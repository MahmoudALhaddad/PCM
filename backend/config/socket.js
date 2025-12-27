import { Server } from 'socket.io';
import { verifyToken } from '../utils/authUtils.js';
import { saveMessage, getUserById } from '../controllers/chatController.js';
import { createNotification } from '../controllers/notificationController.js';

const connectedUsers = new Map(); // Map of userId -> socket.id

export const initializeSocket = (server) => {
  const io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware for socket authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication token required'));

      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Store user connection
    connectedUsers.set(userId, socket.id);

    // Join personal room for direct messages
    socket.join(`user:${userId}`);

    // Join role-based room if needed
    const user = await getUserById(userId);
    if (user) {
      socket.join(`role:${user.role}`);
    }

    // --- Send message ---
    socket.on('send_message', async (data) => {
      try {
        const { recipientId, content } = data;
        if (!recipientId || !content || content.trim().length === 0) {
          return socket.emit('message_error', { error: 'Recipient and content are required' });
        }

        // Save message in DB
        const message = await saveMessage(userId, recipientId, content);

        const messagePayload = {
          id: message.id,
          sender_id: message.sender_id,
          recipient_id: message.recipient_id,
          content: message.content,
          is_read: message.is_read,
          created_at: message.created_at,
        };

        // Emit message to recipient
        io.to(`user:${recipientId}`).emit('receive_message', messagePayload);

        // Emit confirmation to sender
        socket.emit('message_sent', messagePayload);

        // --- Create notification ---
        const notification = await createNotification({
          userId: recipientId,
            fromUserId: userId, // 👈 THIS IS THE KEY
          type: 'message',
          title: `New message from ${user?.name || 'Someone'}`,
          body: null,
          link: '/chat',
        });

        // Emit notification to recipient
        io.to(`user:${recipientId}`).emit('new_notification', notification);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // --- Typing indicators ---
    socket.on('typing', (data) => {
      const { recipientId } = data;
      io.to(`user:${recipientId}`).emit('user_typing', { userId, isTyping: true });
    });

    socket.on('stop_typing', (data) => {
      const { recipientId } = data;
      io.to(`user:${recipientId}`).emit('user_typing', { userId, isTyping: false });
    });

    // --- Mark messages as read ---
    socket.on('messages_read', (data) => {
      const { senderId, recipientId } = data;
      // Notify sender that messages were read
      io.to(`user:${senderId}`).emit('messages_marked_read', {
        senderId,
        recipientId,
        timestamp: new Date(),
      });
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
};

export { connectedUsers };
