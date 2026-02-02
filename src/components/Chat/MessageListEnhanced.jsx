import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { messageService } from '../../services/authService';
import MessageItem from './MessageItem';
import '../../assets/reactions.css';
import '../../assets/message-ui.css';

const MessageListEnhanced = ({ messages, loading, onReply }) => {
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const { socket } = useSocket();
  const [allMessages, setAllMessages] = useState([]);

  useEffect(() => {
    console.log('📨 MessageListEnhanced received:', messages.length, 'messages');
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

      // Handle reactions
      socket.on('message:reaction', ({ messageId, reactions }) => {
        setAllMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, reactions } : msg
        ));
      });

      return () => {
        socket.off('message:deleted');
        socket.off('message:delivery-update');
        socket.off('message:read-update');
        socket.off('message:reaction');
      };
    }
  }, [socket]);

  // Mark messages as delivered
  useEffect(() => {
    if (socket && allMessages.length > 0) {
      allMessages.forEach(message => {
        if (message.sender._id !== user.userId) {
          const isDelivered = message.deliveredTo?.includes(user.userId);
          if (!isDelivered) {
            socket.emit('message:delivered', { messageId: message._id });
          }
        }
      });
    }
  }, [allMessages, socket, user.userId]);

  // Mark messages as read
  useEffect(() => {
    if (socket && allMessages.length > 0 && document.hasFocus()) {
      const timer = setTimeout(() => {
        allMessages.forEach(message => {
          if (message.sender._id !== user.userId) {
            const isRead = message.readBy?.some(r => r.userId === user.userId);
            if (!isRead) {
              socket.emit('message:read', { messageId: message._id });
            }
          }
        });
      }, 1000);

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
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      console.log('Adding reaction:', { messageId, emoji });
      const result = await messageService.addReaction(messageId, emoji);
      console.log('Reaction added successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error; // Re-throw to handle in caller
    }
  };

  const handleRemoveReaction = async (messageId, emoji) => {
    try {
      console.log('Removing reaction:', { messageId, emoji });
      const result = await messageService.removeReaction(messageId, emoji);
      console.log('Reaction removed successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      throw error; // Re-throw to handle in caller
    }
  };

  // Safety check for user
  if (!user || !user.userId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Loading user data...
      </div>
    );
  }

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
      gap: '8px',
      background: '#f5f7fa'
    }}>
      {allMessages.map((message) => (
        <MessageItem
          key={message._id}
          message={message}
          onReply={onReply}
          onReact={handleReaction}
          onRemoveReact={handleRemoveReaction}
          onDelete={handleDeleteMessage}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageListEnhanced;
