import { useState, useEffect, useCallback, useId } from "react";
import {
  Activity,
  Search,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  getTransactionsApi,
  type TransactionItem,
  type PaginationInfo,
} from "../../apis/transaction.apis";




// Retailer-visible service options (Excludes: PAYOUT, MANUAL, COMMISSION)
const SERVICE_OPTIONS = [
  { label: "All Services", value: "ALL" },
  { label: "AEPS", value: "AEPS" },
  { label: "DMT", value: "DMT" },
  { label: "BBPS", value: "BBPS" },
  { label: "CMS", value: "CMS" },
  { label: "UPI Cash Point", value: "UPI" },
  { label: "Wallet Topup", value: "RAZORPAY" },
] as const;

const TYPE_OPTIONS = [
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

const formatAmount = (amount: number) =>
  amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (isoString?: string) => {
  if (!isoString) return { date: "—", time: "" };
  try {
    const d = new Date(isoString);
    return {
      date: d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  } catch {
    return { date: isoString, time: "" };
  }
};

export default function Transactions() {
  const searchInputId = useId();
  const dateInputId = useId();
  const serviceSelectId = useId();
  const typeSelectId = useId();
  const statusSelectId = useId();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filter States
  const [selectedService, setSelectedService] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const isDebouncing = search !== debouncedSearch;

  // UI States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [selectedTxn, setSelectedTxn] = useState<TransactionItem | null>(null);

  // Debounce search input with 500ms delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Fetch transactions by page (for pagination & manual refresh)
  const fetchPage = useCallback(
    async (pageToFetch: number) => {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const response = await getTransactionsApi({
          page: pageToFetch,
          limit: pagination.limit,
          service: selectedService,
          type: selectedType,
          status: selectedStatus,
          search: debouncedSearch,
          startDate: dateFilter || undefined,
          endDate: dateFilter || undefined,
        });

        if (response && response.success && response.data) {
          setTransactions(response.data.transactions || []);
          setPagination(
            response.data.pagination || {
              total: 0,
              page: pageToFetch,
              limit: pagination.limit,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            }
          );
        } else {
          setErrorMsg(response?.message || "Failed to load transactions.");
        }
      } catch (err: unknown) {
        console.error("Error fetching transactions:", err);
        const axiosErr = err as { response?: { data?: { message?: string; errors?: string[] } } };
        const backendErr = axiosErr?.response?.data;
        setErrorMsg(
          backendErr?.message ||
            (Array.isArray(backendErr?.errors) ? backendErr.errors.join(", ") : "") ||
            "Unable to load transactions. Please verify your connection."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      pagination.limit,
      selectedService,
      selectedType,
      selectedStatus,
      debouncedSearch,
      dateFilter,
    ]
  );

  // Re-fetch automatically when filters change
  useEffect(() => {
    let isMounted = true;

    const loadInitialPage = async () => {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const response = await getTransactionsApi({
          page: 1,
          limit: pagination.limit,
          service: selectedService,
          type: selectedType,
          status: selectedStatus,
          search: debouncedSearch,
          startDate: dateFilter || undefined,
          endDate: dateFilter || undefined,
        });

        if (isMounted) {
          if (response && response.success && response.data) {
            setTransactions(response.data.transactions || []);
            setPagination(
              response.data.pagination || {
                total: 0,
                page: 1,
                limit: pagination.limit,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false,
              }
            );
          } else {
            setErrorMsg(response?.message || "Failed to load transactions.");
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error("Error fetching transactions:", err);
          const axiosErr = err as { response?: { data?: { message?: string; errors?: string[] } } };
          const backendErr = axiosErr?.response?.data;
          setErrorMsg(
            backendErr?.message ||
              (Array.isArray(backendErr?.errors) ? backendErr.errors.join(", ") : "") ||
              "Unable to load transactions. Please verify your connection."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialPage();

    return () => {
      isMounted = false;
    };
  }, [
    pagination.limit,
    selectedService,
    selectedType,
    selectedStatus,
    debouncedSearch,
    dateFilter,
  ]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.page) {
      fetchPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit }));
  };

  const clearAllFilters = () => {
    setSelectedService("ALL");
    setSelectedType("ALL");
    setSelectedStatus("ALL");
    setDateFilter("");
    setSearch("");
  };

  const hasActiveFilters =
    selectedService !== "ALL" ||
    selectedType !== "ALL" ||
    selectedStatus !== "ALL" ||
    dateFilter !== "" ||
    search !== "";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
            History & Records
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter, and review all your wallet and service transactions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchPage(pagination.page)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-[#7c3aed] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-[#7c3aed]" : ""}`} />
          {isLoading ? "Syncing..." : "Refresh"}
        </button>
      </section>

      {/* Main Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Filter Controls Bar */}
        <div className="border-b border-slate-100 p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#7c3aed]" />
              <h2 className="text-base font-bold text-slate-900">
                Transaction Records
              </h2>
              {pagination.total > 0 && (
                <span className="rounded-full bg-[#f8f5ff] px-2.5 py-0.5 text-xs font-bold text-[#7c3aed]">
                  {pagination.total}
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-bold text-[#7c3aed] hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id={searchInputId}
                type="text"
                placeholder="Search reference, payee..."
                value={search}
                aria-label="Search reference, payee"
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs outline-none focus:border-[#7c3aed] focus:bg-white transition"
              />
              {isDebouncing ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-[#7c3aed]" />
              ) : search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            {/* Date Filter */}
            <div>
              <input
                id={dateInputId}
                type="date"
                value={dateFilter}
                aria-label="Filter by date"
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none focus:border-[#7c3aed] focus:bg-white transition"
              />
            </div>

            {/* Service Filter (Excluded: PAYOUT, MANUAL, COMMISSION) */}
            <div>
              <select
                id={serviceSelectId}
                value={selectedService}
                aria-label="Filter by service"
                onChange={(e) => setSelectedService(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus:border-[#7c3aed] focus:bg-white transition"
              >
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter (Credit / Debit) */}
            <div>
              <select
                id={typeSelectId}
                value={selectedType}
                aria-label="Filter by flow type"
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus:border-[#7c3aed] focus:bg-white transition"
              >
                {TYPE_OPTIONS.map((opt) => (
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
                value={selectedStatus}
                aria-label="Filter by status"
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus:border-[#7c3aed] focus:bg-white transition"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {errorMsg && (
          <div className="m-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchPage(pagination.page)}
              className="font-bold underline hover:text-rose-950"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="divide-y divide-slate-100 p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-48 animate-pulse rounded bg-slate-50" />
                </div>
                <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                <div className="h-7 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <Filter className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Transactions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {hasActiveFilters
                ? "No records match the current filter criteria. Try adjusting or clearing filters."
                : "No transactions have been recorded in your wallet yet."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-2 inline-flex items-center rounded-xl bg-[#7c3aed] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#6d28d9]"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          /* Transactions Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Transaction ID</th>
                  <th className="px-5 py-3 font-semibold">Service</th>
                  <th className="px-5 py-3 font-semibold">Description / Payee</th>
                  <th className="px-5 py-3 font-semibold">Flow</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Date & Time</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isCredit = String(tx.type).toLowerCase() === "credit";
                  const { date, time } = formatDate(tx.createdAt);
                  const statusLower = String(tx.status || "").toLowerCase();

                  return (
                    <tr
                      key={tx._id}
                      className="text-slate-600 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Transaction ID */}
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-[#7c3aed]">
                          {tx.transactionId || tx.referenceKey || tx.referenceId || tx._id.slice(-8).toUpperCase()}
                        </span>
                       
                      </td>

                      {/* Service Badge */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-lg bg-[#f8f5ff] px-2.5 py-1 text-[11px] font-bold text-[#7c3aed] border border-[#ede7fc]">
                          {tx.service}
                        </span>
                      </td>

                      {/* Description & Payee details */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {tx.description || `${tx.service} Transaction`}
                        </p>
                        {tx.payee?.accountHolderName && (
                          <p className="text-[11px] text-slate-400">
                            {tx.payee.accountHolderName} • {tx.payee.bankName || tx.payee.accountNumber}
                          </p>
                        )}
                      </td>

                      {/* Flow Type */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isCredit
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {tx.type}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4">
                        <span
                          className={`text-sm font-bold ${
                            isCredit ? "text-emerald-600" : "text-slate-900"
                          }`}
                        >
                          {isCredit ? "+" : "-"}₹{formatAmount(tx.amount || 0)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            statusLower === "success"
                              ? "bg-[#e5f7ee] text-[#087f5b] border border-emerald-200"
                              : statusLower === "pending"
                              ? "bg-[#fff2df] text-[#c56b08] border border-amber-200"
                              : "bg-[#ffe6ea] text-[#c21d3d] border border-rose-200"
                          }`}
                        >
                          {statusLower === "success" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : statusLower === "pending" ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {tx.status}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="px-5 py-4 text-slate-700 font-medium">
                        {date} <span className="text-slate-400 text-[11px]">{time}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTxn(tx)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-[#7c3aed] hover:text-white hover:border-[#7c3aed]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                Showing{" "}
                <strong className="font-semibold text-slate-800">
                  {(pagination.page - 1) * pagination.limit + 1}
                </strong>{" "}
                to{" "}
                <strong className="font-semibold text-slate-800">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </strong>{" "}
                of{" "}
                <strong className="font-semibold text-slate-800">
                  {pagination.total}
                </strong>{" "}
                records
              </span>

              <div className="hidden sm:flex items-center gap-1.5 border-l border-slate-200 pl-3">
                <span>Per page:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs outline-none focus:border-[#7c3aed]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1 px-2 text-xs font-bold text-slate-700">
                <span>Page {pagination.page}</span>
                <span className="text-slate-400">/</span>
                <span>{pagination.totalPages || 1}</span>
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* DETAILED RECEIPT MODAL */}
      {selectedTxn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 overflow-y-auto backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setSelectedTxn(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition"
              aria-label="Close receipt modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Receipt Header */}
            <div className="flex flex-col items-center border-b border-slate-100 pb-5 pt-2">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full mb-3 ${
                  String(selectedTxn.status).toLowerCase() === "success"
                    ? "bg-emerald-50 text-emerald-600"
                    : String(selectedTxn.status).toLowerCase() === "pending"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {String(selectedTxn.status).toLowerCase() === "success" ? (
                  <CheckCircle2 className="h-7 w-7" />
                ) : String(selectedTxn.status).toLowerCase() === "pending" ? (
                  <Clock className="h-7 w-7" />
                ) : (
                  <XCircle className="h-7 w-7" />
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {selectedTxn.description || `${selectedTxn.service} Transaction`}
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {formatDate(selectedTxn.createdAt).date} at{" "}
                {formatDate(selectedTxn.createdAt).time}
              </p>
              <h3
                className={`mt-3 text-3xl font-black ${
                  String(selectedTxn.type).toLowerCase() === "credit"
                    ? "text-emerald-600"
                    : "text-slate-900"
                }`}
              >
                {String(selectedTxn.type).toLowerCase() === "credit" ? "+" : "-"}₹
                {formatAmount(selectedTxn.amount || 0)}
              </h3>
            </div>

            {/* Receipt Body */}
            <div className="mt-5 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedTxn.transactionId || selectedTxn._id}
                </span>
              </div>

              {(selectedTxn?.payee?.bankName|| selectedTxn?.payee?.aadharNumber|| selectedTxn?.payee?.accountNumber|| selectedTxn?.payee?.ifscCode
              ) && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Bank Name</span>
                  <span className="font-mono font-bold text-slate-700">
                    {selectedTxn.payee.bankName}
                  </span>
                </div>
              )}

            {(selectedTxn?.payee?.aadharNumber
              ) && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Aadhar Number</span>
                  <span className="font-mono font-bold text-slate-700">
                    {selectedTxn.payee.aadharNumber}
                  </span>
                </div>
              )}

              {( selectedTxn?.payee?.accountNumber
              ) && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Account Number</span>
                  <span className="font-mono font-bold text-slate-700">
                    {selectedTxn.payee.accountNumber}
                  </span>
                </div>
              )}

              {( selectedTxn?.payee?.ifscCode
              ) && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">IFSC Code</span>
                  <span className="font-mono font-bold text-slate-700">
                    {selectedTxn.payee.ifscCode}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Service</span>
                <span className="font-bold text-[#7c3aed]">{selectedTxn.service}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Flow Type</span>
                <span
                  className={`font-bold uppercase ${
                    String(selectedTxn.type).toLowerCase() === "credit"
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {selectedTxn.type}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Status</span>
                <span
                  className={`font-bold uppercase ${
                    String(selectedTxn.status).toLowerCase() === "success"
                      ? "text-emerald-600"
                      : String(selectedTxn.status).toLowerCase() === "pending"
                      ? "text-amber-600"
                      : "text-rose-600"
                  }`}
                >
                  {selectedTxn.status}
                </span>
              </div>

              {selectedTxn.balanceBefore !== undefined && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Wallet Balance Before</span>
                  <span className="font-semibold text-slate-700">
                    ₹{formatAmount(selectedTxn.balanceBefore)}
                  </span>
                </div>
              )}

              {selectedTxn.balanceAfter !== undefined && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Wallet Balance After</span>
                  <span className="font-bold text-slate-900">
                    ₹{formatAmount(selectedTxn.balanceAfter)}
                  </span>
                </div>
              )}

              {selectedTxn.commissionEarned ? (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Commission Earned</span>
                  <span className="font-bold text-emerald-600">
                    +₹{formatAmount(selectedTxn.commissionEarned)}
                  </span>
                </div>
              ) : null}

              {selectedTxn.payee?.accountHolderName && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Beneficiary / Payee</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {selectedTxn.payee.accountHolderName}
                    {selectedTxn.payee.accountNumber && (
                      <span className="block text-slate-400 font-mono">
                        A/C: {selectedTxn.payee.accountNumber}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Print Action */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-[#7c3aed]"
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="flex items-center justify-center rounded-xl bg-[#7c3aed] px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#6d28d9]"
              >
                Close
              </button>
            </div>

            {/* Security Badge */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Verified & Secured by HappyPay Core Banking
            </div>
          </div>
        </div>
      )}
    </div>
  );
}