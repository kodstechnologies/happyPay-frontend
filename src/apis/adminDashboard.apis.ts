import api from "../config/axiosInstance";
import type { AdminDashboardData } from "../types/admin/dashboard";
import type { AxiosResponse } from "axios";

interface ApiResponseEnvelope<T> {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: T;
}

const unwrap = <T,>(response: AxiosResponse<ApiResponseEnvelope<T>>): T => response.data.data;

/**
 * Fetch unified live metrics for the Admin Dashboard:
 * - Stats (Retailers, Distributors, Pending KYC, Approved, Suspended)
 * - Service transaction counts & earnings overview
 * - KYC status overview breakdown
 * - Rolling 12-month transaction trend
 * - Latest 5 platform transactions
 */
export function getAdminDashboard(): Promise<AdminDashboardData> {
  return api
    .get<ApiResponseEnvelope<AdminDashboardData>>("/api/admin/dashboard")
    .then(unwrap);
}

export default {
  getAdminDashboard,
};
