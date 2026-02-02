import api from './api';

export const authService = {
  // OTP-based signup
  signup: async (username, mobile, email) => {
    const payload = { username };
    if (mobile) payload.mobile = mobile;
    if (email) payload.email = email;
    
    const response = await api.post('/auth/signup', payload);
    return response.data;
  },

  // Verify signup OTP
  verifySignupOTP: async (userId, otp) => {
    const response = await api.post('/auth/verify-signup-otp', { userId, otp });
    return response.data;
  },

  // Request login OTP
  requestLoginOTP: async (mobile, email) => {
    const payload = {};
    if (mobile) payload.mobile = mobile;
    if (email) payload.email = email;
    
    const response = await api.post('/auth/request-login-otp', payload);
    return response.data;
  },

  // Verify login OTP
  verifyLoginOTP: async (userId, otp) => {
    const response = await api.post('/auth/verify-login-otp', { userId, otp });
    return response.data;
  },

  // Resend OTP
  resendOTP: async (userId) => {
    const response = await api.post('/auth/resend-otp', { userId });
    return response.data;
  }
};

export const channelService = {
  getChannels: async (search = '') => {
    const response = await api.get('/channels', {
      params: { search }
    });
    return response.data;
  },

  getUserChannels: async () => {
    const response = await api.get('/channels/my-channels');
    return response.data;
  },

  createChannel: async (channelData) => {
    const response = await api.post('/channels', channelData);
    return response.data;
  },

  joinChannel: async (channelId, password) => {
    const payload = {};
    if (password) {
      payload.password = password;
    }
    const response = await api.post(`/channels/${channelId}/join`, payload);
    return response.data;
  },

  getChannelDetails: async (channelId) => {
    const response = await api.get(`/channels/${channelId}`);
    return response.data;
  },

  updateChannel: async (channelId, channelData) => {
    const response = await api.put(`/channels/${channelId}`, channelData);
    return response.data;
  },

  deleteChannel: async (channelId) => {
    const response = await api.delete(`/channels/${channelId}`);
    return response.data;
  },

  leaveChannel: async (channelId) => {
    const response = await api.delete(`/channels/${channelId}/leave`);
    return response.data;
  },

  updateMemberRole: async (channelId, userId, role) => {
    const response = await api.post(`/channels/${channelId}/members/${userId}/role`, { role });
    return response.data;
  },

  removeMember: async (channelId, userId) => {
    const response = await api.delete(`/channels/${channelId}/members/${userId}`);
    return response.data;
  }
};

export const messageService = {
  getMessages: async (channelId, page = 1, limit = 50) => {
    const response = await api.get(`/messages/${channelId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  editMessage: async (messageId, text) => {
    const response = await api.put(`/messages/${messageId}`, { text });
    return response.data;
  },

  addReaction: async (messageId, emoji) => {
    const response = await api.post(`/messages/${messageId}/react`, { emoji });
    return response.data;
  },

  removeReaction: async (messageId, emoji) => {
    const response = await api.delete(`/messages/${messageId}/react`, { 
      data: { emoji } 
    });
    return response.data;
  }
};
