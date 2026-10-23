import { apiClient } from "../client";
import { getToken } from "../../../utils/auth";

interface ApiEnvelope<T, M = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: M | null;
}

export interface RetailerLoginResult {
  user: {
    id: string;
    _id?: string;
    fullName?: string;
    email?: string;
    mobile: string;
    status: string;
    registrationStatus?: string;
    currentRegistrationStep?: string;
    kycStatus?: string;
    adminApproved?: boolean | string;
    outletId?: string;
    roles: string[];
    permissions: string[];
    AepsEkyc?: AepsEkycData | null;
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
  distributorId?: string;
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
  distributorId?: string;
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
  if (payload.distributorId) fd.append("distributorId", payload.distributorId);

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
  bank_id?: string | number;
  ifscCode: string;
  accountNumber: string;
  fcmToken?: string | null;
  deviceId?: string | null;
  platform?: string | null;
  deviceName?: string | null;
  distributorId?: string;
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

export function getBankList(page?: number, limit?: number) {
  const params = new URLSearchParams();
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());

  return apiClient<ApiEnvelope<Bank[]>>(
    `/api/v1/auth/banks${params.toString() ? `?${params.toString()}` : ''}`,
    {
      method: "GET",
    },
  );
}

export function getRetailerAadhaarAndMobile(userId: string) {
  return apiClient<
    ApiEnvelope<{
      aadhaarNumber: string | null;
      mobile: string | null;
    }>
  >("/api/v1/auth/retailer/aadhaar-mobile", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
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

export interface AepsEkycData {
  outletId: string | null;
  referenceKey: string | null;
  pidOptionWadh?: string | null;
  eKYCStatus: string | null;
  eKYCRejectionReason?: string | null;
}

export interface RetailerUser {
  id: string;
  _id: string;
  mobile: string;
  email: string | null;
  fullName: string | null;
  registrationStatus: string;
  currentRegistrationStep: string;
  adminApproved: string;
  kycStatus: string;
  outletId: string | null;
  referenceKey: string | null;
  eKYCStatus: string | null;
  AepsEkyc: AepsEkycData | null;
  roles: string[];
  permissions: string[];
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  status: string;
  isActive: boolean;
}

export function getAuthenticatedRetailer(token?: string) {
  const effectiveToken =
    token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("accessToken") || localStorage.getItem("token")
      : null) ||
    undefined;

  return apiClient<ApiEnvelope<RetailerUser>>(
    "/api/v1/auth/retailer/auth/me",
    {
      method: "GET",
      token: effectiveToken,
    }
  );
}

export function logoutRetailerApi(payload: {
  refreshToken?: string | null;
  deviceId?: string | null;
}) {
  return apiClient<ApiEnvelope<null>>(
    "/api/v1/auth/retailer/logout",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

// ============================================================
// PINCODE VALIDATION
// ============================================================

export interface PincodeValidationData {
  isValid: boolean;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  postOffices?: string[];
  message?: string;
  isFallback?: boolean;
}

export function validatePincodeApi(pincode: string) {
  return apiClient<ApiEnvelope<PincodeValidationData>>(
    `/api/v1/auth/pincode/validate/${encodeURIComponent(pincode)}`,
    {
      method: "GET",
    }
  );
}

// ============================================================
// DOWNLINE RETAILERS (DISTRIBUTOR NETWORK)
// ============================================================

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface DownlineRetailer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  shopName: string;
  panNumber?: string;
  status: "Pending" | "Approved" | "Active" | "Blocked" | "Suspended" | "Rejected";
  rawStatus: string;
  adminApproved: string;
  registeredAt: string;
}

export interface RetailerFullProfile {
  id: string;
  mobile: string;
  isMobileVerified?: boolean;
  email?: string;
  isEmailVerified?: boolean;
  registrationStatus?: string;
  currentRegistrationStep?: string;
  fullName: string;
  fatherName?: string;
  gender?: string;
  maritalStatus?: string;
  educationalQualification?: string;
  dateOfBirth?: string;
  panNumber?: string;
  panDocument?: string;
  aadhaarNumber?: string;
  aadhaarDocument?: { front?: string; back?: string };
  selfie?: string;
  shop?: {
    name?: string;
    category?: { _id?: string; name?: string } | string;
    propertyType?: { _id?: string; name?: string } | string;
    address?: { addressLine?: string; city?: string; state?: string; pincode?: string } | string;
    completeAddress?: string;
    location?: { type?: string; coordinates?: number[] };
  };
  shopInsidePhoto?: string;
  shopOutsidePhoto?: string;
  shopLocationPhoto?: string;
  businessProofType?: { _id?: string; name?: string } | string;
  businessProofDocument?: string;
  banks?: Array<{
    _id?: string;
    id?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    isPrimary?: boolean;
    isVerified?: boolean;
  }>;
  primaryBank?: {
    _id?: string;
    id?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    isPrimary?: boolean;
    isVerified?: boolean;
  } | null;
  outletId?: string | null;
  eKYCStatus?: string | null;
  referenceKey?: string | null;
  kycStatus?: string;
  kycRejectionReason?: string;
  adminApproved?: string;
  reasonOfRejection?: string;
  status: string;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export function getDownlineRetailersApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  adminApproved?: string;
  token?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.adminApproved) query.set("adminApproved", params.adminApproved);

  const effectiveToken = params?.token || getToken() || undefined;

  const qs = query.toString();
  return apiClient<ApiEnvelope<DownlineRetailer[], PaginationMeta>>(
    `/api/v1/auth/retailer/downline-retailers${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      token: effectiveToken,
    }
  );
}

export function getDownlineRetailerDetailsApi(
  retailerId: string,
  token?: string
) {
  const effectiveToken = token || getToken() || undefined;
  return apiClient<ApiEnvelope<RetailerFullProfile>>(
    `/api/v1/auth/retailer/downline-retailers/${retailerId}`,
    {
      method: "GET",
      token: effectiveToken,
    }
  );
}

export interface DownlineTransaction {
  id: string;
  _id?: string;
  date?: string;
  createdAt?: string;
  service: string;
  amount: number;
  status: string;
  type?: string;
  narration?: string;
}

export function getDownlineRetailerTransactionsApi(
  retailerId: string,
  params?: {
    page?: number;
    limit?: number;
    service?: string;
    status?: string;
    search?: string;
    token?: string;
  }
) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.service && params.service !== "All" && params.service !== "all") query.set("service", params.service);
  if (params?.status && params.status !== "All" && params.status !== "all") query.set("status", params.status);
  if (params?.search) query.set("search", params.search);

  const effectiveToken = params?.token || getToken() || undefined;

  const qs = query.toString();
  return apiClient<ApiEnvelope<DownlineTransaction[], PaginationMeta>>(
    `/api/v1/auth/retailer/downline-retailers/${retailerId}/transactions${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      token: effectiveToken,
    }
  );
}


