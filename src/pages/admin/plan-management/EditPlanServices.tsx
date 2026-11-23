import { useState, useEffect, useRef } from "react";
import { Plus, X, Trash2, Search, ChevronDown, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import { showToast } from "../../../utils/toast";

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

// Service configuration with predefined categories
const SERVICE_CONFIG = {
  "AEPS": ["cash withdrawal", "cash deposit"],
  "BBPS": ["electricity bill", "gas bill", "water bill", "fast tag", "lpg gas", "insurance", "life insurance", "municipal tax", "credit card"],
  "DMT": [],
  "CMS": [],
  "UPI CASH POINT": [],
  "ADHAR PAY": [],
  "PAYOUT": ["transfer to bank"]
};

const AVAILABLE_SERVICES = ["AEPS", "DMT", "BBPS", "CMS", "UPI CASH POINT", "ADHAR PAY", "PAYOUT"];

// ─── Table-based Slab Editor ──────────────────────────────────────────────────

interface SlabTableProps {
  pricing: Pricing;
  serviceName?: string;
  onUpdateSlab: (slabIndex: number, field: keyof PricingSlab, value: number | string | null) => void;
  onRemoveSlab: (slabIndex: number) => void;
  onAddSlab: () => void;
  onCalcTypeChange: (calcType: "FIXED" | "PERCENTAGE") => void;
}

const SlabTable = ({
  pricing,
  serviceName,
  onUpdateSlab,
  onRemoveSlab,
  onAddSlab,
  onCalcTypeChange,
}: SlabTableProps) => {
  const unit = pricing.calculationType === "PERCENTAGE" ? "%" : "₹";
  const chargeLabel = serviceName === "AEPS" ? "Commission" : "Charge";

  return (
    <div className="overflow-x-auto">
      {/* Calculation Type Selector */}
      <div className="mb-3 flex items-center gap-3">
        <label className="text-xs font-medium text-gray-700">Calculation Type</label>
        <select
          value={pricing.calculationType}
          onChange={(e) => onCalcTypeChange(e.target.value as "FIXED" | "PERCENTAGE")}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
        >
          <option value="FIXED">Fixed ({unit})</option>
          <option value="PERCENTAGE">Percentage (%)</option>
        </select>
      </div>

      {/* Slab Table */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200 bg-gray-50">
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-gray-600">
              Min Amount (₹)
            </th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-gray-600">
              Max Amount (₹)
            </th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-gray-600">
              {chargeLabel} ({unit})
            </th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-gray-600">
              Retailer ({unit})
            </th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-gray-600">
              Distributor ({unit})
            </th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-gray-600">
              Admin ({unit})
            </th>
            <th className="px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-600">
              Status
            </th>
            <th className="px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {pricing.slabs.map((slab, idx) => {
            const isMaxInvalid =
              slab.maxAmount !== null &&
              slab.maxAmount !== undefined &&
              String(slab.maxAmount) !== "" &&
              Number(slab.maxAmount) <= Number(slab.minAmount);

            const charge =
              slab.chargeAmount !== null &&
              slab.chargeAmount !== undefined &&
              String(slab.chargeAmount) !== ""
                ? Number(slab.chargeAmount)
                : null;

            const ret =
              slab.retailerAmount !== null &&
              slab.retailerAmount !== undefined &&
              String(slab.retailerAmount) !== ""
                ? Number(slab.retailerAmount)
                : 0;
            const dist =
              slab.distributorAmount !== null &&
              slab.distributorAmount !== undefined &&
              String(slab.distributorAmount) !== ""
                ? Number(slab.distributorAmount)
                : 0;
            const adm =
              slab.adminAmount !== null &&
              slab.adminAmount !== undefined &&
              String(slab.adminAmount) !== ""
                ? Number(slab.adminAmount)
                : 0;

            const sum = Math.round((ret + dist + adm) * 100) / 100;
            const hasValues =
              (slab.retailerAmount !== undefined && slab.retailerAmount !== null && String(slab.retailerAmount) !== "") ||
              (slab.distributorAmount !== undefined && slab.distributorAmount !== null && String(slab.distributorAmount) !== "") ||
              (slab.adminAmount !== undefined && slab.adminAmount !== null && String(slab.adminAmount) !== "");

            // Status badge
            let statusBadge = null;
            if (charge !== null && charge > 0 && hasValues) {
              const roundedCharge = Math.round(charge * 100) / 100;
              if (sum === roundedCharge) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Balanced
                  </span>
                );
              } else if (sum > roundedCharge) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                    <AlertCircle className="h-3 w-3" /> Exceeded
                  </span>
                );
              } else {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                    <AlertCircle className="h-3 w-3" /> Incomplete
                  </span>
                );
              }
            }

            return (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition">
                {/* Min Amount */}
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={slab.minAmount}
                    onChange={(e) =>
                      onUpdateSlab(idx, "minAmount", e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)
                    }
                    className="w-full min-w-[90px] rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                  />
                </td>

                {/* Max Amount */}
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={slab.maxAmount !== null && slab.maxAmount !== undefined ? slab.maxAmount : ""}
                    onChange={(e) =>
                      onUpdateSlab(
                        idx,
                        "maxAmount",
                        e.target.value === "" ? null : isNaN(parseFloat(e.target.value)) ? null : parseFloat(e.target.value)
                      )
                    }
                    placeholder="∞"
                    className={`w-full min-w-[90px] rounded-md border px-2.5 py-1.5 text-sm focus:outline-none ${
                      isMaxInvalid
                        ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        : "border-gray-300 focus:border-[#315bd1] focus:ring-1 focus:ring-[#315bd1]"
                    }`}
                  />
                </td>

                {/* Charge/Commission Amount */}
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={slab.chargeAmount !== null && slab.chargeAmount !== undefined ? slab.chargeAmount : ""}
                    onChange={(e) =>
                      onUpdateSlab(
                        idx,
                        "chargeAmount",
                        e.target.value === "" ? null : isNaN(parseFloat(e.target.value)) ? null : parseFloat(e.target.value)
                      )
                    }
                    placeholder="0"
                    className="w-full min-w-[80px] rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                  />
                </td>

                {/* Retailer Amount */}
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={slab.retailerAmount !== undefined && slab.retailerAmount !== null ? slab.retailerAmount : ""}
                    onChange={(e) =>
                      onUpdateSlab(
                        idx,
                        "retailerAmount",
                        e.target.value === "" ? null : isNaN(parseFloat(e.target.value)) ? null : parseFloat(e.target.value)
                      )
                    }
                    placeholder="0"
                    className="w-full min-w-[80px] rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                  />
                </td>

                {/* Distributor Amount */}
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={slab.distributorAmount !== undefined && slab.distributorAmount !== null ? slab.distributorAmount : ""}
                    onChange={(e) =>
                      onUpdateSlab(
                        idx,
                        "distributorAmount",
                        e.target.value === "" ? null : isNaN(parseFloat(e.target.value)) ? null : parseFloat(e.target.value)
                      )
                    }
                    placeholder="0"
                    className="w-full min-w-[80px] rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                  />
                </td>

                {/* Admin Amount */}
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={slab.adminAmount !== undefined && slab.adminAmount !== null ? slab.adminAmount : ""}
                    onChange={(e) =>
                      onUpdateSlab(
                        idx,
                        "adminAmount",
                        e.target.value === "" ? null : isNaN(parseFloat(e.target.value)) ? null : parseFloat(e.target.value)
                      )
                    }
                    placeholder="0"
                    className="w-full min-w-[80px] rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                  />
                </td>

                {/* Status */}
                <td className="px-3 py-2 text-center">
                  {statusBadge ?? <span className="text-[10px] text-gray-400">—</span>}
                </td>

                {/* Remove */}
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveSlab(idx)}
                    className="rounded-md p-1 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
                    title="Remove range"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Add Range + validation hints */}
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onAddSlab}
          className="flex items-center gap-1 rounded-lg border border-[#315bd1] bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#315bd1] transition hover:bg-[#315bd1] hover:text-white"
        >
          <Plus className="h-3 w-3" />
          Add Range
        </button>
        <p className="text-[11px] text-gray-400">
          Leave Max Amount blank for infinity (∞). Retailer + Distributor + Admin should equal {chargeLabel}.
        </p>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface EditPlanServicesProps {
  services: ServiceFormData[];
  setServices: (services: ServiceFormData[]) => void;
  configuringServices: boolean;
  onConfigureServices: () => void;
  onBack: () => void;
}

