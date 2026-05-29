import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Usamos import.meta.env para Vite. 
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token desde el store global
api.interceptors.request.use((config) => {
  try {
    const storageItem = sessionStorage.getItem('auth-storage');
    const token = JSON.parse(storageItem)?.state?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn("No se pudo leer el token de sesión");
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