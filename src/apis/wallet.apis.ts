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
  id: string;
  name: string;
  bank_name?: string;
  bank_id?: string;
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
  bank_code: string;
  bank_name: string;
  beneficiary_name: string;
  ifsc: string;
  account_number: string;
  amount: number;
  mode: "IMPS" | "NEFT";
  lat: string;
  long: string;
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



