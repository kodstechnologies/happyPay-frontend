import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Store,
  Phone,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  Mail,
} from "lucide-react";
import AddRetailerForm from "./AddRetailerForm";
import { useAuth } from "../../context/AuthContext";
import {
  getDownlineRetailersApi,
  type DownlineRetailer,
  type PaginationMeta,
} from "../../services/api/retailer/retailerAuthApi";
import Pagination from "../../components/common/Pagination";

export default function DistributorDashboard() {
  const { user, refreshUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [retailers, setRetailers] = useState<DownlineRetailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch downline retailers
  const fetchRetailers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDownlineRetailersApi({
        page,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== "All" && statusFilter !== "Approved" && statusFilter !== "Pending" && statusFilter !== "Rejected"
          ? statusFilter.toLowerCase()
          : undefined,
        adminApproved:
          statusFilter === "Approved"
            ? "approved"
            : statusFilter === "Pending"
            ? "pending"
            : statusFilter === "Rejected"
            ? "rejected"
            : undefined,
      });

      if (res?.data) {
        setRetailers(res.data);
        if (res.meta) {
          setPagination(res.meta);
        }
      } else {
        setRetailers([]);
        setPagination(null);
      }
    } catch (err) {
      console.error("Failed to fetch downline retailers:", err);
      setError(err instanceof Error ? err.message : "Failed to load retailers");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRetailers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchRetailers]);

  // Called when a new retailer is successfully registered
  const handleRegistrationComplete = async () => {
    setIsRegisterOpen(false);
    try {
      await refreshUser();
    } catch (e) {
      console.warn("Failed to refresh user auth context:", e);
    }
    fetchRetailers();
  };

  const getStatusBadge = (status: string, adminApproved?: string) => {
    const effective = (adminApproved || status || "").toLowerCase();
    switch (effective) {
      case "approved":
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "blocked":
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getDisplayStatus = (status: string, adminApproved?: string) => {
    if (adminApproved === "approved") return "Approved";
    if (adminApproved === "rejected") return "Rejected";
    if (adminApproved === "pending") return "Pending";
    if (status.toLowerCase() === "blocked") return "Blocked";
    if (status.toLowerCase() === "suspended") return "Suspended";
    if (status.toLowerCase() === "active") return "Active";
    return status;
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
      <AddRetailerForm
        distributorId={user?._id || user?.id}
        distributorName={user?.fullName || "Distributor"}
        onExit={() => setIsRegisterOpen(false)}
        onSuccess={handleRegistrationComplete}
      />
    );
  }

  const totalRetailersCount = pagination?.total ?? retailers.length;

  return (
    <div className="w-full space-y-6">
      {/* HEADER SECTION */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">Distributor Retailers</h1>
            {totalRetailersCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-[#f3e8ff] px-2.5 py-0.5 text-xs font-bold text-[#7c3aed]">
                {totalRetailersCount} registered
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage, inspect profiles, and register new retailers under your distribution network.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchRetailers()}
            disabled={loading}
            className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
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

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, shop, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-[#7c3aed]"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

          {/* Page Size */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-[#7c3aed]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* RETAILERS TABLE / LIST VIEW */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
            <p className="mt-3 text-sm font-semibold text-slate-500">Loading retailers list...</p>
          </div>
        ) : retailers.length === 0 ? (
          <div className="py-20 text-center">
            <Store className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-base font-bold text-slate-900">
              {searchTerm || statusFilter !== "All"
                ? "No matching retailers found"
                : "No retailers registered yet"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== "All"
                ? "Try adjusting your search criteria or filter to see more retailers."
                : "Click 'Add New Retailer' to register another retailer under your downline network."}
            </p>
            {!searchTerm && statusFilter === "All" && (
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#6d28d9]"
              >
                <Plus className="h-4 w-4" />
                Add First Retailer
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Retailer & Store</th>
                    <th className="px-5 py-3.5 font-bold">Contact Info</th>
                    <th className="px-5 py-3.5 font-bold">PAN Number</th>
                    <th className="px-5 py-3.5 font-bold">Status</th>
                    <th className="px-5 py-3.5 font-bold">Registration Date</th>
                    <th className="px-5 py-3.5 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {retailers.map((retailer) => {
                    const displayStatus = getDisplayStatus(retailer.status, retailer.adminApproved);
                    const badgeClass = getStatusBadge(retailer.status, retailer.adminApproved);

                    return (
                      <tr
                        key={retailer.id}
                        className="transition hover:bg-slate-50/60 group"
                      >
                        {/* RETAILER & STORE */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4effe] text-[#7c3aed] font-bold">
                              <Store className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-[#7c3aed] transition">
                                {retailer.name}
                              </p>
                              {retailer.shopName ? (
                                <p className="text-xs font-semibold text-[#7c3aed]">
                                  {retailer.shopName}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400">Shop not specified</p>
                              )}
                              
                            </div>
                          </div>
                        </td>

                        {/* CONTACT INFO */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span>+91 {retailer.mobile}</span>
                            </div>
                            {retailer.email && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                <span className="max-w-[180px] truncate">{retailer.email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* PAN NUMBER */}
                        <td className="px-5 py-4">
                          {retailer.panNumber ? (
                            <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-800">
                              {retailer.panNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${badgeClass}`}
                          >
                            {displayStatus}
                          </span>
                        </td>

                        {/* REGISTRATION DATE */}
                        <td className="px-5 py-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{formatDate(retailer.registeredAt)}</span>
                          </div>
                        </td>

                        {/* ACTION */}
                        <td className="px-5 py-4 text-center">
                          <Link
                            to={`/retailer/distributor/retailers/${retailer.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#7c3aed]/30 bg-[#faf7ff] px-3.5 py-2 text-xs font-bold text-[#7c3aed] shadow-sm transition hover:bg-[#7c3aed] hover:text-white"
                            title="View retailer profile and transactions"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {pagination && pagination.totalPages > 1 && (
              <div className="border-t border-slate-100 p-4">
                <Pagination
                  currentPage={page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  pageSize={pageSize}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
