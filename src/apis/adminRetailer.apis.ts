import api from "../config/axiosInstance";
import type {
  AdminRetailer,
  RetailerListFilters,
  AdminTransactionFilters,
  AdminTransactionListResponse,
  SubRetailerFilters,
  SubRetailerListResponse,
} from "../types/admin/retailer";
import type { AxiosResponse } from "axios";
import { lockUserWalletApi, unlockUserWalletApi } from "./walletLock.apis";

interface Envelope<T> {
  data: T;
  message?: string;
}

const unwrap = <T,>(response: AxiosResponse<Envelope<T>>) => response.data.data;

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
  return api.get<Envelope<RetailerList>>(`/api/admin/retailers?${params.toString()}`).then(unwrap);
}

export function getAdminDistributors(filters: Omit<RetailerListFilters, "role"> = {}) {
  return getAdminRetailers({ ...filters, role: "distributor" });
}

export function getAdminRetailer(id: string) {
  return api.get<Envelope<AdminRetailer>>(`/api/admin/retailers/${id}`).then(unwrap);
}

export function updateAdminRetailerKyc(
  id: string,
  status: "approved" | "rejected",
  reason?: string
) {
  return api.put<Envelope<{ id: string; kycStatus: string; kycRejectionReason?: string }>>(
    `/api/admin/retailers/${id}/kyc`,
    { status, reason }
  ).then(unwrap);
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
  return api.get<Envelope<AdminTransactionListResponse>>(endpoint).then(unwrap);
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
  return api.get<Envelope<SubRetailerListResponse>>(endpoint).then(unwrap);
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
  ).then(unwrap);
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
  ).then(unwrap);
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
  return api.get<Envelope<AdminTransactionListResponse>>(endpoint).then(unwrap);
}

/**
 * PATCH /api/v1/auth/admin/retailers/:retailerId/convert-distributor
 * Converts a retailer to a distributor by adding the distributor role.
 */
export function convertRetailerToDistributor(retailerId: string) {
  return api.patch<Envelope<{ id: string; roles: string[] }>>(
    `/api/v1/auth/admin/retailers/${retailerId}/convert-distributor`
  ).then(unwrap);
}

/**
 * Lock retailer wallet (admin action)
 */
export function lockRetailerWallet(userId: string, reason: string, adminNotes?: string) {
  return lockUserWalletApi({ userId, reason, adminNotes });
}

/**
 * Unlock retailer wallet (admin action)
 */
export function unlockRetailerWallet(userId: string, adminNotes?: string) {
  return unlockUserWalletApi({ userId, adminNotes });
}