const EditPlanServices = ({
  services,
  setServices,
  configuringServices,
  onConfigureServices,
  onBack,
}: EditPlanServicesProps) => {
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowServiceDropdown(false);
        setServiceSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addService = (serviceName: string) => {
    if (services.some(s => s.serviceName === serviceName)) {
      showToast("error", "This service is already added");
      return;
    }
    const predefinedCategories = SERVICE_CONFIG[serviceName as keyof typeof SERVICE_CONFIG] || [];
    const newService: ServiceFormData = {
      serviceName,
      categories: predefinedCategories.map(cat => ({ categoryName: cat, pricing: [] })),
      pricing: [],
    };
    setServices([...services, newService]);
    setShowServiceDropdown(false);
    setServiceSearchQuery("");
  };

  const getFilteredServices = () => {
    if (!serviceSearchQuery) return AVAILABLE_SERVICES;
    return AVAILABLE_SERVICES.filter(service =>
      service.toLowerCase().includes(serviceSearchQuery.toLowerCase())
    );
  };

  const hasCategories = (serviceName: string) => {
    const categories = SERVICE_CONFIG[serviceName as keyof typeof SERVICE_CONFIG];
    return categories && categories.length > 0;
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const removeCategory = (serviceIndex: number, categoryIndex: number) => {
    const updated = [...services];
    updated[serviceIndex].categories = updated[serviceIndex].categories?.filter((_, i) => i !== categoryIndex);
    setServices(updated);
  };

  // ── Category-based slab operations ──

  const addPricingForCategory = (si: number, ci: number) => {
    const updated = [...services];
    const newPricing: Pricing = {
      type: "COMMISSION",
      calculationType: "FIXED",
      slabs: [{ minAmount: 0, maxAmount: null }],
    };
    updated[si].categories![ci].pricing = [...(updated[si].categories![ci].pricing || []), newPricing];
    setServices(updated);
  };

  const removePricingForCategory = (si: number, ci: number, pi: number) => {
    const updated = [...services];
    updated[si].categories![ci].pricing = updated[si].categories![ci].pricing?.filter((_, i) => i !== pi);
    setServices(updated);
  };

  const updateCalcTypeForCategory = (si: number, ci: number, pi: number, calcType: "FIXED" | "PERCENTAGE") => {
    const updated = [...services];
    updated[si].categories![ci].pricing![pi].calculationType = calcType;
    setServices(updated);
  };

  const addSlabForCategory = (si: number, ci: number, pi: number) => {
    const updated = [...services];
    const slabs = updated[si].categories![ci].pricing![pi].slabs;
    const last = slabs[slabs.length - 1];
    if (last && (last.maxAmount === null || last.maxAmount === undefined)) {
      showToast("error", "The last range is open-ended (∞). Set its Max Amount before adding another range.");
      return;
    }
    const nextMin = last ? Number(last.maxAmount) || 0 : 0;
    updated[si].categories![ci].pricing![pi].slabs = [
      ...slabs,
      { minAmount: nextMin, maxAmount: null },
    ];
    setServices(updated);
  };

  const removeSlabForCategory = (si: number, ci: number, pi: number, sli: number) => {
    const updated = [...services];
    updated[si].categories![ci].pricing![pi].slabs = updated[si].categories![ci].pricing![pi].slabs.filter((_, i) => i !== sli);
    setServices(updated);
  };

  const updateSlabForCategory = (si: number, ci: number, pi: number, sli: number, field: keyof PricingSlab, value: number | string | null) => {
    const updated = [...services];
    updated[si].categories![ci].pricing![pi].slabs[sli] = {
      ...updated[si].categories![ci].pricing![pi].slabs[sli],
      [field]: value,
    };
    setServices(updated);
  };

  // ── Service-level slab operations ──

  const addPricing = (si: number) => {
    const updated = [...services];
    const newPricing: Pricing = {
      type: "COMMISSION",
      calculationType: "FIXED",
      slabs: [{ minAmount: 0, maxAmount: null }],
    };
    updated[si].pricing = [...(updated[si].pricing || []), newPricing];
    setServices(updated);
  };

  const removePricing = (si: number, pi: number) => {
    const updated = [...services];
    updated[si].pricing = updated[si].pricing?.filter((_, i) => i !== pi);
    setServices(updated);
  };

  const updateCalcType = (si: number, pi: number, calcType: "FIXED" | "PERCENTAGE") => {
    const updated = [...services];
    updated[si].pricing![pi].calculationType = calcType;
    setServices(updated);
  };

  const addSlab = (si: number, pi: number) => {
    const updated = [...services];
    const slabs = updated[si].pricing![pi].slabs;
    const last = slabs[slabs.length - 1];
    if (last && (last.maxAmount === null || last.maxAmount === undefined)) {
      showToast("error", "The last range is open-ended (∞). Set its Max Amount before adding another range.");
      return;
    }
    const nextMin = last ? Number(last.maxAmount) || 0 : 0;
    updated[si].pricing![pi].slabs = [...slabs, { minAmount: nextMin, maxAmount: null }];
    setServices(updated);
  };

  const removeSlab = (si: number, pi: number, sli: number) => {
    const updated = [...services];
    updated[si].pricing![pi].slabs = updated[si].pricing![pi].slabs.filter((_, i) => i !== sli);
    setServices(updated);
  };

  const updateSlab = (si: number, pi: number, sli: number, field: keyof PricingSlab, value: number | string | null) => {
    const updated = [...services];
    updated[si].pricing![pi].slabs[sli] = { ...updated[si].pricing![pi].slabs[sli], [field]: value };
    setServices(updated);
  };

  // ── Render ──

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Services & Price Configuration</h2>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowServiceDropdown(!showServiceDropdown)}
            className="flex items-center gap-2 rounded-lg bg-[#315bd1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#274bbd] shadow-md"
          >
            <Plus className="h-4 w-4" />
            Add Service
            <ChevronDown className="h-4 w-4" />
          </button>

          {showServiceDropdown && (
            <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-xl">
              <div className="border-b border-gray-200 p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={serviceSearchQuery}
                    onChange={(e) => setServiceSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto py-2">
                {getFilteredServices().length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">No services found</div>
                ) : (
                  getFilteredServices().map((service) => {
                    const isAdded = services.some(s => s.serviceName === service);
                    const hasCat = hasCategories(service);
                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => !isAdded && addService(service)}
                        disabled={isAdded}
                        className={`w-full px-4 py-2.5 text-left text-sm transition ${
                          isAdded ? "cursor-not-allowed bg-gray-50 text-gray-400" : "hover:bg-blue-50 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{service}</span>
                          {isAdded && <Check className="h-4 w-4 text-green-500" />}
                        </div>
                        {hasCat && !isAdded && (
                          <div className="mt-1 text-xs text-gray-500">
                            Includes: {SERVICE_CONFIG[service as keyof typeof SERVICE_CONFIG]?.join(", ")}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {services.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm font-medium text-gray-500">No services added yet</p>
          <p className="mt-1 text-xs text-gray-400">Click "Add Service" to configure pricing</p>
        </div>
      ) : (
        <div className="space-y-6">
          {services.map((service, si) => (
            <div key={si} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              {/* Service Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold shadow-md">
                    {si + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{service.serviceName}</h3>
                    <p className="text-xs text-gray-500 capitalize">
                      {hasCategories(service.serviceName) ? "Category-based pricing" : "Service-level pricing"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeService(si)}
                  className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
                  title="Remove service"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* ── Category-based pricing ── */}
              {hasCategories(service.serviceName) ? (
                <div className="space-y-4">
                  {service.categories && service.categories.length > 0 ? (
                    service.categories.map((category, ci) => (
                      <div key={ci} className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                        {/* Category header */}
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                              {ci + 1}
                            </div>
                            <h5 className="text-sm font-semibold text-gray-900 capitalize">{category.categoryName}</h5>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCategory(si, ci)}
                            className="rounded-lg p-1 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Pricing tables for this category */}
                        {category.pricing && category.pricing.length > 0 ? (
                          <div className="space-y-4">
                            {category.pricing.map((pricing, pi) => (
                              <div key={pi} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                  <span className="text-sm font-semibold text-gray-900">
                                    Pricing #{pi + 1} <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">{pricing.type}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removePricingForCategory(si, ci, pi)}
                                    className="rounded-lg p-1 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>

                                <SlabTable
                                  pricing={pricing}
                                  serviceName={service.serviceName}
                                  onUpdateSlab={(sli, field, value) => updateSlabForCategory(si, ci, pi, sli, field, value)}
                                  onRemoveSlab={(sli) => removeSlabForCategory(si, ci, pi, sli)}
                                  onAddSlab={() => addSlabForCategory(si, ci, pi)}
                                  onCalcTypeChange={(ct) => updateCalcTypeForCategory(si, ci, pi, ct)}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addPricingForCategory(si, ci)}
                            className="flex items-center gap-1 rounded-lg border border-[#315bd1] bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#315bd1] transition hover:bg-[#315bd1] hover:text-white"
                          >
                            <Plus className="h-3 w-3" />
                            Add Pricing
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No categories added. Pricing will be applied at service level.</p>
                  )}
                </div>
              ) : (
                /* ── Service-level pricing ── */
                <div>
                  {service.pricing && service.pricing.length > 0 ? (
                    <div className="space-y-4">
                      {service.pricing.map((pricing, pi) => (
                        <div key={pi} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">
                              Pricing #{pi + 1} <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">{pricing.type}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removePricing(si, pi)}
                              className="rounded-lg p-1 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>

                          <SlabTable
                            pricing={pricing}
                            serviceName={service.serviceName}
                            onUpdateSlab={(sli, field, value) => updateSlab(si, pi, sli, field, value)}
                            onRemoveSlab={(sli) => removeSlab(si, pi, sli)}
                            onAddSlab={() => addSlab(si, pi)}
                            onCalcTypeChange={(ct) => updateCalcType(si, pi, ct)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addPricing(si)}
                      className="flex items-center gap-1 rounded-lg border border-[#315bd1] bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#315bd1] transition hover:bg-[#315bd1] hover:text-white"
                    >
                      <Plus className="h-3 w-3" />
                      Add Pricing
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 shadow-sm"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfigureServices}
          className="rounded-lg bg-gradient-to-r from-[#315bd1] to-[#274bbd] px-6 py-2.5 text-sm font-medium text-white transition hover:from-[#274bbd] hover:to-[#1e3b8d] disabled:opacity-50 shadow-md"
          disabled={configuringServices}
        >
          {configuringServices ? "Saving..." : "Save Services Configuration"}
        </button>
      </div>
    </div>
  );
};

export default EditPlanServices;
