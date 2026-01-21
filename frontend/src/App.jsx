import React, { useState, useEffect, useCallback } from 'react';
import { mailboxAPI } from './utils/api';
import { useWebSocket } from './hooks/useWebSocket';
import MailboxHeader from './components/MailboxHeader';
import EmailList from './components/EmailList';
import EmailViewer from './components/EmailViewer';
import MailboxCreator from './components/MailboxCreator';

const LAST_MAILBOX_STORAGE_KEY = 'mailserve:lastMailbox';

function normalizeAddress(address) {
    if (typeof address !== 'string') return '';
    return address.trim().toLowerCase();
}

function loadLastMailbox() {
    if (typeof localStorage === 'undefined') return null;
    try {
        const raw = localStorage.getItem(LAST_MAILBOX_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveLastMailbox(mailbox) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(LAST_MAILBOX_STORAGE_KEY, JSON.stringify(mailbox));
    } catch {
        // ignore
    }
}

function App() {
    const [domains, setDomains] = useState([]);
    const [defaultDomain, setDefaultDomain] = useState('');
    const [domainsLoading, setDomainsLoading] = useState(true);
    const [mailbox, setMailbox] = useState(null);
    const [lastMailbox, setLastMailbox] = useState(() => loadLastMailbox());
    const [lastCreateOptions, setLastCreateOptions] = useState(null);
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mailboxActionLoading, setMailboxActionLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadDomains = async () => {
            try {
                const response = await mailboxAPI.getDomains();
                if (response.success) {
                    setDomains(response.data.domains);
                    setDefaultDomain(response.data.defaultDomain);
                }
            } catch (err) {
                setDomains(['temp-mail.local']);
                setDefaultDomain('temp-mail.local');
            } finally {
                setDomainsLoading(false);
            }
        };
        loadDomains();
    }, []);

    useEffect(() => {
        if (!mailbox) return;
        saveLastMailbox(mailbox);
        setLastMailbox(mailbox);
    }, [mailbox]);

    const handleNewEmail = useCallback(async () => {
        if (!mailbox) return;
        try {
            const response = await mailboxAPI.getEmails(mailbox.id);
            if (response.success) setEmails(response.data);
        } catch (err) { console.error('Error refreshing emails:', err); }
    }, [mailbox]);

    const { connected, reconnect } = useWebSocket(mailbox?.id, handleNewEmail);

    const createMailbox = async (options = {}) => {
        setLastCreateOptions(options);
        setLoading(true); setError(null);
        try {
            const response = await mailboxAPI.createMailbox(options);
            if (response.success) { setMailbox(response.data); setEmails([]); setSelectedEmail(null); }
            else setError(response.error || '创建邮箱失败');
        } catch (err) {
            setError(err.response?.data?.error || '创建邮箱失败,请重试');
        } finally { setLoading(false); }
    };

    const loadEmails = async () => {
        if (!mailbox) return;
        try {
            const response = await mailboxAPI.getEmails(mailbox.id);
            if (response.success) setEmails(response.data);
        } catch (err) { console.error('Error loading emails:', err); }
    };

    const handleSelectEmail = async (email) => {
        try {
            const response = await mailboxAPI.getEmail(mailbox.id, email.id);
            if (response.success) setSelectedEmail(response.data);
        } catch (err) { console.error('Error loading email:', err); }
    };

    const handleDeleteEmail = async (emailId) => {
        try {
            await mailboxAPI.deleteEmail(mailbox.id, emailId);
            setEmails(emails.filter(e => e.id !== emailId));
            if (selectedEmail?.id === emailId) setSelectedEmail(null);
        } catch (err) { console.error('Error deleting email:', err); }
    };

    useEffect(() => {
        if (!mailbox) return;
        loadEmails();
        const interval = setInterval(loadEmails, 10000);
        return () => clearInterval(interval);
    }, [mailbox]);

    const handleNewMailbox = () => { setMailbox(null); setEmails([]); setSelectedEmail(null); setError(null); };

    const desiredAddress = lastCreateOptions?.prefix
        ? normalizeAddress(`${lastCreateOptions.prefix}@${lastCreateOptions.domain || defaultDomain}`)
        : '';
    const canForceReuse = !mailbox
        && error === '该邮箱地址已被使用'
        && desiredAddress
        && lastMailbox?.id
        && normalizeAddress(lastMailbox?.address) === desiredAddress;

    const forceReuseMailbox = async (options) => {
        const desired = options?.prefix
            ? normalizeAddress(`${options.prefix}@${options.domain || defaultDomain}`)
            : '';
        const canReuse = desired
            && lastMailbox?.id
            && normalizeAddress(lastMailbox?.address) === desired;

        if (!canReuse) {
            setError('这个地址不是你上一次创建的邮箱，没法一键强制复用；换个前缀或者先手动释放上次邮箱。');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await mailboxAPI.deleteMailbox(lastMailbox.id);
            const createResponse = await mailboxAPI.createMailbox({
                ...options,
                domain: options?.domain || defaultDomain,
            });
            if (createResponse.success) {
                setMailbox(createResponse.data);
                setEmails([]);
                setSelectedEmail(null);
            } else {
                setError(createResponse.error || '创建邮箱失败');
            }
        } catch (err) {
            const serverError = err.response?.data?.error;
            if (serverError === '该邮箱地址已被使用') {
                setError('强制复用没成功：这个地址可能不是你上一次创建的邮箱（或者已经被别人占了），换个前缀更省心。');
            } else {
                setError(serverError || '强制复用失败,请重试');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReleaseMailbox = async () => {
        if (!mailbox) return;

        const confirmRelease = window.confirm(`确定要释放邮箱 ${mailbox.address} 吗？释放后该地址可立即复用，且当前邮箱和邮件会被删除。`);
        if (!confirmRelease) return;

        setMailboxActionLoading(true);
        setError(null);
        try {
            await mailboxAPI.deleteMailbox(mailbox.id);
            handleNewMailbox();
        } catch (err) {
            setError(err.response?.data?.error || '释放邮箱失败,请重试');
        } finally {
            setMailboxActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">📧 临时邮箱</h1>
                    <p className="text-white/80">安全、快速、免注册的临时邮箱服务</p>
                    {domains.length > 1 && <p className="text-white/60 text-sm mt-1">支持 {domains.length} 个域名</p>}
                </div>
                {error && (
                    <div className="bg-red-500 text-white px-4 py-3 rounded mb-4 max-w-md mx-auto flex items-center gap-3">
                        <div className="flex-1 min-w-0">{error}</div>
                        {canForceReuse && (
                            <button
                                onClick={() => forceReuseMailbox(lastCreateOptions)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-white/20 rounded hover:bg-white/30 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                title="先释放上次创建的邮箱，再用同一个地址重新创建"
                            >
                                ♻️ 强制复用
                            </button>
                        )}
                        <button onClick={() => setError(null)} className="font-bold">✕</button>
                    </div>
                )}
                {!mailbox ? (
                    <div className="text-center">
                        {domainsLoading ? <div className="text-white">加载中...</div> : (
                            <MailboxCreator
                                domains={domains}
                                defaultDomain={defaultDomain}
                                onCreateMailbox={createMailbox}
                                onForceReuse={forceReuseMailbox}
                                lastMailbox={lastMailbox}
                                loading={loading}
                            />
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <MailboxHeader
                            mailbox={mailbox}
                            connected={connected}
                            onRefresh={loadEmails}
                            onNewMailbox={handleNewMailbox}
                            onReleaseMailbox={handleReleaseMailbox}
                            actionLoading={mailboxActionLoading}
                            onReconnect={reconnect}
                        />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-1"><EmailList emails={emails} selectedEmail={selectedEmail} onSelectEmail={handleSelectEmail} onDeleteEmail={handleDeleteEmail} /></div>
                            <div className="lg:col-span-2"><EmailViewer email={selectedEmail} /></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
