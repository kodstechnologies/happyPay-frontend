import { Eye, RefreshCw, Search, Store, Ban, CheckCircle } from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { AdminRetailer } from "../../../types/admin/retailer";
import { clearAdminSession } from "../../../utils/adminAuth";
import { DUMMY_RETAILERS, updateDummyRetailerStatus } from "./mockRetailers";
import {
  getAdminRetailers,
  updateAdminRetailerAccountStatus,
} from "../../../apis/adminRetailer.apis";

const kycBadge: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  rejected: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

export default function AdminRetailers() {
  const navigate = useNavigate();

  const [items, setItems] = useState<AdminRetailer[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [usingMockFallback, setUsingMockFallback] = useState(false);
  const PAGE_SIZE = 10;

  // Debounce search input (400ms delay)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch((prev) => {
        if (prev !== search) {
          setPage(1);
          return search;
        }
        return prev;
      });
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  const handleRequestError = useCallback(
    (caught: unknown) => {
      const message =
        caught instanceof Error
          ? caught.message
          : "Unable to load retailers.";

      if (
        message
          .toLowerCase()
          .includes("invalid or expired access token")
      ) {
        clearAdminSession();
        navigate("/admin/login", { replace: true });
        return;
      }

      setError(message);
    },
    [navigate],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getAdminRetailers({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
        status: status || undefined,
      });

      if (res) {
        setItems(res.items || []);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages || 1);
        setUsingMockFallback(false);
      }
    } catch (caught) {
      console.warn("Could not fetch retailers from API, falling back to mock:", caught);
      // Fallback to mock data for resilience
      let filteredItems = [...DUMMY_RETAILERS];
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        filteredItems = filteredItems.filter(item => 
          item.fullName?.toLowerCase().includes(query) ||
          item.email?.toLowerCase().includes(query) ||
          item.mobile?.includes(query) ||
          item.id.toLowerCase().includes(query)
        );
      }
      if (status) {
        if (status === 'distributor') {
          filteredItems = filteredItems.filter(item => item.role === 'distributor');
        } else {
          filteredItems = filteredItems.filter(item => item.status === status);
        }
      }

      setItems(filteredItems);
      setTotal(filteredItems.length);
      setTotalPages(Math.ceil(filteredItems.length / PAGE_SIZE) || 1);
      setUsingMockFallback(true);
      handleRequestError(caught);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    status,
    handleRequestError,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [load]);

  const updateStatus = async (id: string, newStatus: AdminRetailer['status']) => {
    setActionLoadingId(id);
    try {
      if (newStatus) {
        await updateAdminRetailerAccountStatus(id, newStatus);
      }
      setItems((prevItems) => 
        prevItems.map((item) => 
          item.id === id ? ({ ...item, status: newStatus } as AdminRetailer) : item
        )
      );
    } catch (err) {
      console.warn("Could not persist status update to backend, updating locally:", err);
      updateDummyRetailerStatus(id, newStatus);
      setItems((prevItems) => 
        prevItems.map((item) => 
          item.id === id ? ({ ...item, status: newStatus } as AdminRetailer) : item
        )
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSearch = () => {
    if (debouncedSearch !== search) {
      setDebouncedSearch(search);
      setPage(1);
    } else {
      void load();
    }
  };

  return (
    <div className="mx-auto w-full space-y-6">
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#315bd1]">
          Management
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Retailers
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View retailer registration details and verification status.
        </p>
      </section>

      <section className="hp-card overflow-hidden rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div className="flex items-center gap-2 shrink-0">
            <Store className="h-5 w-5 text-[#315bd1]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Retailer records
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {total.toLocaleString("en-IN")} total retailers
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Search Name, email, mobile, PAN..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-[#315bd1] focus:bg-white"
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs outline-none"
            >
              <option value="">All Accounts</option>
              <option value="distributor">Distributor</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="blocked">Blocked</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              type="button"
              onClick={() => void load()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="m-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-12 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No retailers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="hp-table min-w-[850px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>PAN Card</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {(usingMockFallback ? items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : items).map((item) => {
                  const kyc = (item.adminApproved || item.kycStatus || "pending").toLowerCase();
                  const cfg = kycBadge[kyc] || kycBadge.pending;
                  const isBlocked = item.status === "blocked";
                  const isUpdating = actionLoadingId === item.id;

                  return (
                    <tr key={item.id}>
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {item.fullName || "Unnamed retailer"}
                        {item.role === 'distributor' && (
                          <span className="ml-1 text-slate-400 font-medium">(Distributor)</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {item.email || "-"}
                      </td>
                      <td className="px-5 py-4">
                        {item.mobile || "-"}
                      </td>
                      <td className="px-5 py-4 font-medium">
                        {(item as unknown as { panCard?: string; panNumber?: string }).panCard || (item as unknown as { panNumber?: string }).panNumber || "-"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {kyc}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/retailers/${item.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#315bd1] bg-[#f0f4ff] hover:bg-[#315bd1] hover:text-white transition-all shadow-sm"
                            title="View Retailer Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </button>

                          {/* Block / Unblock Toggle Button */}
                          {isBlocked ? (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => updateStatus(item.id, "active")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-200/60 disabled:opacity-50"
                              title="Unblock Retailer Account"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>{isUpdating ? "Updating..." : "Unblock"}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => updateStatus(item.id, "blocked")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-200/60 disabled:opacity-50"
                              title="Block Retailer Account"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              <span>{isUpdating ? "Updating..." : "Block"}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={total}
            pageSize={PAGE_SIZE}
          />
        </div>
      </section>
    </div>
  );
}