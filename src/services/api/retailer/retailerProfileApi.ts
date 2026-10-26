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
