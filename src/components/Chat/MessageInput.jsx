import { useState, useRef, useEffect } from 'react';
import { validateMessage } from '../../utils/sanitize';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import EmojiPicker from './EmojiPicker';

const MessageInput = ({ onSend, channelId, replyTo, onCancelReply }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const { socket } = useSocket();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // If file is selected, upload it
    if (selectedFile) {
      await handleFileUpload();
      return;
    }

    // Otherwise send text message
    const validation = validateMessage(message);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Send message with reply info if replying
    const messageData = {
      text: message.trim(),
      replyTo: replyTo?._id
    };

    onSend(messageData);
    setMessage('');
    
    // Cancel reply after sending
    if (onCancelReply) {
      onCancelReply();
    }
    
    // Stop typing indicator
    if (socket && isTyping && channelId) {
      setIsTyping(false);
      socket.emit('stop-typing', { channelId });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        setError('File too large. Maximum size is 50MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (message.trim()) {
        formData.append('text', message.trim());
      }

      await api.post(`/upload/${channelId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Clear form
      setMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    if (error) setError('');

    // Typing indicator logic
    if (socket && channelId) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { channelId });
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('stop-typing', { channelId });
      }, 2000);
    }
  };

  useEffect(() => {
    // Close emoji picker when clicking outside
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup: stop typing when component unmounts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (socket && isTyping && channelId) {
        socket.emit('stop-typing', { channelId });
      }
    };
  }, [socket, isTyping, channelId, showEmojiPicker]);

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        {/* Reply Preview */}
        {replyTo && (
          <div className="reply-preview">
            <div className="reply-preview-content">
              <span className="reply-preview-label">Replying to {replyTo.sender.username}</span>
              <span className="reply-preview-text">{replyTo.text}</span>
            </div>
            <button type="button" onClick={onCancelReply} className="btn-cancel-reply">
              ✕
            </button>
          </div>
        )}

        {selectedFile && (
          <div className="file-preview">
            <span className="file-name">📎 {selectedFile.name}</span>
            <button type="button" onClick={clearFile} className="btn-clear-file">
              ✕
            </button>
          </div>
        )}
        <div className="input-row">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-attach"
            title="Attach file"
            disabled={uploading}
          >
            📎
          </button>
          <div style={{ position: 'relative' }} ref={emojiPickerRef}>
            <button
              type="button"
              className="btn-emoji"
              title="Add emoji"
              disabled={uploading}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              😊
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
                position="bottom"
              />
            )}
          </div>
          <input
            type="text"
            placeholder={
              replyTo 
                ? `Reply to ${replyTo.sender.username}...` 
                : selectedFile 
                  ? "Add a caption (optional)..." 
                  : "Type a message... (Press Enter to send)"
            }
            value={message}
            onChange={handleChange}
            maxLength={2000}
            disabled={uploading}
            className="message-text-input"
          />
          <button
            type="button"
            className="btn-voice"
            title="Voice note (coming soon)"
            disabled={uploading}
          >
            🎤
          </button>
          <button type="submit" disabled={(!message.trim() && !selectedFile) || uploading} className="btn-send">
            {uploading ? '⏳' : selectedFile ? '📤' : '➤'}
          </button>
        </div>
        {error && <span className="input-error">{error}</span>}
      </div>
    </form>
  );
};

export default MessageInput;
