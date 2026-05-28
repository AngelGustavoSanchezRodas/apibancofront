import axios from 'axios';

// Usamos import.meta.env para Vite. 
// Si la variable no existe, el fallback es nuestra URL de producción.
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token desde el store global
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth-storage') ? JSON.parse(sessionStorage.getItem('auth-storage')).state.token : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;