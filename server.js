const WebSocket = require('ws');

const SIZE = 80;
const COOLDOWN = 3000;
const PORT = process.env.PORT || 8080;  // Render задаст PORT автоматически

let canvas = new Array(SIZE * SIZE).fill('#FFFFFF');
const lastClick = new Map();

const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', (ws) => {
  console.log('Новый игрок подключился');
  ws.send(JSON.stringify({ type: 'init', data: canvas }));

  ws.on('message', (message) => {
    try {
      const { x, y, color } = JSON.parse(message);
      const index = y * SIZE + x;
      
      if (index < 0 || index >= canvas.length) return;
      
      const now = Date.now();
      if (lastClick.has(ws) && now - lastClick.get(ws) < COOLDOWN) {
        ws.send(JSON.stringify({ type: 'error', message: 'Подождите 3 секунды' }));
        return;
      }
      
      lastClick.set(ws, now);
      canvas[index] = color;
      
      const update = JSON.stringify({ type: 'update', x, y, color });
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(update);
        }
      });
    } catch(e) {}
  });
  
  ws.on('close', () => {
    lastClick.delete(ws);
  });
});

console.log(`Сервер запущен на порту ${PORT}`);