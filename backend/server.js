// server.js
import 'dotenv/config'; // faisal
import http from 'http';//faisal
import app from './app.js';
import cors from 'cors';


import { initializeSocket } from './config/socket.js';//faisal

const PORT = process.env.PORT || 5000;

// Create HTTP server for socket.io integration faisal
const server = http.createServer(app);
const io = initializeSocket(server);

// faisal - Store io instance in app for routes to access
app.set('io', io);


const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));  

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
