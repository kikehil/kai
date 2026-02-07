// Configuración de la API
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_URL = isDevelopment
    ? 'http://localhost:3000'
    : `${window.location.protocol}//${window.location.host}`;

export const SOCKET_URL = isDevelopment
    ? 'http://localhost:3000'
    : `${window.location.protocol}//${window.location.host}`;
