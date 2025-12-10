import { Server } from 'socket.io';
import { verifyToken } from '../utils/authUtils.js';
import { saveMessage, getUserById } from '../controllers/chatController.js';
import { createNotification } from '../controllers/notificationController.js';

const connectedUsers = new Map(); // Map of userId -> socket.id

export const initializeSocket = (server) => {
  const io = new Server(server, {
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
      if (!token) {
        return next(new Error('Authentication token required'));
      }

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

    // Join role-based rooms
    const user = await getUserById(userId);
    if (user) {
      socket.join(`role:${user.role}`);
    }

    // Handle sending message
    socket.on('send_message', async (data) => {
      try {
        const { recipientId, content } = data;

        // Validate input
        if (!recipientId || !content || content.trim().length === 0) {
          return socket.emit('message_error', {
            error: 'Recipient and content are required',
          });
        }

        // Save to database
        const message = await saveMessage(userId, recipientId, content);

        // Emit to recipient's room
        const messagePayload = {
          id: message.id,
          sender_id: message.sender_id,
          recipient_id: message.recipient_id,
          content: message.content,
          created_at: message.created_at,
        };

        io.to(`user:${recipientId}`).emit('receive_message', messagePayload);

        // Emit confirmation to sender with full message data
        socket.emit('message_sent', messagePayload);

        // faisal - Create and emit notification to recipient
        const senderUser = user; // already fetched at connection time
        const notification = await createNotification(
          recipientId,
          `New message from ${senderUser?.name || 'someone'}`,
          'chat',
          message.id,
          '/chat',
          { senderId: userId }
        );
        io.to(`user:${recipientId}`).emit('notification', notification);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { recipientId } = data;
      io.to(`user:${recipientId}`).emit('user_typing', {
        userId,
        isTyping: true,
      });
    });

    socket.on('stop_typing', (data) => {
      const { recipientId } = data;
      io.to(`user:${recipientId}`).emit('user_typing', {
        userId,
        isTyping: false,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
};

export { connectedUsers };
