import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Inject auth token on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('bd_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bd_token');
      localStorage.removeItem('bd_name');
      localStorage.removeItem('bd_userId');
      window.dispatchEvent(new Event('bd_logout'));
    }
    return Promise.reject(error);
  }
);

export default client;
