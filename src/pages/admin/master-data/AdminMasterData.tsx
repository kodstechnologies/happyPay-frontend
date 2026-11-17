import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Search,
  Building2,
  Home,
  FileBadge,
  Loader2,
} from "lucide-react";
import { showToast } from "../../../utils/toast";
import ModalWrapper from "../../../components/common/ModalWrapper";
import ConfirmDeleteModal from "../../../components/common/ConfirmDeleteModal";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getPropertyTypes,
  createPropertyType,
  updatePropertyType,
  deletePropertyType,
  getProofTypes,
  createProofType,
  updateProofType,
  deleteProofType,
  type MasterDataItem,
} from "../../../services/api/masterData/masterDataApi";

type DataType = "categories" | "property-types" | "proof-types";

const DATA_CONFIG: Record<
  DataType,
  { label: string; singular: string; icon: typeof Building2; color: string }
> = {
  categories: { label: "Categories", singular: "Category", icon: Building2, color: "bg-blue-50 text-blue-700 border-blue-200" },
  "property-types": { label: "Property Types", singular: "Property Type", icon: Home, color: "bg-purple-50 text-purple-700 border-purple-200" },
  "proof-types": { label: "Proof Types", singular: "Proof Type", icon: FileBadge, color: "bg-amber-50 text-amber-700 border-amber-200" },
};

const API_FUNCTIONS = {
  categories: {
    get: getCategories,
    create: createCategory,
    update: updateCategory,
    delete: deleteCategory,
  },
  "property-types": {
    get: getPropertyTypes,
    create: createPropertyType,
    update: updatePropertyType,
    delete: deletePropertyType,
  },
  "proof-types": {
    get: getProofTypes,
    create: createProofType,
    update: updateProofType,
    delete: deleteProofType,
  },
};

export default function AdminMasterData() {
  const [selectedType, setSelectedType] = useState<DataType>("categories");
  const [data, setData] = useState<MasterDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", isActive: true });

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<MasterDataItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      const api = API_FUNCTIONS[selectedType];
      const result = await api.get();
      setData(Array.isArray(result) ? result : []);
      if (isManualRefresh) {
        showToast("success", `${DATA_CONFIG[selectedType].label} refreshed`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      showToast("error", err, msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedType]);

  useEffect(() => {
    const timer = setTimeout(() => void loadData(), 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ name: "", isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (item: MasterDataItem) => {
    setEditingId(item._id);
    setFormData({ name: item.name, isActive: item.isActive });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast("error", "Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const api = API_FUNCTIONS[selectedType];
      if (editingId) {
        await api.update(editingId, formData.name.trim(), formData.isActive);
        showToast("success", "Item updated successfully");
      } else {
        await api.create(formData.name.trim());
        showToast("success", "Item created successfully");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      showToast("error", err, msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const api = API_FUNCTIONS[selectedType];
      await api.delete(deleteTarget._id);
      showToast("success", "Item deleted successfully");
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      showToast("error", err, msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (item: MasterDataItem) => {
    setTogglingId(item._id);
    try {
      const api = API_FUNCTIONS[selectedType];
      await api.update(item._id, item.name, !item.isActive);
      showToast("success", `Item ${!item.isActive ? "activated" : "deactivated"}`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      showToast("error", err, msg);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
            Configuration
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#171717]">
            Master Data
          </h1>
          <p className="mt-1 text-sm text-[#8992a3]">
            Manage categories, property types, and proof types
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-[#7c3aed] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#7c3aed]" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Data Type Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-4">
        {(Object.keys(DATA_CONFIG) as DataType[]).map((type) => {
          const config = DATA_CONFIG[type];
          const Icon = config.icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                selectedType === type
                  ? "bg-[#7c3aed] text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Search and Add */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${DATA_CONFIG[selectedType].label.toLowerCase()}...`}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6d28d9]"
        >
          <Plus className="h-4 w-4" />
          Add {DATA_CONFIG[selectedType].singular}
        </button>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
          <p className="ml-3 text-sm text-slate-500">Loading...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-20">
          <p className="text-sm font-medium text-slate-500">
            {searchQuery ? "No results found" : `No ${DATA_CONFIG[selectedType].label.toLowerCase()} found`}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={handleAdd}
              className="mt-4 text-sm font-semibold text-[#7c3aed] hover:underline"
            >
              Add your first {DATA_CONFIG[selectedType].singular.toLowerCase()}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Name
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Created At
                </th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      disabled={togglingId === item._id}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition ${
                        item.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      } disabled:opacity-50`}
                    >
                      {togglingId === item._id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : item.isActive ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {item.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-600">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#7c3aed]"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <ModalWrapper
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? `Edit ${DATA_CONFIG[selectedType].singular}` : `Add ${DATA_CONFIG[selectedType].singular}`}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={`Enter ${DATA_CONFIG[selectedType].singular.toLowerCase()} name`}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-[#7c3aed] focus:ring-[#7c3aed]"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
              Active
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6d28d9] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingId ? (
                "Update"
              ) : (
                "Create"
              )}
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Item"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
