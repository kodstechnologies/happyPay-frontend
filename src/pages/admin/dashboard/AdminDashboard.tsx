import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileClock,
  FileText,
  Filter,
  LayoutGrid,
  Network,
  RefreshCw,
  ShieldAlert,
  Store,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAdminDashboard } from "../../../apis/adminDashboard.apis";
import type { AdminDashboardData } from "../../../types/admin/dashboard";

const money = (value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const statusClass: Record<string, string> = {
  Approved: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Rejected: "bg-rose-50 text-rose-700",
  Suspended: "bg-slate-100 text-slate-600",
  Success: "bg-emerald-50 text-emerald-700",
  Failed: "bg-rose-50 text-rose-700",
};

function SectionHeader({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#315bd1] hover:text-[#274dbd]"
        >
          {action}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

const defaultStats = {
  totalRetailers: 0,
  totalDistributors: 0,
  pendingKyc: 0,
  approvedRetailers: 0,
  suspendedRetailers: 0,
  totalAepsTransactions: 0,
  totalDmtTransactions: 0,
  totalCmsTransactions: 0,
  totalCommission: 0,
};

const defaultEarnings = {
  aeps: 0,
  dmt: 0,
  cms: 0,
  total: 0,
};

const defaultKycOverview = [
  { label: "Pending KYC", value: 0, color: "#e59a20" },
  { label: "Approved", value: 0, color: "#20a873" },
  { label: "Rejected", value: 0, color: "#e05252" },
  { label: "Suspended", value: 0, color: "#64748b" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchDashboard = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await getAdminDashboard();
      setData(response);
    } catch (err: unknown) {
      console.error("Failed to load admin dashboard data:", err);
      setError("Unable to load live dashboard metrics. Please check connection and try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getAdminDashboard()
      .then((response) => {
        if (isMounted) {
          setData(response);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          console.error("Failed to load admin dashboard data:", err);
          setError("Unable to load live dashboard metrics. Please check connection and try again.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = data?.stats ?? defaultStats;
  const earnings = data?.earningsOverview ?? defaultEarnings;
  const kycOverview = data?.kycOverview ?? defaultKycOverview;
  const transactionTrend =
    data?.transactionTrend && data.transactionTrend.length > 0
      ? data.transactionTrend
      : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const recentTransactions = data?.recentTransactions ?? [];

  const maxTrend = Math.max(...transactionTrend, 1);
  const totalKyc = kycOverview.reduce((sum, item) => sum + item.value, 0);

  const statCards = [
    { label: "Total Retailers", value: stats.totalRetailers, detail: "All registered retailers", icon: Store, tone: "bg-[#eef2ff] text-[#315bd1]", to: "/admin/retailers" },
    { label: "Total Distributors", value: stats.totalDistributors, detail: "Network distributors", icon: Network, tone: "bg-purple-50 text-purple-600", to: "/admin/retailers" },
    { label: "Pending KYC", value: stats.pendingKyc, detail: "Awaiting admin review", icon: Clock3, tone: "bg-amber-50 text-amber-600", to: "/admin/retailers" },
    { label: "Approved", value: stats.approvedRetailers, detail: "Approved retailers", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600", to: "/admin/retailers" },
    { label: "Suspended", value: stats.suspendedRetailers, detail: "Currently suspended", icon: ShieldAlert, tone: "bg-slate-100 text-slate-600", to: "/admin/retailers" },
  ];

  const serviceTotals = [
    { label: "AEPS", value: stats.totalAepsTransactions, color: "bg-[#315bd1]" },
    { label: "DMT", value: stats.totalDmtTransactions, color: "bg-[#20a873]" },
    { label: "CMS", value: stats.totalCmsTransactions, color: "bg-[#e59a20]" },
  ];

  const conicGradientStyle =
    totalKyc > 0
      ? {
          background: `conic-gradient(${kycOverview
            .map(
              (item, index) =>
                `${item.color} ${(kycOverview.slice(0, index).reduce((sum, entry) => sum + entry.value, 0) / totalKyc) * 360}deg ${(kycOverview.slice(0, index + 1).reduce((sum, entry) => sum + entry.value, 0) / totalKyc) * 360}deg`
            )
            .join(", ")})`,
        }
      : {
          background: "#e2e8f0",
        };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      {/* Page Header */}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#315bd1]">Overview</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, Admin. Monitor retailers, KYC status, transactions and platform activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchDashboard(true)}
            disabled={isRefreshing || loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            title="Refresh live metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#315bd1] ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
            <Activity className="h-4 w-4 text-emerald-500" />
            Platform activity live
          </div>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs font-semibold text-rose-700">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboard()}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top 5 Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => navigate(card.to)}
              className="hp-card group rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-[#315bd1]/30"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-[#315bd1]" />
              </div>
              <p className="mt-5 text-xs font-semibold text-slate-500">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? "..." : card.value.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-slate-400">{card.detail}</p>
            </button>
          );
        })}
      </section>

      {/* Quick Actions */}
      <section className="hp-card rounded-2xl p-5">
        <SectionHeader title="Quick Actions" description="Jump to common administration workflows" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Review Pending KYC", icon: ShieldAlert, to: "/admin/retailers" },
            { label: "View Retailers", icon: Store, to: "/admin/retailers" },
            { label: "View Transactions", icon: FileText, to: "/admin/transactions" },
            { label: "View Audit Logs", icon: FileClock, to: "/admin/audit-logs" },
            { label: "Manage CMS", icon: LayoutGrid, to: "/admin/cms/companies" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.to)}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-xs font-bold text-slate-700 hover:border-[#315bd1]/30 hover:bg-[#f8faff]"
              >
                <Icon className="h-4 w-4 text-[#315bd1]" />
                {action.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Transactions & Earnings Overview */}
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="hp-card overflow-hidden rounded-2xl">
          <div className="p-5 pb-3">
            <SectionHeader
              title="Recent Transactions"
              description="Latest AEPS, DMT and CMS activity"
              action="View Transactions"
              onAction={() => navigate("/admin/transactions")}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="hp-table">
              <thead className="border-y border-slate-100 bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th>Transaction ID</th>
                  <th>Retailer</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date / Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      Loading latest transactions...
                    </td>
                  </tr>
                ) : recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No platform transactions found.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <span className="font-semibold text-[#315bd1]">{transaction.id}</span>
                      </td>
                      <td className="font-semibold text-slate-800">{transaction.retailer}</td>
                      <td>{transaction.service}</td>
                      <td className="font-semibold text-slate-800">{money(transaction.amount)}</td>
                      <td>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            statusClass[transaction.status] || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td>{transaction.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="hp-card rounded-2xl p-5">
          <SectionHeader title="Earnings Overview" description="Retailer earnings by service" />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#eef2ff] p-4">
              <p className="text-xs font-semibold text-slate-500">AEPS Earnings</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {loading ? "..." : money(earnings.aeps)}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-slate-500">DMT Earnings</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {loading ? "..." : money(earnings.dmt)}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs font-semibold text-slate-500">CMS Earnings</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {loading ? "..." : money(earnings.cms)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-900 p-4 text-white">
              <p className="text-xs font-semibold text-slate-300">Total Earnings</p>
              <p className="mt-2 text-lg font-bold">
                {loading ? "..." : money(earnings.total)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KYC Status Overview & Transaction Overview */}
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="hp-card rounded-2xl p-5">
          <SectionHeader
            title="KYC Status Overview"
            description="Current retailer registration status"
            action="View Retailers"
            onAction={() => navigate("/admin/retailers")}
          />
          <div className="grid items-center gap-6 sm:grid-cols-[180px_1fr]">
            <div
              className="mx-auto flex h-44 w-44 items-center justify-center rounded-full transition-all"
              style={conicGradientStyle}
            >
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-xs">
                <span className="text-2xl font-bold text-slate-900">
                  {loading ? "..." : totalKyc.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-slate-400">retailers</span>
              </div>
            </div>
            <div className="space-y-3">
              {kycOverview.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="font-bold text-slate-900">
                    {loading ? "..." : item.value.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hp-card rounded-2xl p-5">
          <SectionHeader title="Transaction Overview" description="Volume by service over the latest period" />
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
            >
              <Filter className="h-3.5 w-3.5" />
              Date range
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
            >
              All services
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
            >
              All status
            </button>
          </div>
          <div className="flex h-40 items-end gap-2 border-b border-l border-slate-100 px-3 pb-0 pt-4">
            {transactionTrend.map((value, index) => (
              <div key={`${value}-${index}`} className="group flex h-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-[#dbe4ff] transition group-hover:bg-[#315bd1]"
                  style={{ height: `${Math.max((value / maxTrend) * 100, 4)}%` }}
                  title={`Period ${index + 1}: ${value.toLocaleString("en-IN")} transactions`}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {serviceTotals.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">{item.label}</p>
                  <p className="text-sm font-bold text-slate-900">
                    {loading ? "..." : item.value.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
