import { useEffect, useState, useMemo, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Image as ImageIcon, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  UploadCloud, 
  SlidersHorizontal,
  Sparkles,
  Link2,
  ArrowUpDown,
  Check
} from "lucide-react";
import { toast } from "react-toastify";
import ModalWrapper from "../../../components/common/ModalWrapper";
import ConfirmDeleteModal from "../../../components/common/ConfirmDeleteModal";
import { 
  getAdminBanners, 
  createAdminBanner, 
  updateAdminBanner, 
  deleteAdminBanner,
  type Banner,
  type BannerFormData
} from "../../../apis/adminBanner.apis";

const POSITION_LABELS: Record<Banner["position"], { label: string; badge: string }> = {
  top: { label: "Top Hero", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  middle: { label: "Middle Promo", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  bottom: { label: "Bottom Showcase", badge: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<"ALL" | "top" | "middle" | "bottom">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "active" | "inactive">("ALL");

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BannerFormData>({
    title: "",
    imageUrl: "",
    targetUrl: "",
    position: "top",
    order: 0,
    isActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Toggling State tracker
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadBanners = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      const res = await getAdminBanners();
      setBanners(res.data || []);
      if (isManualRefresh) {
        toast.success("Banners refreshed");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load banners";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function initBanners() {
      try {
        const res = await getAdminBanners();
        if (!ignore) {
          setBanners(res.data || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Failed to load banners";
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    initBanners();

    return () => {
      ignore = true;
    };
  }, []);

  // Quick inline status toggle directly on card
  const handleToggleStatus = async (banner: Banner) => {
    const newStatus = !banner.isActive;
    try {
      setTogglingId(banner._id);
      // Optimistic update
      setBanners((prev) =>
        prev.map((b) => (b._id === banner._id ? { ...b, isActive: newStatus } : b))
      );

      await updateAdminBanner(banner._id, {
        title: banner.title || "",
        targetUrl: banner.targetUrl || "",
        position: banner.position,
        order: banner.order,
        isActive: newStatus,
        imageUrl: banner.imageUrl,
      });

      toast.success(
        `Banner "${banner.title || "Untitled"}" is now ${newStatus ? "Active" : "Inactive"}`
      );
    } catch (err: unknown) {
      // Revert optimistic update
      loadBanners();
      const msg = err instanceof Error ? err.message : "Failed to update banner status";
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Action via ConfirmDeleteModal
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteAdminBanner(deleteTarget._id);
      toast.success("Banner deleted successfully");
      setDeleteTarget(null);
      loadBanners();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete banner";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingId(banner._id);
      setFormData({
        title: banner.title || "",
        imageUrl: banner.imageUrl || "",
        targetUrl: banner.targetUrl || "",
        position: banner.position || "top",
        order: banner.order ?? 0,
        isActive: banner.isActive !== undefined ? banner.isActive : true,
      });
      setImageFile(null);
      setImagePreview(banner.imageUrl || "");
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        imageUrl: "",
        targetUrl: "",
        position: "top",
        order: 0,
        isActive: true,
      });
      setImageFile(null);
      setImagePreview("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setImageFile(null);
    setImagePreview("");
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    // Validate size (max 5MB per backend configuration)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum allowed size is 5MB.");
      return;
    }

    // Validate format
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingId && !imageFile) {
      toast.error("Please upload a banner image.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await updateAdminBanner(editingId, formData, imageFile);
        toast.success("Banner updated successfully");
      } else if (imageFile) {
        await createAdminBanner(formData, imageFile);
        toast.success("Banner created successfully");
      }
      setIsModalOpen(false);
      loadBanners();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save banner";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    handleFileChange(file);
  };

  // Filtered & Sorted Banners
  const filteredBanners = useMemo(() => {
    return banners
      .filter((banner) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = banner.title?.toLowerCase().includes(q);
          const matchUrl = banner.targetUrl?.toLowerCase().includes(q);
          if (!matchTitle && !matchUrl) return false;
        }

        // Position filter
        if (positionFilter !== "ALL" && banner.position !== positionFilter) {
          return false;
        }

        // Status filter
        if (statusFilter === "active" && !banner.isActive) return false;
        if (statusFilter === "inactive" && banner.isActive) return false;

        return true;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [banners, searchQuery, positionFilter, statusFilter]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = banners.length;
    const active = banners.filter((b) => b.isActive).length;
    const inactive = total - active;
    const topCount = banners.filter((b) => b.position === "top").length;
    const middleCount = banners.filter((b) => b.position === "middle").length;
    const bottomCount = banners.filter((b) => b.position === "bottom").length;
    return { total, active, inactive, topCount, middleCount, bottomCount };
  }, [banners]);

  const hasActiveFilters = searchQuery !== "" || positionFilter !== "ALL" || statusFilter !== "ALL";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#315bd1]/15 to-[#315bd1]/5 border border-[#315bd1]/20 text-[#315bd1] shadow-xs">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Manage Banners
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure promotional banners, ordering, and placement across user dashboards.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadBanners(true)}
            disabled={loading || refreshing}
            title="Refresh banners"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#315bd1]" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#315bd1] to-[#2546a8] px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-[#315bd1]/25 hover:from-[#2a4eb8] hover:to-[#1e3b91] transition focus:outline-none focus:ring-2 focus:ring-[#315bd1]/40"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Banner</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Banners */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Banners</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400">items</span>
          </div>
        </div>

        {/* Active Banners */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Banners</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600">{stats.active}</span>
            <span className="text-xs text-slate-400">visible live</span>
          </div>
        </div>

        {/* Inactive / Draft Banners */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Inactive / Drafts</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <XCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-700">{stats.inactive}</span>
            <span className="text-xs text-slate-400">hidden</span>
          </div>
        </div>

        {/* Position Breakdown */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Positions</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium">
            <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-blue-700 border border-blue-100">
              Top: {stats.topCount}
            </span>
            <span className="rounded-lg bg-purple-50 px-2 py-0.5 text-purple-700 border border-purple-100">
              Mid: {stats.middleCount}
            </span>
            <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-amber-700 border border-amber-100">
              Bot: {stats.bottomCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search banners by title or link..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-[#315bd1] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Position Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Position:</span>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value as "ALL" | "top" | "middle" | "bottom")}
              aria-label="Filter by position"
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All ({stats.total})</option>
              <option value="top">Top ({stats.topCount})</option>
              <option value="middle">Middle ({stats.middleCount})</option>
              <option value="bottom">Bottom ({stats.bottomCount})</option>
            </select>
          </div>

          {/* Status Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "active" | "inactive")}
              aria-label="Filter by status"
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active Only ({stats.active})</option>
              <option value="inactive">Inactive Only ({stats.inactive})</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setPositionFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs font-medium text-rose-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadBanners()}
            className="font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content Section: Cards Grid or Skeletons or Empty State */}
      {loading ? (
        /* Loading Skeletons */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs"
            >
              <div className="aspect-[21/9] w-full bg-slate-200/70" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
                <div className="flex justify-between pt-3 border-t border-slate-100">
                  <div className="h-5 w-16 rounded-full bg-slate-200" />
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded bg-slate-100" />
                    <div className="h-6 w-6 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredBanners.length > 0 ? (
        /* Banners Cards Grid */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBanners.map((banner) => {
            const positionInfo = POSITION_LABELS[banner.position] || POSITION_LABELS.top;
            const isToggling = togglingId === banner._id;

            return (
              <div
                key={banner._id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md"
              >
                {/* Image Container with Badges */}
                <div className="relative aspect-[21/9] w-full overflow-hidden bg-slate-100">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || "Banner image"}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80";
                    }}
                  />

                  {/* Gradient Overlay for Top Badges */}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 bg-gradient-to-b from-slate-950/60 via-slate-950/20 to-transparent">
                    {/* Position Badge */}
                    <span
                      className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-bold shadow-xs backdrop-blur-md ${positionInfo.badge}`}
                    >
                      {positionInfo.label}
                    </span>

                    {/* Order Badge */}
                    <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-slate-900/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md shadow-xs">
                      <ArrowUpDown className="h-3 w-3 opacity-70" />
                      <span>#{banner.order ?? 0}</span>
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3
                      className="font-bold text-slate-900 tracking-tight truncate text-sm"
                      title={banner.title || "Untitled Banner"}
                    >
                      {banner.title || "Untitled Banner"}
                    </h3>

                    {/* Target URL */}
                    <div className="mt-1.5 flex items-center gap-1 text-xs">
                      <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {banner.targetUrl ? (
                        <a
                          href={banner.targetUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          title={banner.targetUrl}
                          className="inline-flex items-center gap-1 truncate text-xs font-medium text-[#315bd1] hover:underline"
                        >
                          <span className="truncate">{banner.targetUrl}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No target link attached</span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Bar */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    {/* Interactive Active / Inactive Toggle Switch */}
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleToggleStatus(banner)}
                      title={`Click to ${banner.isActive ? "deactivate" : "activate"} banner`}
                      className={`inline-flex items-center gap-2 rounded-xl px-2.5 py-1 text-xs font-semibold transition border ${
                        banner.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      } disabled:opacity-50 cursor-pointer`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          banner.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`}
                      />
                      <span>{isToggling ? "Updating..." : banner.isActive ? "Active" : "Inactive"}</span>
                    </button>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(banner)}
                        title="Edit banner"
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-[#315bd1] transition"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(banner)}
                        title="Delete banner"
                        className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 px-6 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 mb-3 shadow-inner">
            <ImageIcon className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {hasActiveFilters ? "No matching banners found" : "No banners configured yet"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            {hasActiveFilters
              ? "Try adjusting your search keywords, position filter, or status filter to see other banners."
              : "Upload promotional banners to showcase services, offers, and announcements on retailer dashboards."}
          </p>

          <div className="mt-5 flex gap-2">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPositionFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                Clear All Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#315bd1] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#2546a8] transition"
              >
                <Plus className="h-4 w-4" /> Create Your First Banner
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Banner Modal using Standard ModalWrapper */}
      <ModalWrapper
        open={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? "Edit Banner" : "Add New Banner"}
        description={
          editingId
            ? "Update banner details, positioning, target link, and visual artwork."
            : "Upload and publish a new banner to be featured on dashboard carousels."
        }
        icon={editingId ? Edit3 : Plus}
        variant="primary"
        size="lg"
        formId="banner-form"
        submitLabel={editingId ? "Save Changes" : "Create Banner"}
        isSubmitting={isSubmitting}
        cancelLabel="Cancel"
      >
        <form id="banner-form" onSubmit={handleSubmit} className="space-y-4.5">
          {/* Banner Title */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Banner Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
              placeholder="e.g. Festival Cashback Special 2026"
            />
          </div>

          {/* Banner Image Upload Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Banner Artwork {!editingId && <span className="text-rose-500">*</span>}
              </label>
              <span className="text-[11px] text-slate-400">
                Recommended ratio: 21:9 or 16:9 (Max 5MB)
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />

            {imagePreview ? (
              /* Preview Area with Replace / Remove button */
              <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-inner">
                <div className="aspect-[21/9] w-full">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-md hover:bg-slate-100 transition"
                  >
                    Change Image
                  </button>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(editingId ? formData.imageUrl : "");
                      }}
                      className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition"
                    >
                      Clear File
                    </button>
                  )}
                </div>
                {imageFile && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>New file selected: {imageFile.name}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Drag & Drop Upload Zone */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                  isDragging
                    ? "border-[#315bd1] bg-[#315bd1]/5 scale-[0.99]"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500 shadow-xs mb-2">
                  <UploadCloud className="h-5 w-5 text-[#315bd1]" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Click to browse <span className="font-normal text-slate-500">or drag and drop your image</span>
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Supports JPEG, PNG, and WebP (up to 5MB)
                </p>
              </div>
            )}
          </div>

          {/* Target URL */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Target Link / Redirection URL <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={formData.targetUrl}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                placeholder="https://example.com/promo or /retailer/services"
              />
            </div>
          </div>

          {/* Position & Order Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Display Position
              </label>
              <select
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value as Banner["position"] })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1] cursor-pointer"
              >
                <option value="top">Top (Hero Slider / Carousel)</option>
                <option value="middle">Middle (Services / Promos)</option>
                <option value="bottom">Bottom (Footer Banner)</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Display Order
              </label>
              <input
                type="number"
                min={0}
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                placeholder="0"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Banners with lower order numbers appear first.
              </p>
            </div>
          </div>

          {/* Active Status Checkbox / Switch */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="pr-4">
                <span className="text-xs font-bold text-slate-800 block">
                  Active Status
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  When enabled, this banner will be visible to retailers and users immediately.
                </span>
              </div>
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4.5 w-4.5 rounded border-slate-300 text-[#315bd1] focus:ring-[#315bd1] cursor-pointer"
              />
            </label>
          </div>
        </form>
      </ModalWrapper>

      {/* Delete Confirmation Modal using Standard ConfirmDeleteModal */}
      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Banner"
        itemName={deleteTarget?.title || "this banner"}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Banner"}
        isLoading={isDeleting}
        warningNotice="This banner will be permanently removed and will immediately disappear from all dashboards."
      />
    </div>
  );
}
