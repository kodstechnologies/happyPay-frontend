import api from "../../../config/axiosInstance";
import type { AxiosResponse } from "axios";

interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string | T;
  data: T | string;
  meta: null;
}

const unwrap = <T,>(response: AxiosResponse<ApiEnvelope<T>>) => response.data;

// ============================================================
// FUND REQUEST TYPES
// ============================================================

export interface FundRequest {
  _id: string;
  userId: string;
  retailerId?: string;
  paymentMode: "UPI" | "NEFT" | "IMPS" | "RTGS" | "CASH" | "CHEQUE" | "OTHER";
  rrn?: string;
  amount: number;
  paymentDate: string;
  bank: string;
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
  isBiometricVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFundRequestPayload {
  paymentMode: "UPI" | "NEFT" | "IMPS" | "RTGS" | "CASH" | "CHEQUE" | "OTHER";
  rrn?: string;
  amount: number;
  paymentDate: string;
  bank: string;
  ifscCode: string;
  accountNumber: string;
  branchName: string;
  receiptSlip: string;
  notes?: string;
}

export interface BiometricVerificationPayload {
  devicePid?: string;
  biometricData?: string;
  [key: string]: unknown;
}

export interface ResubmitFundRequestPayload {
  paymentMode?: "UPI" | "NEFT" | "IMPS" | "RTGS" | "CASH" | "CHEQUE" | "OTHER";
  rrn?: string;
  amount?: number;
  paymentDate?: string;
  bank?: string;
  ifscCode?: string;
  accountNumber?: string;
  branchName?: string;
  receiptSlip?: string;
  notes?: string;
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

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FundRequestCounts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface Bank {
  _id: string;
  bankName: string;
  bankCode?: string;
}

export interface FundRequestsWithPagination {
  requests: FundRequest[];
  pagination: PaginationInfo;
  counts: FundRequestCounts;
}

// ============================================================
// RETAILER FUND REQUEST APIS
// ============================================================

/**
 * Create a new fund request
 */
export function createFundRequest(payload: FormData) {
  return api.post<ApiEnvelope<FundRequest>>("/api/v1/fund-requests", payload).then(unwrap);
}

/**
 * Get fund request by ID
 */
export function getFundRequestById(id: string) {
  return api.get<ApiEnvelope<FundRequest>>(`/api/v1/fund-requests/${id}`).then(unwrap);
}

/**
 * Get all fund requests for the logged-in user with pagination
 */
export function getMyFundRequests(
  status?: "PENDING" | "APPROVED" | "REJECTED",
  page?: number,
  limit?: number
) {
  const params: { status?: string; page?: number; limit?: number } = {};
  if (status) params.status = status;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  return api.get<ApiEnvelope<FundRequestsWithPagination>>("/api/v1/fund-requests/my", { params }).then(unwrap) as Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: FundRequestsWithPagination;
    meta: null;
  }>;
}

/**
 * Get fund requests by retailer ID
 */
export function getFundRequestsByRetailerId(
  retailerId: string,
  status?: "PENDING" | "APPROVED" | "REJECTED"
) {
  const params: { status?: string } = {};
  if (status) params.status = status;

  return api
    .get<ApiEnvelope<FundRequest[]>>(`/api/v1/fund-requests/retailer/${retailerId}`, { params })
    .then(unwrap);
}

/**
 * Get fund request statistics for the logged-in user
 */
export function getMyFundRequestStats() {
  return api.get<ApiEnvelope<FundRequestStats>>("/api/v1/fund-requests/my/stats").then(unwrap);
}

/**
 * Get bank list
 */
export function getBankList() {
  return api.get<ApiEnvelope<{ name: string; code: string; bank_id: string }[]>>("/api/v1/wallet/banklist").then(unwrap);
}

/**
 * Verify biometric and credit wallet for approved fund request
 */
export function verifyBiometricAndCreditWallet(id: string, withdrawalData: BiometricVerificationPayload) {
  return api.post<ApiEnvelope<FundRequest>>(
    `/api/v1/fund-requests/${id}/verify-biometric`,
    withdrawalData
  ).then(unwrap);
}

/**
 * Resubmit a rejected fund request
 */
export function resubmitFundRequest(id: string, payload: FormData) {
  return api.patch<ApiEnvelope<FundRequest>>(`/api/v1/fund-requests/${id}/resubmit`, payload).then(unwrap);
}

/**
 * Delete a pending fund request
 */
export function deleteFundRequest(id: string) {
  return api.delete<ApiEnvelope<null>>(`/api/v1/fund-requests/${id}`).then(unwrap);
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
