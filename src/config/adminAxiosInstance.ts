import axios from "axios";
import { getAdminToken } from "../utils/adminAuth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:7000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
