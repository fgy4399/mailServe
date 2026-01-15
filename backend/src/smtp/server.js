import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { config } from '../config/index.js';
import { redisClient } from '../utils/redis.js';
import { generateEmailId, parseEmailAddress, isValidDomain } from '../utils/mailbox.js';

export class MailServer {
    constructor(wsServer) {
        this.wsServer = wsServer;
        this.server = null;
    }

    start() {
        this.server = new SMTPServer({
            authOptional: true,
            disabledCommands: ['AUTH'],

            onData: async (stream, session, callback) => {
                try {
                    const parsed = await simpleParser(stream);
                    const recipient = session.envelope.rcptTo[0]?.address;
                    if (!recipient) return callback(new Error('No recipient'));

                    const parsedAddress = parseEmailAddress(recipient);
                    if (!parsedAddress || !isValidDomain(parsedAddress.domain)) {
                        console.log(`❌ Rejected - invalid domain: ${recipient}`);
                        return callback(new Error('Invalid domain'));
                    }

                    const mailbox = await redisClient.getMailboxByAddress(recipient);
                    if (!mailbox) {
                        console.log(`❌ Mailbox not found: ${recipient}`);
                        return callback(new Error('Mailbox not found'));
                    }

                    const emailId = generateEmailId();
                    const emailData = {
                        id: emailId,
                        mailboxId: mailbox.id,
                        from: parsed.from?.text || 'Unknown',
                        to: parsed.to?.text || recipient,
                        subject: parsed.subject || '(No Subject)',
                        text: parsed.text || '',
                        html: parsed.html || '',
                        date: parsed.date || new Date(),
                        attachments: parsed.attachments?.map(att => ({
                            filename: att.filename,
                            contentType: att.contentType,
                            size: att.size,
                            content: att.content.toString('base64'),
                        })) || [],
                        receivedAt: new Date().toISOString(),
                    };

                    await redisClient.saveEmail(mailbox.id, emailId, emailData);
                    this.notifyNewEmail(mailbox.id, emailData);
                    console.log(`📧 Email received for ${recipient}`);
                    callback();
                } catch (err) {
                    console.error('Error processing email:', err);
                    callback(err);
                }
            },

            onMailFrom: (address, session, callback) => {
                console.log(`📨 Mail from: ${address.address}`);
                callback();
            },

            onRcptTo: (address, session, callback) => {
                const parsedAddress = parseEmailAddress(address.address);
                if (!parsedAddress || !isValidDomain(parsedAddress.domain)) {
                    console.log(`❌ Rejected recipient: ${address.address}`);
                    return callback(new Error('Invalid domain'));
                }
                console.log(`📬 Mail to: ${address.address}`);
                callback();
            },
        });

        this.server.listen(config.smtpPort, () => {
            console.log(`📮 SMTP Server listening on port ${config.smtpPort}`);
            console.log(`📧 Accepted domains: ${config.email.domains.join(', ')}`);
        });

        this.server.on('error', (err) => console.error('SMTP Error:', err));
    }

    notifyNewEmail(mailboxId, emailData) {
        if (!this.wsServer) return;
        this.wsServer.clients.forEach((client) => {
            if (client.readyState === 1 && client.mailboxId === mailboxId) {
                client.send(JSON.stringify({
                    type: 'new_email',
                    data: { id: emailData.id, from: emailData.from, subject: emailData.subject, receivedAt: emailData.receivedAt },
                }));
            }
        });
    }

    stop() {
        if (this.server) this.server.close();
    }
}
