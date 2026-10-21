import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Store, Phone, Clock, Activity, Eye, X, Loader2, RefreshCw } from "lucide-react";
import RetailerRegister from "../retailer/auth/Register";
import { useAuth } from "../../context/AuthContext";
import {
  getDownlineRetailersApi,
  getDownlineRetailerTransactionsApi,
  type DownlineRetailer,
  type DownlineTransaction,
} from "../../services/api/retailer/retailerAuthApi";

export default function DistributorDashboard() {
  const { user, refreshUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [retailers, setRetailers] = useState<DownlineRetailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRetailer, setSelectedRetailer] = useState<DownlineRetailer | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Transaction modal state
  const [transactions, setTransactions] = useState<DownlineTransaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);

  // Fetch downline retailers
  const fetchRetailers = useCallback(async (searchQuery = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await getDownlineRetailersApi({ search: searchQuery.trim() || undefined });
      if (res && res.data) {
        setRetailers(res.data);
      } else {
        setRetailers([]);
      }
    } catch (err) {
      console.error("Failed to fetch downline retailers:", err);
      setError(err instanceof Error ? err.message : "Failed to load retailers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRetailers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchRetailers]);

  // Handle search term input with debounce or direct filter
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRetailers(searchTerm);
  };

  // Filter retailers for client-side quick filter
  const filteredRetailers = retailers.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.mobile.includes(searchTerm) ||
      (r.shopName && r.shopName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // When a retailer is selected for viewing transactions
  const handleViewTransactions = async (retailer: DownlineRetailer) => {
    setSelectedRetailer(retailer);
    setLoadingTxns(true);
    setTransactions([]);
    try {
      const res = await getDownlineRetailerTransactionsApi(retailer.id);
      if (res && res.data) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoadingTxns(false);
    }
  };

  // Called when a new retailer is successfully registered
  const handleRegistrationComplete = async () => {
    setIsRegisterOpen(false);
    // Refresh user profile in AuthContext to pick up distributor role upgrade
    try {
      await refreshUser();
    } catch (e) {
      console.warn("Failed to refresh user auth context:", e);
    }
    // Refresh list of retailers
    fetchRetailers();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
      case "active":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "Approved":
      case "approved":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "Pending":
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Blocked":
      case "blocked":
      case "Rejected":
      case "rejected":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isRegisterOpen) {
    return (
      <RetailerRegister
        distributorId={user?._id || user?.id}
        onExit={() => setIsRegisterOpen(false)}
        onRegistrationComplete={handleRegistrationComplete}
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">Distributor Retailers</h1>
            {retailers.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-[#f3e8ff] px-2.5 py-0.5 text-xs font-bold text-[#7c3aed]">
                {retailers.length} registered
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage and register new retailers under your distribution network.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchRetailers(searchTerm)}
            disabled={loading}
            className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-slate-600 shadow-sm transition hover:bg-slate-50"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#7c3aed]" : ""}`} />
          </button>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#7c3aed] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#6d28d9]"
          >
            <Plus className="h-5 w-5" />
            Add New Retailer
          </button>
        </div>
      </header>

      {/* SEARCH */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, mobile, shop..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm"
        />
      </form>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* CARDS SECTION */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Loading your retailers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredRetailers.length > 0 ? (
            filteredRetailers.map((retailer) => (
              <div
                key={retailer.id}
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-[#7c3aed]/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8f5ff] text-[#7c3aed]">
                    <Store className="h-6 w-6" />
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${getStatusBadge(
                      retailer.status
                    )}`}
                  >
                    {retailer.status}
                  </span>
                </div>

                <div className="mt-4 flex-1">
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{retailer.name}</h3>
                  {retailer.shopName && (
                    <p className="text-xs font-semibold text-[#7c3aed] mt-0.5">{retailer.shopName}</p>
                  )}
                  <p className="text-xs font-mono text-slate-400 mt-1">ID: {retailer.id.slice(-8).toUpperCase()}</p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>+91 {retailer.mobile}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>{formatDate(retailer.registeredAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => handleViewTransactions(retailer)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-bold text-[#7c3aed] transition hover:bg-[#7c3aed] hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                    View Transactions
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
              <Store className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-4 text-base font-bold text-slate-900">
                {searchTerm ? "No matching retailers found" : "No retailers registered yet"}
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                {searchTerm
                  ? `No retailers matching "${searchTerm}". Try another search term.`
                  : "Click 'Add New Retailer' to register another retailer under your network."}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#6d28d9]"
                >
                  <Plus className="h-4 w-4" />
                  Add First Retailer
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TRANSACTIONS MODAL */}
      {selectedRetailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Retailer Transactions</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {selectedRetailer.name} (+91 {selectedRetailer.mobile})
                </p>
              </div>
              <button
                onClick={() => setSelectedRetailer(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {loadingTxns ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-7 w-7 animate-spin text-[#7c3aed]" />
                  <p className="mt-2 text-xs font-semibold text-slate-500">Fetching transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
                  <Activity className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-4 text-sm font-bold text-slate-900">No transactions recorded</p>
                  <p className="mt-1 text-xs text-slate-500">
                    This retailer has not processed any customer transactions yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Txn ID</th>
                        <th className="px-4 py-3 font-semibold">Service</th>
                        <th className="px-4 py-3 font-semibold">Amount</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((txn) => (
                        <tr key={txn.id || txn._id} className="transition hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-bold text-slate-900 font-mono text-xs">
                            {(txn.id || txn._id || "").slice(-8).toUpperCase()}
                          </td>
                          <td className="px-4 py-3 font-semibold">{txn.service}</td>
                          <td className="px-4 py-3 font-black text-slate-800">
                            ₹{(txn.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold ${
                                txn.status?.toLowerCase() === "success"
                                  ? "bg-[#e5f7ee] text-[#087f5b]"
                                  : txn.status?.toLowerCase() === "pending"
                                  ? "bg-[#fff2df] text-[#c56b08]"
                                  : "bg-[#ffe6ea] text-[#c21d3d]"
                              }`}
                            >
                              {txn.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">{formatDate(txn.date || txn.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
