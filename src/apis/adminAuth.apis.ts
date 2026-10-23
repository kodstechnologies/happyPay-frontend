import axios from "axios";
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../types/admin/auth";
import { clearAdminSession } from "../utils/adminAuth";

interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

const unwrap = <T,>(response: { data: ApiEnvelope<T> }) => response.data.data;

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
    .then((response) => unwrap(response));
}

export function resetPassword(payload: ResetPasswordRequest) {
  return axios
    .post<ApiEnvelope<{ message?: string }>>(`${baseURL}/api/admin/auth/reset-password`, payload)
    .then((response) => unwrap(response));
}

export function logoutAdmin() {
  clearAdminSession();
  return axios.post(`${baseURL}/api/admin/auth/logout`).catch(() => undefined);
}
