// ---------------------------------------------------------------------------
// Existing types — NOT modified
// ---------------------------------------------------------------------------

export interface AdminRetailer {
  id: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  fatherName?: string;
  gender?: string;
  maritalStatus?: string;
  educationalQualification?: string;
  dateOfBirth?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  aadhaarVerified?: boolean;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  panDocument?: string;
  aadhaarDocument?: string;
  businessProofDocument?: string;
  businessProofType?: { _id?: string; name?: string; code?: string } | string;
  selfie?: string;
  shopInsidePhoto?: string;
  shopOutsidePhoto?: string;
  shopLocationPhoto?: string;
  documentReviews?: Record<string, { status?: string; rejectionReason?: string | null; reviewedAt?: string | null }>;
  banks?: Array<{
    _id?: string;
    name?: string;
    ifscCode?: string;
    accountNumber?: string;
    confirmAccountNumber?: string;
    branchName?: string;
    isPrimary?: boolean;
    isActive?: boolean;
  }>;
  shop?: {
    name?: string;
    completeAddress?: string;
    category?: { _id?: string; name?: string } | string;
    propertyType?: { _id?: string; name?: string } | string;
    address?: { addressLine?: string; city?: string; state?: string; pincode?: string };
    location?: { latitude?: number; longitude?: number };
  };
  kycStatus?: "pending" | "under_review" | "approved" | "rejected";
  adminApproved?: "pending" | "approved" | "rejected";
  status?: "pending" | "approved" | "active" | "rejected" | "suspended" | "blocked";
  role?: "distributor" | "retailer";
  kycRejectionReason?: string;
  reasonOfRejection?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RetailerListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  kycStatus?: string;
}

// ---------------------------------------------------------------------------
// Pagination metadata (shared shape returned by all paginated admin APIs)
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ---------------------------------------------------------------------------
// Admin: retailer transaction types
// ---------------------------------------------------------------------------

/** Transaction services that can appear on the backend Transaction model. */
export type TransactionService =
  | "AEPS"
  | "DMT"
  | "UPI"
  | "CMS"
  | "PAYOUT"
  | "BBPS"
  | "RAZORPAY"
  | "MANUAL"
  | "COMMISSION";

export interface AdminTransaction {
  _id: string;
  transactionId: string;
  type: "credit" | "debit";
  service: TransactionService;
  amount: number;
  status: "pending" | "success" | "failed" | "reversed";
  description?: string;
  commissionEarned: number;
  balanceBefore?: number;
  balanceAfter?: number;
  payee?: {
    bankName?: string;
    aadharNumber?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
  wallet?: {
    _id?: string;
    user?: {
      _id?: string;
      fullName?: string;
      mobile?: string;
      email?: string;
    };
  };
  createdAt: string;
}

/**
 * Query-string parameters accepted by
 * `GET /api/admin/retailers/:id/transactions`
 */
export interface AdminTransactionFilters {
  /** Filter by service type; omit or set to "ALL" for all services. */
  service?: TransactionService | "ALL";
  /** Filter by transaction status; omit or set to "ALL" for all statuses. */
  status?: "pending" | "success" | "failed" | "reversed" | "ALL";
  /** Filter by ledger direction; omit or set to "ALL" for both. */
  type?: "credit" | "debit" | "ALL";
  /** Inclusive start date (YYYY-MM-DD). */
  startDate?: string;
  /** Inclusive end date (YYYY-MM-DD). */
  endDate?: string;
  /** Free-text search across transactionId, description, payee fields, etc. */
  search?: string;
  /** 1-based page number (default 1). */
  page?: number;
  /** Page size, max 100 (default 10). */
  limit?: number;
}

export interface AdminTransactionListResponse {
  transactions: AdminTransaction[];
  pagination: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Admin: distributor sub-retailer types
// ---------------------------------------------------------------------------

export interface AdminSubRetailerBank {
  name: string | null;
  ifscCode: string | null;
  /** Masked format: XXXXXXXX<last4> */
  accountNumber: string | null;
}

export interface AdminSubRetailer {
  id: string;
  fullName: string | null;
  email: string | null;
  mobile: string | null;
  panNumber: string | null;
  status: "active" | "suspended" | "blocked";
  adminApproved: "pending" | "approved" | "rejected";
  registrationStatus: string | null;
  shopName: string | null;
  shopAddress: string | null;
  primaryBank: AdminSubRetailerBank | null;
  createdAt: string;
  /** Count of successful transactions. */
  totalTransactions: number;
  /** Sum of successful transaction amounts (in ₹). */
  totalVolume: number;
}

/**
 * Query-string parameters accepted by
 * `GET /api/admin/retailers/:id/sub-retailers`
 */
export interface SubRetailerFilters {
  /** Free-text search on fullName, email, or mobile. */
  search?: string;
  /** Filter by account status. */
  status?: "active" | "suspended" | "blocked";
  /** Filter by KYC / admin approval status. */
  adminApproved?: "pending" | "approved" | "rejected";
  /** 1-based page number (default 1). */
  page?: number;
  /** Page size, max 100 (default 10). */
  limit?: number;
}

export interface SubRetailerListResponse {
  items: AdminSubRetailer[];
  pagination: PaginationMeta;
}
