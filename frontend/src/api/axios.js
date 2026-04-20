import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

API.interceptors.request.use((config) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (userInfo?.token) {
    config.headers.Authorization = `Bearer ${userInfo.token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default API;
