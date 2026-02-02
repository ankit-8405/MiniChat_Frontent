import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../assets/profile-setup.css';

const ProfileSetup = () => {
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Default avatar options
  const defaultAvatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Rocky',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Robot2',
    'https://api.dicebear.com/7.x/identicon/svg?seed=Pattern1',
    'https://api.dicebear.com/7.x/identicon/svg?seed=Pattern2'
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      setUploadedImage(file);
      setSelectedAvatar(''); // Clear selected avatar
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
    setUploadedImage(null);
    setImagePreview('');
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate display name
    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    if (displayName.trim().length < 2) {
      setError('Display name must be at least 2 characters');
      return;
    }

    if (displayName.trim().length > 50) {
      setError('Display name must be less than 50 characters');
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = selectedAvatar;

      // Upload image if user selected one
      if (uploadedImage) {
        try {
          const formData = new FormData();
          formData.append('avatar', uploadedImage);

          const uploadResponse = await api.post('/users/upload-avatar', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          avatarUrl = uploadResponse.data.avatarUrl;
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          // Continue with default avatar if upload fails
          setError('Photo upload failed, using default avatar');
        }
      }

      // Update profile - this should work even without avatar
      const response = await api.put('/users/profile', {
        displayName: displayName.trim(),
        avatar: avatarUrl || selectedAvatar || null
      });

      // Update auth context
      if (updateUser) {
        updateUser({
          ...user,
          displayName: response.data.displayName,
          avatar: response.data.avatar
        });
      }

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.error || 'Failed to update profile. Try skipping for now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-card">
        <div className="profile-setup-header">
          <h1>Complete Your Profile</h1>
          <p>Set up your display name and choose an avatar</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Display Name */}
          <div className="form-group">
            <label>Display Name *</label>
            <input
              type="text"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              required
            />
            <small>{displayName.length}/50 characters</small>
          </div>

          {/* Avatar Preview */}
          <div className="avatar-preview-section">
            <label>Profile Picture</label>
            <div className="current-avatar">
              {imagePreview || selectedAvatar ? (
                <img 
                  src={imagePreview || selectedAvatar} 
                  alt="Avatar preview" 
                />
              ) : (
                <div className="no-avatar">
                  <span>👤</span>
                  <p>No avatar selected</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Custom Image */}
          <div className="form-group">
            <label>Upload Your Photo</label>
            <div className="upload-section">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="avatar-upload" className="upload-btn">
                📷 Choose Photo
              </label>
              <small>Max 5MB (JPG, PNG, GIF)</small>
            </div>
          </div>

          {/* Default Avatars */}
          <div className="form-group">
            <label>Or Choose Default Avatar</label>
            <div className="avatar-grid">
              {defaultAvatars.map((avatar, index) => (
                <div
                  key={index}
                  className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  <img src={avatar} alt={`Avatar ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="button-group">
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
            <button type="button" onClick={handleSkip} className="skip-btn">
              Skip for Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
