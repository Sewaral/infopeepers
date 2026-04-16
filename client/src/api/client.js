import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      const rawUser = localStorage.getItem('user');
      let nextLogin = '/login';
      try {
        const parsed = rawUser ? JSON.parse(rawUser) : null;
        if (parsed?.role === 'admin') nextLogin = '/admin/login';
        else if (parsed?.role === 'guide') nextLogin = '/guide/login';
      } catch {
        // Fall back to visitor login if stored user is invalid.
      }
      localStorage.removeItem('user');
      window.location.href = nextLogin;
    }
    return Promise.reject(err);
  }
);

export default api;
