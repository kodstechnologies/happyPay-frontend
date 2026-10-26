export interface DashboardStats {
  totalRetailers: number;
  totalDistributors: number;
  pendingKyc: number;
  approvedRetailers: number;
  suspendedRetailers: number;
  totalAepsTransactions: number;
  totalDmtTransactions: number;
  totalCmsTransactions: number;
  totalCommission: number;
}

export interface RecentRetailer {
  id: string;
  name: string;
  mobile: string;
  kycStatus: "Approved" | "Pending" | "Rejected";
  registrationDate: string;
}

export interface RecentTransaction {
  id: string;
  retailer: string;
  service: "AEPS" | "DMT" | "CMS" | string;
  amount: number;
  status: "Success" | "Pending" | "Failed";
  date: string;
}

export interface EarningsOverview {
  aeps: number;
  dmt: number;
  cms: number;
  total: number;
}

export interface KycOverviewItem {
  label: string;
  value: number;
  color: string;
}

export interface AdminDashboardData {
  stats: DashboardStats;
  earningsOverview: EarningsOverview;
  kycOverview: KycOverviewItem[];
  transactionTrend: number[];
  recentTransactions: RecentTransaction[];
}

export interface AdminDashboardApiResponse {
  success: boolean;
  statusCode?: number;
  message: string;
  data: AdminDashboardData;
}
