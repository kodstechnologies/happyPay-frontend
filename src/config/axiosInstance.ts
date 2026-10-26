import axios from "axios";
import { getToken } from "../utils/auth";
import { getAdminToken, clearAdminSession } from "../utils/adminAuth";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:7000",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const url = config.url || "";
        const isUrlAdmin =
            url.startsWith("/api/admin") ||
            url.startsWith("/api/v1/admin") ||
            url.startsWith("/api/v1/auth/admin") ||
            url.includes("/admin/") ||
            url.endsWith("/admin");

        const isPortalAdmin =
            typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

        const isAdminRoute = isUrlAdmin || isPortalAdmin;

        // When making requests to an admin endpoint or from within the admin portal,
        // strictly use the admin token to prevent 403 token cross-contamination.
        const token = isAdminRoute ? getAdminToken() : (getToken() || getAdminToken());

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

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || "";
        const isUrlAdmin =
            url.startsWith("/api/admin") ||
            url.startsWith("/api/v1/admin") ||
            url.startsWith("/api/v1/auth/admin") ||
            url.includes("/admin/") ||
            url.endsWith("/admin");
        const isPortalAdmin =
            typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

        // If an admin token expires or is invalid (401), clear session and redirect to /admin/login cleanly
        if (status === 401 && (isUrlAdmin || isPortalAdmin)) {
            clearAdminSession();
            if (typeof window !== "undefined" && !window.location.pathname.includes("/admin/login")) {
                window.location.href = "/admin/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;