import { Image as ImageIcon, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlanFormData {
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  validityPeriod: number;
  validityUnit: "DAYS" | "MONTHS" | "YEARS";
}

interface EditPlanBasicInfoProps {
  formData: Partial<PlanFormData>;
  setFormData: (data: Partial<PlanFormData>) => void;
  imagePreview: string;
  setImagePreview: (preview: string) => void;
  updating: boolean;
  onUpdateBasicInfo: (e: React.FormEvent) => void;
}

const EditPlanBasicInfo = ({
  formData,
  setFormData,
  imagePreview,
  setImagePreview,
  updating,
  onUpdateBasicInfo,
}: EditPlanBasicInfoProps) => {
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  return (
    <form onSubmit={onUpdateBasicInfo}>
      <div className="max-w-2xl space-y-6">
        {/* Image Upload */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Plan Image
          </label>
          <div className="flex items-center gap-4">
            <div className="h-32 w-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Upload className="h-4 w-4" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">PNG, JPG up to 5MB</p>
            </div>
          </div>
        </div>

        {/* Plan Name */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Plan Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
            placeholder="Enter plan name"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
            rows={4}
            placeholder="Enter plan description"
          />
        </div>

        {/* Validity Period */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Validity Period <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Duration
              </label>
              <input
                type="number"
                min="1"
                value={formData.validityPeriod || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  validityPeriod: parseInt(e.target.value, 10) || 1
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Unit
              </label>
              <select
                value={formData.validityUnit || "MONTHS"}
                onChange={(e) => setFormData({
                  ...formData,
                  validityUnit: e.target.value as "DAYS" | "MONTHS" | "YEARS"
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
              >
                <option value="DAYS">Days</option>
                <option value="MONTHS">Months</option>
                <option value="YEARS">Years</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/admin/plan-management")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#315bd1] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#274bbd] disabled:opacity-50"
            disabled={updating}
          >
            {updating ? "Updating..." : "Update Plan"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditPlanBasicInfo;
