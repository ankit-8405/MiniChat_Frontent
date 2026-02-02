import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { messageService } from '../../services/authService';

const MessageListWithReactions = ({ messages, loading }) => {
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const { socket } = useSocket();
  const [allMessages, setAllMessages] = useState([]);

  useEffect(() => {
    setAllMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (socket) {
      socket.on('message:deleted', ({ messageId }) => {
        setAllMessages(prev => prev.filter(m => m._id !== messageId));
      });

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

      socket.on('message:reaction-update', ({ messageId, reactions }) => {
        setAllMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, reactions } : msg
        ));
      });

      return () => {
        socket.off('message:deleted');
        socket.off('message:delivery-update');
        socket.off('message:read-update');
        socket.off('message:reaction-update');
      };
    }
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await messageService.deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      if (socket) {
        socket.emit('message:react', { messageId, emoji });
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const renderReactions = (message) => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const reactionGroups = {};
    message.reactions.forEach(reaction => {
      if (!reaction || !reaction.emoji || !reaction.userId) return;

      if (!reactionGroups[reaction.emoji]) {
        reactionGroups[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          userReacted: false
        };
      }
      reactionGroups[reaction.emoji].count++;

      try {
        const reactionUserId = typeof reaction.userId === 'object' 
          ? (reaction.userId._id || reaction.userId.toString())
          : reaction.userId;
        const currentUserId = user?.userId?.toString();
        
        if (reactionUserId && currentUserId && reactionUserId === currentUserId) {
          reactionGroups[reaction.emoji].userReacted = true;
        }
      } catch (error) {
        console.error('Error processing reaction:', error);
      }
    });

    return (
      <div className="message-reactions">
        {Object.values(reactionGroups).map((group, index) => (
          <button
            key={index}
            className={`reaction-bubble ${group.userReacted ? 'user-reacted' : ''}`}
            onClick={() => handleReaction(message._id, group.emoji)}
            title={`${group.count} reaction${group.count > 1 ? 's' : ''}`}
          >
            <span className="reaction-emoji">{group.emoji}</span>
            <span className="reaction-count">{group.count}</span>
          </button>
        ))}
      </div>
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="message-list">
        <div className="loading-messages">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="message-list">
      {allMessages.length === 0 ? (
        <div className="no-messages">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        allMessages.map((message) => {
          const isOwnMessage = message.sender?._id === user?.userId;
          
          return (
            <div
              key={message._id}
              className={`message-wrapper ${isOwnMessage ? 'own-message' : 'other-message'}`}
            >
              <div className="message-bubble">
                {!isOwnMessage && (
                  <div className="message-sender">{message.sender?.username}</div>
                )}
                <div className="message-text">{message.text}</div>
                <div className="message-footer">
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                  {isOwnMessage && (
                    <button
                      className="btn-delete-message"
                      onClick={() => handleDeleteMessage(message._id)}
                      title="Delete message"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                {renderReactions(message)}
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageListWithReactions;
