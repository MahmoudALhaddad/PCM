// app.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import errorMiddleware from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';

// Import routes
import userRoutes from './routes/userRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'PCM Backend API', version: '1.0.0' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorMiddleware);

export default app;
