const express = require('express');
const path = require('path');
const http = require('http');
const { startScraping } = require('./scraper');
const { initializeWebSocket } = require('./websocket');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/test.html'));
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const server = http.createServer(app);

initializeWebSocket(server);
startScraping();

// Add error handling for server
server.on('error', (err) => {
  console.error('Server error:', err);
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
