import 'dotenv/config';

export const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    smtpPort: parseInt(process.env.SMTP_PORT || '2525', 10),
    wsPort: parseInt(process.env.WS_PORT || '3001', 10),
    trustProxy: (() => {
        const value = process.env.TRUST_PROXY;
        if (value === undefined) return 0;
        if (value === 'true') return true;
        if (value === 'false') return false;
        const hops = parseInt(value, 10);
        return Number.isFinite(hops) ? hops : 0;
    })(),

    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
    },

    // Email - 支持多域名
    email: {
        domains: (process.env.EMAIL_DOMAINS || 'temp-mail.local')
            .split(',')
            .map(d => d.trim())
            .filter(d => d.length > 0),
        defaultDomain: process.env.EMAIL_DEFAULT_DOMAIN ||
            (process.env.EMAIL_DOMAINS || 'temp-mail.local').split(',')[0].trim(),
        domain: process.env.EMAIL_DEFAULT_DOMAIN ||
            (process.env.EMAIL_DOMAINS || 'temp-mail.local').split(',')[0].trim(),
        ttl: parseInt(process.env.EMAIL_TTL || '3600', 10),
    },

    cors: {
        origin: process.env.CORS_ORIGIN || '*',
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
};
