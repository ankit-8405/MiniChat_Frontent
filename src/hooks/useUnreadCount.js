import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export const useUnreadCount = () => {
  const [unreadCounts, setUnreadCounts] = useState({});
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (socket && user) {
      // Listen for new messages
      socket.on('message:new', (message) => {
        // Don't count own messages
        if (message.sender._id !== user.userId) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.channelId]: (prev[message.channelId] || 0) + 1
          }));
        }
      });

      // Listen for channel view (mark as read)
      socket.on('channel:viewed', ({ channelId }) => {
        setUnreadCounts(prev => ({
          ...prev,
          [channelId]: 0
        }));
      });

      return () => {
        socket.off('message:new');
        socket.off('channel:viewed');
      };
    }
  }, [socket, user]);

  const markAsRead = (channelId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [channelId]: 0
    }));
    
    if (socket) {
      socket.emit('channel:view', { channelId });
    }
  };

  const getUnreadCount = (channelId) => {
    return unreadCounts[channelId] || 0;
  };

  return { unreadCounts, markAsRead, getUnreadCount };
};
