import React, { useState, useEffect } from 'react';
import DomainSelector from './DomainSelector';
import PrefixInput from './PrefixInput';

function MailboxCreator({ domains, defaultDomain, onCreateMailbox, loading }) {
    const [prefix, setPrefix] = useState('');
    const [selectedDomain, setSelectedDomain] = useState(defaultDomain || '');
    const [prefixError, setPrefixError] = useState(null);

    useEffect(() => {
        if (defaultDomain && !selectedDomain) setSelectedDomain(defaultDomain);
    }, [defaultDomain]);

    const validatePrefix = (value) => {
        if (!value) { setPrefixError(null); return true; }
        const prefixRegex = /^[a-zA-Z0-9._-]{3,30}$/;
        if (!prefixRegex.test(value)) {
            setPrefixError(value.length < 3 ? '前缀至少需要3个字符' : value.length > 30 ? '前缀最多30个字符' : '只允许字母、数字、点、下划线、连字符');
            return false;
        }
        setPrefixError(null);
        return true;
    };

    const handlePrefixChange = (value) => { setPrefix(value); validatePrefix(value); };
    const handleCreate = () => { if (prefix && !validatePrefix(prefix)) return; onCreateMailbox({ prefix: prefix || undefined, domain: selectedDomain }); };
    const handleRandomCreate = () => { onCreateMailbox({ prefix: undefined, domain: selectedDomain }); };

    const previewAddress = prefix ? `${prefix}@${selectedDomain}` : `随机前缀@${selectedDomain}`;

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">创建临时邮箱</h2>
            <div className="space-y-5">
                <PrefixInput value={prefix} onChange={handlePrefixChange} error={prefixError} disabled={loading} />
                <DomainSelector domains={domains} selectedDomain={selectedDomain} onChange={setSelectedDomain} disabled={loading} />
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">预览邮箱地址</p>
                    <p className="text-lg font-mono text-purple-600 break-all">{previewAddress}</p>
                </div>
                <div className="space-y-3">
                    <button onClick={handleCreate} disabled={loading || (prefix && prefixError)} className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? '创建中...' : '🎯 创建临时邮箱'}
                    </button>
                    <button onClick={handleRandomCreate} disabled={loading} className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? '创建中...' : '🎲 随机生成邮箱'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MailboxCreator;
