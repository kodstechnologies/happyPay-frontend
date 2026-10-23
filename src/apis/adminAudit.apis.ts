import api from "../config/adminAxiosInstance";
import type { AuditLog, AuditLogFilters } from "../types/admin/audit";

export function getAdminAuditLogs(filters: AuditLogFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });

  return api.get<{ data: { logs: AuditLog[]; total?: number; page: number; limit: number; totalPages: number } }>(
    `/api/admin/audit-logs?${params.toString()}`
  ).then((response) => response.data.data);
}
