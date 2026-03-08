import axios from 'axios';
import { useUserStore } from '@/stores/useUserStore';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 10000,
});

client.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useUserStore.getState().logout();
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default client;
