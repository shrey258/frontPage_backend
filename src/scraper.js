const axios = require('axios');
const cheerio = require('cheerio');
const { pool } = require('./config/database');
const { broadcastToAll } = require('./websocket');

const SCRAPE_INTERVAL = 5 * 60 * 1000;
const HN_URL = 'https://news.ycombinator.com';
const MAX_STORIES_PER_SCRAPE = 30;

async function checkDatabaseStats() {
  const client = await pool.connect();
  try {
    const dbStats = await client.query(`
      SELECT 
        COUNT(*) as total_rows,
        pg_size_pretty(pg_total_relation_size('stories')) as table_size,
        MIN(created_at) as oldest_story,
        MAX(created_at) as newest_story
      FROM stories
    `);
    console.log('Database Statistics:', dbStats.rows[0]);

    const latestStories = await client.query(`
      SELECT id, title, author, points, created_at AT TIME ZONE 'Asia/Kolkata' as created_at 
      FROM stories 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('\nLatest 5 stories:');
    latestStories.rows.forEach(story => {
      console.log(`- ${story.title} by ${story.author} (${story.points} points) at ${story.created_at}`);
    });

  } catch (error) {
    console.error('Error checking database stats:', error);
  } finally {
    client.release();
  }
}

async function scrapeStories() {
  console.log('Starting to scrape stories...');
  try {
    const response = await axios.get(HN_URL);
    const $ = cheerio.load(response.data);
    const stories = [];

    $('.athing').each((i, element) => {
      if (i >= MAX_STORIES_PER_SCRAPE) return false;

      const id = parseInt($(element).attr('id'));
      const title = $(element).find('.titleline > a').first().text();
      const url = $(element).find('.titleline > a').first().attr('href');
      const subtext = $(element).next();
      const points = parseInt(subtext.find('.score').text()) || 0;
      const author = subtext.find('.hnuser').text();

      stories.push({ id, title, url, author, points });
    });

    console.log(`Found ${stories.length} stories to process`);
    await saveStories(stories);
    broadcastToAll({ type: 'newStories', data: stories });

  } catch (error) {
    console.error('Error scraping Hacker News:', error);
  }
}

async function saveStories(stories) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const values = stories.map((story, i) => 
      `($${i*5 + 1}, $${i*5 + 2}, $${i*5 + 3}, $${i*5 + 4}, $${i*5 + 5}, CURRENT_TIMESTAMP)`
    ).join(',');
    
    const params = stories.flatMap(story => [
      story.id, story.title, story.url, story.author, story.points
    ]);

    const query = `
      INSERT INTO stories (id, title, url, author, points, created_at)
      VALUES ${values}
      ON CONFLICT (id) DO UPDATE 
      SET title = EXCLUDED.title,
          url = EXCLUDED.url,
          author = EXCLUDED.author,
          points = EXCLUDED.points,
          created_at = CURRENT_TIMESTAMP
    `;

    await client.query(query, params);
    await client.query('COMMIT');
    console.log(`Successfully processed ${stories.length} stories`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving stories:', error);
    throw error;
  } finally {
    client.release();
  }
}

function startScraping() {
  console.log('Starting scraper...');
  checkDatabaseStats();
  scrapeStories();
  setInterval(scrapeStories, SCRAPE_INTERVAL);
}

module.exports = {
  startScraping,
  scrapeStories,
  checkDatabaseStats
};
