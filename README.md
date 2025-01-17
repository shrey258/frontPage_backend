# Hacker News Real-time Feed

A real-time Hacker News feed that scrapes and displays the latest stories using Node.js, WebSocket, and Supabase PostgreSQL.

## Features

- Real-time updates using WebSocket
- Efficient database management with Supabase
- Auto-cleanup of old stories (24-hour retention)
- IST timezone support
- Responsive modern UI
- Shows points, author, and timestamp for each story

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Supabase)
- **Real-time**: WebSocket (ws)
- **Scraping**: Axios, Cheerio
- **Frontend**: HTML, CSS, JavaScript

## Prerequisites

- Node.js (v14 or higher)
- Supabase account and database
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone https://github.com/shrey258/frontPage_backend.git
cd frontPage_backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
DATABASE_URL=your_supabase_postgres_connection_string
PORT=3000
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
frontPage_backend/
├── src/
│   ├── config/
│   │   └── database.js    # Database configuration
│   ├── scraper.js         # HN scraping logic
│   ├── websocket.js       # WebSocket server
│   └── server.js          # Express server
├── public/
│   └── test.html         # Frontend interface
├── .env                   # Environment variables
└── package.json
```

## Features in Detail

### Scraping
- Scrapes Hacker News every 5 minutes
- Stores latest 30 stories per scrape
- Updates story points in real-time

### Database Management
- Automatic cleanup of stories older than 24 hours
- Optimized queries with proper indexing
- Efficient batch operations for story updates

### Real-time Updates
- WebSocket connection for instant updates
- Automatic reconnection on disconnection
- Error handling and logging

### Frontend
- Modern, responsive design
- Real-time story updates
- IST timezone for timestamps
- Story points and author information

## API Endpoints

- `GET /`: Serves the main frontend interface
- `GET /health`: Health check endpoint
- `WS /`: WebSocket endpoint for real-time updates

## Environment Variables

- `DATABASE_URL`: Supabase PostgreSQL connection string
- `PORT`: Server port (default: 3000)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
