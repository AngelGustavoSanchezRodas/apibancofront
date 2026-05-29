import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Usamos import.meta.env para Vite. 
// Si la variable no existe, el fallback es nuestra URL de producción.
const API_URL = import.meta.env.VITE_API_URL || 'https://bancocentroamericano.azurewebsites.net';

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

// Interceptor para manejar errores globales (ej. 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('auth-storage');
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;