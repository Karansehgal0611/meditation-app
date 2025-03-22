// services/meditationApi.js
const API_URL = 'http://localhost:5000/api';

// Get the authentication token from localStorage
const getToken = () => localStorage.getItem('token');

// Helper for making authenticated requests
const authFetch = async (endpoint, options = {}) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Something went wrong');
  }
  
  return await response.json();
};

// Auth functions
export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'Login failed');
  }
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data.user;
};

export const registerUser = async (username, email, password) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, email, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || error.errors?.[0]?.msg || 'Registration failed');
  }
  
  return await response.json();
};

// User data functions
export const fetchUserData = async () => {
  return authFetch('/auth/me');
};

// Group data functions
export const fetchGroupData = async () => {
  return authFetch('/meditations/group-stats');
};

// Meditation tracking functions
export const startMeditation = async (userId, startTime) => {
  return authFetch('/meditations/start', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      startTime: startTime.toISOString()
    })
  });
};

export const endMeditation = async (userId, startTime, endTime, duration) => {
  return authFetch('/meditations/end', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration
    })
  });
};

export default {
  loginUser,
  registerUser,
  fetchUserData,
  fetchGroupData,
  startMeditation,
  endMeditation
};