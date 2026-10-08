import api from "../config/axiosInstance";

export interface PayeeInfo {
  bankName?: string;
  aadharNumber?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
}

export interface TransactionItem {
  _id: string;
  wallet?: string;
  type: "credit" | "debit" | string;
  transactionId?: string;

  referenceKey?: string;
  referenceId?: string;
  razorpay_order_id?: string | null;

  razorpay_payment_id?: string | null;
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  payee?: PayeeInfo;
  service: "AEPS" | "DMT" | "UPI" | "CMS" | "BBPS" | "RAZORPAY" | "PAYOUT" | "MANUAL" | "COMMISSION" | string;

  status: "pending" | "success" | "failed" | "reversed" | string;
  description?: string;
  commissionEarned?: number;

  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  service?: string;
  status?: string;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface TransactionListResponse {
  success: boolean;
  message: string;
  data: {
    transactions: TransactionItem[];
    pagination: PaginationInfo;
  };
}

/**
 * Fetch paginated & filtered transactions for authenticated retailer
 */
export const getTransactionsApi = async (
  params: GetTransactionsParams = {}
): Promise<TransactionListResponse> => {
  const response = await api.get<TransactionListResponse>("/api/v1/transactions", {
    params,
  });
  return response.data;
};
