# PCM Backend - Database Setup Guide

## Prerequisites
- Docker and Docker Compose installed on your system
- Node.js and npm installed

## Quick Start

### Step 1: Create `.env` file
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### Step 2: Start PostgreSQL and pgAdmin with Docker Compose
Navigate to the backend folder and run:
```bash
docker-compose up -d
```

This will:
- Start PostgreSQL on `localhost:5432`
- Start pgAdmin on `http://localhost:5050`
- Initialize the database with the schema from `db/init.sql`

### Step 3: Access pgAdmin
1. Open your browser and go to: **http://localhost:5050**
2. Login with credentials:
   - **Email**: admin@pcm.com
   - **Password**: admin123

### Step 4: Connect to PostgreSQL Database in pgAdmin
1. Click on **"Add New Server"** in pgAdmin
2. Fill in the connection details:
   - **Name**: PCM Database
   - **Host name/address**: postgres
   - **Port**: 5432
   - **Username**: pcm_user
   - **Password**: pcm_password
   - **Database**: pcm_db
3. Click **"Save"**

### Step 5: View Database Schema
After connecting, navigate to:
- Servers → PCM Database → Databases → pcm_db → Schemas → public → Tables

You should see all tables:
- users
- projects
- project_members
- tasks
- task_comments
- activity_log
- notifications
- refresh_tokens

### Step 6: Install Backend Dependencies and Start Server
In another terminal:
```bash
cd backend
npm install
npm run dev
```

The backend will run on `http://localhost:5000`

## Database Credentials

**PostgreSQL:**
- Host: localhost
- Port: 5432
- Username: pcm_user
- Password: pcm_password
- Database: pcm_db

**pgAdmin:**
- URL: http://localhost:5050
- Email: admin@pcm.com
- Password: admin123

## Testing the API

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "admin",
    "department": "Engineering"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Create a Project (Replace TOKEN with your access token)
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "Project A",
    "clientName": "Client Name",
    "description": "Project description",
    "deadline": "2025-12-31",
    "status": "planning"
  }'
```

## Stopping Services
To stop all services:
```bash
docker-compose down
```

To stop and remove all data (including database):
```bash
docker-compose down -v
```

## Troubleshooting

### Port Already in Use
If port 5432 or 5050 is already in use, modify `docker-compose.yml`:
```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # Change to 5433
  
  pgadmin:
    ports:
      - "5051:80"    # Change to 5051
```

### Database Connection Failed
Make sure PostgreSQL container is running:
```bash
docker ps
```

View logs:
```bash
docker-compose logs postgres
```

### pgAdmin Won't Connect
Ensure the PostgreSQL container is healthy:
```bash
docker-compose logs --tail=50 postgres
```

Then try reconnecting in pgAdmin using hostname `postgres` (not localhost).
