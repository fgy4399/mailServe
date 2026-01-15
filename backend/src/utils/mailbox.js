import { nanoid } from 'nanoid';
import { config } from '../config/index.js';

export function generateRandomPrefix() {
    return nanoid(10);
}

export function generateMailboxId() {
    return nanoid(12);
}

export function generateMailboxAddress(prefix, domain) {
    const finalPrefix = prefix || generateRandomPrefix();
    const finalDomain = domain || config.email.defaultDomain;
    if (!config.email.domains.includes(finalDomain)) {
        throw new Error(`无效的域名: ${finalDomain}`);
    }
    return `${finalPrefix}@${finalDomain}`;
}

export function isValidPrefix(prefix) {
    if (!prefix) return false;
    const prefixRegex = /^[a-zA-Z0-9._-]{3,30}$/;
    return prefixRegex.test(prefix);
}

export function parseEmailAddress(emailAddress) {
    if (!emailAddress) return null;
    const match = emailAddress.match(/^(.+)@(.+)$/);
    if (!match) return null;
    return { prefix: match[1], domain: match[2] };
}

export function extractMailboxId(emailAddress) {
    const parsed = parseEmailAddress(emailAddress);
    return parsed ? parsed.prefix : null;
}

export function isValidDomain(domain) {
    return config.email.domains.includes(domain);
}

export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function generateEmailId() {
    return nanoid(16);
}
