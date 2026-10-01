import { Eye, RefreshCw, Search, Store, MoreVertical, Ban, CheckCircle, XCircle } from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { AdminRetailer } from "../../../types/admin/retailer";
import { clearAdminSession } from "../../../utils/adminAuth";
import { DUMMY_RETAILERS, updateDummyRetailerStatus } from "./mockRetailers";



const badge: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  under_review: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  active: "bg-emerald-50 text-emerald-700",
  suspended: "bg-slate-100 text-slate-600",
  blocked: "bg-rose-50 text-rose-700",
};

export default function AdminRetailers() {
  const navigate = useNavigate();

  const [items, setItems] = useState<AdminRetailer[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const PAGE_SIZE = 10;

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
      let filteredItems = [...DUMMY_RETAILERS];
      // Simulate network request so loading state is visible on refresh
      await new Promise(resolve => setTimeout(resolve, 400));
      
      if (search) {
        const query = search.toLowerCase();
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
      setTotalPages(Math.ceil(filteredItems.length / 10) || 1);
    } catch (caught) {
      handleRequestError(caught);
    } finally {
      setLoading(false);
    }
  }, [
    search,
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

  const updateStatus = (id: string, newStatus: AdminRetailer['status']) => {
    updateDummyRetailerStatus(id, newStatus);
    setItems((prevItems) => 
      prevItems.map((item) => 
        item.id === id ? { ...item, status: newStatus } as AdminRetailer : item
      )
    );
  };

  const handleSearch = () => {
    setPage(1);
    void load();
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
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
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Search Name, email, mobile..."
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
            <table className="hp-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Retailer ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>PAN Card</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-bold text-[#315bd1]">
                      {item.id}
                    </td>
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
                      {(item as unknown as { panCard?: string }).panCard || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${badge[item.status || "pending"] || badge.pending}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 relative text-right">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {openMenuId === item.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenMenuId(null)} 
                          />
                          <div className="absolute right-10 top-10 z-20 w-36 overflow-hidden rounded-xl bg-white shadow-xl border border-slate-100 text-left">
                            <button
                              type="button"
                              onClick={() => { setOpenMenuId(null); navigate(`/admin/retailers/${item.id}`); }}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="h-3.5 w-3.5 text-[#315bd1]" /> View
                            </button>
                            {(item.status === 'pending' || item.status === 'blocked' || item.status === 'rejected' || item.status === 'suspended') && (
                              <button
                                type="button"
                                onClick={() => { setOpenMenuId(null); updateStatus(item.id, 'approved'); }}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50"
                              >
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Approve
                              </button>
                            )}
                            {(item.status === 'approved' || item.status === 'pending') && (
                              <button
                                type="button"
                                onClick={() => { setOpenMenuId(null); updateStatus(item.id, 'blocked'); }}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-amber-50"
                              >
                                <Ban className="h-3.5 w-3.5 text-amber-600" /> Block
                              </button>
                            )}
                            {(item.status === 'approved' || item.status === 'pending') && (
                              <button
                                type="button"
                                onClick={() => { setOpenMenuId(null); updateStatus(item.id, 'rejected'); }}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-rose-50"
                              >
                                <XCircle className="h-3.5 w-3.5 text-rose-600" /> Reject
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
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