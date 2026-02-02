import { useState } from 'react';
import { requestMediaPermissions } from '../../utils/mediaPermissions';
import './PermissionRequest.css';

const PermissionRequest = ({ onGranted, onDenied }) => {
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async () => {
    setRequesting(true);
    setError('');

    const result = await requestMediaPermissions(true, true);

    if (result.success) {
      onGranted();
    } else {
      setError(result.message);
      if (onDenied) onDenied(result);
    }

    setRequesting(false);
  };

  return (
    <div className="permission-request-overlay">
      <div className="permission-request-modal">
        <div className="permission-icon">📹🎤</div>
        <h2>Camera & Microphone Access</h2>
        <p>
          To make video and audio calls, we need access to your camera and microphone.
        </p>

        {error && (
          <div className="permission-error">
            <strong>⚠️ {error}</strong>
            <div className="permission-help">
              <p>How to fix:</p>
              <ol>
                <li>Click the 🔒 icon in your browser's address bar</li>
                <li>Find "Camera" and "Microphone" settings</li>
                <li>Change to "Allow"</li>
                <li>Refresh the page and try again</li>
              </ol>
            </div>
          </div>
        )}

        <div className="permission-actions">
          <button 
            onClick={handleRequest}
            disabled={requesting}
            className="btn-allow"
          >
            {requesting ? 'Requesting...' : 'Allow Access'}
          </button>
          {onDenied && (
            <button 
              onClick={() => onDenied({ success: false })}
              className="btn-cancel"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="permission-note">
          <small>
            🔒 Your privacy is important. We only access your camera/microphone during calls.
          </small>
        </div>
      </div>
    </div>
  );
};

export default PermissionRequest;
