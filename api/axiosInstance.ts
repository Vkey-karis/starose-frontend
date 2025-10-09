// src/api/axiosInstance.ts
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5000/api'
    : 'https://starose-backend.onrender.com/api'; // <-- notice /api at the end

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
