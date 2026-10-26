import api from "../config/axiosInstance";
import type { AdminUser } from "../types/admin/auth";
import type { AxiosResponse } from "axios";

const unwrap = <T,>(response: AxiosResponse<T>) => response.data;

export function getAdminProfile() {
  return api.get<AdminUser>("/api/admin/profile").then(unwrap);
}
