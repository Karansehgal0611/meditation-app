// api/meditationApi.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function for making API requests
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('meditationToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An unknown error occurred',
    }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
};

// Login user
export const loginUser = async (username, password) => {
  const response = await fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  
  if (response.token) {
    localStorage.setItem('meditationToken', response.token);
  }
  
  return response.user;
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('meditationToken');
};

// Fetch current user data
export const fetchUserData = async () => {
  return fetchWithAuth('/users/me');
};

// Fetch group data (all 4 users)
export const fetchGroupData = async () => {
  return fetchWithAuth('/users/group');
};

// Start a meditation session
export const startMeditation = async (userId, startTime) => {
  return fetchWithAuth('/meditations/start', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      startTime: startTime.toISOString(),
    }),
  });
};

// End a meditation session
export const endMeditation = async (userId, startTime, endTime, duration) => {
  return fetchWithAuth('/meditations/end', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
    }),
  });
};

// Get meditation history
export const getMeditationHistory = async (userId, startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());
  
  return fetchWithAuth(`/meditations/history/${userId}?${params}`);
};