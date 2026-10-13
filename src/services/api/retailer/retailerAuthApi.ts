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
  panNumber?: string;
  panDocument?: string;
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
// VERIFY OTP (mobile + otp)
// ============================================================

export function verifyRetailerRegisterOtp(payload: {
  mobile: string;
  otp: string;
}) {
  return apiClient<ApiEnvelope<VerifyOtpResult>>(
    "/api/v1/otp/verify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

// ============================================================
// GET CURRENT REGISTRATION STEP
// ============================================================



export interface ShopAddress {
  addressLine: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

export interface ShopLocation {
  latitude: number | null;
  longitude: number | null;
}

export interface RegistrationShopDetails {
  name: string | null;
  category: string | null;
  propertyType: string | null;
  address: ShopAddress;
  completeAddress: string | null;
  location: ShopLocation;
}



export interface CurrentRegistrationStepResult {
  userId: string;
  mobile: string;
  email: string;
  registrationStatus: string;
  currentRegistrationStep: number;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  outletId: string | null;
  adminApproved: boolean;
  eKYCStatus: string;
  filledData: {
    panNumber: string | null;
    panDocument: string | null;
    shop: RegistrationShopDetails | null;
    shopInsidePhoto: string | null;
    shopOutsidePhoto: string | null;
    shopLocationPhoto: string | null;
    businessProofType: string | null;
    businessProofDocument: string | null;
    name: string | null;
    selfie: string | null;
    gender: string | null;
    maritalStatus: string | null;
    educationalQualification: string | null;
    dob: string | null;
    aadhaarNumber: string | null;
    aadhaarDocument: string | null;
    aadhaarConsent: boolean;
    aadhaarVerified: boolean;
    banks: unknown[];
  };
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
// GET CURRENT REGISTRATION STEP
// ============================================================

export function getCurrentRegistrationStep(payload: {
  userId?: string;
  mobile?: string;
}) {
  return apiClient<ApiEnvelope<CurrentRegistrationStepResult>>(
    "/api/v1/auth/registration/current-step",
    {
      method: "POST",
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
  panNumber: string;
  panDocument: string;
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
  panNumber: string;
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
  panDocument?: File | null;
}

export function updateRetailerShopDetails(payload: UpdateShopDetailsPayload) {
  const fd = new FormData();
  fd.append("userId", payload.userId);
  fd.append("panNumber", payload.panNumber);
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
  if (payload.panDocument)
    fd.append("panDocument", payload.panDocument);

  return apiClient<ApiEnvelope<UpdateShopDetailsResult>>(
    "/api/v1/auth/registration/shop-details",
    {
      method: "PATCH",
      body: fd,
      // NOTE: do NOT set Content-Type — browser sets multipart boundary automatically
    },
  );
}


// ============================================================
// UPDATE ABOUT (personal info)
// ============================================================

export interface UpdateAboutResult {
  id: string;
  mobile: string;
  isMobileVerified: boolean;
  email: string;
  isEmailVerified: boolean;
  fullName: string;
  gender: string;
  panNumber: string;
  aadhaarNumber: string | null;
  dateOfBirth: string | null;
  fullAddress: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  shopName: string;
  shopCategory: string;
  propertyType: string;
  shopAddress: string;
  latitude: number | null;
  longitude: number | null;
  selfie: string | null;
  maritalStatus: string | null;
  educationalQualification: string | null;
  panDocument: string;
  fatherName: string | null;
  aadhaarDocument: string | null;
  shopInsidePhoto: string | null;
  shopOutsidePhoto: string | null;
  shopLocationPhoto: string | null;
  businessProof: string | null;
  businessProofDocument: string | null;
  banks: unknown[];
  primaryBank: unknown | null;
  outletId: string | null;
  adminApproved: string;
  reasonOfRejection: string | null;
  documentReviews: Record<string, unknown>;
  registrationStatus: string;
  currentRegistrationStep: string;
}

export interface UpdateAboutPayload {
  userId: string;
  fullName: string;
  dateOfBirth: string;
  gender: "M" | "F" | "T";   // ← narrowed
  maritalStatus: string;
  educationalQualification: string;
  selfie: File;
}

export function updateRetailerAboutDetails(payload: UpdateAboutPayload) {
  const fd = new FormData();
  fd.append("userId", payload.userId);
  fd.append("fullName", payload.fullName);
  fd.append("dateOfBirth", payload.dateOfBirth);
  fd.append("gender", payload.gender);
  fd.append("maritalStatus", payload.maritalStatus);
  fd.append("educationalQualification", payload.educationalQualification);
  fd.append("selfie", payload.selfie);

  return apiClient<ApiEnvelope<UpdateAboutResult>>(
    "/api/v1/auth/registration/about",
    {
      method: "PATCH",
      body: fd,
      // do NOT set Content-Type — let the browser set the multipart boundary
    },
  );
}





//=======================================================================================

export function sendRetailerLoginOtp(mobile: string) {
  return apiClient<ApiEnvelope<{ mobile: string; expiresInSeconds: number }>>(
    "/api/v1/auth/retailer/login/send-otp",
    {
      method: "POST",
      body: JSON.stringify({ mobile }),
    },
  );
}

// ============================================================
// UPDATE AADHAAR DETAILS
// ============================================================

export interface UpdateAadhaarResult {
  id: string;
  mobile: string;
  isMobileVerified: boolean;
  email: string;
  isEmailVerified: boolean;
  fullName: string;
  gender: string;
  panNumber: string;
  aadhaarNumber: string;
  aadhaarDocument: string;
  aadhaarConsent: boolean;
  aadhaarMobileLinked: boolean;
  aadhaarVerified: boolean;
  dateOfBirth: string | null;
  fullAddress: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  shopName: string;
  shopCategory: string;
  propertyType: string;
  shopAddress: string;
  latitude: number | null;
  longitude: number | null;
  selfie: string | null;
  maritalStatus: string | null;
  educationalQualification: string | null;
  panDocument: string;
  fatherName: string | null;
  shopInsidePhoto: string | null;
  shopOutsidePhoto: string | null;
  shopLocationPhoto: string | null;
  businessProof: string | null;
  businessProofDocument: string | null;
  banks: unknown[];
  primaryBank: unknown | null;
  outletId: string | null;
  adminApproved: string;
  reasonOfRejection: string | null;
  documentReviews: Record<string, unknown>;
  registrationStatus: string;
  currentRegistrationStep: string;
}

export interface UpdateAadhaarPayload {
  userId: string;
  aadhaarNumber: string;
  aadhaarDocument: File;
  aadhaarConsent: boolean;
  isAdharConsentGiven: boolean;
  aadhaarMobileLinked: boolean;
}

export function updateRetailerAadhaarDetails(payload: UpdateAadhaarPayload) {
  const fd = new FormData();
  fd.append("userId", payload.userId);
  fd.append("aadhaarNumber", payload.aadhaarNumber);
  fd.append("aadhaarDocument", payload.aadhaarDocument);
  fd.append("aadhaarConsent", String(payload.aadhaarConsent));
  fd.append("isAdharConsentGiven", String(payload.isAdharConsentGiven));
  fd.append("aadhaarMobileLinked", String(payload.aadhaarMobileLinked));

  return apiClient<ApiEnvelope<UpdateAadhaarResult>>(
    "/api/v1/auth/registration/adhaar-details",
    {
      method: "PATCH",
      body: fd,
      // do NOT set Content-Type — let the browser set the multipart boundary
    },
  );
}

// ============================================================
// UPDATE BANK DETAILS
// ============================================================

export interface UpdateBankDetailsResult {
  id: string;
  mobile: string;
  isMobileVerified: boolean;
  email: string;
  isEmailVerified: boolean;
  fullName: string;
  gender: string;
  panNumber: string;
  aadhaarNumber: string | null;
  dateOfBirth: string | null;
  fullAddress: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  shopName: string;
  shopCategory: string;
  propertyType: string;
  shopAddress: string;
  latitude: number | null;
  longitude: number | null;
  selfie: string | null;
  maritalStatus: string | null;
  educationalQualification: string | null;
  panDocument: string;
  fatherName: string | null;
  aadhaarDocument: string | null;
  shopInsidePhoto: string | null;
  shopOutsidePhoto: string | null;
  shopLocationPhoto: string | null;
  businessProof: string | null;
  businessProofDocument: string | null;
  banks: unknown[];
  primaryBank: unknown | null;
  outletId: string;
  adminApproved: string;
  reasonOfRejection: string | null;
  documentReviews: Record<string, unknown>;
  registrationStatus: string;
  currentRegistrationStep: string;
}

export interface UpdateBankDetailsPayload {
  userId: string;
  bankName: string;
  ifscCode: string;
  accountNumber: string;
}

export function updateRetailerBankDetails(payload: UpdateBankDetailsPayload) {
  return apiClient<ApiEnvelope<UpdateBankDetailsResult>>(
    "/api/v1/auth/registration/bank-details",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

// ============================================================
// GET BANK LIST
// ============================================================

export interface Bank {
  id: number;
  bank_id: number;
  name: string;
  iin: string;
  aeps_enabled: number;
  aadhaarpay_enabled: number;
  aeps_failure_rate: string;
  aadhaarpay_failure_rate: string;
  created_at: string;
  updated_at: string;
}

export interface BankListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getBankList() {
  return apiClient<ApiEnvelope<Bank[]>>(
    "/api/v1/auth/banks",
    {
      method: "GET",
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
