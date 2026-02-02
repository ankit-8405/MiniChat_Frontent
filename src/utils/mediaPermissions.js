// Media Permissions Utility

export const checkMediaPermissions = async () => {
  try {
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        supported: false,
        error: 'Your browser does not support video/audio calls'
      };
    }

    // Try to get permissions
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });

    // Stop all tracks immediately (we just wanted to check permissions)
    stream.getTracks().forEach(track => track.stop());

    return {
      supported: true,
      granted: true
    };
  } catch (err) {
    return {
      supported: true,
      granted: false,
      error: err.name,
      message: getPermissionErrorMessage(err)
    };
  }
};

export const requestMediaPermissions = async (video = true, audio = true) => {
  try {
    const constraints = {
      video: video,
      audio: audio
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Stop tracks after getting permission
    stream.getTracks().forEach(track => track.stop());

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err.name,
      message: getPermissionErrorMessage(err)
    };
  }
};

const getPermissionErrorMessage = (err) => {
  switch (err.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Permission denied. Please allow camera and microphone access.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera or microphone found on your device.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Camera or microphone is already in use by another application.';
    case 'OverconstrainedError':
      return 'Camera or microphone does not meet requirements.';
    case 'TypeError':
      return 'Invalid media constraints.';
    case 'AbortError':
      return 'Media access was aborted.';
    default:
      return 'Failed to access camera/microphone.';
  }
};

export const getMediaDevices = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return { cameras: [], microphones: [], speakers: [] };
    }

    const devices = await navigator.mediaDevices.enumerateDevices();

    return {
      cameras: devices.filter(d => d.kind === 'videoinput'),
      microphones: devices.filter(d => d.kind === 'audioinput'),
      speakers: devices.filter(d => d.kind === 'audiooutput')
    };
  } catch (err) {
    console.error('Error enumerating devices:', err);
    return { cameras: [], microphones: [], speakers: [] };
  }
};
