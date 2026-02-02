import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../assets/reactions.css';

const MessageReactions = ({ message, onReact }) => {
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);

  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  const allEmojis = [
    '👍', '👎', '❤️', '🔥', '😂', '😮', '😢', '😡', 
    '🙏', '👏', '🎉', '💯', '✅', '❌', '⭐', '💪'
  ];

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowPicker(false);
  };

  const getReactionCount = (emoji) => {
    const reaction = message.reactions?.find(r => r.emoji === emoji);
    return reaction?.users?.length || 0;
  };

  const hasUserReacted = (emoji) => {
    const reaction = message.reactions?.find(r => r.emoji === emoji);
    return reaction?.users?.includes(user.userId) || false;
  };

  return (
    <div className="message-reactions-container">
      {/* Existing Reactions */}
      {message.reactions && message.reactions.length > 0 && (
        <div className="message-reactions-list">
          {message.reactions.map((reaction, index) => (
            <button
              key={index}
              className={`reaction-bubble ${hasUserReacted(reaction.emoji) ? 'user-reacted' : ''}`}
              onClick={() => handleReact(reaction.emoji)}
              title={`${reaction.users.length} ${reaction.users.length === 1 ? 'person' : 'people'}`}
            >
              <span className="reaction-emoji">{reaction.emoji}</span>
              <span className="reaction-count">{reaction.users.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* Add Reaction Button */}
      <div className="reaction-add-container">
        <button
          className="btn-add-reaction"
          onClick={() => setShowPicker(!showPicker)}
          title="Add reaction"
        >
          😊
        </button>

        {/* Emoji Picker */}
        {showPicker && (
          <div className="emoji-picker">
            <div className="emoji-picker-header">
              <span>Quick Reactions</span>
              <button onClick={() => setShowPicker(false)}>✕</button>
            </div>
            <div className="emoji-picker-quick">
              {quickEmojis.map(emoji => (
                <button
                  key={emoji}
                  className="emoji-option"
                  onClick={() => handleReact(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="emoji-picker-divider"></div>
            <div className="emoji-picker-all">
              {allEmojis.map(emoji => (
                <button
                  key={emoji}
                  className="emoji-option"
                  onClick={() => handleReact(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
