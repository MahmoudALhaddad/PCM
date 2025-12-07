require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorMiddleware = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const projectMembersRoutes = require('./routes/projectMembersRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');

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
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-members', projectMembersRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/activity-log', activityLogRoutes);
app.use('/api/notifications', notificationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorMiddleware);

module.exports = app;
