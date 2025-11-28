// frontend/src/api/client.ts
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

export function setAuthHeader(token?: string) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}

// If a token exists in localStorage (from previous session), set the header on startup
try {
  const saved = localStorage.getItem('auth_token');
  if (saved) setAuthHeader(saved);
} catch (e) {
  // localStorage may not be available in some environments
}