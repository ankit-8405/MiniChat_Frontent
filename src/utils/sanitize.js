// Simple XSS protection - sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validate message length
export const validateMessage = (text) => {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (text.length > 2000) {
    return { valid: false, error: 'Message is too long (max 2000 characters)' };
  }
  return { valid: true };
};

// Validate username
export const validateUsername = (username) => {
  if (!username || username.length < 3 || username.length > 30) {
    return { valid: false, error: 'Username must be between 3 and 30 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
};

// Validate password
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { valid: false, error: 'Password must contain uppercase, lowercase, and number' };
  }
  return { valid: true };
};
