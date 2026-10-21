import { apiClient } from "../client";
import { getAdminToken } from "../../../utils/adminAuth";
import type {
  AdminRetailer,
  RetailerListFilters,
  AdminTransactionFilters,
  AdminTransactionListResponse,
  SubRetailerFilters,
  SubRetailerListResponse,
} from "../../../types/admin/retailer";

interface Envelope<T> {
  data: T;
  message?: string;
}

interface RetailerList {
  items: AdminRetailer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getAdminRetailers(filters: RetailerListFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return apiClient<Envelope<RetailerList>>(
    `/api/admin/retailers?${params.toString()}`,
    { token: getAdminToken() ?? undefined }
  );
}

export function getAdminRetailer(id: string) {
  return apiClient<Envelope<AdminRetailer>>(`/api/admin/retailers/${id}`, {
    token: getAdminToken() ?? undefined,
  });
}

export function updateAdminRetailerKyc(
  id: string,
  status: "approved" | "rejected",
  reason?: string
) {
  return apiClient<Envelope<{ id: string; kycStatus: string; kycRejectionReason?: string }>>(
    `/api/admin/retailers/${id}/kyc`,
    {
      method: "PUT",
      body: JSON.stringify({ status, reason }),
      token: getAdminToken() ?? undefined,
    }
  );
}

/**
 * GET /api/admin/retailers/:id/transactions
 * Fetches paginated & filtered transactions for a retailer from the admin portal.
 */
export function getAdminRetailerTransactions(
  id: string,
  filters: AdminTransactionFilters = {}
) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "ALL") {
      params.set(key, String(value));
    }
  });
  const queryString = params.toString();
  const endpoint = `/api/admin/retailers/${id}/transactions${
    queryString ? `?${queryString}` : ""
  }`;
  return apiClient<Envelope<AdminTransactionListResponse>>(endpoint, {
    token: getAdminToken() ?? undefined,
  });
}

/**
 * GET /api/admin/retailers/:id/sub-retailers
 * Fetches paginated sub-retailers under a distributor with transaction volume stats.
 */
export function getAdminDistributorSubRetailers(
  id: string,
  filters: SubRetailerFilters = {}
) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const queryString = params.toString();
  const endpoint = `/api/admin/retailers/${id}/sub-retailers${
    queryString ? `?${queryString}` : ""
  }`;
  return apiClient<Envelope<SubRetailerListResponse>>(endpoint, {
    token: getAdminToken() ?? undefined,
  });
}

/**
 * PATCH /api/admin/retailers/:id/status
 * Updates a retailer's status (approved, blocked, rejected, active, suspended).
 */
export function updateAdminRetailerAccountStatus(
  id: string,
  status: "active" | "suspended" | "blocked" | "approved" | "rejected" | "pending"
) {
  return apiClient<Envelope<{ id: string; status: string; adminApproved: string }>>(
    `/api/admin/retailers/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
      token: getAdminToken() ?? undefined,
    }
  );
}

/**
 * GET /api/admin/transactions
 * Fetches paginated & filtered transactions across all retailers from the admin portal.
 */
export function getAllAdminTransactions(
  filters: AdminTransactionFilters = {}
) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "ALL") {
      params.set(key, String(value));
    }
  });
  const queryString = params.toString();
  const endpoint = `/api/admin/transactions${
    queryString ? `?${queryString}` : ""
  }`;
  return apiClient<Envelope<AdminTransactionListResponse>>(endpoint, {
    token: getAdminToken() ?? undefined,
  });
}

