import React, { useState, useEffect } from 'react';

function MailboxHeader({ mailbox, connected, onRefresh, onNewMailbox, onReleaseMailbox, actionLoading, onReconnect }) {
    const [copied, setCopied] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    // 复制到剪贴板
    const copyToClipboard = async () => {
        try {
            // 优先使用 Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(mailbox.address);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                return;
            }

            // 降级方案：使用 execCommand
            const textArea = document.createElement('textarea');
            textArea.value = mailbox.address;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } else {
                alert('复制失败，请手动复制: ' + mailbox.address);
            }
        } catch (err) {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制: ' + mailbox.address);
        }
    };

    // 刷新按钮带反馈
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setTimeout(() => setRefreshing(false), 500);
        }
    };

    // 倒计时
    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date().getTime();
            const expires = new Date(mailbox.expiresAt).getTime();
            const diff = expires - now;

            if (diff <= 0) {
                setTimeLeft('已过期');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (hours > 0) {
                setTimeLeft(`${hours}小时 ${minutes}分 ${seconds}秒`);
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}分 ${seconds}秒`);
            } else {
                setTimeLeft(`${seconds}秒`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [mailbox.expiresAt]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">你的临时邮箱</h2>
                    <span
                        className={`w-3 h-3 rounded-full cursor-pointer transition-all ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
                        title={connected ? '实时连接正常' : '连接断开，点击重连'}
                        onClick={() => !connected && onReconnect && onReconnect()}
                    />
                    {!connected && (
                        <button
                            onClick={onReconnect}
                            className="text-xs text-blue-500 hover:text-blue-700 underline"
                        >
                            重连
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || actionLoading}
                        className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition transform ${refreshing ? 'scale-95 opacity-70' : 'hover:scale-105'} disabled:cursor-not-allowed`}
                    >
                        {refreshing ? '🔄 刷新中...' : '🔄 刷新'}
                    </button>
                    <button
                        onClick={onReleaseMailbox}
                        disabled={actionLoading}
                        className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition transform ${actionLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
                        title="立刻释放该邮箱地址（删除邮箱和邮件），方便马上复用"
                    >
                        {actionLoading ? '🗑 释放中...' : '🗑 释放邮箱'}
                    </button>
                    <button
                        onClick={onNewMailbox}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition transform hover:scale-105"
                    >
                        ➕ 新邮箱
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
                <input
                    type="text"
                    value={mailbox.address}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-lg select-all cursor-text"
                    onClick={(e) => e.target.select()}
                />
                <button
                    onClick={copyToClipboard}
                    className={`px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105 ${copied
                            ? 'bg-green-600 text-white'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                >
                    {copied ? '✓ 已复制!' : '📋 复制'}
                </button>
            </div>
            <div className="flex items-center gap-4 text-sm">
                <div className={`flex items-center gap-1 ${timeLeft === '已过期' ? 'text-red-600' : 'text-gray-600'}`}>
                    <span>⏰</span>
                    <span>剩余时间: <span className="font-bold text-purple-600">{timeLeft}</span></span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span>{connected ? '实时推送已开启' : '实时推送已断开'}</span>
                </div>
            </div>
        </div>
    );
}

export default MailboxHeader;
