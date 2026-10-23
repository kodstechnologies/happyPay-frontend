import api from "../config/adminAxiosInstance";
import type {
  AdminRetailer,
  RetailerListFilters,
  AdminTransactionFilters,
  AdminTransactionListResponse,
  SubRetailerFilters,
  SubRetailerListResponse,
} from "../types/admin/retailer";

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
  return api.get<Envelope<RetailerList>>(`/api/admin/retailers?${params.toString()}`).then((response) => response.data.data);
}

export function getAdminRetailer(id: string) {
  return api.get<Envelope<AdminRetailer>>(`/api/admin/retailers/${id}`).then((response) => response.data.data);
}

export function updateAdminRetailerKyc(
  id: string,
  status: "approved" | "rejected",
  reason?: string
) {
  return api.put<Envelope<{ id: string; kycStatus: string; kycRejectionReason?: string }>>(
    `/api/admin/retailers/${id}/kyc`,
    { status, reason }
  ).then((response) => response.data.data);
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
  return api.get<Envelope<AdminTransactionListResponse>>(endpoint).then((response) => response.data.data);
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
  return api.get<Envelope<SubRetailerListResponse>>(endpoint).then((response) => response.data.data);
}

/**
 * PATCH /api/admin/retailers/:id/status
 * Updates a retailer's status (approved, blocked, rejected, active, suspended).
 */
export function updateAdminRetailerAccountStatus(
  id: string,
  status: "active" | "suspended" | "blocked" | "approved" | "rejected" | "pending",
  reason?: string
) {
  return api.patch<Envelope<{ id: string; status: string; adminApproved: string }>>(
    `/api/admin/retailers/${id}/status`,
    { status, reason }
  ).then((response) => response.data.data);
}

export interface ReviewRetailerDocumentParams {
  retailerId: string;
  documentField: string;
  action: "approve" | "reject";
  reason?: string;
}

/**
 * PATCH /api/v1/auth/admin/retailers/:retailerId/documents/review
 * Unified API to review (approve or reject) any retailer document.
 * Performs action dynamically based on document type and action.
 */
export function reviewAdminRetailerDocument({
  retailerId,
  documentField,
  action,
  reason,
}: ReviewRetailerDocumentParams) {
  return api.patch<Envelope<unknown>>(
    `/api/v1/auth/admin/retailers/${retailerId}/documents/review`,
    {
      documentField,
      action,
      reason,
    }
  ).then((response) => response.data.data);
}

/**
 * Approves an individual document for a retailer (delegates to reviewAdminRetailerDocument).
 */
export function approveAdminRetailerDocument(
  retailerId: string,
  documentField: string
) {
  return reviewAdminRetailerDocument({
    retailerId,
    documentField,
    action: "approve",
  });
}

/**
 * Rejects an individual document for a retailer with a reason (delegates to reviewAdminRetailerDocument).
 */
export function rejectAdminRetailerDocument(
  retailerId: string,
  documentField: string,
  reasonOfRejection: string
) {
  return reviewAdminRetailerDocument({
    retailerId,
    documentField,
    action: "reject",
    reason: reasonOfRejection,
  });
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
  return api.get<Envelope<AdminTransactionListResponse>>(endpoint).then((response) => response.data.data);
}
