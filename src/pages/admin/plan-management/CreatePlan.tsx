import { useState } from "react";
import { ArrowLeft, Image as ImageIcon, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPlan, type PlanFormData } from "../../../apis/pricingApi";

const CreatePlan = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [formData, setFormData] = useState<Partial<PlanFormData>>({
    name: "",
    description: "",
    status: "ACTIVE",
    validityPeriod: 1,
    validityUnit: "DAYS",
    services: [],
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Please provide a plan name");
      return;
    }

    setCreating(true);
    try {
      const planData: Partial<PlanFormData> = {
        ...formData,
      };
      await createPlan(planData, imageFile);
      navigate("/admin/plan-management");
    } catch (error) {
      console.error("Failed to create plan:", error);
      alert("Failed to create plan. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/plan-management")}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Plan</h1>
          <p className="mt-1 text-sm text-gray-500">Configure plan details and pricing</p>
        </div>
      </div>



      <form onSubmit={handleSubmit}>
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
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Plan"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePlan;
