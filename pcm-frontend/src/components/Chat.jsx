import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FaArrowLeft } from 'react-icons/fa';
import "../styles/chat.css";

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const selectedUserRef = useRef(null);
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user'));
  
  // Update ref when selectedUser changes
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Fetch conversations
  const fetchConversations = React.useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  }, [token]);

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    const newSocket = io(`${process.env.REACT_APP_API_URL}`, {
      auth: { token },
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
    });

    newSocket.on('receive_message', (data) => {
      console.log('Received message:', data);
      console.log('Message content:', data.content);
      console.log('Current user ID:', currentUser.id);
      console.log('Selected user:', selectedUserRef.current);
      // Add message to state if viewing conversation with the sender
      setMessages((prev) => {
        const currentSelectedUser = selectedUserRef.current;
        if (currentSelectedUser && 
            (data.sender_id === currentSelectedUser.id || 
             data.recipient_id === currentSelectedUser.id)) {
          console.log('Adding received message to state');
          return [...prev, data];
        }
        console.log('Not adding message - not part of current conversation');
        return prev;
      });
      // Refresh conversations when new message arrives
      fetchConversations();
    });

    newSocket.on('message_sent', (data) => {
      console.log('Message sent event received:', data);
      // Always add the sent message to the messages state immediately
      setMessages((prev) => [...prev, data]);
      // Refresh conversations after sending
      fetchConversations();
    });

    newSocket.on('user_typing', (data) => {
      setIsTyping((prevIsTyping) => {
        // Only show typing indicator if viewing conversation with that user
        return data.isTyping;
      });
    });

    // faisal - Listen for read status updates
    newSocket.on('messages_marked_read', (data) => {
      console.log('Messages marked as read event received:', data);
      const { senderId, recipientId } = data;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender_id === senderId && msg.recipient_id === recipientId
            ? { ...msg, is_read: true }
            : msg
        )
      );
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, fetchConversations, currentUser.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!token) return;

    fetch(`${process.env.REACT_APP_API_URL}/api/notifications/mark-all-messages-read`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }, [token]);

  // faisal - Fetch all users when modal opens
  const fetchAllUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter out current user
        const filtered = data.filter(u => u.id !== currentUser.id);
        setAllUsers(filtered);
        setShowUserModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  // faisal - Handle selecting a user from modal
  const handleSelectUser = (user) => {
    setSelectedUser({ id: user.id, name: user.name });
    setShowUserModal(false);
    setSearchQuery('');
    setMessages([]); // Clear messages for new conversation
  };

  // faisal - Filter users based on search
  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch chat history when user selected
  useEffect(() => {
    if (!selectedUser || !token) return;

    const fetchHistory = async () => {
      try {
                  // 🔔 MARK MESSAGE NOTIFICATIONS AS READ
          await fetch(`${process.env.REACT_APP_API_URL}/api/notifications/mark-chat-read`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              fromUserId: selectedUser.id,
            }),
          });

        console.log('Fetching history for user:', selectedUser.id);
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/chat/history?withUserId=${selectedUser.id}&limit=1000`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          console.log('Loaded messages:', data.messages.length, data.messages);
          setMessages(data.messages);
          
          // faisal - Mark all messages from sender as read
          const senderIds = [selectedUser.id];
          if (senderIds.length > 0) {
            try {
              await fetch(`${process.env.REACT_APP_API_URL}/api/chat/mark-read`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ senderIds }),
              });
              // Update messages to show as read
              setMessages(prev => prev.map(msg => 
                msg.sender_id === selectedUser.id ? { ...msg, is_read: true } : msg
              ));
            } catch (error) {
              console.error('Failed to mark messages as read:', error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };

    fetchHistory();
  }, [selectedUser, token]);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket) return;

    console.log('Sending message to:', selectedUser.id, 'content:', newMessage);
    socket.emit('send_message', {
      recipientId: selectedUser.id,
      content: newMessage,
    });

    socket.emit('stop_typing', { recipientId: selectedUser.id });
    setNewMessage('');
  };

  const handleTyping = () => {
    if (socket && selectedUser) {
      socket.emit('typing', { recipientId: selectedUser.id });
    }
  };

  return (
    <div className="chat-container">
      <div className={`conversations-list ${selectedUser ? 'has-active-chat' : ''}`}>
        <div className="messages-header">
          <h2>Messages</h2>
          <button className="add-user-btn" onClick={fetchAllUsers} title="Start new conversation">
            <span>+</span>
          </button>
        </div>

        {showUserModal && (
          <div className="user-modal-overlay" onClick={() => setShowUserModal(false)}>
            <div className="user-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Select a user</h3>
                <button className="modal-close" onClick={() => setShowUserModal(false)}>×</button>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="modal-search"
                autoFocus
              />
              <div className="modal-users-list">
                {filteredUsers.length === 0 ? (
                  <div className="no-users">No users found</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="modal-user-item"
                      onClick={() => handleSelectUser(user)}
                    >
                      <h4>{user.name}</h4>
                      <p>{user.role} - {user.department}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {conversations.length === 0 ? (
          <p className="no-conversations">No conversations yet. Click + to start chatting.</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.other_user_id}
              className={`conversation-item ${selectedUser?.id === conv.other_user_id ? 'active' : ''}`}
              onClick={() => setSelectedUser({ id: conv.other_user_id, name: conv.other_user_name })}
            >
              <h4>{conv.other_user_name}</h4>
              <p className="last-message">{conv.last_message}</p>
              <span className="timestamp">
                {new Date(conv.last_message_time).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>

      <div className={`chat-window ${selectedUser ? 'active' : ''}`}>
        {selectedUser ? (
          <>
            <div className="chat-header">
              <button className="back-button" onClick={() => setSelectedUser(null)}>
                <FaArrowLeft />
              </button>
              <h3>{selectedUser.name}</h3>
            </div>
            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">{msg.content}</div>
                  <div className="message-footer">
                    <span className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                    {msg.sender_id === currentUser.id && (
                      <span className={`message-status ${msg.is_read ? 'read' : 'sent'}`}>
                        ✔✔
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && <div className="typing-indicator">typing...</div>}
              <div ref={messagesEndRef} />
            </div>
            <form className="message-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                autoFocus
              />
              <button type="submit" disabled={!newMessage.trim()}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
