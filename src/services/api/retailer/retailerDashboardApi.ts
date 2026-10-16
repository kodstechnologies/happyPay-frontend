import api from "../../../config/axiosInstance";

export interface DashboardRetailerInfo {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  outletId: string;
  registrationStatus: string;
  adminApproved: string;
  status: string;
  shop?: {
    name?: string;
    category?: string;
    propertyType?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  createdAt?: string;
}

export interface DashboardWalletInfo {
  walletId: string;
  balance: number;
  holdBalance: number;
  availableBalance: number;
  currency: string;
  status: string;
}

export interface DashboardTransactionItem {
  _id: string;
  transactionId?: string;
  service: "AEPS" | "DMT" | "CMS" | "BBPS" | "UPI" | "RAZORPAY" | "PAYOUT" | "MANUAL" | "COMMISSION" | string;
  type: "credit" | "debit" | string;
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  status: "success" | "pending" | "failed" | "reversed" | string;
  description?: string;
  commissionEarned?: number;
  payee?: {
    bankName?: string;
    aadharNumber?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  createdAt: string;
}

export interface RetailerDashboardData {
  retailer: DashboardRetailerInfo;
  wallet: DashboardWalletInfo;
  todayEarnings: number;
  recentTransactions: DashboardTransactionItem[];
}

export interface RetailerDashboardResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: RetailerDashboardData;
}

/**
 * Fetch unified dashboard data for a retailer (profile details, wallet balance, today's earnings, latest 5 transactions) in a single API call.
 */
export const getRetailerDashboardApi = async (retailerId?: string): Promise<RetailerDashboardResponse> => {
  const url = retailerId
    ? `/api/v1/retailer/dashboard?retailerId=${retailerId}`
    : `/api/v1/retailer/dashboard`;
  const response = await api.get<RetailerDashboardResponse>(url);
  return response.data;
};

export default getRetailerDashboardApi;
