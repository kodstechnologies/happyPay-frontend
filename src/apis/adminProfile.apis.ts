import api from "../config/adminAxiosInstance";
import type { AdminUser } from "../types/admin/auth";

export function getAdminProfile() {
  return api.get<AdminUser>("/api/admin/profile").then((response) => response.data);
}
