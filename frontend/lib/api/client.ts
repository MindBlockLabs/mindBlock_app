// frontend/lib/api/client.ts
import axios from 'axios';
import {setupInterceptors} from './interceptors'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Prevent API calls during SSR
if (typeof window !== 'undefined') {
  setupInterceptors(api);
}

export default api;
