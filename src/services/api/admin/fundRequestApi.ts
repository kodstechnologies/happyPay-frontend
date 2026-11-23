import api from "../../../config/adminAxiosInstance";
import type { AxiosResponse } from "axios";

interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta: null;
}

const unwrap = <T,>(response: AxiosResponse<ApiEnvelope<T>>) => response.data;

// ============================================================
// FUND REQUEST TYPES
// ============================================================

export interface FundRequestBank {
  _id: string;
  bank: string;
  bankCode?: string | null;
  ifscCode: string;
  accountNumber: string;
  branchName: string;
  createdAt: string;
  updatedAt: string;
}

export interface FundRequest {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    retailerId?: string;
    selfie?: string;
  };
  retailerId?: string;
  paymentMode: "UPI" | "NEFT" | "IMPS" | "RTGS" | "CASH" | "CHEQUE" | "OTHER";
  rrn?: string;
  amount: number;
  paymentDate: string;
  bankDetails?: FundRequestBank | null;
  bank: string;
  bankCode?: string | null;
  ifscCode: string;
  accountNumber: string;
  branchName: string;
  receiptSlip: string;
  notes?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  reviewedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewedAt?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApproveFundRequestPayload {
  adminNotes?: string;
}

export interface RejectFundRequestPayload {
  rejectionReason: string;
  adminNotes?: string;
}

export interface FundRequestStats {
  pending: number;
  approved: number;
  rejected: number;
}

// ============================================================
// ADMIN FUND REQUEST APIS
// ============================================================

/**
 * Get all fund requests (with optional filters)
 */
export function getAllFundRequests(filters?: {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  userId?: string;
  retailerId?: string;
}) {
  return api.get<ApiEnvelope<FundRequest[]>>("/api/v1/admin/fund-requests", { params: filters }).then(unwrap);
}

/**
 * Get pending fund requests
 */
export function getPendingFundRequests() {
  return api.get<ApiEnvelope<FundRequest[]>>("/api/v1/admin/fund-requests/pending").then(unwrap);
}

/**
 * Get fund request statistics (admin)
 */
export function getAdminFundRequestStats() {
  return api.get<ApiEnvelope<FundRequestStats>>("/api/v1/admin/fund-requests/stats").then(unwrap);
}

/**
 * Approve a fund request
 */
export function approveFundRequest(id: string, payload?: ApproveFundRequestPayload) {
  return api.patch<ApiEnvelope<FundRequest>>(`/api/v1/admin/fund-requests/${id}/approve`, payload).then(unwrap);
}

/**
 * Reject a fund request
 */
export function rejectFundRequest(id: string, payload: RejectFundRequestPayload) {
  return api.patch<ApiEnvelope<FundRequest>>(`/api/v1/admin/fund-requests/${id}/reject`, payload).then(unwrap);
}

// ============================================================
// ADMIN FUND REQUEST BANK CRUD APIS
// ============================================================

export interface FundRequestBankMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateFundRequestBankPayload {
  bank: string;
  bankCode?: string;
  ifscCode: string;
  accountNumber: string;
  branchName: string;
}

export interface UpdateFundRequestBankPayload {
  bank?: string;
  bankCode?: string;
  ifscCode?: string;
  accountNumber?: string;
  branchName?: string;
}

/**
 * List all FundRequestBank records (admin).
 * Optional: ?page, ?limit.
 */
export function listFundRequestBanks(params?: {
  page?: number;
  limit?: number;
}) {
  return api
    .get<ApiEnvelope<FundRequestBank[]> & { meta?: FundRequestBankMeta | null }>(
      "/api/v1/admin/fund-requests/banks",
      { params }
    )
    .then((r) => r.data);
}

/**
 * Get a single FundRequestBank record by its _id (admin).
 */
export function getFundRequestBankById(bankId: string) {
  return api
    .get<ApiEnvelope<FundRequestBank>>(`/api/v1/admin/fund-requests/banks/${bankId}`)
    .then(unwrap);
}

/**
 * Create a new FundRequestBank record and link it to a FundRequest (admin).
 */
export function createFundRequestBank(payload: CreateFundRequestBankPayload) {
  return api
    .post<ApiEnvelope<FundRequestBank>>("/api/v1/admin/fund-requests/banks", payload)
    .then(unwrap);
}

/**
 * Update an existing FundRequestBank record (admin).
 */
export function updateFundRequestBank(bankId: string, payload: UpdateFundRequestBankPayload) {
  return api
    .patch<ApiEnvelope<FundRequestBank>>(`/api/v1/admin/fund-requests/banks/${bankId}`, payload)
    .then(unwrap);
}

/**
 * Delete a FundRequestBank record and clear the reference on the parent FundRequest (admin).
 */
export function deleteFundRequestBank(bankId: string) {
  return api
    .delete<ApiEnvelope<null>>(`/api/v1/admin/fund-requests/banks/${bankId}`)
    .then(unwrap);
}
