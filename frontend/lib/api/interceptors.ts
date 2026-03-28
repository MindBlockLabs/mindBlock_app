// frontend/lib/api/interceptors.ts
import type { AxiosInstance } from 'axios';
import { handleApiError } from './error-handler';

export function setupInterceptors(api: AxiosInstance) {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { status } = error.response || {};
      if (status === 401) {
        window.location.href = '/login';
      }

      // Retry logic: up to 3 attempts
      const config = error.config;
      if (!config.__retryCount) config.__retryCount = 0;
      if (config.__retryCount < 3) {
        config.__retryCount += 1;
        return api(config);
      }

      return Promise.reject(handleApiError(error));
    },
  );
}
