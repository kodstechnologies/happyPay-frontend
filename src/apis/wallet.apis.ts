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
