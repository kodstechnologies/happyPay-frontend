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
