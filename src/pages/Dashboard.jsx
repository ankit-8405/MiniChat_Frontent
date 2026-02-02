import { useState, useEffect } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import Navbar from '../components/Layout/Navbar';
import MessageList from '../components/Chat/MessageList';
import MessageListSimple from '../components/Chat/MessageListSimple';
import MessageListEnhanced from '../components/Chat/MessageListEnhanced';
import MessageInput from '../components/Chat/MessageInput';
import VideoCall from '../components/Chat/VideoCall';
import SearchPanel from '../components/Chat/SearchPanel';
import AIAssistant from '../components/Chat/AIAssistant';
import PinnedMessagesPanel from '../components/Chat/PinnedMessagesPanel';
import InviteLinkModal from '../components/Chat/InviteLinkModal';
import ChannelInfo from '../components/Chat/ChannelInfo';
import QuizList from '../components/Quiz/QuizList';
import IncomingCallModal from '../components/Call/IncomingCallModal';
import VideoCallUI from '../components/Call/VideoCallUI';
import { useChat } from '../hooks/useChat';
import { useCall } from '../context/CallContext';
import { useAuth } from '../context/AuthContext';
import { requestNotificationPermission } from '../utils/notifications';
import { SearchIcon, QuizIcon, AIIcon, PinIcon, LinkIcon, VideoIcon, PhoneIcon, InfoIcon } from '../components/Icons/Icons';
import '../assets/dashboard.css';

