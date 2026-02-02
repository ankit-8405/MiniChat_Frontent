import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import '../../assets/video-call.css';

const VideoCall = ({ channelId, callType = 'video', onEnd }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(callType === 'audio');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [participants, setParticipants] = useState([]);

  const { socket } = useSocket();
  const { user } = useAuth();
  const localVideoRef = useRef(null);
  const peerConnections = useRef({});

  useEffect(() => {
    startCall();
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      endCall();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('call:user-joined', handleUserJoined);
    socket.on('call:user-left', handleUserLeft);
    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);

    return () => {
      socket.off('call:user-joined');
      socket.off('call:user-left');
      socket.off('call:offer');
      socket.off('call:answer');
      socket.off('call:ice-candidate');
    };
  }, [socket]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Notify others
      socket.emit('call:join', { channelId, userId: user.userId });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access camera/microphone');
    }
  };

  const handleUserJoined = async ({ userId, username }) => {
    setParticipants(prev => [...prev, { userId, username }]);
    
    // Create peer connection for new user
    const peerConnection = createPeerConnection(userId);
    
    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('call:offer', { to: userId, offer });
  };

  const handleUserLeft = ({ userId }) => {
    setParticipants(prev => prev.filter(p => p.userId !== userId));
    setRemoteStreams(prev => {
      const newStreams = { ...prev };
      delete newStreams[userId];
      return newStreams;
    });
    
    if (peerConnections.current[userId]) {
      peerConnections.current[userId].close();
      delete peerConnections.current[userId];
    }
  };

  const handleOffer = async ({ from, offer }) => {
    const peerConnection = createPeerConnection(from);
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Create and send answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('call:answer', { to: from, answer });
  };

  const handleAnswer = async ({ from, answer }) => {
    const peerConnection = peerConnections.current[from];
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async ({ from, candidate }) => {
    const peerConnection = peerConnections.current[from];
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const createPeerConnection = (userId) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('call:ice-candidate', {
          to: userId,
          candidate: event.candidate
        });
      }
    };

    peerConnection.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [userId]: event.streams[0]
      }));
    };

    peerConnections.current[userId] = peerConnection;
    return peerConnection;
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoMuted(!videoTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Replace video track in all peer connections
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } else {
        // Switch back to camera
        const videoTrack = localStream.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Screen share error:', error);
    }
  };

  const endCall = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};

    // Notify others
    socket.emit('call:leave', { channelId });

    onEnd();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-call-container">
      <div className="video-call-header">
        <div className="call-info">
          <h3>{callType === 'video' ? '📹 Video Call' : '📞 Audio Call'}</h3>
          <div className="call-duration">{formatDuration(callDuration)}</div>
        </div>
        <div className="participants-count">
          👥 {participants.length + 1} participants
        </div>
      </div>

      <div className="video-grid">
        {Object.entries(remoteStreams).map(([userId, stream]) => {
          const participant = participants.find(p => p.userId === userId);
          return (
            <div key={userId} className="video-participant">
              <video
                autoPlay
                playsInline
                ref={el => {
                  if (el) el.srcObject = stream;
                }}
              />
              <div className="participant-info">
                {participant?.username || 'Unknown'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Local Video */}
      <div className="local-video">
        {isVideoMuted ? (
          <div className="no-video-placeholder">
            <div className="no-video-avatar">
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div className="no-video-name">You</div>
          </div>
        ) : (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
          />
        )}
      </div>

      {/* Controls */}
      <div className="video-call-controls">
        <button
          className={`call-control-btn btn-mute-audio ${isAudioMuted ? 'muted' : ''}`}
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute' : 'Mute'}
        >
          {isAudioMuted ? '🔇' : '🎤'}
        </button>

        <button
          className={`call-control-btn btn-mute-video ${isVideoMuted ? 'muted' : ''}`}
          onClick={toggleVideo}
          title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoMuted ? '📷' : '📹'}
        </button>

        <button
          className={`call-control-btn btn-share-screen ${isScreenSharing ? 'sharing' : ''}`}
          onClick={toggleScreenShare}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          🖥️
        </button>

        <button
          className="call-control-btn btn-end-call"
          onClick={endCall}
          title="End call"
        >
          📞
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
