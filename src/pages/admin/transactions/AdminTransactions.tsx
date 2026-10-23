import { useState, useEffect, useCallback, useId } from "react";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  X,
  Copy,
  Check,
  Eye,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  XCircle,
  Clock,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import { getAllAdminTransactions } from "../../../apis/adminRetailer.apis";
import type {
  AdminTransaction,
  PaginationMeta,
  TransactionService,
} from "../../../types/admin/retailer";

const SERVICE_OPTIONS: { label: string; value: TransactionService | "ALL" }[] = [
  { label: "All Services", value: "ALL" },
  { label: "AEPS", value: "AEPS" },
  { label: "DMT", value: "DMT" },
  { label: "UPI Cashpoint", value: "UPI" },
  { label: "CMS", value: "CMS" },
  { label: "BBPS", value: "BBPS" },
  { label: "Payout", value: "PAYOUT" },
  { label: "Wallet Topup (Razorpay)", value: "RAZORPAY" },
  { label: "Manual Adjustment", value: "MANUAL" },
  { label: "Commission", value: "COMMISSION" },
];

const FLOW_OPTIONS = [
  { label: "All Flows", value: "ALL" },
  { label: "Credit (+)", value: "credit" },
  { label: "Debit (-)", value: "debit" },
] as const;

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "ALL" },
  { label: "Success", value: "success" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Reversed", value: "reversed" },
] as const;

const formatCurrency = (val?: number) => {
  const num = typeof val === "number" && !Number.isNaN(val) ? val : 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDateTime = (isoString?: string) => {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
};

const getStatusBadge = (status?: string) => {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "success":
      return {
        label: "Success",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle2 className="h-3 w-3 text-emerald-600" />,
      };
    case "pending":
      return {
        label: "Pending",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <Clock className="h-3 w-3 text-amber-600" />,
      };
    case "failed":
      return {
        label: "Failed",
        bg: "bg-rose-50 text-rose-700 border-rose-200",
        icon: <XCircle className="h-3 w-3 text-rose-600" />,
      };
    case "reversed":
      return {
        label: "Reversed",
        bg: "bg-purple-50 text-purple-700 border-purple-200",
        icon: <RefreshCw className="h-3 w-3 text-purple-600" />,
      };
    default:
      return {
        label: status || "Unknown",
        bg: "bg-slate-50 text-slate-700 border-slate-200",
        icon: <HelpCircle className="h-3 w-3 text-slate-500" />,
      };
  }
};

