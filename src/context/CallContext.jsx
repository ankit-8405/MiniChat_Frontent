import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const CallContext = createContext();

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within CallProvider');
  }
  return context;
};

// ICE servers configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  
  // Call state
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, connected, ended
  const [currentCall, setCurrentCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState(null);
  
  // Refs
  const peerConnection = useRef(null);
  const callTimerRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Initialize peer connection
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && currentCall) {
        socket.emit('call:ice-candidate', {
          callId: currentCall._id,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track:', event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setError('Connection lost. Trying to reconnect...');
      } else if (pc.iceConnectionState === 'connected') {
        setError(null);
        setCallState('connected');
      }
    };

    return pc;
  };

  // Start call timer
  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Stop call timer
  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  // Get user media
  const getUserMedia = async (video = true, audio = true) => {
    try {
      const constraints = {
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError(getMediaError(err));
      throw err;
    }
  };

  // Get media error message
  const getMediaError = (err) => {
    if (err.name === 'NotAllowedError') {
      return 'Camera/microphone permission denied. Please allow access.';
    } else if (err.name === 'NotFoundError') {
      return 'No camera or microphone found.';
    } else if (err.name === 'NotReadableError') {
      return 'Camera/microphone is already in use.';
    }
    return 'Failed to access camera/microphone.';
  };

  // Initiate call
  const initiateCall = async (receiverId, callType = 'video', channelId = null) => {
    try {
      console.log('📞 Initiating call...', { receiverId, callType });
      
      // Check if socket is connected
      if (!socket || !socket.connected) {
        alert('❌ Not connected to server. Please refresh the page.');
        return;
      }

      setCallState('calling');
      setError(null);

      // Check browser support with better detection
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasRTCPeerConnection = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
      
      console.log('Browser support check:', { hasGetUserMedia, hasRTCPeerConnection });
      
      if (!hasGetUserMedia || !hasRTCPeerConnection) {
        const browserInfo = navigator.userAgent;
        console.error('Browser not supported:', browserInfo);
        alert('❌ Your browser does not support video/audio calls.\n\nPlease use:\n• Chrome (recommended)\n• Firefox\n• Edge\n• Safari (iOS/macOS)\n\nCurrent browser: ' + browserInfo.substring(0, 50));
        setCallState('idle');
        return;
      }

      // Get user media
      try {
        console.log('🎥 Requesting media permissions...');
        const stream = await getUserMedia(callType === 'video', true);
        console.log('✅ Media stream obtained:', {
          video: stream.getVideoTracks().length,
          audio: stream.getAudioTracks().length
        });
        
        // Emit call initiate
        console.log('📡 Emitting call:initiate to server');
        socket.emit('call:initiate', { receiverId, callType, channelId });
        
        console.log('⏳ Waiting for receiver to accept...');
      } catch (mediaErr) {
        // Show user-friendly error
        const errorMsg = getMediaError(mediaErr);
        console.error('❌ Media error:', mediaErr.name, errorMsg);
        
        let helpText = '';
        if (mediaErr.name === 'NotAllowedError') {
          helpText = '\n\n📝 How to fix:\n1. Click the 🔒 icon in address bar\n2. Set Camera & Microphone to "Allow"\n3. Refresh page (F5)\n4. Try calling again';
        } else if (mediaErr.name === 'NotFoundError') {
          helpText = '\n\n📝 How to fix:\n1. Connect a camera/microphone\n2. Check device settings\n3. Try restarting browser';
        } else if (mediaErr.name === 'NotReadableError') {
          helpText = '\n\n📝 How to fix:\n1. Close other apps using camera (Zoom, Teams, etc.)\n2. Restart browser\n3. Try again';
        }
        
        alert(`❌ Cannot start call: ${errorMsg}${helpText}`);
        setCallState('idle');
        throw mediaErr;
      }

    } catch (err) {
      setCallState('idle');
      console.error('❌ Failed to initiate call:', err);
    }
  };

  // Accept call
  const acceptCall = async () => {
    try {
      if (!incomingCall) return;

      console.log('✅ Accepting call:', incomingCall._id);
      setCallState('connecting');
      setCurrentCall(incomingCall);
      setIncomingCall(null);

      // Get user media
      try {
        console.log('🎥 Getting media for call type:', incomingCall.callType);
        const stream = await getUserMedia(incomingCall.callType === 'video', true);
        console.log('✅ Media obtained for accepting call');

        // Create peer connection
        peerConnection.current = createPeerConnection();

        // Add local tracks
        stream.getTracks().forEach(track => {
          peerConnection.current.addTrack(track, stream);
          console.log('➕ Added track:', track.kind);
        });

        // Accept call
        socket.emit('call:accept', { callId: incomingCall._id });
        console.log('📡 Sent call:accept to server');

        startCallTimer();
      } catch (mediaErr) {
        const errorMsg = getMediaError(mediaErr);
        console.error('❌ Media error while accepting:', errorMsg);
        alert(`❌ Cannot accept call: ${errorMsg}\n\nPlease allow camera/microphone access and try again.`);
        throw mediaErr;
      }

    } catch (err) {
      console.error('❌ Failed to accept call:', err);
      setError('Failed to accept call');
      rejectCall();
    }
  };

  // Reject call
  const rejectCall = () => {
    if (incomingCall) {
      socket.emit('call:reject', { callId: incomingCall._id });
      setIncomingCall(null);
    }
    setCallState('idle');
  };

  // End call
  const endCall = () => {
    if (currentCall) {
      socket.emit('call:end', { callId: currentCall._id });
    }

    cleanup();
  };

  // Cleanup
  const cleanup = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    stopCallTimer();
    setRemoteStream(null);
    setCurrentCall(null);
    setCallState('idle');
    setIsScreenSharing(false);
    setError(null);
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        if (currentCall) {
          socket.emit('call:toggle-video', {
            callId: currentCall._id,
            enabled: videoTrack.enabled
          });
        }
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        
        if (currentCall) {
          socket.emit('call:toggle-audio', {
            callId: currentCall._id,
            enabled: audioTrack.enabled
          });
        }
      }
    }
  };

  // Start screen share
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });

      screenStreamRef.current = screenStream;

      // Replace video track
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
      
      if (sender) {
        sender.replaceTrack(videoTrack);
      }

      setIsScreenSharing(true);

      if (currentCall) {
        socket.emit('call:screen-share-start', { callId: currentCall._id });
      }

      // Handle screen share stop
      videoTrack.onended = () => {
        stopScreenShare();
      };

    } catch (err) {
      console.error('Screen share error:', err);
      setError('Failed to share screen');
    }
  };

  // Stop screen share
  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Restore camera
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');
      
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
    }

    setIsScreenSharing(false);

    if (currentCall) {
      socket.emit('call:screen-share-stop', { callId: currentCall._id });
    }
  };

  // Switch call type
  const switchCallType = async (newType) => {
    if (!currentCall) return;

    try {
      if (newType === 'audio' && isVideoEnabled) {
        toggleVideo();
      } else if (newType === 'video' && !isVideoEnabled) {
        toggleVideo();
      }

      socket.emit('call:switch-type', {
        callId: currentCall._id,
        newType
      });

      setCurrentCall({ ...currentCall, callType: newType });

    } catch (err) {
      console.error('Failed to switch call type:', err);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Call initiated
    socket.on('call:initiated', ({ call }) => {
      console.log('✅ Call initiated:', call);
      setCurrentCall(call);
      setCallState('ringing');
      console.log('📞 Call state set to: ringing');
    });

    // Incoming call
    socket.on('call:incoming', ({ call }) => {
      console.log('🔔 INCOMING CALL:', call);
      console.log('🔔 Setting incoming call state...');
      setIncomingCall(call);
      setCallState('ringing');
      console.log('📞 Call state set to: ringing (incoming)');
      console.log('📞 incomingCall should now be:', call);
    });

    // Call accepted
    socket.on('call:accepted', async ({ callId }) => {
      console.log('✅ Call accepted:', callId);
      setCallState('connecting');
      console.log('📞 Call state set to: connecting');

      if (!peerConnection.current) {
        peerConnection.current = createPeerConnection();

        // Add local tracks
        if (localStream) {
          localStream.getTracks().forEach(track => {
            peerConnection.current.addTrack(track, localStream);
          });
        }
      }

      // Create and send offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      
      socket.emit('call:offer', { callId, offer });

      startCallTimer();
    });

    // Call rejected
    socket.on('call:rejected', () => {
      setError('Call rejected');
      cleanup();
    });

    // Call busy
    socket.on('call:busy', () => {
      setError('User is busy');
      cleanup();
    });

    // WebRTC offer
    socket.on('call:offer', async ({ callId, offer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        
        socket.emit('call:answer', { callId, answer });
      }
    });

    // WebRTC answer
    socket.on('call:answer', async ({ callId, answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // ICE candidate
    socket.on('call:ice-candidate', async ({ callId, candidate }) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Call ended
    socket.on('call:ended', () => {
      cleanup();
    });

    // Error
    socket.on('call:error', ({ error, code }) => {
      setError(error);
      if (code === 'USER_OFFLINE') {
        cleanup();
      }
    });

    return () => {
      socket.off('call:initiated');
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:busy');
      socket.off('call:offer');
      socket.off('call:answer');
      socket.off('call:ice-candidate');
      socket.off('call:ended');
      socket.off('call:error');
    };
  }, [socket, localStream, currentCall]);

  const value = {
    callState,
    currentCall,
    incomingCall,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    callDuration,
    error,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    switchCallType
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
