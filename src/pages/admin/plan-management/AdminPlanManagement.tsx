import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  FileText,
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  Eye,
  Trash2,
  Search,
  Layers,
  Calendar,
  RefreshCw,
  Sparkles,
  Tag,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import { toast } from "react-toastify";
import { getPlans, deletePlan, type Plan } from "../../../apis/pricingApi";

const AdminPlanManagement = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "validity">("newest");

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPlans = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const plansData = await getPlans();
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      toast.error("Failed to load plans. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchPlans();
    })();
  }, []);

  // Filtered & Sorted plans
  const filteredPlans = useMemo(() => {
    return plans
      .filter((plan) => {
        const matchesStatus =
          statusFilter === "ALL" || plan.status === statusFilter;

        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          plan.name.toLowerCase().includes(query) ||
          (plan.description && plan.description.toLowerCase().includes(query)) ||
          plan.services?.some((s) => s.serviceId.toLowerCase().includes(query));

        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === "validity") {
          return b.validityPeriod - a.validityPeriod;
        }
        // default: newest
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [plans, statusFilter, searchQuery, sortBy]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = plans.length;
    const active = plans.filter((p) => p.status === "ACTIVE").length;
    const inactive = total - active;
    const totalServicesConfigured = plans.reduce(
      (sum, p) => sum + (p.services?.length || 0),
      0
    );
    return { total, active, inactive, totalServicesConfigured };
  }, [plans]);

  // Handle plan deletion
  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    setDeleting(true);
    try {
      await deletePlan(planToDelete._id);
      toast.success(`Plan "${planToDelete.name}" deleted successfully`);
      setPlans((prev) => prev.filter((p) => p._id !== planToDelete._id));
      setDeleteModalOpen(false);
      setPlanToDelete(null);
    } catch (error) {
      console.error("Failed to delete plan:", error);
      toast.error("Failed to delete plan. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
      {/* Top Header Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Plan Management
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#315bd1] border border-blue-100">
              <Sparkles className="h-3 w-3" />
              Pricing & Tiers
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Design, oversee, and configure subscription plans and commission slabs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPlans(true)}
            disabled={refreshing}
            title="Refresh plans"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#315bd1]" : ""}`} />
          </button>
          <button
            onClick={() => navigate("/admin/plan-management/create")}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#315bd1] to-[#254bbd] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-[#254bbd] hover:to-[#1d3d9e] hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Plans */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Plans</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#315bd1]">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400">packages</span>
          </div>
        </div>

        {/* Active Plans */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.active}</span>
            <span className="text-xs text-emerald-600 font-medium">live now</span>
          </div>
        </div>

        {/* Inactive Plans */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inactive</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.inactive}</span>
            <span className="text-xs text-slate-400">disabled</span>
          </div>
        </div>

        {/* Service Mappings */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-indigo-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Services</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.totalServicesConfigured}</span>
            <span className="text-xs text-slate-400">configurations</span>
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Toolbar */}
      <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-2xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plans by name, description, or service..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#315bd1] focus:bg-white focus:ring-2 focus:ring-[#315bd1]/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Status Tabs */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              {(["ALL", "ACTIVE", "INACTIVE"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${statusFilter === status
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  {status === "ALL" ? "All" : status === "ACTIVE" ? "Active" : "Inactive"}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <span className="text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name" | "validity")}
                aria-label="Sort plans by"
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="validity">Validity Period</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        /* Skeleton Grid */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="flex flex-col h-[460px] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs animate-pulse"
            >
              <div className="flex items-center justify-between pb-4">
                <div className="h-14 w-14 rounded-2xl bg-slate-200" />
                <div className="h-6 w-18 rounded-full bg-slate-200" />
              </div>
              <div className="h-5 w-3/4 rounded bg-slate-200 mt-4" />
              <div className="h-4 w-full rounded bg-slate-100 mt-2" />
              <div className="h-4 w-2/3 rounded bg-slate-100 mt-1" />
              <div className="h-16 w-full rounded-xl bg-slate-100 mt-6" />
              <div className="h-20 w-full rounded-xl bg-slate-100 mt-4" />
              <div className="mt-auto pt-6 flex gap-3 border-t border-slate-100">
                <div className="h-10 flex-1 rounded-xl bg-slate-200" />
                <div className="h-10 flex-1 rounded-xl bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#315bd1]">
            <FolderOpen className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            {searchQuery || statusFilter !== "ALL"
              ? "No plans match your filters"
              : "No plans created yet"}
          </h3>
          <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-slate-500">
            {searchQuery || statusFilter !== "ALL"
              ? "Try adjusting your search query or reset filters to see all available plans."
              : "Get started by creating your first subscription or commission plan."}
          </p>
          <div className="mt-6 flex items-center gap-3">
            {searchQuery || statusFilter !== "ALL" ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                Reset Filters
              </button>
            ) : null}
            <button
              onClick={() => navigate("/admin/plan-management/create")}
              className="flex items-center gap-2 rounded-xl bg-[#315bd1] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#254bbd]"
            >
              <Plus className="h-4 w-4" />
              Create New Plan
            </button>
          </div>
        </div>
      ) : (
        /* Vertical Cards Grid */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredPlans.map((plan) => {
            const totalCategories =
              plan.services?.reduce(
                (acc, s) => acc + (s.categories?.length || 0),
                0
              ) || 0;

            return (
              <div
                key={plan._id}
                className="group relative flex flex-col h-full rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl overflow-hidden"
              >
                {/* Decorative Accent Top Line */}
                <div
                  className={`h-1.5 w-full ${plan.status === "ACTIVE"
                    ? "bg-gradient-to-r from-[#315bd1] via-indigo-500 to-emerald-400"
                    : "bg-gradient-to-r from-slate-300 to-slate-400"
                    }`}
                />

                {/* Card Top Section: Image, Status & Delete Action */}
                <div className="p-5 sm:p-6 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Plan Image Avatar */}
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-blue-50/30 p-2 shadow-2xs transition-transform duration-300 group-hover:scale-105">
                      {plan.image ? (
                        <img
                          src={plan.image}
                          alt={plan.name}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            // fallback on image error
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-slate-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      {plan.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60 ring-1 ring-emerald-500/10">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                          </span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                          <span className="h-2 w-2 rounded-full bg-slate-400" />
                          Inactive
                        </span>
                      )}

                      {/* Delete Quick Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanToDelete(plan);
                          setDeleteModalOpen(true);
                        }}
                        title="Delete Plan"
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Plan Name & Description */}
                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-[#315bd1] line-clamp-1">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 line-clamp-2 min-h-[38px] leading-relaxed">
                      {plan.description || "No description provided for this plan."}
                    </p>
                  </div>

                  {/* Key Highlights Section (Long Vertical Layout) */}
                  <div className="mt-4 space-y-3">
                    {/* Validity Period Highlight Card */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100/70 text-[#315bd1]">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Validity Period
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-slate-800">
                            {plan.validityPeriod}{" "}
                            <span className="font-medium text-slate-600 capitalize">
                              {(plan.validityUnit || "MONTHS").toLowerCase()}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Categories
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-indigo-600">
                          {totalCategories}
                        </p>
                      </div>
                    </div>

                    {/* Services Included Breakdown */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Layers className="h-3.5 w-3.5 text-[#315bd1]" />
                          <span>Configured Services</span>
                        </div>
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#315bd1] border border-blue-100">
                          {plan.services?.length || 0} Total
                        </span>
                      </div>

                      {/* Service Pills */}
                      <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                        {plan.services && plan.services.length > 0 ? (
                          <>
                            {plan.services.slice(0, 3).map((service, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs"
                              >
                                <Tag className="h-2.5 w-2.5 text-blue-500" />
                                {service.serviceId}
                              </span>
                            ))}
                            {plan.services.length > 3 && (
                              <span className="inline-flex items-center rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-bold text-[#315bd1]">
                                +{plan.services.length - 3} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] italic text-slate-400">
                            No service configured yet
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta Dates Information */}
                    <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {formatDate(plan.createdAt)}</span>
                      </div>
                      {plan.updatedAt && (
                        <span>Updated: {formatDate(plan.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: View and Edit Action Buttons */}
                <div className="mt-auto border-t border-slate-100 bg-slate-50/70 p-4 pt-3 flex items-center gap-2.5">
                  {/* View Button */}
                  <button
                    onClick={() => navigate(`/admin/plan-management/view/${plan._id}`)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white py-2.5 px-3 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition-all duration-200 hover:border-blue-300 hover:bg-slate-50 hover:text-[#315bd1] active:scale-[0.98]"
                  >
                    <Eye className="h-4 w-4 text-slate-500 transition-colors group-hover:text-[#315bd1]" />
                    <span>View Details</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => navigate(`/admin/plan-management/edit/${plan._id}`)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#315bd1] to-[#254bbd] py-2.5 px-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-[#254bbd] hover:to-[#1d3d9e] hover:shadow-md active:scale-[0.98]"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit Plan</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-slide-in-right">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Plan</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-900 font-semibold">"{planToDelete.name}"</strong>?
              Any configurations and slabs under this plan will be removed.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPlanToDelete(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeletePlan}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlanManagement;
