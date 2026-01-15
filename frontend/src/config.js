// 自动检测 API 和 WebSocket 地址
const getWsUrl = () => {
    if (import.meta.env.VITE_WS_URL) {
        return import.meta.env.VITE_WS_URL;
    }
    // 使用相对路径，通过 Nginx 代理
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
};

export const config = {
    apiUrl: import.meta.env.VITE_API_URL || '',
    wsUrl: getWsUrl(),
};
