import api from "../../../config/axiosInstance";
import type { AxiosResponse } from "axios";

interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta: null;
}

const unwrap = <T,>(response: AxiosResponse<ApiEnvelope<T>>) => response.data;

export interface SendMpinOtpResponse {
  success: boolean;
  message: string;
  mobileMasked?: string;
  expiresInSeconds?: number;
}

export interface SetupMpinPayload {
  newMpin: string;
  confirmMpin: string;
  otp: string;
}

export interface ChangeMpinPayload {
  currentMpin?: string;
  isReset?: boolean;
  newMpin: string;
  confirmMpin: string;
  otp: string;
}

export interface MpinActionResponse {
  success: boolean;
  message: string;
  isMpinSet: boolean;
}

export interface VerifyMpinResponse {
  isValid: boolean;
  message: string;
}

/**
 * Send OTP to retailer's registered mobile number for MPIN Setup or Change
 */
export function sendMpinOtpApi() {
  return api
    .post<ApiEnvelope<SendMpinOtpResponse>>("/api/v1/auth/retailer/mpin/send-otp")
    .then(unwrap);
}

/**
 * Setup Initial MPIN (compulsory OTP verified)
 */
export function setupMpinApi(payload: SetupMpinPayload) {
  return api
    .post<ApiEnvelope<MpinActionResponse>>("/api/v1/auth/retailer/mpin/setup", payload)
    .then(unwrap);
}

/**
 * Change or Reset MPIN (compulsory OTP verified)
 */
export function changeMpinApi(payload: ChangeMpinPayload) {
  return api
    .post<ApiEnvelope<MpinActionResponse>>("/api/v1/auth/retailer/mpin/change", payload)
    .then(unwrap);
}

/**
 * Verify MPIN (for transactions or settlements)
 */
export function verifyMpinApi(mpin: string) {
  return api
    .post<ApiEnvelope<VerifyMpinResponse>>("/api/v1/auth/retailer/mpin/verify", { mpin })
    .then(unwrap);
}
