import api from "../config/axiosInstance";

export interface WalletBalanceData {
  walletId: string;
  userId: string;
  balance: number;
  holdBalance: number;
  availableBalance: number;
  currency: string;
  status: string;
}

export interface WalletBalanceResponse {
  success: boolean;
  message: string;
  data: WalletBalanceData;
}

export const getWalletBalanceApi = async (): Promise<WalletBalanceResponse> => {
  const response = await api.get<WalletBalanceResponse>("/api/v1/wallet/balance");
  return response.data;
};

export const initiatePaymentApi = async (amount: number, purpose: string) => {
  const response = await api.post("/api/v1/payments/initiate", { amount, purpose, method: "razorpay" });
  return response.data;
};

export const verifyPaymentApi = async (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  purpose: string
) => {
  const response = await api.post("/api/v1/payments/verify", {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    purpose,
  });
  return response.data;
};

export const recordPaymentFailureApi = async (
  razorpay_order_id: string,
  razorpay_payment_id?: string,
  reason?: string,
  code?: string,
  purpose: string = "add_wallet"
) => {
  const response = await api.post("/api/v1/payments/failed", {
    razorpay_order_id,
    razorpay_payment_id: razorpay_payment_id || null,
    reason: reason || null,
    code: code || null,
    purpose,
  });
  return response.data;
};

export interface SettlementBankItem {
  _id: string;
  id?: string;
  name: string;
  bank_name?: string;
  bank_id?: string;
  bank_code?: string;
  code?: string;
  accountNumber: string;
  maskedAccountNumber: string;
  ifscCode: string;
  branchName?: string;
  accountType?: string;
  isPrimary: boolean;
  isActive: boolean;
  isVerified: boolean;
}

export interface SettlementRetailerInfo {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  shopName: string;
  status: string;
  adminApproved: string;
  isKycApproved: boolean;
}

export interface SettlementLimits {
  minSettlementAmount: number;
  maxSettlementPerTxn: number;
  dailySettlementLimit: number;
  supportedModes: ("IMPS" | "NEFT")[];
}

export interface SettlementBankInfoData {
  retailer: SettlementRetailerInfo;
  wallet: {
    walletId: string;
    totalBalance: number;
    holdBalance: number;
    availableBalance: number;
    currency: string;
    status: string;
  };
  banks: SettlementBankItem[];
  primaryBank: SettlementBankItem | null;
  limits: SettlementLimits;
}

export interface SettlementBankInfoResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: SettlementBankInfoData;
}

export const getSettlementBankInfoApi = async (): Promise<SettlementBankInfoResponse> => {
  const response = await api.get<SettlementBankInfoResponse>("/api/v1/wallet/settlement/bank-info");
  return response.data;
};

export interface InitiateSettlementPayload {
  accountType: string;
  branchName: string;
  benMobile: string;
  bank_name: string;
  beneficiary_name: string;
  ifsc: string;
  account_number: string;
  amount: number;
  mode: "IMPS" | "NEFT";
  lat: string;
  long: string;
  mpin: string;
}

export interface InitiateSettlementResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    txnid: string;
    utr: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    bankName: string;
    accountNumber: string;
    mode: string;
    status: string;
    providerResponse?: unknown;
  };
}

export const initiateSettlementPayoutApi = async (
  payload: InitiateSettlementPayload
): Promise<InitiateSettlementResponse> => {
  const response = await api.post<InitiateSettlementResponse>(
    "/api/v1/wallet/settlement/payout",
    payload
  );
  return response.data;
};

// ==========================================
// RETAILER TO RETAILER (P2P) SETTLEMENT APIS
// ==========================================

export interface VerifiedRetailerData {
  id: string;
  name: string;
  shopName: string;
  mobile: string;
  status: string;
}

export interface VerifyRecipientRetailerResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: VerifiedRetailerData;
}

