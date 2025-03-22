import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  let token;
  try {
    token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Local storage access failed:', e);
  }
  return config;
});

// Handle auth errors and network issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('token');
      } catch (e) {
        console.error('Failed to remove token:', e);
      }
      window.location.href = '/login';
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timed out');
    } else if (!error.response) {
      console.error('Network error:', error.message);
    }
    return Promise.reject(error);
  }
);
