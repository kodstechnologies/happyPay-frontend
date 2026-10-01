/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, X } from "lucide-react";
import { 
  getAdminBanners, 
  createAdminBanner, 
  updateAdminBanner, 
  deleteAdminBanner,
  type Banner,
  type BannerFormData
} from "../../../services/api/admin/adminBannerApi";

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BannerFormData>({
    title: "",
    imageUrl: "",
    targetUrl: "",
    position: "top",
    order: 0,
    isActive: true,
  });

  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await getAdminBanners();
      setBanners(res.data);
    } catch (err) {
      setError("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBanners();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      await deleteAdminBanner(id);
      loadBanners();
    } catch (err) {
      alert("Failed to delete banner");
    }
  };

  const handleOpenModal = (banner?: any) => {
    if (banner) {
      setEditingId(banner._id);
      setFormData({
        title: banner.title || "",
        imageUrl: banner.imageUrl || "",
        targetUrl: banner.targetUrl || "",
        position: banner.position || "top",
        order: banner.order || 0,
        isActive: banner.isActive !== undefined ? banner.isActive : true,
      });
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
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAdminBanner(editingId, formData);
      } else {
        await createAdminBanner(formData);
      }
      setIsModalOpen(false);
      loadBanners();
    } catch (err) {
      alert("Failed to save banner");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Banners</h1>
          <p className="text-sm text-slate-500 mt-1">Add, edit, and organize dashboard banners.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-xl bg-[#315bd1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2546a8]"
        >
          <Plus className="h-4 w-4" /> Add Banner
        </button>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p>Loading banners...</p>
        ) : banners.map((banner) => (
          <div key={banner._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="aspect-[21/9] w-full bg-slate-100">
              <img 
                src={banner.imageUrl} 
                alt={banner.title} 
                className="h-full w-full object-cover" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80";
                }}
              />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-slate-900 truncate" title={banner.title}>{banner.title || "Untitled Banner"}</h3>
              <p className="text-xs text-slate-500 mt-1">Position: {banner.position} | Order: {banner.order}</p>
              {banner.targetUrl && (
                <p className="text-xs text-blue-500 mt-1 truncate" title={banner.targetUrl}>
                  <a href={banner.targetUrl} target="_blank" rel="noreferrer">Link: {banner.targetUrl}</a>
                </p>
              )}
              
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${banner.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"}`}>
                  {banner.isActive ? "Active" : "Inactive"}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(banner)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(banner._id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && !loading && <p>No banners found.</p>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? "Edit Banner" : "Add New Banner"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                  placeholder="e.g. Summer Sale"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Image URL</label>
                <input
                  type="url"
                  required
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Target URL (Optional)</label>
                <input
                  type="url"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                  placeholder="https://example.com/promo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Position</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#315bd1] focus:ring-[#315bd1]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active (Visible on Dashboard)</label>
              </div>

              <div className="mt-6 flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#315bd1] py-2.5 text-sm font-bold text-white hover:bg-[#2546a8] transition-colors"
                >
                  {editingId ? "Save Changes" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
