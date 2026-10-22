import { apiClient } from "../client";
import { getToken } from "../../../utils/auth";
import type { RetailerFullProfile } from "../../../types/retailer/profile";

interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta: null;
}

export function getRetailerProfile() {
  return apiClient<ApiEnvelope<RetailerFullProfile>>("/api/v1/auth/retailer/profile", {
    method: "GET",
    token: getToken() || undefined,
  });
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

  return apiClient<ApiEnvelope<T>>("/api/v1/auth/retailer/profile", {
    method: "PATCH",
    token: getToken() || undefined,
    body: isFormData ? payload : JSON.stringify(payload),
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
  });
}
