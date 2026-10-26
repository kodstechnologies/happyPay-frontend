import axios from "axios";
import api from "../config/axiosInstance";
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../types/admin/auth";
import { clearAdminSession, getAdminToken } from "../utils/adminAuth";
import type { AxiosResponse } from "axios";

interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

const unwrap = <T,>(response: AxiosResponse<ApiEnvelope<T>>) => response.data.data;

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:7000";

export async function loginAdmin(payload: AdminLoginRequest): Promise<AdminLoginResponse> {
  // Admin login doesn't need auth, so use axios directly without the interceptor
  const response = await axios.post<ApiEnvelope<AdminLoginResponse>>(
    `${baseURL}/api/admin/auth/login`,
    payload
  );
  return unwrap(response);
}

export function forgotPassword(payload: ForgotPasswordRequest) {
  return axios
    .post<ApiEnvelope<{ message?: string; resetUrl?: string }>>(
      `${baseURL}/api/admin/auth/forgot-password`,
      payload
    )
    .then(unwrap);
}

export function resetPassword(payload: ResetPasswordRequest) {
  return axios
    .post<ApiEnvelope<{ message?: string }>>(`${baseURL}/api/admin/auth/reset-password`, payload)
    .then(unwrap);
}

export async function logoutAdmin(): Promise<void> {
  const token = getAdminToken();
  const deviceId = localStorage.getItem("adminDeviceId") || undefined;
  try {
    if (token) {
      await api.post("/api/admin/auth/logout", { deviceId });
    }
  } catch (error) {
    console.warn("Admin logout backend notification error:", error);
  } finally {
    clearAdminSession();
    localStorage.removeItem("adminFcmToken");
  }
}

export function updateAdminDeviceToken(payload: {
  fcmToken: string;
  deviceId?: string;
  platform?: string;
  deviceName?: string;
}) {
  return api.patch<ApiEnvelope<{ success: boolean }>>("/api/admin/device-token", payload).then(unwrap);
}
