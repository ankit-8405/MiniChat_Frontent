import { useEffect, useRef } from 'react';
import { useCall } from '../../context/CallContext';
import CallToolbar from './CallToolbar';
import CallTimer from './CallTimer';
import './VideoCallUI.css';

const VideoCallUI = () => {
  const {
    callState,
    currentCall,
    localStream,
    remoteStream,
    isVideoEnabled,
    endCall
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  console.log('🎥 VideoCallUI render - callState:', callState);
  console.log('🎥 currentCall:', currentCall);
  console.log('🎥 localStream:', localStream);
  console.log('🎥 remoteStream:', remoteStream);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callState === 'idle') return null;

  return (
    <div className="video-call-container">
      {/* Remote Video (Main) */}
      <div className="remote-video-container">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
        ) : (
          <div className="video-placeholder">
            <div className="avatar-large">
              {currentCall?.receiver?.username?.[0]?.toUpperCase() || 
               currentCall?.caller?.username?.[0]?.toUpperCase()}
            </div>
            <p>{callState === 'ringing' ? 'Ringing...' : 'Connecting...'}</p>
          </div>
        )}
      </div>

      {/* Local Video (Picture-in-Picture) */}
      <div className="local-video-container">
        {isVideoEnabled ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="local-video"
          />
        ) : (
          <div className="video-off-placeholder">
            <span>📷</span>
            <p>Camera Off</p>
          </div>
        )}
      </div>

      {/* Call Info */}
      <div className="call-info-overlay">
        <h3>{currentCall?.receiver?.username || currentCall?.caller?.username}</h3>
        <CallTimer />
      </div>

      {/* Call Controls */}
      <CallToolbar />
    </div>
  );
};

export default VideoCallUI;
