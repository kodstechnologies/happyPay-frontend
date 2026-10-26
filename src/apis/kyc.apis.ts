import api from "../config/axiosInstance";

export type KycDocStatus = "APPROVED" | "PENDING" | "REJECTED" | "NOT_SUBMITTED";
export type KycOverallStatus = "pending" | "approved" | "rejected";

export interface KycDocumentItem {
  field: string;
  title: string;
  documentNumber?: string | null;
  documentType?: string | null;
  url?: string | null;
  status: KycDocStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  canReupload: boolean;
}

export interface KycPersonalDetails {
  id: string;
  fullName: string | null;
  fatherName: string | null;
  gender: string | null;
  maritalStatus: string | null;
  educationalQualification: string | null;
  dateOfBirth: string | null;
  mobile: string | null;
  isMobileVerified: boolean;
  email: string | null;
  isEmailVerified: boolean;
  selfie: string | null;
  registrationStatus?: string;
  currentRegistrationStep?: string;
}

export interface KycShopDetails {
  name: string | null;
  category?: { _id?: string; name?: string } | string | null;
  propertyType?: { _id?: string; name?: string } | string | null;
  address?: {
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
  completeAddress?: string | null;
  location?: {
    latitude?: number;
    longitude?: number;
  } | null;
}

export interface KycBankDetails {
  _id?: string;
  name?: string;
  ifscCode?: string;
  accountNumber?: string;
  branchName?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface KycSummary {
  overallStatus: KycOverallStatus;
  totalDocuments: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  notSubmittedCount: number;
  hasRejected: boolean;
  reasonOfRejection?: string | null;
}

export interface RetailerKycData {
  retailer: KycPersonalDetails;
  shop: KycShopDetails;
  bank: KycBankDetails | null;
  documents: KycDocumentItem[];
  summary: KycSummary;
}

export interface KycApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: RetailerKycData;
}

/**
 * Fetch complete retailer personal profile and KYC documents status
 */
export const getRetailerKycDetailsApi = async (): Promise<KycApiResponse> => {
  const response = await api.get<KycApiResponse>("/api/v1/auth/retailer/kyc-details");
  return response.data;
};

/**
 * Re-upload rejected or missing KYC documents
 * Accepts FormData with any of the 7 document fields:
 * - selfie
 * - panDocument
 * - aadhaarDocument
 * - shopInsidePhoto
 * - shopOutsidePhoto
 * - shopLocationPhoto
 * - businessProofDocument
 */
export const reuploadRetailerKycDocumentsApi = async (
  formData: FormData
): Promise<KycApiResponse> => {
  const response = await api.post<KycApiResponse>(
    "/api/v1/auth/retailer/kyc/reupload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
