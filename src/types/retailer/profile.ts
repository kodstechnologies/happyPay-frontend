export type DocumentStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

export interface DocumentReviewItem {
  status: DocumentStatus;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

export interface DocumentReviews {
  panDocument?: DocumentReviewItem;
  aadhaarDocument?: DocumentReviewItem;
  selfie?: DocumentReviewItem;
  shopInsidePhoto?: DocumentReviewItem;
  shopOutsidePhoto?: DocumentReviewItem;
  shopLocationPhoto?: DocumentReviewItem;
  businessProofDocument?: DocumentReviewItem;
}

export interface MasterDataRef {
  _id: string;
  name: string;
}

export interface RetailerShop {
  name?: string;
  category?: MasterDataRef | string | null;
  propertyType?: MasterDataRef | string | null;
  address?: {
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  completeAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface RetailerBank {
  _id?: string;
  bank_id?: string | number;
  bank_code?: string;
  name: string;
  ifscCode: string;
  accountNumber: string;
  branchName?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface RetailerFullProfile {
  id: string;
  _id?: string;
  mobile: string;
  isMobileVerified: boolean;
  email: string;
  isEmailVerified: boolean;
  fullName: string;
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
  shop?: RetailerShop;
  shopInsidePhoto?: string;
  shopOutsidePhoto?: string;
  shopLocationPhoto?: string;
  businessProofType?: MasterDataRef | string | null;
  businessProofDocument?: string;
  banks?: RetailerBank[];
  primaryBank?: RetailerBank | null;
  outletId?: string | null;
  eKYCStatus?: string | null;
  referenceKey?: string | null;
  kycStatus?: string;
  kycRejectionReason?: string | null;
  adminApproved: "pending" | "approved" | "rejected" | string;
  reasonOfRejection?: string | null;
  documentReviews?: DocumentReviews | null;
  registrationStatus: string;
  currentRegistrationStep?: string;
  status: string;
  isActive: boolean;
  isMpinSet?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  fatherName?: string;
  gender?: string;
  maritalStatus?: string;
  educationalQualification?: string;
  dateOfBirth?: string;
  shopName?: string;
  shopCategory?: string;
  propertyType?: string;
  businessProofType?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  completeAddress?: string;
  latitude?: number;
  longitude?: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
}
