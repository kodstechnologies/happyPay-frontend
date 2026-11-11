import api from "../config/axiosInstance";

export interface InitiateUpiCashpointPayload {
  amount: number | string;
  latitude: string | number;
  longitude: string | number;
  merchantLoginId?: string | number;
  mobile?: string;
  txnid?: string;
}

export interface UpiCashpointResponseData {
  status?: boolean | string | number;
  response_code?: number;
  statuscode?: string;
  txnid?: string;
  orderid?: string;
  qrString?: string;
  qrCode?: string;
  upiUri?: string;
  intentUrl?: string;
  rrn?: string;
  bankRefNum?: string;
  message?: string;
  msg?: string;
  amount?: number | string;
  [key: string]: unknown;
}

export interface UpiCashpointApiResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: UpiCashpointResponseData;
}

/**
 * Initiate UPI Cashpoint Payment transaction
 * Calls POST /api/v1/upi-cashpoint/initiate-payment
 */
export const initiateUpiCashpointPaymentApi = async (
  payload: InitiateUpiCashpointPayload
): Promise<UpiCashpointApiResponse> => {
  const response = await api.post<UpiCashpointApiResponse>(
    "/api/v1/upi-cashpoint/initiate-payment",
    payload
  );
  return response.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// MERCHANT REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────

export interface MerchantRegistrationPayload {
  /** HappyPay internal user ID (MongoDB ObjectId) */
  userId: string;
  // The backend pulls most fields from the DB automatically.
  // Pass these overrides only when you need to supply values explicitly.
  stateCode?: string;
  fathername?: string;
  mothername?: string;
  firstname?: string;
  lastname?: string;
  dob?: string;           // DD-MM-YYYY
  email?: string;
  phone?: string | number;
  latitude?: string | number;
  longitude?: string | number;
  txnid?: string;
  merchantpincode?: string | number;
  panno?: string;
  accountnumber?: string | number;
  ifsc?: string;
  bankname?: string;
  aadharno?: string | number;
  state?: string;
  shopname?: string;
  address?: string;
  gender?: string;        // Single uppercase char: M / F / T
  maritalstatus?: string; // Uppercase: MARRIED, UNMARRIED, etc.
  ipaddress?: string;
  district?: string;
  [key: string]: unknown;
}

export interface MerchantRegistrationResponseData {
  merchantId?: string | number;
  status?: boolean | string | number;
  statuscode?: string;
  message?: string;
  msg?: string;
  [key: string]: unknown;
}

export interface MerchantRegistrationApiResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: MerchantRegistrationResponseData;
}

/**
 * Register retailer as a UPI Cashpoint merchant.
 * The backend fetches most KYC fields from the retailer's DB record automatically;
 * you only need to supply `userId`. Pass optional override fields when needed.
 *
 * POST /api/v1/upi-cashpoint/merchant-register
 */
export const merchantRegisterApi = async (
  payload: MerchantRegistrationPayload
): Promise<MerchantRegistrationApiResponse> => {
  const response = await api.post<MerchantRegistrationApiResponse>(
    "/api/v1/upi-cashpoint/merchant-register",
    payload
  );
  return response.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// MERCHANT REGISTRATION — SEND OTP
// ─────────────────────────────────────────────────────────────────────────────

export interface MerchantRegistrationSendOtpPayload {
  merchantId: string | number;
}

export interface MerchantRegistrationSendOtpResponseData {
  status?: boolean | string | number;
  message?: string;
  msg?: string;
  [key: string]: unknown;
}

export interface MerchantRegistrationSendOtpApiResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: MerchantRegistrationSendOtpResponseData;
}

/**
 * Trigger OTP delivery for merchant registration verification.
 * Call this after a successful /merchant-register.
 *
 * POST /api/v1/upi-cashpoint/merchant-registration/send-otp
 */
export const merchantRegistrationSendOtpApi = async (
  payload: MerchantRegistrationSendOtpPayload
): Promise<MerchantRegistrationSendOtpApiResponse> => {
  const response = await api.post<MerchantRegistrationSendOtpApiResponse>(
    "/api/v1/upi-cashpoint/merchant-registration/send-otp",
    payload
  );
  return response.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// MERCHANT REGISTRATION — VERIFY OTP
// ─────────────────────────────────────────────────────────────────────────────

export interface MerchantRegistrationVerifyPayload {
  merchantId: string | number;
  otp: string | number;
}

export interface MerchantRegistrationVerifyResponseData {
  status?: boolean | string | number;
  message?: string;
  msg?: string;
  [key: string]: unknown;
}

export interface MerchantRegistrationVerifyApiResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: MerchantRegistrationVerifyResponseData;
}

/**
 * Verify the OTP to complete merchant registration.
 *
 * POST /api/v1/upi-cashpoint/merchant-registration/verify
 */
export const merchantRegistrationVerifyApi = async (
  payload: MerchantRegistrationVerifyPayload
): Promise<MerchantRegistrationVerifyApiResponse> => {
  const response = await api.post<MerchantRegistrationVerifyApiResponse>(
    "/api/v1/upi-cashpoint/merchant-registration/verify",
    payload
  );
  return response.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// MERCHANT REGISTRATION — EKYC
// ─────────────────────────────────────────────────────────────────────────────

export interface MerchantEkycPayload {
  merchantId: string | number;
  pidData: string;
}

export interface MerchantEkycResponseData {
  status?: boolean | string | number;
  message?: string;
  msg?: string;
  [key: string]: unknown;
}

export interface MerchantEkycApiResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: MerchantEkycResponseData;
}

/**
 * Complete merchant eKYC with biometric data.
 * Sends data as multipart/form-data to the backend.
 *
 * POST /api/v1/upi-cashpoint/ekyc
 */
export const merchantEkycApi = async (
  payload: MerchantEkycPayload
): Promise<MerchantEkycApiResponse> => {
  const formData = new FormData();
  formData.append('merchantId', String(payload.merchantId));
  formData.append('pidData', payload.pidData);

  const response = await api.post<MerchantEkycApiResponse>(
    "/api/v1/upi-cashpoint/ekyc",
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// SELLER ONBOARDING
// ─────────────────────────────────────────────────────────────────────────────

export interface SellerOnboardingPayload {
  merchantId: string | number;
  osVersion: string;
  osType: string;
  appVersion: string;
  deviceFingerprint: string;
  ipaddress: string;
  latitude: string | number;
  longitude: string | number;
}

export interface SellerOnboardingResponseData {
  status?: boolean | string | number;
  message?: string;
  msg?: string;
  [key: string]: unknown;
}

export interface SellerOnboardingApiResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: SellerOnboardingResponseData;
}

/**
 * Seller onboarding — called after successful eKYC.
 *
 * POST /api/v1/upi-cashpoint/seller-onboarding
 */
export const sellerOnboardingApi = async (
  payload: SellerOnboardingPayload
): Promise<SellerOnboardingApiResponse> => {
  const response = await api.post<SellerOnboardingApiResponse>(
    "/api/v1/upi-cashpoint/seller-onboarding",
    payload
  );
  return response.data;
};

export default {
  initiateUpiCashpointPaymentApi,
  merchantRegisterApi,
  merchantRegistrationSendOtpApi,
  merchantRegistrationVerifyApi,
  merchantEkycApi,
  sellerOnboardingApi,
};
