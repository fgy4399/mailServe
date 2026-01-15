import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { sanitizeEmailHtml } from '../utils/sanitizeHtml';

function EmailViewer({ email }) {
    if (!email) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center h-full flex items-center justify-center">
                <div><div className="text-6xl mb-4">📧</div><p className="text-gray-600">选择一封邮件查看内容</p></div>
            </div>
        );
    }

    const safeHtml = email.html ? sanitizeEmailHtml(email.html) : '';

    const downloadAttachment = (attachment) => {
        const blob = new Blob([Uint8Array.from(atob(attachment.content), c => c.charCodeAt(0))], { type: attachment.contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = attachment.filename; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
                <h2 className="text-2xl font-bold mb-4">{email.subject}</h2>
                <div className="space-y-2 text-sm">
                    <div><span className="font-semibold">发件人:</span> {email.from}</div>
                    <div><span className="font-semibold">收件人:</span> {email.to}</div>
                    <div><span className="font-semibold">时间:</span> {format(new Date(email.receivedAt), 'PPpp', { locale: zhCN })}</div>
                </div>
            </div>
            {email.attachments && email.attachments.length > 0 && (
                <div className="p-4 bg-yellow-50 border-b">
                    <div className="font-semibold mb-2">📎 附件 ({email.attachments.length})</div>
                    <div className="space-y-2">
                        {email.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-2 rounded">
                                <div className="flex items-center gap-2">
                                    <span>📄</span><span className="text-sm">{attachment.filename}</span>
                                    <span className="text-xs text-gray-500">({(attachment.size / 1024).toFixed(2)} KB)</span>
                                </div>
                                <button onClick={() => downloadAttachment(attachment)} className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">下载</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="p-6 max-h-[500px] overflow-y-auto">
                {email.html ? <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: safeHtml }} /> : <pre className="whitespace-pre-wrap font-sans">{email.text}</pre>}
            </div>
        </div>
    );
}

export default EmailViewer;