const getServiceBadgeClass = (service?: string) => {
  switch (service) {
    case "AEPS":
      return "bg-blue-50 text-[#315bd1] border-blue-200";
    case "DMT":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "UPI":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "CMS":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "BBPS":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "RAZORPAY":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "PAYOUT":
      return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export default function AdminTransactions() {
  const searchInputId = useId();
  const serviceSelectId = useId();
  const flowSelectId = useId();
  const statusSelectId = useId();
  const dateInputId = useId();

  // Filters State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [service, setService] = useState<TransactionService | "ALL">("ALL");
  const [flow, setFlow] = useState<"credit" | "debit" | "ALL">("ALL");
  const [status, setStatus] = useState<"pending" | "success" | "failed" | "reversed" | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState("");

  // Pagination & Data State
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<AdminTransaction | null>(null);

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch transactions from backend
  const fetchTransactions = useCallback(
    async (pageToFetch: number, isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setErrorMsg("");

      try {
        const response = await getAllAdminTransactions({
          page: pageToFetch,
          limit: pagination.limit,
          service: service !== "ALL" ? service : undefined,
          type: flow !== "ALL" ? flow : undefined,
          status: status !== "ALL" ? status : undefined,
          search: debouncedSearch.trim() || undefined,
          startDate: dateFilter || undefined,
          endDate: dateFilter || undefined,
        });

        if (response) {
          setTransactions(response.transactions || []);
          setPagination(
            response.pagination || {
              total: 0,
              page: pageToFetch,
              limit: pagination.limit,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            }
          );
        } else {
          setTransactions([]);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch admin transactions:", err);
        const errorObj = err as { message?: string };
        setErrorMsg(
          errorObj?.message ||
            "Unable to load transactions from backend. Please verify your connection."
        );
        setTransactions([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [pagination.limit, service, flow, status, debouncedSearch, dateFilter]
  );

  // Trigger query on filter change (resets to page 1)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.page) {
      fetchTransactions(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearAllFilters = () => {
    setSearch("");
    setService("ALL");
    setFlow("ALL");
    setStatus("ALL");
    setDateFilter("");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    service !== "ALL" ||
    flow !== "ALL" ||
    status !== "ALL" ||
    dateFilter !== "";

  return (
    <div className="mx-auto w-full space-y-6">
      {/* ── Page Header ── */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#315bd1]">
            Management
          </p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Transactions
            </h1>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#315bd1] border border-blue-200">
              {pagination.total.toLocaleString("en-IN")} Total
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            View, audit, and filter real-time transactions across all retailers and services.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchTransactions(pagination.page, true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            title="Refresh transaction records"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[#315bd1] ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {/* ── Filters & Search Toolbar ── */}
      <section className="hp-card rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Search Input */}
          <div className="relative lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              id={searchInputId}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, Payee, Description..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#315bd1] focus:bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Service Filter */}
          <div>
            <select
              id={serviceSelectId}
              value={service}
              onChange={(e) => setService(e.target.value as TransactionService | "ALL")}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#315bd1] focus:bg-white"
            >
              {SERVICE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Flow Filter */}
          <div>
            <select
              id={flowSelectId}
              value={flow}
              onChange={(e) => setFlow(e.target.value as "credit" | "debit" | "ALL")}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#315bd1] focus:bg-white"
            >
              {FLOW_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id={statusSelectId}
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "pending" | "success" | "failed" | "reversed" | "ALL")
              }
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#315bd1] focus:bg-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter & Clear */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                id={dateInputId}
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#315bd1] focus:bg-white"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                title="Clear all active filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchTransactions(pagination.page)}
            className="font-bold underline hover:text-rose-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Transactions Table Card ── */}
      <section className="hp-card overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#315bd1]" />
            <h2 className="text-sm font-bold text-slate-900">
              Transaction Records
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Rows per page:</span>
            <select
              value={pagination.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-700 outline-none focus:border-[#315bd1]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="divide-y divide-slate-100 p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#315bd1]">
              <Filter className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Transactions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {hasActiveFilters
                ? "No transaction records match your active search and filter criteria. Try adjusting or clearing filters."
                : "No transactions have been recorded in the platform database yet."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-2 inline-flex items-center rounded-xl bg-[#315bd1] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#2849a8]"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          /* ── Table with Headers Exactly Matching User Image ── */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-bold">TRANSACTION ID</th>
                  <th className="px-5 py-3 font-bold">SERVICE</th>
                  <th className="px-5 py-3 font-bold">DESCRIPTION / PAYEE</th>
                  <th className="px-5 py-3 font-bold">FLOW</th>
                  <th className="px-5 py-3 font-bold">AMOUNT</th>
                  <th className="px-5 py-3 font-bold">COMMISSION</th>
                  <th className="px-5 py-3 font-bold">STATUS</th>
                  <th className="px-5 py-3 font-bold">DATE & TIME</th>
                  <th className="px-5 py-3 font-bold text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const statusInfo = getStatusBadge(tx.status);
                  const isCredit = String(tx.type).toLowerCase() === "credit";
                  const txnId = tx.transactionId || tx._id;
                  const payeeSummary =
                    tx.payee?.accountHolderName ||
                    tx.payee?.bankName ||
                    (tx.payee?.accountNumber ? `A/C: ${tx.payee.accountNumber}` : null) ||
                    tx.description ||
                    "—";

                  return (
                    <tr
                      key={tx._id || tx.transactionId}
                      className="text-slate-600 transition hover:bg-slate-50/60"
                    >
                      {/* 1. TRANSACTION ID */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#315bd1]">
                            {txnId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(txnId)}
                            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Copy Transaction ID"
                          >
                            {copiedId === txnId ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. SERVICE */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-bold uppercase border ${getServiceBadgeClass(
                            tx.service
                          )}`}
                        >
                          {tx.service}
                        </span>
                      </td>

                      {/* 3. DESCRIPTION / PAYEE */}
                      <td className="px-5 py-3.5 max-w-xs truncate">
                        <div>
                          <p className="font-semibold text-slate-800 truncate" title={payeeSummary}>
                            {payeeSummary}
                          </p>
                          {tx.wallet?.user?.fullName && (
                            <p className="text-[10px] text-slate-400">
                              By: {tx.wallet.user.fullName} {tx.wallet.user.mobile ? `(${tx.wallet.user.mobile})` : ""}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 4. FLOW */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                            isCredit
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {isCredit ? "Credit" : "Debit"}
                        </span>
                      </td>

                      {/* 5. AMOUNT */}
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {formatCurrency(tx.amount)}
                      </td>

                      {/* 6. COMMISSION */}
                      <td className="px-5 py-3.5 font-bold text-emerald-600">
                        {formatCurrency(tx.commissionEarned)}
                      </td>

                      {/* 7. STATUS */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize border ${statusInfo.bg}`}
                        >
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* 8. DATE & TIME */}
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {formatDateTime(tx.createdAt)}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedTxn(tx)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-[#315bd1] hover:text-white"
                          title="View Transaction Details"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Footer ── */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={handlePageChange}
              showInfo={true}
            />
          </div>
        )}
      </section>

      {/* ── Transaction Details Modal ── */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="relative w-full overflow-y-auto h-[80vh] max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-slide-in-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase border ${getServiceBadgeClass(
                    selectedTxn.service
                  )}`}
                >
                  {selectedTxn.service}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Transaction Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Status and Amount Card */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Amount
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {formatCurrency(selectedTxn.amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                      getStatusBadge(selectedTxn.status).bg
                    }`}
                  >
                    {getStatusBadge(selectedTxn.status).icon}
                    {getStatusBadge(selectedTxn.status).label}
                  </span>
                </div>
              </div>

              {/* Grid of properties */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-100 bg-white p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Transaction ID</p>
                  <p className="mt-1 font-mono font-bold text-slate-800 break-all">
                    {selectedTxn.transactionId || selectedTxn._id}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Flow</p>
                  <p className="mt-1 font-bold text-slate-800 uppercase">
                    {selectedTxn.type}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Commission Earned</p>
                  <p className="mt-1 font-bold text-emerald-600">
                    {formatCurrency(selectedTxn.commissionEarned)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Date & Time</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {formatDateTime(selectedTxn.createdAt)}
                  </p>
                </div>

                {selectedTxn.balanceBefore !== undefined && (
                  <div className="rounded-xl border border-slate-100 bg-white p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Balance Before</p>
                    <p className="mt-1 font-bold text-slate-800">
                      {formatCurrency(selectedTxn.balanceBefore)}
                    </p>
                  </div>
                )}

                {selectedTxn.balanceAfter !== undefined && (
                  <div className="rounded-xl border border-slate-100 bg-white p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Balance After</p>
                    <p className="mt-1 font-bold text-slate-800">
                      {formatCurrency(selectedTxn.balanceAfter)}
                    </p>
                  </div>
                )}

                {selectedTxn.wallet?.user?.fullName && (
                  <div className="col-span-2 rounded-xl border border-slate-100 bg-white p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Retailer</p>
                    <p className="mt-1 font-bold text-slate-800">
                      {selectedTxn.wallet.user.fullName}{" "}
                      {selectedTxn.wallet.user.mobile && (
                        <span className="font-normal text-slate-500">
                          ({selectedTxn.wallet.user.mobile})
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {selectedTxn.payee && (
                  <div className="col-span-2 rounded-xl border border-slate-100 bg-white p-3 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Payee / Beneficiary</p>
                    {selectedTxn.payee.accountHolderName && (
                      <p className="font-bold text-slate-800">
                        {selectedTxn.payee.accountHolderName}
                      </p>
                    )}
                    {selectedTxn.payee.bankName && (
                      <p className="text-slate-600">Bank: {selectedTxn.payee.bankName}</p>
                    )}
                    {selectedTxn.payee.accountNumber && (
                      <p className="font-mono text-slate-600">A/C: {selectedTxn.payee.accountNumber}</p>
                    )}
                    {selectedTxn.payee.ifscCode && (
                      <p className="font-mono text-slate-600">IFSC: {selectedTxn.payee.ifscCode}</p>
                    )}
                  </div>
                )}

                {selectedTxn.description && (
                  <div className="col-span-2 rounded-xl border border-slate-100 bg-white p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Description</p>
                    <p className="mt-1 text-slate-700 leading-relaxed">
                      {selectedTxn.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
