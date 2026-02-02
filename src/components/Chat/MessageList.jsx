import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePagination } from '../../hooks/usePagination';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import TypingIndicator from './TypingIndicator';
import ReadReceipt from './ReadReceipt';
import MessageReactions from './MessageReactions';

const MessageList = ({ messages, loading, channelId, channelMembers }) => {
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { user } = useAuth();
  const { socket } = useSocket();
  const { loadMore, hasMore, loading: loadingMore } = usePagination(channelId);
  const [allMessages, setAllMessages] = useState([]);

  useEffect(() => {
    console.log('MessageList received messages:', messages.length);
    setAllMessages(messages);
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  useEffect(() => {
    if (socket) {
      socket.on('message:deleted', ({ messageId }) => {
        setAllMessages(prev => prev.filter(msg => msg._id !== messageId));
      });

      socket.on('user:typing', ({ username }) => {
        setTypingUsers(prev => {
          if (!prev.includes(username)) {
            return [...prev, username];
          }
          return prev;
        });
      });

      socket.on('user:stop-typing', ({ username }) => {
        setTypingUsers(prev => prev.filter(u => u !== username));
      });

      // Handle read receipt updates
      socket.on('message:delivery-update', ({ messageId, deliveredTo }) => {
        setAllMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, deliveredTo } : msg
        ));
      });

      socket.on('message:read-update', ({ messageId, readBy }) => {
        setAllMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, readBy } : msg
        ));
      });

      // Handle reaction updates
      socket.on('message:reaction-update', ({ messageId, reactions }) => {
        setAllMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, reactions } : msg
        ));
      });

      return () => {
        socket.off('message:deleted');
        socket.off('user:typing');
        socket.off('user:stop-typing');
        socket.off('message:delivery-update');
        socket.off('message:read-update');
        socket.off('message:reaction-update');
      };
    }
  }, [socket]);

  // Mark messages as delivered and read when they come into view
  useEffect(() => {
    if (socket && allMessages.length > 0 && channelId) {
      allMessages.forEach(message => {
        // Don't mark own messages
        if (message.sender._id !== user.userId) {
          // Mark as delivered
          if (!message.deliveredTo?.includes(user.userId)) {
            socket.emit('message:delivered', { messageId: message._id });
          }
          // Mark as read (when in viewport)
          if (!message.readBy?.some(r => r.userId === user.userId)) {
            socket.emit('message:read', { messageId: message._id });
          }
        }
      });
    }
  }, [allMessages, socket, channelId, user.userId]);

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await api.delete(`/messages/${messageId}`);
      setAllMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message');
    }
  };

  const handleReaction = (messageId, emoji) => {
    if (socket) {
      socket.emit('message:react', { messageId, emoji });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check if message should be grouped with previous message
  const shouldGroupMessage = (currentMsg, previousMsg) => {
    if (!previousMsg) return false;
    
    // Same sender
    if (currentMsg.sender._id !== previousMsg.sender._id) return false;
    
    // Within 1 minute
    const timeDiff = new Date(currentMsg.timestamp) - new Date(previousMsg.timestamp);
    const oneMinute = 60 * 1000;
    
    return timeDiff < oneMinute;
  };

  const handleScroll = async (e) => {
    const { scrollTop } = e.target;
    
    if (scrollTop === 0 && hasMore && !loadingMore) {
      const oldScrollHeight = messagesContainerRef.current.scrollHeight;
      const olderMessages = await loadMore();
      
      if (olderMessages.length > 0) {
        setAllMessages([...olderMessages, ...allMessages]);
        
        setTimeout(() => {
          const newScrollHeight = messagesContainerRef.current.scrollHeight;
          messagesContainerRef.current.scrollTop = newScrollHeight - oldScrollHeight;
        }, 0);
      }
    }
  };

  if (loading) {
    return <div className="messages-loading">Loading messages...</div>;
  }

  return (
    <div 
      className="message-list" 
      ref={messagesContainerRef}
      onScroll={handleScroll}
    >
      {loadingMore && <div className="loading-more">Loading more...</div>}
      
      {allMessages.map((message, index) => {
        const previousMessage = index > 0 ? allMessages[index - 1] : null;
        const isGrouped = shouldGroupMessage(message, previousMessage);
        
        return (
          <div
            key={message._id}
            className={`message ${message.sender._id === user.userId ? 'own-message' : ''} ${isGrouped ? 'grouped-message' : ''}`}
          >
            {!isGrouped && (
              <div className="message-avatar">
                {message.sender.username.charAt(0)}
              </div>
            )}
            {isGrouped && <div className="message-avatar-spacer"></div>}
          <div className="message-content">
            <div className="message-header">
              {!isGrouped && <span className="message-sender">{message.sender.username}</span>}
              <span className="message-time">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
              <ReadReceipt message={message} channelMembers={channelMembers} />
              {message.sender._id === user.userId && (
                <button
                  className="btn-delete-message"
                  onClick={() => handleDeleteMessage(message._id)}
                  title="Delete message"
                >
                  🗑️
                </button>
              )}
            </div>
            <div className="message-bubble">
              {/* Render based on message type */}
              {message.messageType === 'image' && (
                <div className="message-image">
                  <img 
                    src={`${import.meta.env.VITE_API_URL}${message.fileUrl}`} 
                    alt={message.fileName}
                    onClick={() => window.open(`${import.meta.env.VITE_API_URL}${message.fileUrl}`, '_blank')}
                  />
                  {message.text && <div className="message-text">{message.text}</div>}
                </div>
              )}
              
              {message.messageType === 'video' && (
                <div className="message-video">
                  <video 
                    controls 
                    src={`${import.meta.env.VITE_API_URL}${message.fileUrl}`}
                  >
                    Your browser does not support video playback.
                  </video>
                  {message.text && <div className="message-text">{message.text}</div>}
                </div>
              )}
              
              {message.messageType === 'file' && (
                <div className="message-file">
                  <a 
                    href={`${import.meta.env.VITE_API_URL}${message.fileUrl}`} 
                    download={message.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="file-icon">📄</div>
                    <div className="file-info">
                      <div className="file-name">{message.fileName}</div>
                      <div className="file-size">{(message.fileSize / 1024).toFixed(2)} KB</div>
                    </div>
                    <div className="download-icon">⬇️</div>
                  </a>
                  {message.text && <div className="message-text">{message.text}</div>}
                </div>
              )}
              
              {(message.messageType === 'text' || !message.messageType) && (
                <div className="message-text">{message.text}</div>
              )}
            </div>
            <MessageReactions message={message} onReact={handleReaction} />
          </div>
        </div>
        );
      })}
      <TypingIndicator users={typingUsers} />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
