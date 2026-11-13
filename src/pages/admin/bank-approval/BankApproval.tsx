/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from "react";
import { showToast } from "../../../utils/toast";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  getPendingBanks,
  approveBank,
  rejectBank,
  type PendingBankItem,
} from "../../../services/api/retailer/retailerProfileApi";

export default function BankApproval() {
  const [pendingBanks, setPendingBanks] = useState<PendingBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<{
    open: boolean;
    bank: PendingBankItem | null;
  }>({ open: false, bank: null });
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const fetchPendingBanks = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await getPendingBanks(page, 20);
      if (res?.data) {
        setPendingBanks(res.data);
        if (res.meta) {
          setMeta(res.meta as typeof meta);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to fetch pending banks:", err);
      showToast("error", err, "Failed to load pending banks");
    } finally {
      setLoading(false);
    }
  }, []);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchPendingBanks(1);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [fetchPendingBanks]);

  const handleApprove = async (bank: PendingBankItem) => {
    if (approvingId) return;

    try {
      setApprovingId(bank.bankId);
      await approveBank(bank.retailerId, bank.bankId);
      showToast("success", "Bank account approved successfully");
      await fetchPendingBanks(meta.page);
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
      await fetchPendingBanks(meta.page);
    } catch (err: unknown) {
      console.error("Failed to reject bank:", err);
      showToast("error", err, "Failed to reject bank account");
    } finally {
      setRejectingId(null);
    }
  };

  const openRejectModal = (bank: PendingBankItem) => {
    setShowRejectModal({ open: true, bank });
    setRejectionReason("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bank Account Approvals</h1>
          <p className="mt-1 text-xs text-slate-500">
            Review and approve retailer bank account requests
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchPendingBanks(meta.page)}
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
              <p className="text-xs text-slate-600">Pending Approvals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && pendingBanks.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      ) : pendingBanks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-bold text-slate-900">No Pending Approvals</h3>
          <p className="mt-2 text-xs text-slate-500">
            All bank accounts have been reviewed
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingBanks.map((bank) => (
            <div
              key={bank.bankId}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                {/* Bank Details */}
                <div className="flex-1 space-y-3">
                  {/* Retailer Info */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
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
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 lg:ml-4">
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
            disabled={meta.page === 1 || loading}
            onClick={() => fetchPendingBanks(meta.page - 1)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-slate-600">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={meta.page === meta.totalPages || loading}
            onClick={() => fetchPendingBanks(meta.page + 1)}
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
