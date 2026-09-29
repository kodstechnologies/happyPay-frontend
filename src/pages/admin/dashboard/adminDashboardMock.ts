import type { DashboardStats, RecentRetailer, RecentTransaction } from "../../../types/admin/dashboard";
import { DUMMY_RETAILERS } from "../retailers/mockRetailers";
import { DUMMY_TRANSACTIONS } from "../transactions/mockTransactions";

const totalRetailers = DUMMY_RETAILERS.filter(r => r.role === "retailer").length;
const totalDistributors = DUMMY_RETAILERS.filter(r => r.role === "distributor").length;
const pendingKyc = DUMMY_RETAILERS.filter(r => r.kycStatus === "pending").length;
const approvedRetailers = DUMMY_RETAILERS.filter(r => r.kycStatus === "approved").length;
const rejectedRetailers = DUMMY_RETAILERS.filter(r => r.kycStatus === "rejected").length;
const suspendedRetailers = DUMMY_RETAILERS.filter(r => r.status === "suspended").length;

const totalAepsTransactions = DUMMY_TRANSACTIONS.filter(t => t.type.includes("AEPS") || t.type.includes("Aadhar")).length;
const totalDmtTransactions = DUMMY_TRANSACTIONS.filter(t => t.type.includes("DMT")).length;
const totalCmsTransactions = DUMMY_TRANSACTIONS.filter(t => t.type.includes("CMS") || t.type.includes("BBPS") || t.type.includes("UPI")).length;

const getEarnings = (typeMatch: string[]) => DUMMY_TRANSACTIONS.filter(t => typeMatch.some(m => t.type.includes(m))).reduce((acc, t) => {
  const comm = parseFloat(t.commission.replace("₹", ""));
  return acc + (isNaN(comm) ? 0 : comm);
}, 0);

const aepsEarnings = getEarnings(["AEPS", "Aadhar"]);
const dmtEarnings = getEarnings(["DMT"]);
const cmsEarnings = getEarnings(["CMS", "BBPS", "UPI"]);
const totalCommission = aepsEarnings + dmtEarnings + cmsEarnings;

export const dashboardStats: DashboardStats = {
  totalRetailers,
  totalDistributors,
  pendingKyc,
  approvedRetailers,
  suspendedRetailers,
  totalAepsTransactions,
  totalDmtTransactions,
  totalCmsTransactions,
  totalCommission,
};

export { rejectedRetailers };

export const kycOverview = [
  { label: "Pending KYC", value: dashboardStats.pendingKyc, color: "#e59a20" },
  { label: "Approved", value: dashboardStats.approvedRetailers, color: "#20a873" },
  { label: "Rejected", value: rejectedRetailers, color: "#e05252" },
  { label: "Suspended", value: dashboardStats.suspendedRetailers, color: "#64748b" },
];

export const recentRetailers: RecentRetailer[] = DUMMY_RETAILERS.slice(0, 5).map((r) => {
  const kycStatus = r.kycStatus ?? "pending";
  const formattedKycStatus =
    (kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)) as
      | "Approved"
      | "Rejected"
      | "Pending";

  return {
    id: r.id,
    name: r.shop?.name || r.fullName || "Unknown",
    mobile: r.mobile || "-",
    kycStatus: formattedKycStatus,
    registrationDate: new Date(r.createdAt ?? Date.now()).toLocaleDateString(
      "en-GB",
      { day: "numeric", month: "short", year: "numeric" }
    ),
  };
});

export const recentTransactions: RecentTransaction[] = DUMMY_TRANSACTIONS.slice(0, 5).map(t => ({
  id: t.id,
  retailer: t.name,
  service: (t.type.includes("AEPS") || t.type.includes("Aadhar")) ? "AEPS" : (t.type.includes("CMS") || t.type.includes("BBPS") || t.type.includes("UPI")) ? "CMS" : "DMT",
  amount: parseFloat(t.commission.replace("₹", "")) * 200,
  status: t.flow === "Credit" ? "Success" : "Pending",
  date: t.date,
}));

export const transactionTrend = [42, 58, 48, 74, 66, 91, 84, 108, 96, 122, 116, 138];

export const earningsOverview = { aeps: aepsEarnings, dmt: dmtEarnings, cms: cmsEarnings, total: totalCommission };

export const customerOverview = { total: 4820, aeps: 2940, dmt: 1880 };

export const cmsSummary = { companies: 8, productLines: 24, commission: "Configured", limits: "Configured" };

export const recentAdminActivity = [
  { admin: "Super Admin", action: "KYC Approved", entity: "RET-10481", date: "22 Sep, 11:30 AM" },
  { admin: "Super Admin", action: "Limit Changed", entity: "CMS / Daily Cap", date: "21 Sep, 05:12 PM" },
  { admin: "Operations Admin", action: "Retailer Suspended", entity: "RET-10462", date: "21 Sep, 03:48 PM" },
];
