import api from "../config/axiosInstance";
import type { AuditLog, AuditLogFilters } from "../types/admin/audit";
import type { AxiosResponse } from "axios";

interface Envelope<T> {
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const unwrap = <T,>(response: AxiosResponse<Envelope<T>>) => response.data.data;

interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getAdminAuditLogs(filters: AuditLogFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });

  return api.get<Envelope<AuditLogListResponse>>(
    `/api/v1/auth/admin/audit-logs?${params.toString()}`
  ).then(unwrap);
}

export function getAdminAuditLogById(id: string) {
  return api.get<Envelope<AuditLog>>(
    `/api/v1/auth/admin/audit-logs/${id}`
  ).then(unwrap);
}

export function deleteAdminAuditLog(id: string) {
  return api.delete<Envelope<{ message: string }>>(
    `/api/v1/auth/admin/audit-logs/${id}`
  ).then(unwrap);
}

export function deleteAdminAuditLogsByDateRange(fromDate: string, toDate: string) {
  return api.delete<Envelope<{ message: string; deletedCount: number }>>(
    `/api/v1/auth/admin/audit-logs/bulk`,
    { data: { fromDate, toDate } }
  ).then(unwrap);
}
