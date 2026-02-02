import { useCall } from '../../context/CallContext';
import './CallToolbar.css';

const CallToolbar = () => {
  const {
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    switchCallType,
    endCall,
    currentCall
  } = useCall();

  return (
    <div className="call-toolbar">
      <button
        onClick={toggleAudio}
        className={`toolbar-btn ${!isAudioEnabled ? 'disabled' : ''}`}
        title={isAudioEnabled ? 'Mute' : 'Unmute'}
      >
        {isAudioEnabled ? '🎤' : '🔇'}
      </button>

      <button
        onClick={toggleVideo}
        className={`toolbar-btn ${!isVideoEnabled ? 'disabled' : ''}`}
        title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {isVideoEnabled ? '📹' : '📷'}
      </button>

      <button
        onClick={isScreenSharing ? stopScreenShare : startScreenShare}
        className={`toolbar-btn ${isScreenSharing ? 'active' : ''}`}
        title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
      >
        🖥️
      </button>

      <button
        onClick={() => switchCallType(currentCall?.callType === 'video' ? 'audio' : 'video')}
        className="toolbar-btn"
        title="Switch call type"
      >
        {currentCall?.callType === 'video' ? '📞' : '📹'}
      </button>

      <button
        onClick={endCall}
        className="toolbar-btn btn-end-call"
        title="End call"
      >
        📵
      </button>
    </div>
  );
};

export default CallToolbar;
