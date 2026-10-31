import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getPlanById, updatePlan, configurePlanServices, type PlanFormData, type PlanService } from "../../../apis/pricingApi";
import { toast } from "react-toastify";
import EditPlanBasicInfo from "./EditPlanBasicInfo";
import EditPlanServices from "./EditPlanServices";

interface PricingSlab {
  minAmount: number;
  maxAmount: number | null;
  chargeAmount?: number | null;
  adminAmount?: number | null;
  distributorAmount?: number | null;
  retailerAmount?: number | null;
}

interface Pricing {
  type: "COMMISSION" | "CHARGE";
  calculationType: "FIXED" | "PERCENTAGE";
  slabs: PricingSlab[];
}

interface PlanCategory {
  categoryName: string;
  pricing: Pricing[];
}

interface ServiceFormData {
  serviceName: string;
  categories: PlanCategory[];
  pricing: Pricing[];
}

const EditPlan = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [configuringServices, setConfiguringServices] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"basic" | "services">("basic");

  const [formData, setFormData] = useState<Partial<PlanFormData>>({
    name: "",
    description: "",
    status: "ACTIVE",
    validityPeriod: 1,
    validityUnit: "MONTHS",
    services: [],
  });

  const [services, setServices] = useState<ServiceFormData[]>([]);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!id) return;
      try {
        const plan = await getPlanById(id);
        setFormData({
          name: plan.name,
          description: plan.description,
          status: plan.status,
          validityPeriod: plan.validityPeriod,
          validityUnit: plan.validityUnit,
          services: plan.services,
        });
        if (plan.image) {
          setImagePreview(plan.image);
        }
        // Convert services to form data format
        setServices(plan.services.map((s: PlanService) => ({
          serviceName: s.serviceId,
          categories: s.categories,
          pricing: s.pricing || [],
        })));
      } catch (error) {
        console.error("Failed to fetch plan:", error);
        toast.error("Failed to load plan details");
        navigate("/admin/plan-management");
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [id, navigate]);

  const handleUpdateBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please provide a plan name");
      return;
    }

    if (!id) {
      toast.error("Invalid plan ID");
      return;
    }

    setUpdating(true);
    try {
      const planData: Partial<PlanFormData> = {
        ...formData,
      };
      const plandatares = await updatePlan(id, planData, imageFile);
      console.log("Plan details updated successfully!===========", plandatares);
      toast.success("Plan details updated successfully!");
    } catch (error) {
      console.error("Failed to update plan:", error);
      toast.error("Failed to update plan. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfigureServices = async () => {
    if (!id) {
      toast.error("Invalid plan ID");
      return;
    }

    // Validate all services, categories, and slabs
    for (const service of services) {
      // Check category-based slabs
      if (service.categories && service.categories.length > 0) {
        for (const cat of service.categories) {
          for (let pIdx = 0; pIdx < (cat.pricing || []).length; pIdx++) {
            const pricing = cat.pricing[pIdx];
            const unit = pricing.calculationType === "PERCENTAGE" ? "%" : "₹";
            for (let sIdx = 0; sIdx < (pricing.slabs || []).length; sIdx++) {
              const slab = pricing.slabs[sIdx];
              const rangeName = `${service.serviceName} > ${cat.categoryName} > Range #${sIdx + 1}`;

              // 1. Max amount validation
              if (
                slab.maxAmount !== null &&
                slab.maxAmount !== undefined &&
                String(slab.maxAmount) !== ""
              ) {
                if (Number(slab.maxAmount) <= Number(slab.minAmount)) {
                  toast.error(
                    `Invalid range in ${rangeName}: Max amount (${slab.maxAmount}) must be greater than Min amount (${slab.minAmount})`
                  );
                  return;
                }
              }

              // 2. Charge distribution calculation validation
              const charge =
                slab.chargeAmount !== null &&
                  slab.chargeAmount !== undefined &&
                  String(slab.chargeAmount) !== ""
                  ? Number(slab.chargeAmount)
                  : null;

              if (charge !== null && charge > 0) {
                const ret = Number(slab.retailerAmount || 0);
                const dist = Number(slab.distributorAmount || 0);
                const adm = Number(slab.adminAmount || 0);
                const total = Math.round((ret + dist + adm) * 100) / 100;
                const roundedCharge = Math.round(charge * 100) / 100;
                if (total !== roundedCharge) {
                  toast.error(
                    `Rate allocation mismatch in ${rangeName}: Charge is ${roundedCharge} ${unit}, but sum of Retailer (${ret}) + Distributor (${dist}) + Admin (${adm}) is ${total} ${unit}. Please ensure Retailer + Distributor + Admin equals the Charge amount.`
                  );
                  return;
                }
              }
            }
          }
        }
      }

      // Check service-level slabs
      if (!service.categories || service.categories.length === 0) {
        for (let pIdx = 0; pIdx < (service.pricing || []).length; pIdx++) {
          const pricing = service.pricing[pIdx];
          const unit = pricing.calculationType === "PERCENTAGE" ? "%" : "₹";
          for (let sIdx = 0; sIdx < (pricing.slabs || []).length; sIdx++) {
            const slab = pricing.slabs[sIdx];
            const rangeName = `${service.serviceName} > Range #${sIdx + 1}`;

            // 1. Max amount validation
            if (
              slab.maxAmount !== null &&
              slab.maxAmount !== undefined &&
              String(slab.maxAmount) !== ""
            ) {
              if (Number(slab.maxAmount) <= Number(slab.minAmount)) {
                toast.error(
                  `Invalid range in ${rangeName}: Max amount (${slab.maxAmount}) must be greater than Min amount (${slab.minAmount})`
                );
                return;
              }
            }

            // 2. Charge distribution calculation validation
            const charge =
              slab.chargeAmount !== null &&
                slab.chargeAmount !== undefined &&
                String(slab.chargeAmount) !== ""
                ? Number(slab.chargeAmount)
                : null;

            if (charge !== null && charge > 0) {
              const ret = Number(slab.retailerAmount || 0);
              const dist = Number(slab.distributorAmount || 0);
              const adm = Number(slab.adminAmount || 0);
              const total = Math.round((ret + dist + adm) * 100) / 100;
              const roundedCharge = Math.round(charge * 100) / 100;
              if (total !== roundedCharge) {
                toast.error(
                  `Rate allocation mismatch in ${rangeName}: Charge is ${roundedCharge} ${unit}, but sum of Retailer (${ret}) + Distributor (${dist}) + Admin (${adm}) is ${total} ${unit}. Please ensure Retailer + Distributor + Admin equals the Charge amount.`
                );
                return;
              }
            }
          }
        }
      }
    }

    console.log("Configuring services for plan ID:", id);

    setConfiguringServices(true);
    try {
      const servicesData = services.map((s) => {
        const serviceData: {
          serviceId: string;
          categories?: Array<{
            categoryName: string;
            pricing: Array<{
              type: string;
              calculationType: string;
              slabs: Array<{
                minAmount: number;
                maxAmount: number | null;
                chargeAmount?: number | null;
                adminAmount?: number | null;
                distributorAmount?: number | null;
                retailerAmount?: number | null;
              }>;
            }>;
          }>;
          pricing?: Array<{
            type: string;
            calculationType: string;
            slabs: Array<{
              minAmount: number;
              maxAmount: number | null;
              chargeAmount?: number | null;
              adminAmount?: number | null;
              distributorAmount?: number | null;
              retailerAmount?: number | null;
            }>;
          }>;
        } = {
          serviceId: s.serviceName,
        };

        // Only include categories if they exist and have pricing
        if (s.categories && s.categories.length > 0) {
          serviceData.categories = s.categories.map((c) => ({
            categoryName: c.categoryName,
            pricing: c.pricing.map((p) => ({
              type: p.type,
              calculationType: p.calculationType,
              slabs: p.slabs.map((slab) => ({
                minAmount: slab.minAmount,
                maxAmount: slab.maxAmount,
                chargeAmount: slab.chargeAmount ?? undefined,
                adminAmount: slab.adminAmount ?? undefined,
                distributorAmount: slab.distributorAmount ?? undefined,
                retailerAmount: slab.retailerAmount ?? undefined,
              })),
            })),
          }));
        }

        // Only include service-level pricing if no categories
        if (!s.categories || s.categories.length === 0) {
          if (s.pricing && s.pricing.length > 0) {
            serviceData.pricing = s.pricing.map((p) => ({
              type: p.type,
              calculationType: p.calculationType,
              slabs: p.slabs.map((slab) => ({
                minAmount: slab.minAmount,
                maxAmount: slab.maxAmount,
                chargeAmount: slab.chargeAmount ?? undefined,
                adminAmount: slab.adminAmount ?? undefined,
                distributorAmount: slab.distributorAmount ?? undefined,
                retailerAmount: slab.retailerAmount ?? undefined,
              })),
            }));
          }
        }

        return serviceData;
      });

      console.log("Services data being sent:", servicesData);

      await configurePlanServices(id, servicesData);
      toast.success("Services configured successfully!");
      navigate("/admin/plan-management");
    } catch (error) {
      console.error("Failed to configure services:", error);
      toast.error("Failed to configure services. Please try again.");
    } finally {
      setConfiguringServices(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gray-500">Loading plan details...</div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Edit Plan</h1>
          <p className="mt-1 text-sm text-gray-500">Update plan details and configure services</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab("basic")}
            className={`pb-3 text-sm font-medium transition ${activeTab === "basic"
              ? "border-b-2 border-[#315bd1] text-[#315bd1]"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Basic Information
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`pb-3 text-sm font-medium transition ${activeTab === "services"
              ? "border-b-2 border-[#315bd1] text-[#315bd1]"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Services & Price Configuration
          </button>
        </nav>
      </div>

      {activeTab === "basic" && (
        <EditPlanBasicInfo
          formData={formData}
          setFormData={setFormData}
          imageFile={imageFile}
          imagePreview={imagePreview}
          setImageFile={setImageFile}
          setImagePreview={setImagePreview}
          updating={updating}
          setUpdating={setUpdating}
          onUpdateBasicInfo={handleUpdateBasicInfo}
        />
      )}

      {activeTab === "services" && (
        <EditPlanServices
          services={services}
          setServices={setServices}
          configuringServices={configuringServices}
          setConfiguringServices={setConfiguringServices}
          onConfigureServices={handleConfigureServices}
          onBack={() => setActiveTab("basic")}
        />
      )}
    </div>
  );
};

export default EditPlan;
