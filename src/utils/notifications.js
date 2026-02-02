// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Show desktop notification
export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/chat-icon.png', // Add your app icon
      badge: '/chat-badge.png',
      vibrate: [200, 100, 200],
      ...options
    });

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return notification;
  }
};

// Play notification sound
export const playNotificationSound = () => {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (err) {
    console.log('Could not play sound:', err);
  }
};

// Show message notification
export const showMessageNotification = (sender, message, channelName) => {
  const title = `${sender} in ${channelName}`;
  const body = message.length > 100 ? message.substring(0, 100) + '...' : message;
  
  showNotification(title, {
    body,
    tag: 'new-message',
    requireInteraction: false
  });
  
  playNotificationSound();
};

// Check if notifications are enabled
export const areNotificationsEnabled = () => {
  return Notification.permission === 'granted';
};
