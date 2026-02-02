import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import '../../assets/thread-panel.css';

const ThreadPanel = ({ parentMessage, onClose }) => {
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (parentMessage) {
      loadThread();
    }
  }, [parentMessage]);

  useEffect(() => {
    if (!socket) return;

    socket.on('thread:reply', (reply) => {
      if (reply.parentMessageId === parentMessage._id) {
        setReplies(prev => [...prev, reply]);
      }
    });

    return () => {
      socket.off('thread:reply');
    };
  }, [socket, parentMessage]);

  const loadThread = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/threads/${parentMessage._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplies(response.data.replies);
    } catch (error) {
      console.error('Error loading thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/threads/${parentMessage._id}/reply`,
        { text: newReply },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.emit('thread:reply', response.data);
      setReplies(prev => [...prev, response.data]);
      setNewReply('');
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  if (!parentMessage) return null;

  return (
    <div className="thread-panel">
      <div className="thread-header">
        <h3>Thread</h3>
        <button className="btn-close-thread" onClick={onClose}>✕</button>
      </div>

      <div className="thread-content">
        {/* Parent Message */}
        <div className="thread-parent-message">
          <div className="message-avatar">
            {parentMessage.sender?.avatar ? (
              <img src={parentMessage.sender.avatar} alt={parentMessage.sender.username} />
            ) : (
              <div className="avatar-placeholder">
                {parentMessage.sender?.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="message-content">
            <div className="message-header">
              <span className="message-sender">{parentMessage.sender?.username}</span>
              <span className="message-time">
                {new Date(parentMessage.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-text">{parentMessage.text}</div>
          </div>
        </div>

        <div className="thread-divider">
          <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
        </div>

        {/* Replies */}
        <div className="thread-replies">
          {loading ? (
            <div className="thread-loading">Loading replies...</div>
          ) : replies.length === 0 ? (
            <div className="thread-empty">No replies yet. Start the conversation!</div>
          ) : (
            replies.map(reply => (
              <div key={reply._id} className="thread-reply">
                <div className="message-avatar">
                  {reply.sender?.avatar ? (
                    <img src={reply.sender.avatar} alt={reply.sender.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {reply.sender?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-sender">{reply.sender?.username}</span>
                    <span className="message-time">
                      {new Date(reply.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-text">{reply.text}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply Input */}
      <form className="thread-input-form" onSubmit={handleSendReply}>
        <input
          type="text"
          value={newReply}
          onChange={(e) => setNewReply(e.target.value)}
          placeholder="Reply to thread..."
          className="thread-input"
        />
        <button type="submit" className="btn-send-reply" disabled={!newReply.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ThreadPanel;
