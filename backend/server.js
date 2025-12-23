// server.js
import 'dotenv/config';
import http from 'http';
import cors from 'cors';
import app from './app.js';
import { initializeSocket } from './config/socket.js';

const PORT = process.env.PORT || 5000;

// CORS setup
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL
];

app.use(cors({
  origin: allowedOrigins.filter(Boolean), 
  credentials: true
}));

// Create HTTP server for socket.io integration
const server = http.createServer(app);
const io = initializeSocket(server);

// Store io instance in app for routes to access
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
