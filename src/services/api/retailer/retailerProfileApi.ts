import api from "../../../config/axiosInstance";
import type { AxiosResponse } from "axios";
import type { RetailerFullProfile } from "../../../types/retailer/profile";

interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta: null;
}

const unwrap = <T,>(response: AxiosResponse<ApiEnvelope<T>>) => response.data;

export function getRetailerProfile() {
  return api.get<ApiEnvelope<RetailerFullProfile>>("/api/v1/auth/retailer/profile").then(unwrap);
}

export interface RetailerUpdateResponse extends Partial<RetailerFullProfile> {
  id?: string;
  updated?: boolean;
  banks?: RetailerFullProfile["banks"];
  primaryBank?: RetailerFullProfile["primaryBank"];
  documentReviews?: RetailerFullProfile["documentReviews"];
  [key: string]: unknown;
}

export function updateRetailerProfile<T = RetailerFullProfile>(payload: FormData | Record<string, unknown>) {
  const isFormData = payload instanceof FormData;

  return api.patch<ApiEnvelope<T>>("/api/v1/auth/retailer/profile", payload, {
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
  }).then(unwrap);
}

// ============================================================
// BANK APPROVAL API (Admin)
// ============================================================

export interface PendingBankItem {
  bankId: string;
  retailerId: string;
  retailerMobile: string;
  retailerEmail: string;
  retailerName: string;
  bankIndex: number;
  name: string;
  bank_code?: string;
  ifscCode: string;
  accountNumber: string;
  branchName?: string;
  isPrimary: boolean;
  submittedAt: string;
}

export interface PendingBanksResponse {
  data: PendingBankItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function getPendingBanks(page?: number, limit?: number) {
  const params: { page?: number; limit?: number } = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;

  return api.get<ApiEnvelope<PendingBankItem[]>>("/api/v1/auth/admin/banks/pending", { params }).then(unwrap);
}

// ============================================================
// ALL BANK APPROVAL REQUESTS (admin) — every status
// ============================================================

export type BankApprovalStatus = "pending" | "rejected" | "approved";

export interface BankRequestItem {
  bankId: string;
  retailerId: string;
  retailerMobile: string;
  retailerEmail: string;
  retailerName: string;
  source: "pendingBanks" | "banks";
  name: string;
  bank_code?: string | null;
  bankMasterId?: string | null;
  ifscCode: string;
  accountNumber: string;
  branchName?: string;
  isPrimary: boolean;
  isActive?: boolean;
  approvalStatus: BankApprovalStatus;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

export function getAllBankRequests(params?: {
  page?: number;
  limit?: number;
  status?: "all" | "pending" | "rejected" | "approved";
  search?: string;
}) {
  const query: { page?: number; limit?: number; status?: string; search?: string } = {};
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  if (params?.status) query.status = params.status;
  if (params?.search) query.search = params.search;

  return api
    .get<ApiEnvelope<BankRequestItem[]>>("/api/v1/auth/admin/banks/requests", { params: query })
    .then(unwrap);
}

export function approveBank(retailerId: string, pendingBankId: string) {
  return api.patch<ApiEnvelope<RetailerFullProfile>>(
    `/api/v1/auth/admin/retailers/${retailerId}/banks/${pendingBankId}/approve`
  ).then(unwrap);
}

export function rejectBank(retailerId: string, pendingBankId: string, reasonOfRejection: string) {
  return api.patch<ApiEnvelope<RetailerFullProfile>>(
    `/api/v1/auth/admin/retailers/${retailerId}/banks/${pendingBankId}/reject`,
    { reasonOfRejection }
  ).then(unwrap);
}

export function resubmitBank(pendingBankId: string, newBankDetails: Record<string, unknown>) {
  return api.patch<ApiEnvelope<RetailerFullProfile>>(
    `/api/v1/auth/retailer/banks/${pendingBankId}/resubmit`,
    newBankDetails
  ).then(unwrap);
}

// ============================================================
// MOBILE & EMAIL UPDATE WITH OTP (using existing OTP routes)
// ============================================================

export interface SendMobileOtpResponse {
  mobile: string;
  expiresInSeconds: number;
}

export interface VerifyMobileOtpResponse {
  mobile: string;
  message: string;
}

export interface SendEmailOtpResponse {
  email: string;
  expiresInSeconds: number;
}

export interface VerifyEmailOtpResponse {
  email: string;
  message: string;
}

export function sendMobileUpdateOtp(newMobile: string, userId: string, currentMobile: string) {
  return api.post<ApiEnvelope<SendMobileOtpResponse>>(
    "/api/v1/otp/send",
    { mobile: newMobile, userId, isUpdate: true, currentMobile }
  ).then(unwrap);
}

export function verifyMobileUpdateOtp(otp: string, userId: string) {
  return api.post<ApiEnvelope<VerifyMobileOtpResponse>>(
    "/api/v1/otp/verify",
    { otp, userId, isUpdate: true }
  ).then(unwrap);
}

export function sendEmailUpdateOtp(newEmail: string, userId: string) {
  return api.patch<ApiEnvelope<SendEmailOtpResponse>>(
    "/api/v1/email-otp/send",
    { email: newEmail, userId, isUpdate: true }
  ).then(unwrap);
}

export function verifyEmailUpdateOtp(otp: string, userId: string, email: string) {
  return api.patch<ApiEnvelope<VerifyEmailOtpResponse>>(
    "/api/v1/email-otp/verify",
    { email, otp, userId, isUpdate: true }
  ).then(unwrap);
}
