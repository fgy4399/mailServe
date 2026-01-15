import { createClient } from 'redis';
import { config } from '../config/index.js';

function normalizeAddress(address) {
    if (typeof address !== 'string') return '';
    return address.trim().toLowerCase();
}

class RedisClient {
    constructor() {
        this.client = null;
    }

    async connect() {
        this.client = createClient({
            socket: { host: config.redis.host, port: config.redis.port },
            password: config.redis.password,
        });
        this.client.on('error', (err) => console.error('Redis Error:', err));
        this.client.on('connect', () => console.log('✅ Connected to Redis'));
        await this.client.connect();
    }

    async disconnect() {
        if (this.client) await this.client.quit();
    }

    async addressExists(address) {
        const normalized = normalizeAddress(address);
        if (!normalized) return false;
        const existsCount = await this.client.exists(
            `address:${normalized}`,
            ...(address && address !== normalized ? [`address:${address}`] : []),
        );
        return existsCount > 0;
    }

    async createMailbox(mailboxId, data) {
        const multi = this.client.multi();
        multi.setEx(`mailbox:${mailboxId}`, config.email.ttl, JSON.stringify(data));
        const normalizedAddress = normalizeAddress(data.address);
        if (normalizedAddress) {
            multi.setEx(`address:${normalizedAddress}`, config.email.ttl, mailboxId);
        }
        await multi.exec();
        return mailboxId;
    }

    async getMailbox(mailboxId) {
        const data = await this.client.get(`mailbox:${mailboxId}`);
        return data ? JSON.parse(data) : null;
    }

    async getMailboxIdByAddress(address) {
        const normalized = normalizeAddress(address);
        if (!normalized) return null;
        const normalizedValue = await this.client.get(`address:${normalized}`);
        if (normalizedValue) return normalizedValue;
        if (address && address !== normalized) return await this.client.get(`address:${address}`);
        return null;
    }

    async getMailboxByAddress(address) {
        const mailboxId = await this.getMailboxIdByAddress(address);
        return mailboxId ? await this.getMailbox(mailboxId) : null;
    }

    async deleteMailbox(mailboxId) {
        const mailbox = await this.getMailbox(mailboxId);
        if (mailbox) {
            const multi = this.client.multi();
            multi.del(`mailbox:${mailboxId}`);
            if (mailbox.address) {
                const normalized = normalizeAddress(mailbox.address);
                if (normalized) multi.del(`address:${normalized}`);
                if (mailbox.address !== normalized) multi.del(`address:${mailbox.address}`);
            }
            const emailIds = await this.client.lRange(`emails:${mailboxId}`, 0, -1);
            for (const emailId of emailIds) {
                multi.del(`email:${mailboxId}:${emailId}`);
                multi.del(`emailSummary:${mailboxId}:${emailId}`);
            }
            multi.del(`emails:${mailboxId}`);
            await multi.exec();
        }
    }

    async saveEmail(mailboxId, emailId, emailData) {
        const ttl = config.email.ttl;
        const summary = {
            id: emailId,
            from: emailData.from,
            subject: emailData.subject,
            receivedAt: emailData.receivedAt,
        };
        const multi = this.client.multi();
        multi.setEx(`email:${mailboxId}:${emailId}`, ttl, JSON.stringify(emailData));
        multi.setEx(`emailSummary:${mailboxId}:${emailId}`, ttl, JSON.stringify(summary));
        multi.lPush(`emails:${mailboxId}`, emailId);
        multi.expire(`emails:${mailboxId}`, ttl);
        await multi.exec();
    }

    async getEmail(mailboxId, emailId) {
        const data = await this.client.get(`email:${mailboxId}:${emailId}`);
        return data ? JSON.parse(data) : null;
    }

    async getEmails(mailboxId) {
        const emailIds = await this.client.lRange(`emails:${mailboxId}`, 0, -1);
        const emails = [];
        for (const emailId of emailIds) {
            const email = await this.getEmail(mailboxId, emailId);
            if (email) emails.push(email);
        }
        return emails;
    }

    async getEmailSummaries(mailboxId) {
        const emailIds = await this.client.lRange(`emails:${mailboxId}`, 0, -1);
        if (emailIds.length === 0) return [];

        const values = await this.client.mGet(emailIds.map((emailId) => `emailSummary:${mailboxId}:${emailId}`));
        const summaries = [];
        for (let index = 0; index < values.length; index++) {
            const value = values[index];
            if (value) {
                try {
                    summaries.push(JSON.parse(value));
                    continue;
                } catch {
                    // fall through to legacy fallback
                }
            }

            // Fallback for legacy data (no summary key yet)
            const emailId = emailIds[index];
            const email = await this.getEmail(mailboxId, emailId);
            if (!email) continue;
            summaries.push({
                id: email.id,
                from: email.from,
                subject: email.subject,
                receivedAt: email.receivedAt,
            });
        }
        return summaries;
    }

    async deleteEmail(mailboxId, emailId) {
        const multi = this.client.multi();
        multi.del(`email:${mailboxId}:${emailId}`);
        multi.del(`emailSummary:${mailboxId}:${emailId}`);
        multi.lRem(`emails:${mailboxId}`, 1, emailId);
        await multi.exec();
    }
}

export const redisClient = new RedisClient();
