import api from "../config/axiosInstance";

interface ApiEnvelope<T, M = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: M | null;
}

export interface BankMaster {
  _id: string;
  bankName: string;
  normalizedName: string;
  aeps: {
    bankId: string | null;
    iin: string | null;
    enabled: boolean;
  };
  payout: {
    bankCode: string | null;
    enabled: boolean;
  };
  isActive: boolean;
  lastSyncedAt: string | null;
  syncSource: "aeps" | "payout" | "both" | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncStats {
  added: number;
  updated: number;
  aepsCount: number;
  payoutCount: number;
  errors: string[];
}

export interface BankListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetBanksParams {
  search?: string;
  isActive?: string; // "true" | "false" | "" (all)
  aepsEnabled?: string;
  payoutEnabled?: string;
  page?: number;
  limit?: number;
}

export function getAdminBanks(params: GetBanksParams = {}) {
  return api.get<ApiEnvelope<BankMaster[], BankListMeta>>("/api/admin/banks", { params });
}

export function getAdminBank(id: string) {
  return api.get<ApiEnvelope<BankMaster>>(`/api/admin/banks/${id}`);
}

export function updateAdminBank(
  id: string,
  data: Partial<Pick<BankMaster, "bankName"> & { aepsBankId: string; aepsIin: string; payoutBankCode: string }>
) {
  return api.patch<ApiEnvelope<BankMaster>>(`/api/admin/banks/${id}`, data);
}

export function toggleBankStatus(id: string, isActive: boolean) {
  return api.patch<ApiEnvelope<BankMaster>>(`/api/admin/banks/${id}/status`, { isActive });
}

export function toggleBankAepsStatus(id: string, enabled: boolean) {
  return api.patch<ApiEnvelope<BankMaster>>(`/api/admin/banks/${id}/aeps-status`, { enabled });
}

export function toggleBankPayoutStatus(id: string, enabled: boolean) {
  return api.patch<ApiEnvelope<BankMaster>>(`/api/admin/banks/${id}/payout-status`, { enabled });
}

export function syncBankLists() {
  return api.post<ApiEnvelope<SyncStats>>("/api/admin/banks/sync");
}

