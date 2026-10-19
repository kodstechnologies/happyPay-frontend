import api from "../config/axiosInstance";

export interface DashboardRetailerInfo {
  id: string;
  fullName: string;
  mobile: string;
  shopName?: string;
}

export interface DashboardWalletInfo {
  walletId: string;
  userId: string;
  balance: number;
  holdBalance: number;
  availableBalance: number;
  currency: string;
  status: string;
}

export interface DashboardEarningsInfo {
  todayEarnings: number;
  todayTransactionsCount: number;
}

export interface DashboardTransactionItem {
  _id: string;
  id: string;
  service: "AEPS" | "DMT" | "CMS" | "BBPS" | "UPI" | string;
  title: string;
  date: string;
  time: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  status: "Success" | "Pending" | "Failed";
  commissionEarned: number;
  createdAt: string;
}

export interface DashboardData {
  retailer: DashboardRetailerInfo;
  wallet: DashboardWalletInfo;
  earnings: DashboardEarningsInfo;
  recentTransactions: DashboardTransactionItem[];
}

export interface DashboardApiResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

/**
 * Fetch unified dashboard metrics for the authenticated retailer:
 * - Retailer Profile & ID
 * - Live Wallet Balance
 * - Today's Earnings (calculated from today's commissionEarned)
 * - Latest 5 Transactions
 */
export const getRetailerDashboardApi = async (): Promise<DashboardApiResponse> => {
  const response = await api.get<DashboardApiResponse>("/api/v1/dashboard/retailer");
  return response.data;
};

export default {
  getRetailerDashboardApi,
};
