import { apiClient } from "../client";
import { getAccessToken } from "../../auth/token";

export interface BankAccount {
  _id?: string;
  name: string;
  ifscCode: string;
  accountNumber: string;
  branchName?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface ShopCategory {
  _id?: string;
  name?: string;
}

export interface PropertyType {
  _id?: string;
  name?: string;
}

export interface ShopAddress {
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface ShopLocation {
  latitude?: number;
  longitude?: number;
}

export interface ShopInfo {
  name?: string;
  category?: ShopCategory | string;
  propertyType?: PropertyType | string;
  address?: ShopAddress;
  completeAddress?: string;
  location?: ShopLocation;
}

export interface RetailerProfileData {
  id: string;
  mobile: string;
  isMobileVerified: boolean;
  email?: string;
  isEmailVerified?: boolean;
  registrationStatus: string;
  fullName?: string;
  fatherName?: string;
  gender?: string;
  maritalStatus?: string;
  educationalQualification?: string;
  dateOfBirth?: string;
  panNumber?: string;
  panDocument?: string;
  aadhaarNumber?: string;
  aadhaarDocument?: string;
  selfie?: string;
  shop?: ShopInfo;
  shopInsidePhoto?: string;
  shopOutsidePhoto?: string;
  shopLocationPhoto?: string;
  businessProofType?: { _id?: string; name?: string } | string;
  businessProofDocument?: string;
  banks?: BankAccount[];
  primaryBank?: BankAccount | null;
  outletId?: string;
  kycStatus?: string;
  kycRejectionReason?: string;
  adminApproved?: string;
  reasonOfRejection?: string | null;
  documentReviews?: Record<string, { status?: string; rejectionReason?: string | null; reviewedAt?: string | null }>;
  status?: string;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export async function getRetailerProfile(): Promise<ApiEnvelope<RetailerProfileData>> {
  const token = getAccessToken() || localStorage.getItem("token") || undefined;
  return apiClient<ApiEnvelope<RetailerProfileData>>("/api/v1/auth/retailer/profile", {
    method: "GET",
    token,
  });
}
