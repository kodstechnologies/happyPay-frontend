import { apiClient } from "../client";

interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta: null;
}

export interface RetailerLoginResult {
  user: {
    id: string;
    email?: string;
    mobile: string;
    status: string;
    kycStatus?: string;
    adminApproved?: boolean;
    outletId?: string;
    roles: string[];
    permissions: string[];
  };
  accessToken: string;
  refreshToken: string;
}
export interface SendOtpResult {
  message: string;
}

export interface RegisterUser {
  _id: string;
  registrationStatus: string;
  currentRegistrationStep: string;
  panNumber: string;
  panDocument: string;
  mobile: string;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  aadhaarConsent: boolean;
  aadhaarVerified: boolean;
  eKYCStatus: string;
  adminApproved: string;
  reasonOfRejection: string | null;
  documentReviews: Record<string, unknown>;
  roles: string[];
  permissions: string[];
  status: string;
  isActive: boolean;
  banks: unknown[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface VerifyOtpResult {
  user: RegisterUser;
}




export function sendRetailerRegisterOtp(mobile: string) {
  return apiClient<ApiEnvelope<SendOtpResult>>(
    "/api/v1/otp/send",
    {
      method: "POST",
      body: JSON.stringify({ mobile }),
    },
  );
}

// ============================================================
// VERIFY OTP (mobile + otp + panNumber + panDocument)
// ============================================================

export function verifyRetailerRegisterOtp(payload: {
  mobile: string;
  otp: string;
  panNumber: string;
  panDocument: File;
}) {
  const formData = new FormData();
  formData.append("mobile", payload.mobile);
  formData.append("otp", payload.otp);
  formData.append("panNumber", payload.panNumber);
  formData.append("panDocument", payload.panDocument);

  return apiClient<ApiEnvelope<VerifyOtpResult>>(
    "/api/v1/otp/verify",
    {
      method: "POST",
      body: formData,
    },
  );
}


//============================================================


export interface SendEmailOtpResult {
  email: string;
  expiresAt: string;
}

export interface VerifyEmailOtpResult {
  userId: string;
  email: string;
  verified: boolean;
  isEmailVerified: boolean;
  emailVerified: boolean;
  verifiedAt: string;
}



export function sendRetailerEmailOtp(payload: {
  userId: string;
  email: string;
}) {
  return apiClient<ApiEnvelope<SendEmailOtpResult>>(
    "/api/v1/email-otp/send",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}



export function verifyRetailerEmailOtp(payload: {
  userId: string;
  email: string;
  otp: string;
}) {
  return apiClient<ApiEnvelope<VerifyEmailOtpResult>>(
    "/api/v1/email-otp/verify",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

// ============================================================
// SHOP DETAILS (FormData)
// ============================================================

export interface UpdateShopDetailsResult {
  id: string;
  mobile: string;
  isMobileVerified: boolean;
  email: string;
  isEmailVerified: boolean;
  fullName: string;
  shopName: string;
  shopCategory: string;
  propertyType: string;
  shopAddress: string;
  latitude: number;
  longitude: number;
  city: string;
  pincode: string;
  shopInsidePhoto: string;
  shopOutsidePhoto: string;
  shopLocationPhoto: string;
  businessProof: string;
  businessProofDocument: string;
  registrationStatus: string;
  currentRegistrationStep: string;
}

export interface UpdateShopDetailsPayload {
  userId: string;
  shopName: string;
  shopCategory: string;
  propertyType: string;
  address: string;
  city: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  businessProofType: string;
  shopInsidePhoto?: File | null;
  shopOutsidePhoto?: File | null;
  shopLocationPhoto?: File | null;
  businessProofDocument?: File | null;
}

export function updateRetailerShopDetails(payload: UpdateShopDetailsPayload) {
  const fd = new FormData();
  fd.append("userId", payload.userId);
  fd.append("shopName", payload.shopName);
  fd.append("shopCategory", payload.shopCategory);
  fd.append("propertyType", payload.propertyType);
  fd.append("address", payload.address);
  fd.append("city", payload.city);
  fd.append("pincode", payload.pincode);
  if (payload.latitude != null) fd.append("latitude", String(payload.latitude));
  if (payload.longitude != null)
    fd.append("longitude", String(payload.longitude));
  fd.append("businessProofType", payload.businessProofType);

  if (payload.shopInsidePhoto)
    fd.append("shopInsidePhoto", payload.shopInsidePhoto);
  if (payload.shopOutsidePhoto)
    fd.append("shopOutsidePhoto", payload.shopOutsidePhoto);
  if (payload.shopLocationPhoto)
    fd.append("shopLocationPhoto", payload.shopLocationPhoto);
  if (payload.businessProofDocument)
    fd.append("businessProofDocument", payload.businessProofDocument);

  return apiClient<ApiEnvelope<UpdateShopDetailsResult>>(
    "/api/v1/auth/retailer/register/shop-details",
    {
      method: "POST",
      body: fd,
      // NOTE: do NOT set Content-Type — browser sets multipart boundary automatically
    },
  );
}















export function sendRetailerLoginOtp(mobile: string) {
  return apiClient<ApiEnvelope<{ mobile: string; expiresInSeconds: number }>>(
    "/api/v1/auth/retailer/login/send-otp",
    {
      method: "POST",
      body: JSON.stringify({ mobile }),
    },
  );
}

export function verifyRetailerLoginOtp(payload: {
  mobile: string;
  otp: string;
  fcmToken?: string | null;
  deviceId?: string;
  platform?: string;
  deviceName?: string;
}) {
  return apiClient<ApiEnvelope<RetailerLoginResult>>(
    "/api/v1/auth/retailer/login/verify-otp",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
