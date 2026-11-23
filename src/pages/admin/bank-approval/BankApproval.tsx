import { useState, useEffect, useCallback } from "react";
import { showToast } from "../../../utils/toast";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  getAllBankRequests,
  approveBank,
  rejectBank,
  type BankRequestItem,
  type BankApprovalStatus,
} from "../../../services/api/retailer/retailerProfileApi";

type FilterStatus = "all" | "pending" | "rejected" | "approved";

const STATUS_LABEL: Record<FilterStatus, string> = {
  all: "All Requests",
  pending: "Pending",
  rejected: "Rejected",
  approved: "Approved",
};

const LIMIT = 20;

export default function BankApproval() {
  const [requests, setRequests] = useState<BankRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<{
    open: boolean;
    bank: BankRequestItem | null;
  }>({ open: false, bank: null });
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: LIMIT,
    totalPages: 1,
  });

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce the search term; when it changes, jump back to the first page.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchBankRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllBankRequests({
        page,
        limit: LIMIT,
        status: filterStatus,
        search: debouncedSearch,
      });
      if (res?.data) {
        setRequests(res.data);
        if (res.meta) setMeta(res.meta as typeof meta);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch bank approval requests:", err);
      showToast("error", err, "Failed to load bank approval requests");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, debouncedSearch]);

  // Refetch whenever the page, status filter, or (debounced) search changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchBankRequests();
  }, [fetchBankRequests]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    setPage(1);
  };

  const handleApprove = async (bank: BankRequestItem) => {
    if (approvingId) return;

    try {
      setApprovingId(bank.bankId);
      await approveBank(bank.retailerId, bank.bankId);
      showToast("success", "Bank account approved successfully");
      await fetchBankRequests();
    } catch (err: unknown) {
      console.error("Failed to approve bank:", err);
      showToast("error", err, "Failed to approve bank account");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!showRejectModal.bank || !rejectionReason.trim() || rejectingId) return;

    try {
      setRejectingId(showRejectModal.bank.bankId);
      await rejectBank(
        showRejectModal.bank.retailerId,
        showRejectModal.bank.bankId,
        rejectionReason.trim()
      );
      showToast("success", "Bank account rejected successfully");
      setShowRejectModal({ open: false, bank: null });
      setRejectionReason("");
      await fetchBankRequests();
    } catch (err: unknown) {
      console.error("Failed to reject bank:", err);
      showToast("error", err, "Failed to reject bank account");
    } finally {
      setRejectingId(null);
    }
  };

  const openRejectModal = (bank: BankRequestItem) => {
    setShowRejectModal({ open: true, bank });
    setRejectionReason("");
  };

  const getStatusBadge = (status: BankApprovalStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bank Account Approvals</h1>
          <p className="mt-1 text-xs text-slate-500">
            Review all retailer bank account requests and their approval status
          </p>
        </div>
        <button
          type="button"
          onClick={fetchBankRequests}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{meta.total}</p>
              <p className="text-xs text-slate-600">{STATUS_LABEL[filterStatus]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "pending", "rejected", "approved"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleFilterChange(s)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                filterStatus === s
                  ? "bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white shadow-lg shadow-[#7c3aed]/30"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-[#7c3aed] hover:text-[#7c3aed]"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search retailer, mobile, bank..."
            className="w-full sm:w-72 rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 transition"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && requests.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-bold text-slate-900">No Bank Requests Found</h3>
          <p className="mt-2 text-xs text-slate-500">
            No bank account requests match the current filter
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((bank) => (
            <div
              key={`${bank.source}-${bank.bankId}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                {/* Bank Details */}
                <div className="flex-1 space-y-3">
                  {/* Retailer Info + Status */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-[#7c3aed]">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{bank.retailerName}</p>
                        <p className="text-xs text-slate-500">
                          {bank.retailerMobile} • {bank.retailerEmail}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(bank.approvalStatus)}
                  </div>

                  {/* Bank Info */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">
                        Bank Name
                      </p>
                      <p className="text-sm font-bold text-slate-900">{bank.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">
                        Branch
                      </p>
                      <p className="text-sm text-slate-700">{bank.branchName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">
                        Account Number
                      </p>
                      <p className="font-mono text-sm font-bold text-slate-900">
                        {bank.accountNumber
                          ? `•••• •••• ${bank.accountNumber.slice(-4)}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">
                        IFSC Code
                      </p>
                      <p className="font-mono text-sm font-bold text-slate-900">
                        {bank.ifscCode}
                      </p>
                    </div>
                  </div>

                  {bank.isPrimary && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Primary Settlement Account</span>
                    </div>
                  )}

                  {bank.approvalStatus === "rejected" && bank.rejectionReason && (
                    <div className="rounded-lg bg-rose-50 p-3 border border-rose-200">
                      <p className="text-[11px] font-semibold text-rose-800">Rejection Reason:</p>
                      <p className="text-xs text-rose-700 mt-0.5">{bank.rejectionReason}</p>
                    </div>
                  )}

                  {bank.approvalStatus === "approved" && (
                    <p className="text-xs text-emerald-700 font-medium">
                      This bank account is approved and active for settlements.
                    </p>
                  )}

                  {bank.submittedAt && (
                    <p className="text-[11px] text-slate-400">
                      Submitted on {new Date(bank.submittedAt).toLocaleString("en-GB")}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 lg:ml-4">
                  {bank.approvalStatus === "pending" && (
                    <>
                      <button
                        type="button"
                        disabled={approvingId === bank.bankId || rejectingId === bank.bankId}
                        onClick={() => handleApprove(bank)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        {approvingId === bank.bankId ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Approving...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Approve</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={approvingId === bank.bankId || rejectingId === bank.bankId}
                        onClick={() => openRejectModal(bank)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                      >
                        {rejectingId === bank.bankId ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Rejecting...</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            <span>Reject</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-slate-600">
            Page {page} of {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={page === meta.totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal.open && showRejectModal.bank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">Reject Bank Account</h3>
              <p className="mt-1 text-xs text-slate-500">
                Please provide a reason for rejecting this bank account
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal({ open: false, bank: null });
                  setRejectionReason("");
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || !!rejectingId}
                onClick={handleReject}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {rejectingId ? (
                  <>
                    <Loader2 className="inline h-4 w-4 animate-spin mr-1" />
                    Rejecting...
                  </>
                ) : (
                  "Reject Bank Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
