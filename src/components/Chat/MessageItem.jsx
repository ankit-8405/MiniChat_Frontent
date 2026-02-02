import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import EmojiPicker from './EmojiPicker';
import '../../assets/message-ui.css';

const MessageItem = ({ message, onReply, onReact, onRemoveReact, onDelete }) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showQuickReactions, setShowQuickReactions] = useState(false);

  // WhatsApp-style quick reactions
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👎'];

  if (!message || !message._id || !message.sender) {
    return null;
  }

  const isOwn = message.sender._id === user?.userId;

  const getMessageStatus = () => {
    if (!isOwn) return null;

    const deliveredCount = message.deliveredTo?.length || 0;
    const readCount = message.readBy?.length || 0;

    if (readCount > 0) {
      return <span className="message-status read" title={`Read by ${readCount}`}>✓✓</span>;
    } else if (deliveredCount > 0) {
      return <span className="message-status delivered" title={`Delivered to ${deliveredCount}`}>✓✓</span>;
    } else {
      return <span className="message-status sent" title="Sent">✓</span>;
    }
  };

  // Get user's current reaction (if any)
  const getUserReaction = () => {
    if (!message.reactions || message.reactions.length === 0) return null;
    
    const currentUserId = user?.userId;
    if (!currentUserId) return null;

    const userReaction = message.reactions.find(reaction => {
      if (!reaction || !reaction.emoji || !reaction.userId) return false;
      
      try {
        let reactionUserId;
        if (typeof reaction.userId === 'object' && reaction.userId !== null) {
          reactionUserId = reaction.userId._id || reaction.userId.toString();
        } else {
          reactionUserId = reaction.userId;
        }

        const reactionUserIdStr = reactionUserId.toString();
        const currentUserIdStr = currentUserId.toString();

        return reactionUserIdStr === currentUserIdStr;
      } catch (error) {
        console.error('Error checking user reaction:', error);
        return false;
      }
    });

    return userReaction?.emoji || null;
  };

  // Check if user already reacted with this emoji
  const hasUserReacted = (emoji) => {
    return getUserReaction() === emoji;
  };

  // Handle reaction click - Instagram style (only one emoji per user)
  const handleReactionClick = async (emoji) => {
    const currentReaction = getUserReaction();
    
    console.log('🎯 Reaction click:', { emoji, currentReaction });
    
    // If clicking same emoji, remove it
    if (currentReaction === emoji) {
      console.log('➖ Removing same reaction');
      try {
        await onRemoveReact(message._id, emoji);
        console.log('✅ Reaction removed');
      } catch (error) {
        console.error('❌ Error removing reaction:', error);
      }
      return;
    }
    
    // Add new reaction (server will auto-remove old one)
    console.log('➕ Adding/changing reaction to:', emoji);
    try {
      await onReact(message._id, emoji);
      console.log('✅ Reaction added/changed successfully');
    } catch (error) {
      console.error('❌ Error adding reaction:', error);
      // If error, might be because old reaction still exists
      // Try removing old one first
      if (currentReaction) {
        console.log('🔄 Retrying: removing old reaction first');
        try {
          await onRemoveReact(message._id, currentReaction);
          await new Promise(resolve => setTimeout(resolve, 200));
          await onReact(message._id, emoji);
          console.log('✅ Reaction changed on retry');
        } catch (retryError) {
          console.error('❌ Retry failed:', retryError);
        }
      }
    }
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) {
      return null;
    }

    const reactionGroups = {};
    message.reactions.forEach(reaction => {
      if (!reaction || !reaction.emoji || !reaction.userId) return;

      if (!reactionGroups[reaction.emoji]) {
        reactionGroups[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          userReacted: false
        };
      }

      reactionGroups[reaction.emoji].count++;
      reactionGroups[reaction.emoji].users.push(reaction.userId);

      try {
        let reactionUserId;
        if (typeof reaction.userId === 'object' && reaction.userId !== null) {
          reactionUserId = reaction.userId._id || reaction.userId.toString();
        } else {
          reactionUserId = reaction.userId;
        }

        const currentUserId = user?.userId;

        if (reactionUserId && currentUserId) {
          const reactionUserIdStr = reactionUserId.toString();
          const currentUserIdStr = currentUserId.toString();

          if (reactionUserIdStr === currentUserIdStr) {
            reactionGroups[reaction.emoji].userReacted = true;
          }
        }
      } catch (error) {
        console.error('Error checking user reaction:', error);
      }
    });

    return (
      <div className="message-reactions">
        {Object.values(reactionGroups).map((group, index) => (
          <button
            key={`${group.emoji}-${index}`}
            className={`reaction-item ${group.userReacted ? 'user-reacted' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleReactionClick(group.emoji);
            }}
            title={`${group.count} reaction(s)`}
          >
            <span className="reaction-emoji">{group.emoji}</span>
            <span className="reaction-count">{group.count}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`message-wrapper ${isOwn ? 'own-message' : ''}`}
      onMouseEnter={() => {
        setIsHovered(true);
        setShowQuickReactions(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setTimeout(() => setShowQuickReactions(false), 200);
      }}
    >
      {/* Avatar */}
      <div className={`message-avatar ${isOwn ? 'own-avatar' : 'other-avatar'}`}>
        {message.sender.username.charAt(0).toUpperCase()}
      </div>

      {/* Message Content */}
      <div className="message-content-wrapper">
        {/* Header */}
        <div className="message-header">
          <span className="message-sender-name">{message.sender.username}</span>
          <span className="message-timestamp">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.editedAt && (
            <span className="message-edited-badge">(edited)</span>
          )}
        </div>

        {/* Message Bubble */}
        <div className="message-bubble">
          {/* Reply Indicator */}
          {message.replyTo && (
            <div className="message-reply-indicator">
              <div className="reply-sender">
                {message.replyTo.sender?.username || 'Unknown User'}
              </div>
              <div className="reply-text">
                {message.replyTo.text || '[Message not available]'}
              </div>
            </div>
          )}

          {/* Message Text */}
          <div className="message-text">
            {message.text}
            {getMessageStatus()}
          </div>

          {/* Action Buttons - Reply & Delete only */}
          {isHovered && (
            <div className="message-actions-bar">
              <button
                className="message-action-button action-reply"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(message);
                }}
                data-tooltip="Reply"
                aria-label="Reply to message"
              >
                ↩️
              </button>

              {isOwn && (
                <button
                  className="message-action-button action-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(message._id);
                  }}
                  data-tooltip="Delete"
                  aria-label="Delete message"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reactions */}
        {renderReactions()}

        {/* WhatsApp-style Quick Reaction Bar */}
        {showQuickReactions && (
          <div className="quick-reactions-bar">
            {quickReactions.map((emoji) => (
              <button
                key={emoji}
                className={`quick-reaction-btn ${hasUserReacted(emoji) ? 'already-reacted' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReactionClick(emoji);
                  setShowQuickReactions(false);
                }}
                title={hasUserReacted(emoji) ? `Remove ${emoji}` : `React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            <button
              className="quick-reaction-btn more-reactions"
              onClick={(e) => {
                e.stopPropagation();
                setShowReactionPicker(!showReactionPicker);
                setShowQuickReactions(false);
              }}
              title="More reactions"
            >
              ➕
            </button>
            
            {showReactionPicker && (
              <div className="emoji-picker-popup">
                <EmojiPicker
                  onSelect={(emoji) => {
                    handleReactionClick(emoji);
                    setShowReactionPicker(false);
                  }}
                  onClose={() => setShowReactionPicker(false)}
                  position="top"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
