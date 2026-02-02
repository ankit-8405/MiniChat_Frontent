import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { messageService } from '../../services/authService';

const MessageListSimple = ({ messages, loading }) => {
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const { socket } = useSocket();
  const [allMessages, setAllMessages] = useState([]);
  const [hoveredMessage, setHoveredMessage] = useState(null);

  useEffect(() => {
    console.log('📨 MessageListSimple received:', messages.length, 'messages');
    setAllMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (socket) {
      // Handle message deleted
      socket.on('message:deleted', ({ messageId }) => {
        console.log('Message deleted:', messageId);
        setAllMessages(prev => prev.filter(m => m._id !== messageId));
      });

      // Handle delivery updates
      socket.on('message:delivery-update', ({ messageId, deliveredTo }) => {
        setAllMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, deliveredTo } : msg
        ));
      });

      // Handle read updates
      socket.on('message:read-update', ({ messageId, readBy }) => {
        setAllMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, readBy } : msg
        ));
      });

      return () => {
        socket.off('message:deleted');
        socket.off('message:delivery-update');
        socket.off('message:read-update');
      };
    }
  }, [socket]);

  // Mark messages as delivered when they appear
  useEffect(() => {
    if (socket && allMessages.length > 0) {
      allMessages.forEach(message => {
        // Only mark as delivered if it's not our own message
        if (message.sender._id !== user.userId) {
          const isDelivered = message.deliveredTo?.includes(user.userId);
          if (!isDelivered) {
            socket.emit('message:delivered', { messageId: message._id });
          }
        }
      });
    }
  }, [allMessages, socket, user.userId]);

  // Mark messages as read when user is viewing them
  useEffect(() => {
    if (socket && allMessages.length > 0 && document.hasFocus()) {
      const timer = setTimeout(() => {
        allMessages.forEach(message => {
          // Only mark as read if it's not our own message
          if (message.sender._id !== user.userId) {
            const isRead = message.readBy?.some(r => r.userId === user.userId);
            if (!isRead) {
              socket.emit('message:read', { messageId: message._id });
            }
          }
        });
      }, 1000); // Wait 1 second before marking as read

      return () => clearTimeout(timer);
    }
  }, [allMessages, socket, user.userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await messageService.deleteMessage(messageId);
      // Message will be removed via socket event
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const getMessageStatus = (message) => {
    // Only show status for own messages
    if (message.sender._id !== user.userId) {
      return null;
    }

    const deliveredCount = message.deliveredTo?.length || 0;
    const readCount = message.readBy?.length || 0;

    if (readCount > 0) {
      // Message read - blue double tick
      return (
        <span style={{ color: '#4fc3f7', fontSize: '14px', marginLeft: '5px' }} title={`Read by ${readCount} user(s)`}>
          ✓✓
        </span>
      );
    } else if (deliveredCount > 0) {
      // Message delivered - gray double tick
      return (
        <span style={{ color: '#999', fontSize: '14px', marginLeft: '5px' }} title={`Delivered to ${deliveredCount} user(s)`}>
          ✓✓
        </span>
      );
    } else {
      // Message sent - single tick
      return (
        <span style={{ color: '#999', fontSize: '14px', marginLeft: '5px' }} title="Sent">
          ✓
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Loading messages...
      </div>
    );
  }

  if (allMessages.length === 0) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#999',
        fontSize: '18px'
      }}>
        No messages yet. Send the first one! 💬
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      background: '#f5f7fa'
    }}>
      {allMessages.map((message) => {
        const isOwn = message.sender._id === user.userId;
        const isHovered = hoveredMessage === message._id;
        
        return (
          <div
            key={message._id}
            onMouseEnter={() => setHoveredMessage(message._id)}
            onMouseLeave={() => setHoveredMessage(null)}
            style={{
              display: 'flex',
              flexDirection: isOwn ? 'row-reverse' : 'row',
              gap: '10px',
              alignItems: 'flex-start',
              maxWidth: '70%',
              alignSelf: isOwn ? 'flex-end' : 'flex-start',
              position: 'relative'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isOwn ? '#764ba2' : '#667eea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              flexShrink: 0
            }}>
              {message.sender.username.charAt(0).toUpperCase()}
            </div>

            {/* Message Content */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              flex: 1,
              position: 'relative'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                gap: '10px',
                fontSize: '12px',
                color: '#666',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 'bold', color: '#333' }}>
                  {message.sender.username}
                </span>
                <span>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
                {message.editedAt && (
                  <span style={{ fontSize: '11px', fontStyle: 'italic' }}>
                    (edited)
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div style={{
                background: isOwn ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                color: isOwn ? 'white' : '#333',
                padding: '12px 16px',
                borderRadius: '18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                wordWrap: 'break-word',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px' }}>
                  <span style={{ flex: 1 }}>{message.text}</span>
                  {getMessageStatus(message)}
                </div>
                
                {/* Delete Button - Only show on hover and for own messages */}
                {isHovered && isOwn && (
                  <button
                    onClick={() => handleDeleteMessage(message._id)}
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s',
                      zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#c82333';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#dc3545';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Delete message"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageListSimple;
