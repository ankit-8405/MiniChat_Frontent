import { useState, useEffect } from 'react';
import { channelService } from '../../services/authService';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import './ChannelInfo.css';

const ChannelInfo = ({ channel, onClose, onUpdate }) => {
  const [channelDetails, setChannelDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState('');
  const { onlineUsers } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    loadChannelDetails();
  }, [channel._id]);

  const loadChannelDetails = async () => {
    try {
      setLoading(true);
      const data = await channelService.getChannelDetails(channel._id);
      setChannelDetails(data);
      setEditForm({
        name: data.name,
        description: data.description || ''
      });
    } catch (error) {
      console.error('Failed to load channel details:', error);
      setError('Failed to load channel details');
    } finally {
      setLoading(false);
    }
  };

  const isOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const getUserRole = () => {
    return channelDetails?.members.find(m => m.userId._id === user.userId)?.role;
  };

  const canManage = () => {
    const role = getUserRole();
    return role === 'owner' || role === 'admin';
  };

  const handleUpdateChannel = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await channelService.updateChannel(channel._id, editForm);
      await loadChannelDetails();
      setEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update channel');
    }
  };

  const handleDeleteChannel = async () => {
    if (!window.confirm('Are you sure you want to delete this channel? This action cannot be undone.')) {
      return;
    }

    try {
      await channelService.deleteChannel(channel._id);
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete channel');
    }
  };

  const handleLeaveChannel = async () => {
    if (!window.confirm('Are you sure you want to leave this channel?')) {
      return;
    }

    try {
      await channelService.leaveChannel(channel._id);
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to leave channel');
    }
  };

  const handleUpdateMemberRole = async (userId, newRole) => {
    try {
      await channelService.updateMemberRole(channel._id, userId, newRole);
      await loadChannelDetails();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await channelService.removeMember(channel._id, userId);
      await loadChannelDetails();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="channel-info-panel">
        <div className="panel-header">
          <h3>Channel Info</h3>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>
        <div className="panel-content">Loading...</div>
      </div>
    );
  }

  if (!channelDetails) {
    return null;
  }

  const userRole = getUserRole();
  const onlineMembers = channelDetails.members.filter(m => isOnline(m.userId._id));
  const offlineMembers = channelDetails.members.filter(m => !isOnline(m.userId._id));

  return (
    <div className="channel-info-panel">
      <div className="panel-header">
        <h3>Channel Info</h3>
        <button onClick={onClose} className="btn-close">✕</button>
      </div>

      <div className="panel-content">
        {error && <div className="error-message">{error}</div>}

        {editing ? (
          <form onSubmit={handleUpdateChannel} className="edit-form">
            <div className="form-group">
              <label>Channel Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="channel-details">
            <div className="detail-item">
              <strong>Name:</strong> {channelDetails.isPrivate ? '🔒' : '🌐'} {channelDetails.name}
            </div>
            {channelDetails.description && (
              <div className="detail-item">
                <strong>Description:</strong> {channelDetails.description}
              </div>
            )}
            <div className="detail-item">
              <strong>Created by:</strong> {channelDetails.createdBy.username}
            </div>
            <div className="detail-item">
              <strong>Your role:</strong> <span className={`role-badge ${userRole}`}>{userRole}</span>
            </div>
          </div>
        )}

        <div className="members-section">
          <h4>Members ({channelDetails.members.length})</h4>
          
          {onlineMembers.length > 0 && (
            <div className="members-group">
              <div className="group-title">🟢 Online ({onlineMembers.length})</div>
              {onlineMembers.map((member) => (
                <div key={member.userId._id} className="member-item">
                  <div className="member-info">
                    <span className="member-avatar">{member.userId.username[0].toUpperCase()}</span>
                    <div className="member-details">
                      <span className="member-name">{member.userId.username}</span>
                      <span className={`member-role ${member.role}`}>{member.role}</span>
                    </div>
                    <span className="status-indicator online"></span>
                  </div>
                  {canManage() && member.userId._id !== user.userId && member.role !== 'owner' && (
                    <div className="member-actions">
                      {member.role === 'member' ? (
                        <button 
                          onClick={() => handleUpdateMemberRole(member.userId._id, 'admin')}
                          className="btn-small"
                          title="Make Admin"
                        >
                          ⬆️
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateMemberRole(member.userId._id, 'member')}
                          className="btn-small"
                          title="Remove Admin"
                        >
                          ⬇️
                        </button>
                      )}
                      <button 
                        onClick={() => handleRemoveMember(member.userId._id)}
                        className="btn-small btn-danger"
                        title="Remove Member"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {offlineMembers.length > 0 && (
            <div className="members-group">
              <div className="group-title">⚫ Offline ({offlineMembers.length})</div>
              {offlineMembers.map((member) => (
                <div key={member.userId._id} className="member-item">
                  <div className="member-info">
                    <span className="member-avatar">{member.userId.username[0].toUpperCase()}</span>
                    <div className="member-details">
                      <span className="member-name">{member.userId.username}</span>
                      <span className={`member-role ${member.role}`}>{member.role}</span>
                    </div>
                    <span className="status-indicator offline"></span>
                  </div>
                  {canManage() && member.userId._id !== user.userId && member.role !== 'owner' && (
                    <div className="member-actions">
                      {member.role === 'member' ? (
                        <button 
                          onClick={() => handleUpdateMemberRole(member.userId._id, 'admin')}
                          className="btn-small"
                          title="Make Admin"
                        >
                          ⬆️
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateMemberRole(member.userId._id, 'member')}
                          className="btn-small"
                          title="Remove Admin"
                        >
                          ⬇️
                        </button>
                      )}
                      <button 
                        onClick={() => handleRemoveMember(member.userId._id)}
                        className="btn-small btn-danger"
                        title="Remove Member"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-actions">
          {canManage() && (
            <>
              {!editing && (
                <button onClick={() => setEditing(true)} className="btn-secondary">
                  ✏️ Edit Channel
                </button>
              )}
              {userRole === 'owner' && (
                <button onClick={handleDeleteChannel} className="btn-danger">
                  🗑️ Delete Channel
                </button>
              )}
            </>
          )}
          {userRole !== 'owner' && (
            <button onClick={handleLeaveChannel} className="btn-secondary">
              🚪 Leave Channel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelInfo;
