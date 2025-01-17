const WebSocket = require('ws');
const { pool } = require('./config/database');

let wss;

async function getRecentStories() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT COUNT(*) as count, json_agg(stories.*) as stories
      FROM (
        SELECT 
          id, 
          title, 
          url, 
          author, 
          points,
          created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as created_at
        FROM stories
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '5 minutes'
        ORDER BY created_at DESC
      ) stories
    `);
    
    return {
      count: result.rows[0].count,
      stories: result.rows[0].stories || []
    };
  } catch (error) {
    console.error('Error getting recent stories:', error);
    return { count: 0, stories: [] };
  } finally {
    client.release();
  }
}

function initializeWebSocket(server) {
  // Check if we're in a Vercel environment
  const isVercel = process.env.VERCEL === '1';
  
  if (isVercel) {
    // For Vercel, use their WebSocket URL scheme
    wss = new WebSocket.Server({
      server,
      path: '/ws'
    });
  } else {
    // For local development
    wss = new WebSocket.Server({ server });
  }

  wss.on('connection', async (ws, req) => {
    console.log('Client connected');
    
    const recentStories = await getRecentStories();
    ws.send(JSON.stringify({
      type: 'recentStories',
      data: recentStories
    }));

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
}

function broadcastToAll(message) {
  if (!wss) return;
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

module.exports = {
  initializeWebSocket,
  broadcastToAll
};
