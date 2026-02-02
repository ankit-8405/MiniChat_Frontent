import { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/invite-modal.css';

const InviteLinkModal = ({ channelId, onClose }) => {
  const [inviteLinks, setInviteLinks] = useState([]);
  const [expiryHours, setExpiryHours] = useState(24);
  const [maxUses, setMaxUses] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInviteLinks();
  }, [channelId]);

  const loadInviteLinks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/channel/${channelId}/invites`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteLinks(response.data.inviteLinks);
    } catch (error) {
      console.error('Error loading invite links:', error);
    }
  };

  const createInviteLink = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/channel/${channelId}/invite`,
        { 
          expiryHours: expiryHours === 0 ? null : expiryHours,
          maxUses: maxUses ? parseInt(maxUses) : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setInviteLinks(prev => [...prev, response.data]);
      alert('Invite link created! Link copied to clipboard.');
      navigator.clipboard.writeText(response.data.link);
    } catch (error) {
      console.error('Error creating invite link:', error);
      alert('Failed to create invite link');
    } finally {
      setLoading(false);
    }
  };

  const deleteInviteLink = async (code) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/channel/${channelId}/invite/${code}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteLinks(prev => prev.filter(inv => inv.code !== code));
    } catch (error) {
      console.error('Error deleting invite link:', error);
    }
  };

  const copyToClipboard = (link) => {
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invite Links</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Create New Link */}
          <div className="create-invite-section">
            <h3>Create New Invite Link</h3>
            
            <div className="form-group">
              <label>Expiry Time</label>
              <select 
                value={expiryHours} 
                onChange={(e) => setExpiryHours(parseInt(e.target.value))}
                className="form-select"
              >
                <option value={1}>1 hour</option>
                <option value={24}>24 hours</option>
                <option value={168}>7 days</option>
                <option value={0}>Never expires</option>
              </select>
            </div>

            <div className="form-group">
              <label>Max Uses (optional)</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                className="form-input"
                min="1"
              />
            </div>

            <button 
              onClick={createInviteLink} 
              disabled={loading}
              className="btn-create-invite"
            >
              {loading ? 'Creating...' : 'Create Invite Link'}
            </button>
          </div>

          {/* Existing Links */}
          <div className="existing-invites-section">
            <h3>Existing Invite Links</h3>
            {inviteLinks.length === 0 ? (
              <p className="no-invites">No invite links yet</p>
            ) : (
              <div className="invite-links-list">
                {inviteLinks.map(invite => (
                  <div key={invite.code} className="invite-link-item">
                    <div className="invite-link-info">
                      <code className="invite-code">{invite.code}</code>
                      <div className="invite-meta">
                        <span>Uses: {invite.uses}/{invite.maxUses || '∞'}</span>
                        {invite.expiresAt && (
                          <span>Expires: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="invite-actions">
                      <button 
                        onClick={() => copyToClipboard(`${window.location.origin}/invite/${invite.code}`)}
                        className="btn-copy"
                      >
                        📋
                      </button>
                      <button 
                        onClick={() => deleteInviteLink(invite.code)}
                        className="btn-delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteLinkModal;
