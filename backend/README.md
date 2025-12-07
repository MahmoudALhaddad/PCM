# PCM Backend

Node.js backend API for PCM application using Express and PostgreSQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your PostgreSQL credentials

4. Initialize the database:
```bash
psql -U your_username -d pcm_db -f db/init.sql
```

5. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## Project Structure

- `config/` - Configuration files (database connection, etc.)
- `routes/` - API route definitions
- `controllers/` - Route handlers and business logic
- `models/` - Data models and queries
- `middleware/` - Custom middleware
- `db/` - Database initialization scripts
