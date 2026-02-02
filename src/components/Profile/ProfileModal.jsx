import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import '../../assets/profile.css';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    status: user?.status || 'online',
    statusMessage: user?.statusMessage || '',
    bio: user?.bio || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Upload avatar if changed
      let avatarUrl = user?.avatar;
      if (avatarFile) {
        const formDataAvatar = new FormData();
        formDataAvatar.append('avatar', avatarFile);
        const avatarRes = await api.post('/users/avatar', formDataAvatar, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        avatarUrl = avatarRes.data.avatarUrl;
      }

      // Update profile
      const response = await api.put('/users/profile', {
        ...formData,
        avatar: avatarUrl
      });

      updateUser(response.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'online', label: 'Online' },
    { value: 'busy', label: 'Busy' },
    { value: 'away', label: 'Away' },
    { value: 'offline', label: 'Offline' }
  ];

  // Handle click outside to close
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('profile-modal-overlay')) {
      onClose();
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Edit Profile</h2>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="profile-avatar-actions">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="avatar-upload" className="btn-upload-avatar">
                📷 Change Avatar
              </label>
              <p className="avatar-hint">Max 5MB • JPG, PNG, GIF</p>
            </div>
          </div>

          {/* Username */}
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
              required
            />
            <small>3-30 characters, letters, numbers, underscore only</small>
          </div>

          {/* Status */}
          <div className="form-group">
            <label>Status</label>
            <div className="status-options">
              {statusOptions.map(option => (
                <label key={option.value} className="status-option">
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={formData.status === option.value}
                    onChange={handleChange}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Message */}
          <div className="form-group">
            <label>Status Message</label>
            <input
              type="text"
              name="statusMessage"
              value={formData.statusMessage}
              onChange={handleChange}
              maxLength={100}
              placeholder="What's on your mind?"
            />
            <small>{formData.statusMessage.length}/100</small>
          </div>

          {/* Bio */}
          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              maxLength={200}
              rows={3}
              placeholder="Tell us about yourself..."
            />
            <small>{formData.bio.length}/200</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-save">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
