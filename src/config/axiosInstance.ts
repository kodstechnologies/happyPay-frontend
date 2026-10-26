import axios from "axios";
import { getToken } from "../utils/auth";
import { getAdminToken } from "../utils/adminAuth";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:7000",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const isAdminRoute = Boolean(
            config.url && (config.url.startsWith("/api/admin") || config.url.startsWith("/api/v1/admin"))
        );
        const token = isAdminRoute
            ? (getAdminToken() || getToken())
            : (getToken() || getAdminToken());

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
            delete config.headers["content-type"];
            if (typeof config.headers.delete === "function") {
                config.headers.delete("Content-Type");
                config.headers.delete("content-type");
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;