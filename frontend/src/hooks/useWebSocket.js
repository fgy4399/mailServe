import { useState, useEffect, useRef, useCallback } from 'react';
import { config } from '../config';

export function useWebSocket(mailboxId, onNewEmail) {
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 10;

    const connect = useCallback(() => {
        if (!mailboxId) return;

        // 清理旧连接
        if (wsRef.current) {
            wsRef.current.close();
        }

        try {
            const ws = new WebSocket(config.wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);
                reconnectAttemptsRef.current = 0;
                ws.send(JSON.stringify({ type: 'subscribe', mailboxId }));
                console.log('✅ WebSocket 已连接');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'new_email' && onNewEmail) {
                        onNewEmail(data.data);
                    }
                } catch (err) {
                    console.error('WebSocket message error:', err);
                }
            };

            ws.onclose = () => {
                setConnected(false);
                console.log('⚠️ WebSocket 断开连接');

                // 自动重连
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    console.log(`🔄 ${delay / 1000}秒后尝试重连...`);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, delay);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setConnected(false);
            };
        } catch (err) {
            console.error('WebSocket 创建失败:', err);
            setConnected(false);
        }
    }, [mailboxId, onNewEmail]);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    // 手动重连方法
    const reconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        connect();
    }, [connect]);

    return { connected, reconnect };
}
