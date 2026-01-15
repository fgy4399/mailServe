import { WebSocketServer } from 'ws';

export class WebSocketService {
    constructor(port) {
        this.port = port;
        this.wss = null;
    }

    start() {
        this.wss = new WebSocketServer({ port: this.port });

        this.wss.on('connection', (ws) => {
            console.log('🔌 WebSocket client connected');

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    if (data.type === 'subscribe' && data.mailboxId) {
                        ws.mailboxId = data.mailboxId;
                        console.log(`📡 Client subscribed to mailbox: ${data.mailboxId}`);
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            });

            ws.on('close', () => {
                console.log('🔌 WebSocket client disconnected');
            });
        });

        console.log(`🔌 WebSocket Server listening on port ${this.port}`);
    }
}
