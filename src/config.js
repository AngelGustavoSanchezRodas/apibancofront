// Configuración global del cliente frontend
export const API_URL = import.meta.env.VITE_API_URL || 'https://bancocentroamericano.azurewebsites.net';
export const AUTH_LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH || '/api/Auth/login';
export const AUTH_LOGIN_CREDENTIAL_FIELD = import.meta.env.VITE_LOGIN_CREDENTIAL_FIELD || 'credencial';
export const AUTH_LOGIN_PASSWORD_FIELD = import.meta.env.VITE_LOGIN_PASSWORD_FIELD || 'password';
export const API_WITH_CREDENTIALS = String(import.meta.env.VITE_API_WITH_CREDENTIALS || '').toLowerCase() === 'true';
export const ADMIN_DEFAULT_ACCOUNT_ID = import.meta.env.VITE_ADMIN_DEFAULT_ACCOUNT_ID || '1';
