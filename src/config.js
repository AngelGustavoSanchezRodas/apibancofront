// src/config.js

// 1. Tomar puramente la variable de entorno
const RAW_API_URL = import.meta.env.VITE_API_URL || '';

// 2. Principio Fail-Fast: Si está vacío en producción, lo reportamos inmediatamente
if (!RAW_API_URL) {
  console.error("🚨 ERROR CRÍTICO: La variable VITE_API_URL no fue inyectada durante la compilación.");
}

// 3. Exportar limpiamente sin fallback a origin
export const API_URL = RAW_API_URL.replace(/\/$/, '');

// Resto de tus variables...
export const AUTH_LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH || '/api/Auth/login';
export const AUTH_LOGIN_CREDENTIAL_FIELD = import.meta.env.VITE_LOGIN_CREDENTIAL_FIELD || 'credencial';
export const AUTH_LOGIN_PASSWORD_FIELD = import.meta.env.VITE_LOGIN_PASSWORD_FIELD || 'password';
export const API_WITH_CREDENTIALS = String(import.meta.env.VITE_API_WITH_CREDENTIALS || '').toLowerCase() === 'true';
export const ADMIN_DEFAULT_ACCOUNT_ID = import.meta.env.VITE_ADMIN_DEFAULT_ACCOUNT_ID || '';
export const UI_CONFIG_PATH = import.meta.env.VITE_UI_CONFIG_PATH || '';