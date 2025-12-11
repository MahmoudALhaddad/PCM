import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import "../styles/chat.css";

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
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
      const res = await fetch('http://localhost:5000/api/chat/conversations', {
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

    const newSocket = io('http://localhost:5000', {
      auth: { token },
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

  // Handle user search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/chat/search-users?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setShowSearch(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Handle selecting a user from search results
  const handleSelectSearchResult = (user) => {
    setSelectedUser({ id: user.id, name: user.name });
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setMessages([]); // Clear messages since this is a new conversation
  };

  // Fetch chat history when user selected
  useEffect(() => {
    if (!selectedUser || !token) return;

    const fetchHistory = async () => {
      try {
        console.log('Fetching history for user:', selectedUser.id);
        const res = await fetch(
          `http://localhost:5000/api/chat/history?withUserId=${selectedUser.id}&limit=1000`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          console.log('Loaded messages:', data.messages.length, data.messages);
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };

    fetchHistory();
  }, [selectedUser, token]);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      <div className="conversations-list">
        <h2>Messages</h2>
        
        <div className="search-box">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Search users..."
            className="search-input"
          />
        </div>

        {showSearch && searchResults.length > 0 ? (
          <div className="search-results">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="conversation-item"
                onClick={() => handleSelectSearchResult(user)}
              >
                <h4>{user.name}</h4>
                <p className="user-role">{user.role} - {user.department}</p>
              </div>
            ))}
          </div>
        ) : (
          <>
            {conversations.length === 0 ? (
              <p className="no-conversations">No conversations yet. Search for a user to start chatting.</p>
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
          </>
        )}
      </div>

      <div className="chat-window">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <h3>{selectedUser.name}</h3>
            </div>
            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">{msg.content}</div>
                  <span className="message-time">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
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
