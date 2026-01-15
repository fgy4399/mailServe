import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function EmailList({ emails, selectedEmail, onSelectEmail, onDeleteEmail }) {
    if (emails.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600">暂无邮件</p>
                <p className="text-sm text-gray-500 mt-2">发送邮件到上方地址即可接收</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b"><h3 className="font-semibold">收件箱 ({emails.length})</h3></div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
                {emails.map((email) => (
                    <div key={email.id} onClick={() => onSelectEmail(email)} className={`p-4 cursor-pointer hover:bg-gray-50 transition ${selectedEmail?.id === email.id ? 'bg-blue-50' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                            <div className="font-semibold text-sm truncate flex-1">{email.from}</div>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteEmail(email.id); }} className="text-red-500 hover:text-red-700 ml-2" title="删除">🗑️</button>
                        </div>
                        <div className="text-sm font-medium truncate mb-1">{email.subject}</div>
                        <div className="text-xs text-gray-500">{formatDistanceToNow(new Date(email.receivedAt), { locale: zhCN, addSuffix: true })}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default EmailList;
