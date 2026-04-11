import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
});

// Request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = (localStorage.getItem('token') || sessionStorage.getItem('token'));
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers.Accept = 'application/json';
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors globally 
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Automatically logout on unauthorized — clear both storages
        ['token', 'user', 'role', 'isLoggedIn', 'token_expires_at'].forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
