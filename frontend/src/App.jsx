import React, { useState, useEffect, useCallback } from 'react';
import { mailboxAPI } from './utils/api';
import { useWebSocket } from './hooks/useWebSocket';
import MailboxHeader from './components/MailboxHeader';
import EmailList from './components/EmailList';
import EmailViewer from './components/EmailViewer';
import MailboxCreator from './components/MailboxCreator';

function App() {
    const [domains, setDomains] = useState([]);
    const [defaultDomain, setDefaultDomain] = useState('');
    const [domainsLoading, setDomainsLoading] = useState(true);
    const [mailbox, setMailbox] = useState(null);
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [loading, setLoading] = useState(false);
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

    const handleNewEmail = useCallback(async () => {
        if (!mailbox) return;
        try {
            const response = await mailboxAPI.getEmails(mailbox.id);
            if (response.success) setEmails(response.data);
        } catch (err) { console.error('Error refreshing emails:', err); }
    }, [mailbox]);

    const { connected, reconnect } = useWebSocket(mailbox?.id, handleNewEmail);

    const createMailbox = async (options = {}) => {
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

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">📧 临时邮箱</h1>
                    <p className="text-white/80">安全、快速、免注册的临时邮箱服务</p>
                    {domains.length > 1 && <p className="text-white/60 text-sm mt-1">支持 {domains.length} 个域名</p>}
                </div>
                {error && (
                    <div className="bg-red-500 text-white px-4 py-3 rounded mb-4 max-w-md mx-auto">
                        {error}<button onClick={() => setError(null)} className="float-right font-bold">✕</button>
                    </div>
                )}
                {!mailbox ? (
                    <div className="text-center">
                        {domainsLoading ? <div className="text-white">加载中...</div> : <MailboxCreator domains={domains} defaultDomain={defaultDomain} onCreateMailbox={createMailbox} loading={loading} />}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <MailboxHeader mailbox={mailbox} connected={connected} onRefresh={loadEmails} onNewMailbox={handleNewMailbox} onReconnect={reconnect} />
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
