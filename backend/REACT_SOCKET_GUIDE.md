# React Socket.IO Integration Guide

## 📦 Installation

```bash
npm install socket.io-client
```

---

## 🏗️ Project Structure

```
src/
├── contexts/
│   └── SocketContext.tsx          # Socket.IO context provider
├── hooks/
│   ├── useSocket.ts                # Socket connection hook
│   └── useConversation.ts          # Conversation management hook
├── services/
│   └── api.ts                      # API service for REST calls
├── components/
│   ├── ChatInbox.tsx               # Inbox component
│   ├── ConversationView.tsx        # Chat messages view
│   └── MessageInput.tsx            # Message input component
└── types/
    └── conversation.types.ts       # TypeScript types
```

---

## 📝 Step 1: TypeScript Types

**File: `src/types/conversation.types.ts`**

```typescript
export interface Message {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  content_type: string;
  created_at: string;
}

export interface InboxItem {
  conversation_id: string;
  title: string;
  type_name: string;
  unread_count: number;
  last_message_content: string;
  last_message_at: string;
  last_message_sender_id: string;
  last_message_sender_name: string;
  source_type: string | null;
  source_id: string | null;
}

export interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  username: string;
  is_typing: boolean;
}
```

---

## 🔌 Step 2: Socket Context Provider

**File: `src/contexts/SocketContext.tsx`**

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, TypingIndicator } from '../types/conversation.types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onNewMessage: (callback: (message: Message) => void) => void;
  onTyping: (callback: (data: TypingIndicator) => void) => void;
  emitTyping: (conversationId: string, isTyping: boolean) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get JWT token from localStorage or your auth context
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('No auth token found, skipping socket connection');
      return;
    }

    // Initialize socket connection
    const socketInstance = io('http://localhost:5000', {
      auth: {
        token: token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const onNewMessage = (callback: (message: Message) => void) => {
    if (!socket) return;
    socket.on('new_message', callback);
  };

  const onTyping = (callback: (data: TypingIndicator) => void) => {
    if (!socket) return;
    socket.on('user_typing', callback);
  };

  const emitTyping = (conversationId: string, isTyping: boolean) => {
    if (!socket) return;
    socket.emit('typing', {
      conversation_id: conversationId,
      is_typing: isTyping
    });
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, onNewMessage, onTyping, emitTyping }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
};
```

---

## 🎣 Step 3: Custom Hooks

### Socket Hook

**File: `src/hooks/useSocket.ts`**

```typescript
import { useEffect } from 'react';
import { useSocketContext } from '../contexts/SocketContext';
import { Message, TypingIndicator } from '../types/conversation.types';

export const useSocket = () => {
  const { socket, isConnected, onNewMessage, onTyping, emitTyping } = useSocketContext();

  const subscribeToMessages = (callback: (message: Message) => void) => {
    onNewMessage(callback);

    // Cleanup
    return () => {
      if (socket) {
        socket.off('new_message', callback);
      }
    };
  };

  const subscribeToTyping = (callback: (data: TypingIndicator) => void) => {
    onTyping(callback);

    return () => {
      if (socket) {
        socket.off('user_typing', callback);
      }
    };
  };

  return {
    socket,
    isConnected,
    subscribeToMessages,
    subscribeToTyping,
    emitTyping
  };
};
```

### Conversation Hook

**File: `src/hooks/useConversation.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { Message, InboxItem } from '../types/conversation.types';
import api from '../services/api';

export const useConversation = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const { subscribeToMessages, subscribeToTyping } = useSocket();

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const response = await api.get(`/conversation/${conversationId}/messages`);
      setMessages(response.data.data.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Send message
  const sendMessage = async (content: string) => {
    if (!conversationId) return;

    try {
      const response = await api.post('/conversation/message', {
        conversation_id: conversationId,
        content,
        content_type_name: 'text'
      });

      // Optimistically add message to UI
      const newMessage: Message = {
        message_id: response.data.data.message_id,
        conversation_id: conversationId,
        sender_id: 'current-user-id', // Get from auth context
        sender_name: 'You',
        content,
        content_type: 'text',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages((message: Message) => {
      // Only add if it's for this conversation
      if (message.conversation_id === conversationId) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.message_id === message.message_id)) {
            return prev;
          }
          return [...prev, message];
        });
      }
    });

    return unsubscribe;
  }, [conversationId, subscribeToMessages]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToTyping((data) => {
      if (data.conversation_id === conversationId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.is_typing) {
            newSet.add(data.username);
          } else {
            newSet.delete(data.username);
          }
          return newSet;
        });
      }
    });

    return unsubscribe;
  }, [conversationId, subscribeToTyping]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    loading,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    loadMessages
  };
};
```

---

## 🌐 Step 4: API Service

**File: `src/services/api.ts`**

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 🎨 Step 5: React Components

### Chat Inbox Component

**File: `src/components/ChatInbox.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { InboxItem } from '../types/conversation.types';
import api from '../services/api';

interface ChatInboxProps {
  onSelectConversation: (conversationId: string) => void;
}

