import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { messageService } from '../services/authService';
import { showMessageNotification, areNotificationsEnabled } from '../utils/notifications';

export const useChat = (channelId, channelName = 'Channel') => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!channelId) return;

    const loadMessages = async () => {
      setLoading(true);
      try {
        console.log('Loading messages for channel:', channelId);
        const data = await messageService.getMessages(channelId);
        console.log('Messages loaded:', data.messages.length, 'messages');
        setMessages(data.messages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    if (socket) {
      socket.emit('channel:join', channelId);

      socket.on('message:new', (message) => {
        console.log('New message received:', message);
        if (message.channelId === channelId) {
          console.log('Adding message to state');
          setMessages((prev) => [...prev, message]);
          
          // Show notification if message is from someone else and window is not focused
          if (message.sender._id !== user.userId && !document.hasFocus() && areNotificationsEnabled()) {
            showMessageNotification(
              message.sender.username,
              message.text,
              channelName
            );
          }
        } else {
          console.log('Message for different channel, ignoring');
        }
      });

      return () => {
        socket.emit('channel:leave', channelId);
        socket.off('message:new');
      };
    }
  }, [channelId, socket]);

  const sendMessage = useCallback((messageData) => {
    if (socket) {
      // Handle both string and object formats
      const data = typeof messageData === 'string' 
        ? { channelId, text: messageData }
        : { channelId, ...messageData };
      
      if (data.text && data.text.trim()) {
        console.log('Sending message:', data);
        socket.emit('message:send', data);
      } else {
        console.log('Cannot send empty message');
      }
    } else {
      console.log('Cannot send message: socket not connected');
    }
  }, [socket, channelId]);

  return { messages, loading, sendMessage };
};
