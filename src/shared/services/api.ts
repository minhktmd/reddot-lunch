import axios from 'axios';

import { env } from '@/config/env';

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — inject auth token
// Token is registered externally via registerTokenGetter() to keep shared/ dependency-free
let getToken: (() => string | null) | null = null;

export function registerTokenGetter(getter: () => string | null) {
  getToken = getter;
}

apiClient.interceptors.request.use((config) => {
  const token = getToken?.();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — unwrap data, normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message ?? error.message ?? 'Unknown error';
    return Promise.reject(new Error(message));
  }
);
