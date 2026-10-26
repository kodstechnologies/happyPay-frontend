import api from "../config/adminAxiosInstance";
import type { AuditLog, AuditLogFilters } from "../types/admin/audit";
import type { AxiosResponse } from "axios";

const unwrap = <T,>(response: AxiosResponse<{ data: T }>) => response.data.data;

export function getAdminAuditLogs(filters: AuditLogFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });

  return api.get<{ data: { logs: AuditLog[]; total?: number; page: number; limit: number; totalPages: number } }>(
    `/api/admin/audit-logs?${params.toString()}`
  ).then(unwrap);
}
