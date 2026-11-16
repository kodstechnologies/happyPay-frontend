import { useState, useEffect, useCallback, useMemo } from "react";
import { showToast } from "../../../utils/toast";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Loader2,
  RefreshCw,
  IndianRupee,
  FileText,
  Eye,
  Search,
  ArrowUpDown,
  Download,
  Calendar,
} from "lucide-react";
import {
  getAllFundRequests,
  getAdminFundRequestStats,
  approveFundRequest,
  rejectFundRequest,
  type FundRequest,
  type FundRequestStats,
} from "../../../services/api/admin/fundRequestApi";

export default function AdminFundRequest() {
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<{
    open: boolean;
    request: FundRequest | null;
  }>({ open: false, request: null });
  const [showViewModal, setShowViewModal] = useState<{
    open: boolean;
    request: FundRequest | null;
  }>({ open: false, request: null });
  const [stats, setStats] = useState<FundRequestStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"createdAt" | "amount" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchFundRequests = useCallback(async () => {
    try {
      setLoading(true);
      const status = filterStatus === "ALL" ? undefined : filterStatus;
      const res = await getAllFundRequests({ status });
      if (res?.data) {
        setFundRequests(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch fund requests:", err);
      showToast("error", err, "Failed to load fund requests");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    let filtered = [...fundRequests];

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((request) =>
        request.userId?.firstName?.toLowerCase().includes(term) ||
        request.userId?.lastName?.toLowerCase().includes(term) ||
        request.userId?.mobile?.includes(term) ||
        request.userId?.email?.toLowerCase().includes(term) ||
        request.bank?.toLowerCase().includes(term) ||
        request.paymentMode?.toLowerCase().includes(term) ||
        request._id?.toLowerCase().includes(term)
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortField) {
        case "createdAt":
          return sortOrder === "asc"
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "amount":
          return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
        case "status":
          return sortOrder === "asc"
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [fundRequests, searchTerm, sortField, sortOrder]);

  const handleSort = (field: "createdAt" | "amount" | "status") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const exportToExcel = () => {
    const headers = ["Date", "Retailer Name", "Mobile", "Email", "Amount", "Payment Mode", "Bank", "Status", "Notes"];
    const rows = filteredRequests.map((request) => [
      new Date(request.createdAt).toLocaleDateString(),
      `${request.userId?.firstName || ""} ${request.userId?.lastName || ""}`,
      String(request.userId?.mobile || ""),
      String(request.userId?.email || ""),
      String(request.amount.toFixed(2)),
      String(request.paymentMode || ""),
      String(request.bank || ""),
      String(request.status || ""),
      String(request.notes || ""),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `fund_requests_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await getAdminFundRequestStats();
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchStats();
    fetchFundRequests();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

  const handleApprove = async (request: FundRequest) => {
    if (approvingId) return;

    try {
      setApprovingId(request._id);
      await approveFundRequest(request._id, { adminNotes: adminNotes.trim() || undefined });
      showToast("success", "Fund request approved successfully");
      setAdminNotes("");
      await fetchFundRequests();
      await fetchStats();
    } catch (err: unknown) {
      console.error("Failed to approve fund request:", err);
      showToast("error", err, "Failed to approve fund request");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!showRejectModal.request || !rejectionReason.trim() || rejectingId) return;

    try {
      setRejectingId(showRejectModal.request._id);
      await rejectFundRequest(
        showRejectModal.request._id,
        {
          rejectionReason: rejectionReason.trim(),
          adminNotes: adminNotes.trim() || undefined,
        }
      );
      showToast("success", "Fund request rejected successfully");
      setShowRejectModal({ open: false, request: null });
      setRejectionReason("");
      setAdminNotes("");
      await fetchFundRequests();
      await fetchStats();
    } catch (err: unknown) {
      console.error("Failed to reject fund request:", err);
      showToast("error", err, "Failed to reject fund request");
    } finally {
      setRejectingId(null);
    }
  };

  const openRejectModal = (request: FundRequest) => {
    setShowRejectModal({ open: true, request });
    setRejectionReason("");
    setAdminNotes("");
  };

  const openViewModal = (request: FundRequest) => {
    setShowViewModal({ open: true, request });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3" />
            Rejected
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
          <h1 className="text-2xl font-bold text-slate-900">Fund Request Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and manage retailer fund requests
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            fetchFundRequests();
            fetchStats();
          }}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow-md transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-amber-200/30 blur-2xl" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg">
                <Clock className="h-7 w-7" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-200/30 blur-2xl" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{stats.approved}</p>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Approved</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-rose-200/30 blur-2xl" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow-lg">
                <XCircle className="h-7 w-7" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{stats.rejected}</p>
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus("ALL")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filterStatus === "ALL"
                ? "bg-gradient-to-r from-[#315bd1] to-[#2a4cb8] text-white shadow-lg shadow-[#315bd1]/30"
                : "bg-white text-slate-600 border border-slate-200 hover:border-[#315bd1] hover:text-[#315bd1]"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("PENDING")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filterStatus === "PENDING"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30"
                : "bg-white text-slate-600 border border-slate-200 hover:border-amber-500 hover:text-amber-600"
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("APPROVED")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filterStatus === "APPROVED"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-500 hover:text-emerald-600"
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("REJECTED")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filterStatus === "REJECTED"
                ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30"
                : "bg-white text-slate-600 border border-slate-200 hover:border-rose-500 hover:text-rose-600"
            }`}
          >
            Rejected
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, mobile, bank..."
              className="pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#315bd1] focus:outline-none focus:ring-2 focus:ring-[#315bd1]/20 transition-all duration-200 w-72 shadow-sm"
            />
          </div>
          <button
            type="button"
            onClick={exportToExcel}
            disabled={filteredRequests.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#315bd1] to-[#2a4cb8] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#315bd1]/30 hover:shadow-xl hover:shadow-[#315bd1]/40 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && fundRequests.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#315bd1] mx-auto" />
            <p className="mt-4 text-sm text-slate-500">Loading fund requests...</p>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-16 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-4">
            <IndianRupee className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Fund Requests Found</h3>
          <p className="mt-2 text-sm text-slate-500">
            No fund requests match your current filter criteria
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                    Retailer / Distributor
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer hover:text-[#315bd1] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Date
                      {sortField === "createdAt" && (
                        <ArrowUpDown className="h-4 w-4 text-[#315bd1]" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("amount")}
                    className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer hover:text-[#315bd1] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Amount
                      {sortField === "amount" && (
                        <ArrowUpDown className="h-4 w-4 text-[#315bd1]" />
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                    Payment Mode
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                    Bank
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer hover:text-[#315bd1] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {sortField === "status" && (
                        <ArrowUpDown className="h-4 w-4 text-[#315bd1]" />
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((request) => (
                  <tr
                    key={request._id}
                    className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transition-all duration-200"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {request.userId?.selfie ? (
                          <img
                            src={request.userId.selfie}
                            alt={`${request.userId?.firstName} ${request.userId?.lastName}`}
                            className="h-10 w-10 rounded-full object-cover border-2 border-purple-200"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {request.userId?.firstName} {request.userId?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{request.userId?.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {new Date(request.createdAt).toLocaleDateString('en-GB')}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(request.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-slate-900">
                        ₹{request.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                        {request.paymentMode}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <p className="text-sm text-slate-700">{request.bank}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openViewModal(request)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-[#315bd1] hover:text-[#315bd1] transition-all duration-200 shadow-sm"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>

                        {request.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              disabled={approvingId === request._id || rejectingId === request._id}
                              onClick={() => handleApprove(request)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
                              title="Approve"
                            >
                              {approvingId === request._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={approvingId === request._id || rejectingId === request._id}
                              onClick={() => openRejectModal(request)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all duration-200 disabled:opacity-50"
                              title="Reject"
                            >
                              {rejectingId === request._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal.open && showRejectModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-rose-500 text-white">
                  <XCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Reject Fund Request</h3>
              </div>
              <p className="text-sm text-slate-500 ml-15">
                Please provide a reason for rejecting this fund request
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                rows={4}
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 transition-all duration-200"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={2}
                maxLength={500}
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#315bd1] focus:outline-none focus:ring-2 focus:ring-[#315bd1]/20 transition-all duration-200 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal({ open: false, request: null });
                  setRejectionReason("");
                  setAdminNotes("");
                }}
                className="rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || !!rejectingId}
                onClick={handleReject}
                className="rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
              >
                {rejectingId ? (
                  <>
                    <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                    Rejecting...
                  </>
                ) : (
                  "Reject Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal.open && showViewModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 bg-white z-10 p-6 border-b border-slate-200 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Fund Request Details</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Request ID: {showViewModal.request._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowViewModal({ open: false, request: null })}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-200"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                {getStatusBadge(showViewModal.request.status)}
                <p className="text-sm text-slate-500">
                  Submitted on {new Date(showViewModal.request.createdAt).toLocaleString('en-GB')}
                </p>
              </div>

              {/* Amount */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-6 shadow-lg">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="relative">
                  <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Requested Amount</p>
                  <p className="mt-2 text-4xl font-bold text-white">
                    ₹{showViewModal.request.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Retailer Information */}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 text-white">
                    <User className="h-4 w-4" />
                  </div>
                  Retailer Information
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {showViewModal.request.userId?.selfie && (
                    <div className="bg-white rounded-xl p-4 border border-slate-100">
                      <p className="text-[10px] uppercase font-semibold text-slate-400 mb-2">Profile Photo</p>
                      <img
                        src={showViewModal.request.userId.selfie}
                        alt={`${showViewModal.request.userId?.firstName} ${showViewModal.request.userId?.lastName}`}
                        className="h-16 w-16 rounded-full object-cover border-2 border-purple-200"
                      />
                    </div>
                  )}
                  <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Name</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {showViewModal.request.userId?.firstName} {showViewModal.request.userId?.lastName}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Mobile</p>
                    <p className="text-sm font-semibold text-slate-900">{showViewModal.request.userId?.mobile}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Email</p>
                    <p className="text-sm font-semibold text-slate-900">{showViewModal.request.userId?.email}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white">
                    <IndianRupee className="h-4 w-4" />
                  </div>
                  Payment Information
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Payment Mode</p>
                    <p className="text-sm font-semibold text-slate-900">{showViewModal.request.paymentMode}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Payment Date</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(showViewModal.request.paymentDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  {showViewModal.request.rrn && (
                    <div className="bg-white rounded-xl p-4 border border-slate-100 md:col-span-2">
                      <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">RRN / Reference Number</p>
                      <p className="font-mono text-sm font-semibold text-slate-900">{showViewModal.request.rrn}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Information */}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 text-white">
                    <Building2 className="h-4 w-4" />
                  </div>
                  Bank Information
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Bank Name</p>
                    <p className="text-sm font-semibold text-slate-900">{showViewModal.request.bank}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Branch</p>
                    <p className="text-sm font-semibold text-slate-900">{showViewModal.request.branchName || "—"}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Account Number</p>
                    <p className="font-mono text-sm font-semibold text-slate-900">
                      {showViewModal.request.accountNumber
                        ? `•••• •••• ${showViewModal.request.accountNumber.slice(-4)}`
                        : "—"}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">IFSC Code</p>
                    <p className="font-mono text-sm font-semibold text-slate-900">{showViewModal.request.ifscCode}</p>
                  </div>
                </div>
              </div>

              {/* Receipt Slip */}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 text-white">
                    <FileText className="h-4 w-4" />
                  </div>
                  Receipt Slip
                </h4>
                {showViewModal.request.receiptSlip ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <img
                      src={showViewModal.request.receiptSlip}
                      alt="Receipt Slip"
                      className="mx-auto max-h-[400px] w-auto rounded-lg shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                    <FileText className="mx-auto h-16 w-16 text-slate-300" />
                    <p className="mt-4 text-sm text-slate-500">No receipt slip uploaded</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {showViewModal.request.notes && (
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                  <h4 className="text-base font-bold text-slate-900 mb-3">Retailer Notes</h4>
                  <p className="text-sm text-slate-700 bg-white rounded-xl p-4 border border-slate-100">{showViewModal.request.notes}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {showViewModal.request.rejectionReason && (
                <div className="rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100 p-6 shadow-sm">
                  <h4 className="text-base font-bold text-rose-900 mb-3">Rejection Reason</h4>
                  <p className="text-sm text-rose-900">{showViewModal.request.rejectionReason}</p>
                </div>
              )}

              {/* Admin Notes */}
              {showViewModal.request.adminNotes && (
                <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm">
                  <h4 className="text-base font-bold text-blue-900 mb-3">Admin Notes</h4>
                  <p className="text-sm text-blue-900">{showViewModal.request.adminNotes}</p>
                </div>
              )}

              {/* Review Information */}
              {showViewModal.request.reviewedBy && (
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                  <h4 className="text-base font-bold text-slate-900 mb-3">Review Information</h4>
                  <p className="text-sm text-slate-700">
                    Reviewed by <span className="font-semibold">{showViewModal.request.reviewedBy.firstName} {showViewModal.request.reviewedBy.lastName}</span> on{" "}
                    {showViewModal.request.reviewedAt ? new Date(showViewModal.request.reviewedAt).toLocaleString('en-GB') : "—"}
                  </p>
                </div>
              )}

              {/* Actions for Pending Requests */}
              {showViewModal.request.status === "PENDING" && (
                <div className="flex flex-col gap-4 border-t-2 border-slate-200 pt-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes for approval/rejection..."
                      rows={3}
                      maxLength={500}
                      className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#315bd1] focus:outline-none focus:ring-2 focus:ring-[#315bd1]/20 transition-all duration-200 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      disabled={approvingId === showViewModal.request._id || rejectingId === showViewModal.request._id}
                      onClick={() => handleApprove(showViewModal.request!)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
                    >
                      {approvingId === showViewModal.request._id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Approving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          <span>Approve Request</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={approvingId === showViewModal.request._id || rejectingId === showViewModal.request._id}
                      onClick={() => {
                        openRejectModal(showViewModal.request!);
                        setShowViewModal({ open: false, request: null });
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100 px-6 py-3.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all duration-200 disabled:opacity-50"
                    >
                      {rejectingId === showViewModal.request._id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Rejecting...</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5" />
                          <span>Reject Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 rounded-b-3xl">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowViewModal({ open: false, request: null })}
                  className="rounded-2xl border-2 border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
