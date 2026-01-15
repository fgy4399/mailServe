import express from 'express';
import { redisClient } from '../utils/redis.js';
import { generateMailboxId, generateRandomPrefix, isValidPrefix, isValidDomain } from '../utils/mailbox.js';
import { config } from '../config/index.js';

const router = express.Router();

router.get('/domains', async (req, res) => {
    res.json({ success: true, data: { domains: config.email.domains, defaultDomain: config.email.defaultDomain } });
});

router.post('/mailbox/check-availability', async (req, res) => {
    try {
        const { prefix, domain } = req.body;
        if (prefix && !isValidPrefix(prefix)) {
            return res.status(400).json({ success: false, error: '前缀格式无效' });
        }
        const finalDomain = domain || config.email.defaultDomain;
        if (!isValidDomain(finalDomain)) {
            return res.status(400).json({ success: false, error: '无效的域名' });
        }
        if (!prefix) {
            return res.json({ success: true, data: { available: true, address: null } });
        }
        const exists = await redisClient.addressExists(`${prefix}@${finalDomain}`);
        res.json({ success: true, data: { available: !exists, address: `${prefix}@${finalDomain}` } });
    } catch (error) {
        res.status(500).json({ success: false, error: '检查失败' });
    }
});

router.post('/mailbox/create', async (req, res) => {
    try {
        const { prefix, domain } = req.body || {};
        const finalDomain = domain || config.email.defaultDomain;
        if (!isValidDomain(finalDomain)) {
            return res.status(400).json({ success: false, error: '无效的域名' });
        }
        let finalPrefix, isCustomPrefix = false;
        if (prefix) {
            if (!isValidPrefix(prefix)) {
                return res.status(400).json({ success: false, error: '前缀格式无效' });
            }
            finalPrefix = prefix;
            isCustomPrefix = true;
        } else {
            finalPrefix = generateRandomPrefix();
        }
        const address = `${finalPrefix}@${finalDomain}`;
        if (await redisClient.addressExists(address)) {
            return res.status(409).json({ success: false, error: '该邮箱地址已被使用' });
        }
        const mailboxId = generateMailboxId();
        const mailboxData = {
            id: mailboxId, prefix: finalPrefix, domain: finalDomain, address,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + config.email.ttl * 1000).toISOString(),
            isCustomPrefix,
        };
        await redisClient.createMailbox(mailboxId, mailboxData);
        res.json({ success: true, data: mailboxData });
    } catch (error) {
        res.status(500).json({ success: false, error: '创建邮箱失败' });
    }
});

router.get('/mailbox/:id', async (req, res) => {
    try {
        const mailbox = await redisClient.getMailbox(req.params.id);
        if (!mailbox) return res.status(404).json({ success: false, error: '邮箱不存在' });
        res.json({ success: true, data: mailbox });
    } catch (error) {
        res.status(500).json({ success: false, error: '获取失败' });
    }
});

router.get('/mailbox/:id/emails', async (req, res) => {
    try {
        const mailbox = await redisClient.getMailbox(req.params.id);
        if (!mailbox) return res.status(404).json({ success: false, error: '邮箱不存在' });
        const emails = await redisClient.getEmailSummaries(req.params.id);
        res.json({ success: true, data: emails });
    } catch (error) {
        res.status(500).json({ success: false, error: '获取失败' });
    }
});

router.get('/email/:mailboxId/:emailId', async (req, res) => {
    try {
        const email = await redisClient.getEmail(req.params.mailboxId, req.params.emailId);
        if (!email) return res.status(404).json({ success: false, error: '邮件不存在' });
        res.json({ success: true, data: email });
    } catch (error) {
        res.status(500).json({ success: false, error: '获取失败' });
    }
});

router.delete('/mailbox/:id', async (req, res) => {
    try {
        await redisClient.deleteMailbox(req.params.id);
        res.json({ success: true, message: '邮箱已删除' });
    } catch (error) {
        res.status(500).json({ success: false, error: '删除失败' });
    }
});

router.delete('/email/:mailboxId/:emailId', async (req, res) => {
    try {
        await redisClient.deleteEmail(req.params.mailboxId, req.params.emailId);
        res.json({ success: true, message: '邮件已删除' });
    } catch (error) {
        res.status(500).json({ success: false, error: '删除失败' });
    }
});

export default router;
