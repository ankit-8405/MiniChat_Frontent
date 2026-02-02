import { useState, useEffect } from 'react';
import { channelService } from '../../services/authService';
import UserStatus from '../Chat/UserStatus';
import { useSocket } from '../../context/SocketContext';

const Sidebar = ({ selectedChannel, onSelectChannel, isOpen }) => {
  const [myChannels, setMyChannels] = useState([]);
  const [allChannels, setAllChannels] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showJoinByIdModal, setShowJoinByIdModal] = useState(false);
  const [showPasteLinkModal, setShowPasteLinkModal] = useState(false);
  const [selectedChannelToJoin, setSelectedChannelToJoin] = useState(null);
  const [joinChannelId, setJoinChannelId] = useState('');
  const [joinChannelPassword, setJoinChannelPassword] = useState('');
  const [pastedLink, setPastedLink] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [channelPassword, setChannelPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [joiningChannelId, setJoiningChannelId] = useState(null);
  const { onlineUsers } = useSocket();

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async (search = '') => {
    try {
      const myData = await channelService.getUserChannels();
      setMyChannels(myData);
      
      const allData = await channelService.getChannels(search);
      setAllChannels(allData);
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    loadChannels(query);
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const channelData = {
        name: newChannelName,
        description: newChannelDescription,
        isPrivate,
        password: isPrivate ? channelPassword : undefined
      };
      
      const newChannel = await channelService.createChannel(channelData);
      setMyChannels([...myChannels, newChannel]);
      
      // Reset form
      setNewChannelName('');
      setNewChannelDescription('');
      setIsPrivate(false);
      setChannelPassword('');
      setShowCreateModal(false);
      
      loadChannels();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create channel');
    }
  };

  const handleJoinChannel = async (channel) => {
    console.log('Attempting to join channel:', channel);
    setError('');
    
    // If private, show password modal
    if (channel.isPrivate) {
      setSelectedChannelToJoin(channel);
      setShowPasswordModal(true);
      setShowBrowseModal(false);
    } else {
      // Public channel, join directly
      try {
        console.log('Joining public channel:', channel._id);
        const joinedChannel = await channelService.joinChannel(channel._id);
        console.log('Successfully joined:', joinedChannel);
        await loadChannels();
        setShowBrowseModal(false);
        
        // Automatically select the joined channel
        onSelectChannel(joinedChannel);
      } catch (error) {
        console.error('Failed to join channel:', error);
        const errorMsg = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Failed to join channel';
        setError(errorMsg);
        alert(`Error: ${errorMsg}`);
      }
    }
  };

  const handleJoinPrivateChannel = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      console.log('Joining private channel:', selectedChannelToJoin._id);
      const joinedChannel = await channelService.joinChannel(selectedChannelToJoin._id, joinPassword);
      console.log('Successfully joined private channel:', joinedChannel);
      await loadChannels();
      setShowPasswordModal(false);
      setJoinPassword('');
      setSelectedChannelToJoin(null);
      
      // Automatically select the joined channel
      onSelectChannel(joinedChannel);
    } catch (error) {
      console.error('Failed to join private channel:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Failed to join channel';
      setError(errorMsg);
    }
  };

  const handleJoinById = async (e) => {
    e.preventDefault();
    setError('');

    if (!joinChannelId.trim()) {
      setError('Please enter a channel name or ID');
      return;
    }

    try {
      const input = joinChannelId.trim();
      let channelToJoin = null;

      // First, try to find channel by name
      const searchResults = await channelService.getChannels(input);
      
      if (searchResults.length > 0) {
        // If exact name match found
        const exactMatch = searchResults.find(ch => 
          ch.name.toLowerCase() === input.toLowerCase()
        );
        
        if (exactMatch) {
          channelToJoin = exactMatch;
        } else if (searchResults.length === 1) {
          // If only one result, use it
          channelToJoin = searchResults[0];
        } else {
          // Multiple matches, show error
          setError(`Multiple channels found. Please use exact name or channel ID`);
          return;
        }
      } else {
        // No name match, try as ID
        try {
          // Validate if it looks like a MongoDB ObjectId
          if (input.match(/^[0-9a-fA-F]{24}$/)) {
            // Try to join directly with ID
            const joinedChannel = await channelService.joinChannel(input, joinChannelPassword || null);
            await loadChannels();
            setShowJoinByIdModal(false);
            setJoinChannelId('');
            setJoinChannelPassword('');
            onSelectChannel(joinedChannel);
            return;
          } else {
            setError('Channel not found. Please check the name or ID');
            return;
          }
        } catch (err) {
          setError('Channel not found. Please check the name or ID');
          return;
        }
      }

      // Join the found channel
      if (channelToJoin) {
        const joinedChannel = await channelService.joinChannel(
          channelToJoin._id, 
          joinChannelPassword || null
        );
        
        await loadChannels();
        setShowJoinByIdModal(false);
        setJoinChannelId('');
        setJoinChannelPassword('');
        onSelectChannel(joinedChannel);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to join channel');
    }
  };

  const handlePasteLink = async (e) => {
    e.preventDefault();
    setError('');

    if (!pastedLink.trim()) {
      setError('Please paste a channel link');
      return;
    }

    try {
      // Extract channel ID from link
      // Format: http://localhost:3000/join/CHANNEL_ID
      const linkPattern = /\/join\/([0-9a-fA-F]{24})/;
      const match = pastedLink.match(linkPattern);

      if (!match) {
        setError('Invalid channel link format');
        return;
      }

      const channelId = match[1];

      // Try to join
      const joinedChannel = await channelService.joinChannel(channelId, joinChannelPassword || null);
      await loadChannels();
      setShowPasteLinkModal(false);
      setPastedLink('');
      setJoinChannelPassword('');
      onSelectChannel(joinedChannel);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to join channel');
    }
  };

  const isChannelJoined = (channelId) => {
    return myChannels.some(ch => ch._id === channelId);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3>My Channels</h3>
        <div className="header-buttons">
          <button onClick={() => setShowPasteLinkModal(true)} className="btn-paste-link" title="Paste Link to Join">
            🔗
          </button>
          <button onClick={() => setShowJoinByIdModal(true)} className="btn-join-id" title="Join by ID">
            🔑
          </button>
          <button onClick={() => setShowBrowseModal(true)} className="btn-browse" title="Browse Channels">
            🔍
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-create" title="Create Channel">
            +
          </button>
        </div>
      </div>

      <div className="channel-list">
        {myChannels.length === 0 ? (
          <div className="no-channels">
            <p>No channels yet</p>
            <button onClick={() => setShowJoinByIdModal(true)} className="btn-join-id-inline">
              🔑 Join by ID
            </button>
            <button onClick={() => setShowBrowseModal(true)} className="btn-browse-inline">
              🔍 Browse Channels
            </button>
          </div>
        ) : (
          myChannels.map((channel) => (
            <div
              key={channel._id}
              className={`channel-item ${selectedChannel?._id === channel._id ? 'active' : ''}`}
              onClick={() => onSelectChannel(channel)}
            >
              <span>{channel.isPrivate ? '🔒' : '🌐'} {channel.name}</span>
              <UserStatus userId={channel._id} onlineUsers={onlineUsers} />
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Channel</h3>
            <form onSubmit={handleCreateChannel}>
              <input
                type="text"
                placeholder="Channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={newChannelDescription}
                onChange={(e) => setNewChannelDescription(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  <span>🔒 Private Channel (requires password)</span>
                </label>
              </div>
              {isPrivate && (
                <input
                  type="password"
                  placeholder="Channel password"
                  value={channelPassword}
                  onChange={(e) => setChannelPassword(e.target.value)}
                  required
                  minLength={4}
                />
              )}
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button type="submit">Create</button>
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBrowseModal && (
        <div className="modal" onClick={() => setShowBrowseModal(false)}>
          <div className="modal-content browse-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Browse Channels</h3>
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search by name or channel ID..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="browse-list">
              {allChannels.length === 0 ? (
                <p>No channels found. Try a different search or create one!</p>
              ) : (
                allChannels.map((channel) => (
                  <div key={channel._id} className="browse-item">
                    <div className="browse-info">
                      <div className="browse-header">
                        <span className="browse-name">
                          {channel.isPrivate ? '🔒' : '🌐'} {channel.name}
                        </span>
                        {channel.isPrivate && <span className="private-badge">Private</span>}
                      </div>
                      {channel.description && (
                        <span className="browse-description">{channel.description}</span>
                      )}
                      <span className="browse-members">{channel.members?.length || 0} members</span>
                      <span className="browse-id">ID: {channel._id}</span>
                    </div>
                    {isChannelJoined(channel._id) ? (
                      <button type="button" className="btn-joined" disabled>✓ Joined</button>
                    ) : (
                      <button 
                        type="button"
                        className="btn-join" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleJoinChannel(channel);
                        }}
                      >
                        {channel.isPrivate ? '🔒 Join' : 'Join'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => {
                setShowBrowseModal(false);
                setError('');
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🔒 Join Private Channel</h3>
            <p>Channel: <strong>{selectedChannelToJoin?.name}</strong></p>
            <form onSubmit={handleJoinPrivateChannel}>
              <input
                type="password"
                placeholder="Enter channel password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                required
                autoFocus
              />
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button type="submit">Join</button>
                <button type="button" onClick={() => {
                  setShowPasswordModal(false);
                  setShowBrowseModal(true);
                  setJoinPassword('');
                  setError('');
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasteLinkModal && (
        <div className="modal" onClick={() => setShowPasteLinkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🔗 Paste Link to Join</h3>
            <p className="modal-description">
              Paste the channel invitation link you received to join instantly!
            </p>
            <form onSubmit={handlePasteLink}>
              <div className="form-group">
                <label>Channel Link *</label>
                <input
                  type="text"
                  placeholder="http://localhost:3000/join/692f33c140c4c5a47bf904a3"
                  value={pastedLink}
                  onChange={(e) => setPastedLink(e.target.value)}
                  required
                  autoFocus
                />
                <small>Paste the complete link shared by channel admin</small>
              </div>
              
              <div className="form-group">
                <label>Password (if private)</label>
                <input
                  type="password"
                  placeholder="Leave empty for public channels"
                  value={joinChannelPassword}
                  onChange={(e) => setJoinChannelPassword(e.target.value)}
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              
              <div className="modal-actions">
                <button type="submit">Join Channel</button>
                <button type="button" onClick={() => {
                  setShowPasteLinkModal(false);
                  setPastedLink('');
                  setJoinChannelPassword('');
                  setError('');
                }}>
                  Cancel
                </button>
              </div>
            </form>
            
            <div className="modal-help">
              <p><strong>💡 How to use:</strong></p>
              <ul>
                <li>Copy the link someone shared with you</li>
                <li>Paste it in the field above</li>
                <li>Enter password if it's a private channel</li>
                <li>Click "Join Channel"</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {showJoinByIdModal && (
        <div className="modal" onClick={() => setShowJoinByIdModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🔑 Join Channel</h3>
            <p className="modal-description">
              Enter the channel name or ID to join. If it's a private channel, you'll also need the password.
            </p>
            <form onSubmit={handleJoinById}>
              <div className="form-group">
                <label>Channel Name or ID *</label>
                <input
                  type="text"
                  placeholder="e.g., general or 692f33c140c4c5a47bf904a3"
                  value={joinChannelId}
                  onChange={(e) => setJoinChannelId(e.target.value)}
                  required
                  autoFocus
                />
                <small>Enter channel name (like "general") or full channel ID</small>
              </div>
              
              <div className="form-group">
                <label>Password (if private)</label>
                <input
                  type="password"
                  placeholder="Leave empty for public channels"
                  value={joinChannelPassword}
                  onChange={(e) => setJoinChannelPassword(e.target.value)}
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              
              <div className="modal-actions">
                <button type="submit">Join Channel</button>
                <button type="button" onClick={() => {
                  setShowJoinByIdModal(false);
                  setJoinChannelId('');
                  setJoinChannelPassword('');
                  setError('');
                }}>
                  Cancel
                </button>
              </div>
            </form>
            
            <div className="modal-help">
              <p><strong>💡 Examples:</strong></p>
              <ul>
                <li><strong>By Name:</strong> "general", "team-alpha", "project-x"</li>
                <li><strong>By ID:</strong> "692f33c140c4c5a47bf904a3"</li>
                <li>Find IDs in 🔍 Browse or ask channel creator</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
