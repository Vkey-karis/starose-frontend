// src/api/axiosInstance.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
const API_BASE_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5000/api'
    : 'https://starose-backend.onrender.com/api';

export default api;
