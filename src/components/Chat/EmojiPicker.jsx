import { useState } from 'react';
import '../../assets/emoji-picker.css';

const EmojiPicker = ({ onSelect, onClose, position = 'bottom' }) => {
  const [activeCategory, setActiveCategory] = useState('smileys');

  const emojiCategories = {
    smileys: {
      name: '😊 Smileys',
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
        '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
        '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
        '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
        '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
        '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕'
      ]
    },
    gestures: {
      name: '👍 Gestures',
      emojis: [
        '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
        '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️',
        '🖖', '👋', '🤝', '💪', '🦾', '🙏', '✍️', '💅',
        '🤳', '💃', '🕺', '👏', '🙌', '👐', '🤲', '🤝'
      ]
    },
    hearts: {
      name: '❤️ Hearts',
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
        '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
        '💘', '💝', '💟', '♥️', '💌', '💋', '💏', '💑'
      ]
    },
    animals: {
      name: '🐶 Animals',
      emojis: [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
        '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
        '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
        '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞'
      ]
    },
    food: {
      name: '🍕 Food',
      emojis: [
        '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚',
        '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯',
        '🥖', '🧀', '🥗', '🥙', '🌮', '🌯', '🥪', '🍖',
        '🍗', '🥩', '🍠', '🍱', '🍘', '🍙', '🍚', '🍛'
      ]
    },
    activities: {
      name: '⚽ Activities',
      emojis: [
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
        '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
        '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊',
        '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿'
      ]
    },
    objects: {
      name: '💡 Objects',
      emojis: [
        '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵',
        '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰',
        '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱',
        '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️'
      ]
    },
    symbols: {
      name: '🔥 Symbols',
      emojis: [
        '🔥', '⭐', '✨', '💫', '💥', '💢', '💦', '💨',
        '🕳️', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '✅',
        '✔️', '❌', '❎', '➕', '➖', '➗', '✖️', '💯',
        '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫'
      ]
    }
  };

  const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];

  return (
    <div className={`emoji-picker emoji-picker-${position}`}>
      <div className="emoji-picker-header">
        <span>Pick an emoji</span>
        <button onClick={onClose} title="Close">✕</button>
      </div>

      {/* Quick Reactions */}
      <div className="emoji-picker-section">
        <div className="emoji-picker-quick">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              className="emoji-option emoji-quick"
              onClick={() => onSelect(emoji)}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="emoji-picker-divider" />

      {/* Category Tabs */}
      <div className="emoji-picker-categories">
        {Object.keys(emojiCategories).map((category) => (
          <button
            key={category}
            className={`emoji-category-btn ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
            title={emojiCategories[category].name}
          >
            {emojiCategories[category].emojis[0]}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="emoji-picker-grid">
        {emojiCategories[activeCategory].emojis.map((emoji) => (
          <button
            key={emoji}
            className="emoji-option"
            onClick={() => onSelect(emoji)}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
