const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS stories (
        id INTEGER PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        url TEXT,
        author VARCHAR(100),
        points INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at);
    `);

    await client.query(`ALTER TABLE stories ENABLE ROW LEVEL SECURITY;`);

    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'stories' AND policyname = 'allow_all'
        ) THEN
          CREATE POLICY allow_all ON stories FOR ALL USING (true);
        END IF;
      END $$;
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function cleanupOldStories() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      DELETE FROM stories 
      WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours'
      RETURNING COUNT(*) as deleted_count
    `);
    
    console.log(`Cleaned up ${result.rows[0].deleted_count} old stories`);
  } catch (error) {
    console.error('Error cleaning up old stories:', error);
  } finally {
    client.release();
  }
}

setInterval(cleanupOldStories, 60 * 60 * 1000);

initializeDatabase().catch(console.error);

module.exports = {
  pool,
  cleanupOldStories
};
