// server.js
import 'dotenv/config'; // faisal
import http from 'http';//faisal
import app from './app.js';
import { initializeSocket } from './config/socket.js';//faisal

const PORT = process.env.PORT || 5000;

// Create HTTP server for socket.io integration faisal
const server = http.createServer(app);
const io = initializeSocket(server);

// faisal - Store io instance in app for routes to access
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
