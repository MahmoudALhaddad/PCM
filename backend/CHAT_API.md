Chat System Documentation

Overview
Real-time chat system using socket.io + Postgres for employees, managers, and admins.

Architecture
- Transport: WebSocket with fallback (socket.io)
- Database: Postgres messages table
- Rooms: Per-user (user:{id}) and role-based (role:{role})
- Auth: JWT token verification on socket connect

REST API Endpoints

1. Get Chat History
Endpoint: GET /api/chat/history

Headers:
Authorization: Bearer {token}

Query Parameters:
- withUserId (required): ID of the other user
- limit (optional): Number of messages to fetch (default: 50)
- cursor (optional): Timestamp for pagination

Response:
{
  "messages": [
    {
      "id": 1,
      "sender_id": 1,
      "recipient_id": 2,
      "content": "Hello!",
      "sender_name": "John",
      "recipient_name": "Jane",
      "created_at": "2025-12-09T10:00:00Z"
    }
  ],
  "hasMore": false,
  "nextCursor": "2025-12-09T10:00:00Z"
}

2. Get Conversations
Endpoint: GET /api/chat/conversations

Headers:
Authorization: Bearer {token}

Response:
[
  {
    "other_user_id": 2,
    "other_user_name": "Jane",
    "last_message": "See you tomorrow!",
    "last_message_time": "2025-12-09T15:30:00Z",
    "is_sender": true
  }
]

WebSocket Events

Client -> Server

send_message
Send a message to another user.

socket.emit('send_message', {
  recipientId: 2,
  content: 'Hello Jane!'
});

typing
Notify recipient that user is typing.

socket.emit('typing', {
  recipientId: 2
});

stop_typing
Notify recipient that user stopped typing.

socket.emit('stop_typing', {
  recipientId: 2
});

Server -> Client

receive_message
Receive incoming message from another user.

socket.on('receive_message', (data) => {
  console.log(data);
  // {
  //   id: 1,
  //   sender_id: 1,
  //   recipient_id: 2,
  //   content: 'Hello!',
  //   created_at: '2025-12-09T10:00:00Z'
  // }
});

message_sent
Confirmation that message was saved.

socket.on('message_sent', (data) => {
  console.log(data);
  // {
  //   id: 1,
  //   recipient_id: 2,
  //   created_at: '2025-12-09T10:00:00Z'
  // }
});

user_typing
Notification that user is typing.

socket.on('user_typing', (data) => {
  console.log(data);
  // {
  //   userId: 1,
  //   isTyping: true
  // }
});

message_error
Error sending message.

socket.on('message_error', (data) => {
  console.error(data.error);
});

Socket Connection Example

import { io } from 'socket.io-client';

const token = localStorage.getItem('token');

const socket = io('http://localhost:5000', {
  auth: {
    token: token
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

// Listen for incoming messages
socket.on('receive_message', (message) => {
  console.log('New message:', message);
});

// Send a message
socket.emit('send_message', {
  recipientId: 2,
  content: 'Hello!'
});

// Disconnect
socket.disconnect();

Database Schema

messages table

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INT REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INT REFERENCES users(id) ON DELETE SET NULL,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

Indexes for performance:
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_sender_recipient ON messages(sender_id, recipient_id, created_at);

Features

✓ Real-time one-to-one messaging
✓ Message persistence in Postgres
✓ Typing indicators
✓ Message history pagination
✓ Conversation list
✓ JWT-based WebSocket auth
✓ Automatic reconnection
✓ Role-based access control
✓ User-to-user and role-based rooms

Performance Optimizations

- Connection pooling (Postgres)
- Indexed queries on recipient_id, sender_id, created_at
- Pagination for large chat histories
- Lazy load conversations
- Emit only to specific rooms (avoid broadcast spam)

Future Enhancements

- Group chats / channels
- Attachments (file uploads)
- Message read receipts
- Encryption
- Redis for horizontal scaling
