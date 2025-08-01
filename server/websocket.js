const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    try {
      const token = req.url.split('token=')[1];
      if (!token) throw new Error('No token provided');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.userId = decoded.userId;

      ws.on('message', (message) => {
        // Handle incoming messages
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'notification', data: message }));
          }
        });
      });

    } catch (err) {
      ws.close(1008, 'Authentication failed');
    }
  });

  return wss;
};

module.exports = setupWebSocket;
