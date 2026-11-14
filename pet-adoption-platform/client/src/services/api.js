import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pawbridge_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('pawbridge_token')) {
      localStorage.removeItem('pawbridge_token');
      localStorage.removeItem('pawbridge_user');
      window.dispatchEvent(new CustomEvent('pawbridge:session-expired'));
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.code === 'ERR_NETWORK' || !error?.response) {
    return 'Cannot reach the backend server (http://localhost:5000). Please make sure the backend server is running.';
  }
  return error?.response?.data?.message || error?.message || fallback;
};

export default api;
