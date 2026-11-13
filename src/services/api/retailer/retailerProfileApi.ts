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

export function resubmitBank(retailerId: string, pendingBankId: string, newBankDetails: Record<string, unknown>) {
  return api.patch<ApiEnvelope<RetailerFullProfile>>(
    `/api/v1/auth/admin/retailers/${retailerId}/banks/${pendingBankId}/resubmit`,
    newBankDetails
  ).then(unwrap);
}
