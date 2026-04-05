import axios from 'axios';

import { env } from '@/config/env';

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — unwrap data, normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message ?? error.message ?? 'Unknown error';
    return Promise.reject(new Error(message));
  }
);
