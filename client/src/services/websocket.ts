export class WebSocketService {
  private socket: WebSocket | null = null;
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  connect() {
    this.socket = new WebSocket(`${process.env.REACT_APP_WS_URL}?token=${this.token}`);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle different message types
      if (data.type === 'notification') {
        // Update UI with new notification
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  sendMessage(message: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    }
  }

  disconnect() {
    this.socket?.close();
  }
}
