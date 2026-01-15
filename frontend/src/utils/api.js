import axios from 'axios';
import { config } from '../config';

const api = axios.create({ baseURL: config.apiUrl, timeout: 10000 });

export const mailboxAPI = {
    getDomains: async () => (await api.get('/api/domains')).data,
    checkAvailability: async (params) => (await api.post('/api/mailbox/check-availability', params)).data,
    createMailbox: async (params = {}) => (await api.post('/api/mailbox/create', params)).data,
    getMailbox: async (mailboxId) => (await api.get(`/api/mailbox/${mailboxId}`)).data,
    getEmails: async (mailboxId) => (await api.get(`/api/mailbox/${mailboxId}/emails`)).data,
    getEmail: async (mailboxId, emailId) => (await api.get(`/api/email/${mailboxId}/${emailId}`)).data,
    deleteMailbox: async (mailboxId) => (await api.delete(`/api/mailbox/${mailboxId}`)).data,
    deleteEmail: async (mailboxId, emailId) => (await api.delete(`/api/email/${mailboxId}/${emailId}`)).data,
};
