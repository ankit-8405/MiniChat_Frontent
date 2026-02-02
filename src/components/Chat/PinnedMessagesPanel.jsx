import { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/context-menu.css';

const PinnedMessagesPanel = ({ channelId, onClose, onUnpin, canUnpin }) => {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPinnedMessages();
  }, [channelId]);

  const loadPinnedMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/messages/${channelId}/pinned`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPinnedMessages(response.data.pinnedMessages);
    } catch (error) {
      console.error('Error loading pinned messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/messages/${messageId}/pin`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPinnedMessages(prev => prev.filter(msg => msg._id !== messageId));
      if (onUnpin) onUnpin(messageId);
    } catch (error) {
      console.error('Error unpinning message:', error);
    }
  };

  return (
    <div className="pinned-messages-panel">
      <div className="pinned-messages-header">
        <h3>📌 Pinned Messages</h3>
        <button className="btn-close-thread" onClick={onClose}>✕</button>
      </div>

      <div className="pinned-messages-list">
        {loading ? (
          <div className="pinned-messages-empty">Loading...</div>
        ) : pinnedMessages.length === 0 ? (
          <div className="pinned-messages-empty">
            No pinned messages yet
          </div>
        ) : (
          pinnedMessages.map(message => (
            <div key={message._id} className="pinned-message-item">
              <div className="pinned-message-header">
                <span className="pinned-message-sender">
                  {message.sender?.username}
                </span>
                <span>{new Date(message.timestamp).toLocaleDateString()}</span>
              </div>
              <div className="pinned-message-text">{message.text}</div>
              <div className="pinned-message-footer">
                <span>Pinned by {message.pinnedBy?.username}</span>
                {canUnpin && (
                  <button 
                    className="btn-unpin"
                    onClick={() => handleUnpin(message._id)}
                  >
                    Unpin
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PinnedMessagesPanel;