const Dashboard = () => {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState(null); // 'video' or 'audio'
  const [showSearch, setShowSearch] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const { messages, loading, sendMessage } = useChat(
    selectedChannel?._id,
    selectedChannel?.name
  );
  const { callState, initiateCall } = useCall();
  const { user } = useAuth();

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <div className="dashboard">
      <Navbar onMenuToggle={handleMenuToggle} />
      {sidebarOpen && <div className="sidebar-overlay active" onClick={() => setSidebarOpen(false)} />}
      <div className="dashboard-content">
        <Sidebar 
          selectedChannel={selectedChannel}
          onSelectChannel={handleChannelSelect}
          isOpen={sidebarOpen}
        />
        <div className="chat-area">
          {selectedChannel ? (
            <>
              <div className="chat-header">
                <div className="channel-title">
                  <div className="channel-title-left">
                    <h2>{selectedChannel.isPrivate ? '🔒' : '🌐'} {selectedChannel.name}</h2>
                    <div className="channel-subtitle">
                      {selectedChannel.description && (
                        <span className="channel-description">{selectedChannel.description}</span>
                      )}
                      <span className="channel-members">
                        👥 {selectedChannel.members?.length || 0} members
                      </span>
                    </div>
                  </div>
                  <div className="channel-actions">
                    <button 
                      className="btn-search" 
                      onClick={() => setShowSearch(true)}
                      title="Search Messages"
                    >
                      <SearchIcon size={20} />
                    </button>
                    <button 
                      className="btn-quiz" 
                      onClick={() => setShowQuiz(true)}
                      title="Quizzes"
                    >
                      <QuizIcon size={20} />
                    </button>
                    <button 
                      className="btn-ai-assistant" 
                      onClick={() => setShowAI(true)}
                      title="AI Assistant"
                    >
                      <AIIcon size={20} />
                    </button>
                    <button 
                      className="btn-pinned" 
                      onClick={() => setShowPinned(true)}
                      title="Pinned Messages"
                    >
                      <PinIcon size={20} />
                    </button>
                    <button 
                      className="btn-invite" 
                      onClick={() => setShowInvite(true)}
                      title="Invite Links"
                    >
                      <LinkIcon size={20} />
                    </button>
                    <button 
                      className="btn-video-call" 
                      onClick={() => {
                        // Find other member (not current user)
                        const otherMember = selectedChannel.members.find(m => {
                          const memberId = m.userId?._id || m.userId;
                          return memberId.toString() !== user?.userId.toString();
                        });
                        
                        if (otherMember) {
                          const receiverId = otherMember.userId?._id || otherMember.userId;
                          console.log('Starting video call to:', receiverId);
                          initiateCall(receiverId, 'video', selectedChannel._id);
                        } else {
                          alert('No other members in this channel to call');
                        }
                      }}
                      title="Start Video Call"
                      disabled={callState !== 'idle'}
                    >
                      <VideoIcon size={20} />
                    </button>
                    <button 
                      className="btn-audio-call" 
                      onClick={() => {
                        // Find other member (not current user)
                        const otherMember = selectedChannel.members.find(m => {
                          const memberId = m.userId?._id || m.userId;
                          return memberId.toString() !== user?.userId.toString();
                        });
                        
                        if (otherMember) {
                          const receiverId = otherMember.userId?._id || otherMember.userId;
                          console.log('Starting audio call to:', receiverId);
                          initiateCall(receiverId, 'audio', selectedChannel._id);
                        } else {
                          alert('No other members in this channel to call');
                        }
                      }}
                      title="Start Audio Call"
                      disabled={callState !== 'idle'}
                    >
                      <PhoneIcon size={20} />
                    </button>
                    <button 
                      className="btn-channel-info" 
                      onClick={() => setShowChannelInfo(!showChannelInfo)}
                      title="Channel Info"
                    >
                      <InfoIcon size={20} />
                    </button>
                    <button 
                      className="btn-leave-channel" 
                      title="Leave Channel"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to leave this channel?')) {
                          setSelectedChannel(null);
                        }
                      }}
                    >
                      🚪
                    </button>
                  </div>
                </div>
                {showChannelInfo && (
                  <div className="channel-info-panel">
                    <div className="info-panel-header">
                      <h3>Channel Information</h3>
                      <button 
                        className="btn-close-info"
                        onClick={() => setShowChannelInfo(false)}
                        title="Close"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Channel Name:</span>
                      <span className="info-value">{selectedChannel.name}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Channel ID:</span>
                      <div className="info-value-with-copy">
                        <code className="channel-id">{selectedChannel._id}</code>
                        <button 
                          className="btn-copy" 
                          onClick={() => {
                            navigator.clipboard.writeText(selectedChannel._id);
                            alert('Channel ID copied!');
                          }}
                          title="Copy ID"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Type:</span>
                      <span className="info-value">
                        {selectedChannel.isPrivate ? '🔒 Private' : '🌐 Public'}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Members:</span>
                      <span className="info-value">{selectedChannel.members?.length || 0}</span>
                    </div>
                    {selectedChannel.description && (
                      <div className="info-row">
                        <span className="info-label">Description:</span>
                        <span className="info-value">{selectedChannel.description}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="info-label">Share Link:</span>
                      <div className="info-value-with-copy">
                        <code className="share-link">
                          {window.location.origin}/join/{selectedChannel._id}
                        </code>
                        <button 
                          className="btn-copy" 
                          onClick={() => {
                            const link = `${window.location.origin}/join/${selectedChannel._id}`;
                            navigator.clipboard.writeText(link);
                            alert('Link copied! Share this with others.');
                          }}
                          title="Copy Link"
                        >
                          🔗
                        </button>
                      </div>
                    </div>
                    <div className="info-actions">
                      <button 
                        className="btn-share"
                        onClick={() => {
                          const shareText = selectedChannel.isPrivate 
                            ? `Join "${selectedChannel.name}" channel!\n\nChannel ID: ${selectedChannel._id}\nLink: ${window.location.origin}/join/${selectedChannel._id}\n\n⚠️ This is a private channel. Ask admin for password.`
                            : `Join "${selectedChannel.name}" channel!\n\nChannel ID: ${selectedChannel._id}\nLink: ${window.location.origin}/join/${selectedChannel._id}`;
                          
                          navigator.clipboard.writeText(shareText);
                          alert('Channel details copied! You can paste and share.');
                        }}
                      >
                        📤 Copy Share Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {inCall ? (
                <VideoCall 
                  channelId={selectedChannel._id}
                  callType={callType}
                  onEnd={() => {
                    setInCall(false);
                    setCallType(null);
                  }}
                />
              ) : (
                <>
                  <MessageListEnhanced 
                    messages={messages} 
                    loading={loading}
                    onReply={setReplyTo}
                  />
                  <MessageInput 
                    onSend={sendMessage} 
                    channelId={selectedChannel._id}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                  />
                </>
              )}

              {/* Feature Panels */}
              {showSearch && (
                <SearchPanel
                  channelId={selectedChannel._id}
                  onMessageClick={(msg) => {
                    // Scroll to message
                    console.log('Jump to message:', msg);
                  }}
                  onClose={() => setShowSearch(false)}
                />
              )}

              {showAI && (
                <AIAssistant
                  channelId={selectedChannel._id}
                  onClose={() => setShowAI(false)}
                />
              )}

              {showPinned && (
                <PinnedMessagesPanel
                  channelId={selectedChannel._id}
                  onClose={() => setShowPinned(false)}
                  canUnpin={true}
                />
              )}

              {showInvite && (
                <InviteLinkModal
                  channelId={selectedChannel._id}
                  onClose={() => setShowInvite(false)}
                />
              )}

              {showQuiz && (
                <div className="quiz-modal-overlay">
                  <div className="quiz-modal-container">
                    <button 
                      className="quiz-close-btn" 
                      onClick={() => setShowQuiz(false)}
                    >
                      ×
                    </button>
                    <QuizList channelId={selectedChannel._id} />
                  </div>
                </div>
              )}

              {showChannelInfo && (
                <ChannelInfo
                  channel={selectedChannel}
                  onClose={() => setShowChannelInfo(false)}
                  onUpdate={() => {
                    // Refresh channel list in sidebar
                    setShowChannelInfo(false);
                  }}
                />
              )}
            </>
          ) : (
            <div className="no-channel">
              <div className="no-channel-icon">💬</div>
              <div className="no-channel-text">
                <p>Select a channel to start chatting</p>
                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Choose from the sidebar or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Call UI Components */}
      <IncomingCallModal />
      {callState !== 'idle' && <VideoCallUI />}
    </div>
  );
};

export default Dashboard;