export const ChatInbox: React.FC<ChatInboxProps> = ({ onSelectConversation }) => {
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = async () => {
    try {
      const response = await api.get('/conversation/inbox');
      setInbox(response.data.data);
    } catch (error) {
      console.error('Error loading inbox:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading conversations...</div>;

  return (
    <div className="inbox-container">
      <h2>Messages</h2>
      {inbox.length === 0 ? (
        <p>No conversations yet</p>
      ) : (
        <ul className="conversation-list">
          {inbox.map((item) => (
            <li
              key={item.conversation_id}
              onClick={() => onSelectConversation(item.conversation_id)}
              className="conversation-item"
            >
              <div className="conversation-header">
                <h3>{item.title}</h3>
                {item.unread_count > 0 && (
                  <span className="unread-badge">{item.unread_count}</span>
                )}
              </div>
              <p className="last-message">
                {item.last_message_sender_name}: {item.last_message_content}
              </p>
              <span className="timestamp">
                {new Date(item.last_message_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### Conversation View Component

**File: `src/components/ConversationView.tsx`**

```typescript
import React, { useRef, useEffect } from 'react';
import { useConversation } from '../hooks/useConversation';
import { MessageInput } from './MessageInput';

interface ConversationViewProps {
  conversationId: string;
}

export const ConversationView: React.FC<ConversationViewProps> = ({ conversationId }) => {
  const { messages, loading, typingUsers, sendMessage } = useConversation(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  if (loading) return <div>Loading messages...</div>;

  return (
    <div className="conversation-view">
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.message_id}
            className={`message ${message.sender_name === 'You' ? 'sent' : 'received'}`}
          >
            <div className="message-header">
              <strong>{message.sender_name}</strong>
              <span className="timestamp">
                {new Date(message.created_at).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      <MessageInput onSend={handleSendMessage} conversationId={conversationId} />
    </div>
  );
};
```

### Message Input Component

**File: `src/components/MessageInput.tsx`**

```typescript
import React, { useState } from 'react';
import { useSocket } from '../hooks/useSocket';

interface MessageInputProps {
  onSend: (content: string) => void;
  conversationId: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, conversationId }) => {
  const [message, setMessage] = useState('');
  const { emitTyping } = useSocket();
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    // Emit typing indicator
    emitTyping(conversationId, true);

    // Clear previous timeout
    if (typingTimeout) clearTimeout(typingTimeout);

    // Stop typing after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      emitTyping(conversationId, false);
    }, 2000);

    setTypingTimeout(timeout);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
      emitTyping(conversationId, false);
      if (typingTimeout) clearTimeout(typingTimeout);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="message-input-form">
      <input
        type="text"
        value={message}
        onChange={handleChange}
        placeholder="Type a message..."
        className="message-input"
      />
      <button type="submit" className="send-button">
        Send
      </button>
    </form>
  );
};
```

---

## 🚀 Step 6: App Integration

**File: `src/App.tsx`**

```typescript
import React, { useState } from 'react';
import { SocketProvider } from './contexts/SocketContext';
import { ChatInbox } from './components/ChatInbox';
import { ConversationView } from './components/ConversationView';
import './App.css';

function App() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  return (
    <SocketProvider>
      <div className="app-container">
        <div className="sidebar">
          <ChatInbox onSelectConversation={setSelectedConversation} />
        </div>
        <div className="main-content">
          {selectedConversation ? (
            <ConversationView conversationId={selectedConversation} />
          ) : (
            <div className="empty-state">Select a conversation to start chatting</div>
          )}
        </div>
      </div>
    </SocketProvider>
  );
}

export default App;
```

---

## 🎨 Step 7: Basic CSS

**File: `src/App.css`**

```css
.app-container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 300px;
  border-right: 1px solid #ddd;
  overflow-y: auto;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.conversation-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.conversation-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.conversation-item:hover {
  background-color: #f5f5f5;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unread-badge {
  background-color: #007bff;
  color: white;
  border-radius: 50%;
  padding: 2px 8px;
  font-size: 12px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  margin-bottom: 15px;
  max-width: 70%;
}

.message.sent {
  margin-left: auto;
  text-align: right;
}

.message.received {
  margin-right: auto;
}

.message-content {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border-radius: 15px;
  display: inline-block;
}

.message.received .message-content {
  background-color: #e9ecef;
  color: black;
}

.typing-indicator {
  padding: 10px 20px;
  font-style: italic;
  color: #666;
}

.message-input-form {
  display: flex;
  padding: 20px;
  border-top: 1px solid #ddd;
}

.message-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  margin-right: 10px;
}

.send-button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.send-button:hover {
  background-color: #0056b3;
}
```

---

## ✅ Testing Checklist

1. **Start Backend**: `npm run dev` (in backend directory)
2. **Start Frontend**: `npm start` (in React app)
3. **Login**: Get JWT token
4. **Check Console**: Should see "✅ Socket connected"
5. **Send Message**: Type and send
6. **Check Backend Logs**: Should see socket events
7. **Open Second Tab**: Login as different user
8. **Send Message**: Should appear in real-time!

---

## 🐛 Troubleshooting

### Socket not connecting?
- Check backend is running on port 5000
- Verify JWT token in localStorage
- Check browser console for errors
- Ensure CORS is configured correctly

### Messages not appearing in real-time?
- Check socket connection status
- Verify conversation_id matches
- Check backend logs for socket emissions
- Ensure both users are in the same conversation

### Typing indicator not working?
- Verify socket connection
- Check emitTyping is being called
- Ensure conversation_id is correct