export const verifyRecipientRetailerApi = async (
  mobile: string
): Promise<VerifyRecipientRetailerResponse> => {
  const response = await api.get<VerifyRecipientRetailerResponse>(
    `/api/v1/wallet/settlement/retailer/verify?mobile=${encodeURIComponent(mobile)}`
  );
  return response.data;
};

export interface TransferRetailerPayload {
  recipientMobile: string;
  amount: number;
  mpin: string;
  remarks?: string;
}

export interface TransferRetailerResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    id: string;
    transactionId: string;
    recipientTxnId: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    recipientName: string;
    recipientShopName: string;
    recipientMobile: string;
    remarks?: string;
    date: string;
  };
}

export const transferRetailerSettlementApi = async (
  payload: TransferRetailerPayload
): Promise<TransferRetailerResponse> => {
  const response = await api.post<TransferRetailerResponse>(
    "/api/v1/wallet/settlement/retailer/transfer",
    payload
  );
  return response.data;
};

export interface RecentRetailerTransferItem {
  id: string;
  name: string;
  shopName: string;
  mobile: string;
  amount: number;
  type: "credit" | "debit";
  date: string;
  status: string;
}

export interface RecentRetailerTransfersResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: RecentRetailerTransferItem[];
}

export const getRecentRetailerTransfersApi = async (): Promise<RecentRetailerTransfersResponse> => {
  const response = await api.get<RecentRetailerTransfersResponse>(
    "/api/v1/wallet/settlement/retailer/recent"
  );
  return response.data;
};

// ==========================================
// RETAILER TO DISTRIBUTOR SETTLEMENT APIS
// ==========================================

export interface AssignedDistributorData {
  id: string;
  customId: string;
  name: string;
  contactName: string;
  shopName: string;
  phone: string;
  email: string;
  address: string;
  zone: string;
  status: string;
  isPrimary: boolean;
}

export interface DistributorSettlementInfoData {
  hasDistributor: boolean;
  canTransfer: boolean;
  distributor: AssignedDistributorData | null;
  message?: string;
  retailer: {
    id: string;
    fullName: string;
    mobile: string;
    hasMpin: boolean;
    isKycApproved: boolean;
    status: string;
  };
  wallet: WalletBalanceData;
  limits: {
    minAmount: number;
    maxAmount: number;
    charges: number;
  };
}

export interface DistributorSettlementInfoResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: DistributorSettlementInfoData;
}

export const getDistributorSettlementInfoApi = async (): Promise<DistributorSettlementInfoResponse> => {
  const response = await api.get<DistributorSettlementInfoResponse>(
    "/api/v1/wallet/settlement/distributor/info"
  );
  return response.data;
};

export interface TransferDistributorPayload {
  amount: number;
  mpin: string;
  reason?: string;
  distributorId?: string;
}

export interface TransferDistributorResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    id: string;
    transactionId: string;
    distributorTxnId: string;
    amount: number;
    senderBalanceBefore: number;
    senderBalanceAfter: number;
    distributorBalanceAfter: number;
    distributorName: string;
    distributorShopName: string;
    distributorId: string;
    distributorMobile: string;
    reason: string;
    date: string;
  };
}

export const transferDistributorSettlementApi = async (
  payload: TransferDistributorPayload
): Promise<TransferDistributorResponse> => {
  const response = await api.post<TransferDistributorResponse>(
    "/api/v1/wallet/settlement/distributor/transfer",
    payload
  );
  return response.data;
};

export interface RecentDistributorTransferItem {
  id: string;
  name: string;
  shopName: string;
  mobile: string;
  amount: number;
  type: "credit" | "debit";
  date: string;
  status: string;
  description?: string;
}

export interface RecentDistributorTransfersResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: RecentDistributorTransferItem[];
}

export const getRecentDistributorTransfersApi = async (): Promise<RecentDistributorTransfersResponse> => {
  const response = await api.get<RecentDistributorTransfersResponse>(
    "/api/v1/wallet/settlement/distributor/recent"
  );
  return response.data;
};




