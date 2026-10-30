import { useState, useEffect, useRef } from "react";
import { Plus, X, Trash2, Search, ChevronDown, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";

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
  "AEPS": ["cash withdrawal", "cash deposit", "mini statement"],
  "BBPS": ["electricity bill", "gas bill", "water bill", "fast tag", "lpg gas", "insurance", "life insurance", "municipal tax", "credit card"],
  "DMT": [],
  "CMS": [],
  "UPI CASH POINT": [],
  "ADHAR PAY": []
};

const AVAILABLE_SERVICES = ["AEPS", "DMT", "BBPS", "CMS", "UPI CASH POINT", "ADHAR PAY"];

interface PricingSlabCardProps {
  slab: PricingSlab;
  slabIndex: number;
  calculationType: "FIXED" | "PERCENTAGE";
  onUpdate: (field: keyof PricingSlab, value: number | string | null) => void;
  onRemove: () => void;
}

const PricingSlabCard = ({
  slab,
  slabIndex,
  calculationType,
  onUpdate,
  onRemove,
}: PricingSlabCardProps) => {
  const unitSymbol = calculationType === "PERCENTAGE" ? "%" : "₹";
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

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm transition-all hover:border-blue-200">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-600">
            {slabIndex + 1}
          </div>
          <span className="text-sm font-semibold text-gray-900">
            Range Configuration
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-1 text-red-500 transition hover:bg-red-50 hover:text-red-600"
          title="Remove range"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Min & Max Amount */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Min Amount (₹)
          </label>
          <div className="flex rounded-lg shadow-2xs">
            <span className="inline-flex items-center px-2.5 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-xs font-semibold">
              ₹
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={slab.minAmount}
              onChange={(e) =>
                onUpdate(
                  "minAmount",
                  e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                )
              }
              className="w-full rounded-r-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Max Amount (₹)
          </label>
          <div className="flex rounded-lg shadow-2xs">
            <span className="inline-flex items-center px-2.5 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-xs font-semibold">
              ₹
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={slab.maxAmount !== null && slab.maxAmount !== undefined ? slab.maxAmount : ""}
              onChange={(e) =>
                onUpdate(
                  "maxAmount",
                  e.target.value === "" ? null : isNaN(parseFloat(e.target.value)) ? null : parseFloat(e.target.value)
                )
              }
              className={`w-full rounded-r-lg border px-3 py-2 text-sm focus:outline-none ${isMaxInvalid
                ? "border-red-400 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-gray-300 focus:border-[#315bd1] focus:ring-1 focus:ring-[#315bd1]"
                }`}
              placeholder="Enter max amount"
            />
          </div>
          {isMaxInvalid && (
            <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Max amount must be greater than min amount ({slab.minAmount})
            </p>
          )}
        </div>
      </div>

      {/* Charge Amount */}
      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Charge ({unitSymbol})
        </label>
        <div className="flex rounded-lg shadow-2xs">
          <span className="inline-flex items-center px-2.5 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-xs font-semibold">
            {unitSymbol}
          </span>
          <input
            type="number"
            min="0"
            step="any"
            value={slab.chargeAmount !== null && slab.chargeAmount !== undefined ? slab.chargeAmount : ""}
            onChange={(e) =>
              onUpdate(
                "chargeAmount",
                e.target.value === "" ? null : isNaN(parseFloat(e.target.value)) ? null : parseFloat(e.target.value)
              )
            }
            className="w-full rounded-r-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
            placeholder={`Enter charge in ${unitSymbol}`}
          />
        </div>
      </div>

      {/* Commission Breakdown: Retailer First, Distributor Second, Admin Third */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Distribution Breakdown ({unitSymbol})
          </label>
          {charge !== null && charge > 0 ? (
            <span className="text-[11px] text-gray-500">
              Total to allocate: <strong className="text-gray-900">{charge} {unitSymbol}</strong>
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* 1. Retailer Amount */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Retailer Amount ({unitSymbol})
            </label>
            <div className="flex rounded-lg shadow-2xs">
              <span className="inline-flex items-center px-2 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-xs font-semibold">
                {unitSymbol}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={slab.retailerAmount !== undefined && slab.retailerAmount !== null ? slab.retailerAmount : ""}
                onChange={(e) =>
                  onUpdate(
                    "retailerAmount",
                    e.target.value === "" ? null : isNaN(parseFloat(e.target.value)) ? null : parseFloat(e.target.value)
                  )
                }
                className="w-full rounded-r-lg border border-gray-300 px-2.5 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                placeholder="0"
              />
            </div>
          </div>

          {/* 2. Distributor Amount */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Distributor Amount ({unitSymbol})
            </label>
            <div className="flex rounded-lg shadow-2xs">
              <span className="inline-flex items-center px-2 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-xs font-semibold">
                {unitSymbol}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={slab.distributorAmount !== undefined && slab.distributorAmount !== null ? slab.distributorAmount : ""}
                onChange={(e) =>
                  onUpdate(
                    "distributorAmount",
                    e.target.value === "" ? null : isNaN(parseFloat(e.target.value)) ? null : parseFloat(e.target.value)
                  )
                }
                className="w-full rounded-r-lg border border-gray-300 px-2.5 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                placeholder="0"
              />
            </div>
          </div>

          {/* 3. Admin Amount */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Admin Amount ({unitSymbol})
            </label>
            <div className="flex rounded-lg shadow-2xs">
              <span className="inline-flex items-center px-2 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-xs font-semibold">
                {unitSymbol}
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={slab.adminAmount !== undefined && slab.adminAmount !== null ? slab.adminAmount : ""}
                onChange={(e) =>
                  onUpdate(
                    "adminAmount",
                    e.target.value === "" ? null : isNaN(parseFloat(e.target.value)) ? null : parseFloat(e.target.value)
                  )
                }
                className="w-full rounded-r-lg border border-gray-300 px-2.5 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Real-time Calculation & Validation Feedback */}
        {(() => {
          if (charge !== null && charge > 0) {
            const roundedCharge = Math.round(charge * 100) / 100;
            const diff = Math.round((roundedCharge - sum) * 100) / 100;

            if (hasValues && sum === roundedCharge) {
              return (
                <div className="mt-2.5 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 border border-emerald-200">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Calculates correctly: Retailer ({ret}) + Distributor ({dist}) + Admin ({adm}) = {sum} {unitSymbol} (Matches Charge)
                  </span>
                  <span className="font-bold text-emerald-700">✓ Balanced</span>
                </div>
              );
            } else if (hasValues && sum > roundedCharge) {
              return (
                <div className="mt-2.5 flex items-center justify-between rounded-lg bg-rose-50 px-3 py-1.5 text-xs text-rose-800 border border-rose-200">
                  <span className="flex items-center gap-1.5 font-medium">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    Total sum ({sum} {unitSymbol}) exceeds Charge ({roundedCharge} {unitSymbol}) by {Math.abs(diff)} {unitSymbol}
                  </span>
                  <span className="font-bold text-rose-700">Exceeded</span>
                </div>
              );
            } else if (hasValues && sum < roundedCharge) {
              return (
                <div className="mt-2.5 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800 border border-amber-200">
                  <span className="flex items-center gap-1.5 font-medium">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    Allocated sum: {sum} / {roundedCharge} {unitSymbol} — Remaining to allocate: {diff} {unitSymbol}
                  </span>
                  <span className="font-semibold text-amber-700">Incomplete</span>
                </div>
              );
            }
          } else if (hasValues) {
            return (
              <div className="mt-2 text-right text-xs text-gray-500">
                Total Distributed: <strong className="text-gray-800">{sum} {unitSymbol}</strong>
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
};

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
  // Service dropdown states
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
    // Check if service already exists
    if (services.some(s => s.serviceName === serviceName)) {
      toast.error("This service is already added");
      return;
    }

    const predefinedCategories = SERVICE_CONFIG[serviceName as keyof typeof SERVICE_CONFIG] || [];
    const newService: ServiceFormData = {
      serviceName,
      categories: predefinedCategories.map(cat => ({
        categoryName: cat,
        pricing: []
      })),
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
    const updatedServices = [...services];
    updatedServices[serviceIndex].categories = updatedServices[serviceIndex].categories?.filter((_, i) => i !== categoryIndex);
    setServices(updatedServices);
  };

  const addPricingForCategory = (serviceIndex: number, categoryIndex: number) => {
    const newPricing: Pricing = {
      type: "COMMISSION",
      calculationType: "FIXED",
      slabs: [{ minAmount: 0, maxAmount: null }],
    };
    const updatedServices = [...services];
    if (updatedServices[serviceIndex].categories) {
      updatedServices[serviceIndex].categories![categoryIndex].pricing = [
        ...(updatedServices[serviceIndex].categories![categoryIndex].pricing || []),
        newPricing,
      ];
    }
    setServices(updatedServices);
  };

  const removePricingForCategory = (serviceIndex: number, categoryIndex: number, pricingIndex: number) => {
    const updatedServices = [...services];
    if (updatedServices[serviceIndex].categories) {
      updatedServices[serviceIndex].categories![categoryIndex].pricing = updatedServices[serviceIndex].categories![categoryIndex].pricing?.filter(
        (_, i) => i !== pricingIndex
      );
    }
    setServices(updatedServices);
  };

  const updatePricingForCategory = (serviceIndex: number, categoryIndex: number, pricingIndex: number, field: keyof Pricing, value: string) => {
    const updatedServices = [...services];
    if (updatedServices[serviceIndex].categories && updatedServices[serviceIndex].categories![categoryIndex].pricing) {
      updatedServices[serviceIndex].categories![categoryIndex].pricing![pricingIndex] = {
        ...updatedServices[serviceIndex].categories![categoryIndex].pricing![pricingIndex],
        [field]: value,
      };
    }
    setServices(updatedServices);
  };

  const addSlabForCategory = (serviceIndex: number, categoryIndex: number, pricingIndex: number) => {
    const updatedServices = [...services];
    if (updatedServices[serviceIndex].categories && updatedServices[serviceIndex].categories![categoryIndex].pricing) {
      updatedServices[serviceIndex].categories![categoryIndex].pricing![pricingIndex].slabs = [
        ...updatedServices[serviceIndex].categories![categoryIndex].pricing![pricingIndex].slabs,
        { minAmount: 0, maxAmount: null },
      ];
    }
    setServices(updatedServices);
  };

  const removeSlabForCategory = (serviceIndex: number, categoryIndex: number, pricingIndex: number, slabIndex: number) => {
    const updatedServices = [...services];
    if (updatedServices[serviceIndex].categories && updatedServices[serviceIndex].categories![categoryIndex].pricing) {
      updatedServices[serviceIndex].categories![categoryIndex].pricing![pricingIndex].slabs = updatedServices[serviceIndex].categories![categoryIndex].pricing![pricingIndex].slabs.filter(
        (_, i) => i !== slabIndex
      );
    }
    setServices(updatedServices);
  };

  const updateSlabForCategory = (
    serviceIndex: number,
    categoryIndex: number,
    pricingIndex: number,
    slabIndex: number,
    field: keyof PricingSlab,
    value: number | string | null
  ) => {
    const updatedServices = [...services];
    if (updatedServices[serviceIndex].categories && updatedServices[serviceIndex].categories![categoryIndex].pricing) {
      updatedServices[serviceIndex].categories![categoryIndex].pricing![pricingIndex].slabs[slabIndex] = {
        ...updatedServices[serviceIndex].categories![categoryIndex].pricing![pricingIndex].slabs[slabIndex],
        [field]: value,
      };
    }
    setServices(updatedServices);
  };

  const addPricing = (serviceIndex: number) => {
    const newPricing: Pricing = {
      type: "COMMISSION",
      calculationType: "FIXED",
      slabs: [{ minAmount: 0, maxAmount: null }],
    };
    const updatedServices = [...services];
    updatedServices[serviceIndex].pricing = [...(updatedServices[serviceIndex].pricing || []), newPricing];
    setServices(updatedServices);
  };

  const removePricing = (serviceIndex: number, pricingIndex: number) => {
    const updatedServices = [...services];
    updatedServices[serviceIndex].pricing = updatedServices[serviceIndex].pricing?.filter((_, i) => i !== pricingIndex);
    setServices(updatedServices);
  };

  const updatePricing = (serviceIndex: number, pricingIndex: number, field: keyof Pricing, value: string) => {
    const updatedServices = [...services];
    if (updatedServices[serviceIndex].pricing) {
      updatedServices[serviceIndex].pricing![pricingIndex] = {
        ...updatedServices[serviceIndex].pricing![pricingIndex],
        [field]: value,
      };
    }
    setServices(updatedServices);
  };

  const addSlab = (serviceIndex: number, pricingIndex: number) => {
    const updatedServices = [...services];
    if (updatedServices[serviceIndex].pricing) {
      updatedServices[serviceIndex].pricing![pricingIndex].slabs = [
        ...updatedServices[serviceIndex].pricing![pricingIndex].slabs,
        { minAmount: 0, maxAmount: null },
      ];
    }
    setServices(updatedServices);
  };

  const removeSlab = (serviceIndex: number, pricingIndex: number, slabIndex: number) => {
    const updatedServices = [...services];
    if (updatedServices[serviceIndex].pricing) {
      updatedServices[serviceIndex].pricing![pricingIndex].slabs = updatedServices[serviceIndex].pricing![pricingIndex].slabs.filter(
        (_, i) => i !== slabIndex
      );
    }
    setServices(updatedServices);
  };

  const updateSlab = (
    serviceIndex: number,
    pricingIndex: number,
    slabIndex: number,
    field: keyof PricingSlab,
    value: number | string | null
  ) => {
    const updatedServices = [...services];
    if (updatedServices[serviceIndex].pricing) {
      updatedServices[serviceIndex].pricing![pricingIndex].slabs[slabIndex] = {
        ...updatedServices[serviceIndex].pricing![pricingIndex].slabs[slabIndex],
        [field]: value,
      };
    }
    setServices(updatedServices);
  };

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
                        className={`w-full px-4 py-2.5 text-left text-sm transition ${isAdded
                          ? "cursor-not-allowed bg-gray-50 text-gray-400"
                          : "hover:bg-blue-50 text-gray-700"
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
          {services.map((service, serviceIndex) => (
            <div key={serviceIndex} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold shadow-md">
                    {serviceIndex + 1}
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
                  onClick={() => removeService(serviceIndex)}
                  className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                  title="Remove service"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Service Name */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={service.serviceName}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                    placeholder="Service name"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {hasCategories(service.serviceName) ? "Has Categories" : "Service Level"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Categories Section */}
              {hasCategories(service.serviceName) ? (
                <div className="mb-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">Predefined Categories</h4>
                    <span className="text-xs text-gray-500">
                      {service.categories?.length || 0} categories
                    </span>
                  </div>

                  {service.categories && service.categories.length > 0 ? (
                    <div className="space-y-3">
                      {service.categories.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-4 transition hover:border-blue-300">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                                {categoryIndex + 1}
                              </div>
                              <h5 className="text-sm font-semibold text-gray-900 capitalize">{category.categoryName}</h5>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCategory(serviceIndex, categoryIndex)}
                              className="rounded-lg p-1 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                              title="Remove category"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Category Name - Read Only for predefined categories */}
                          <div className="mb-3">
                            <label className="mb-1 block text-xs font-medium text-gray-500">
                              Category Name
                            </label>
                            <input
                              type="text"
                              value={category.categoryName}
                              readOnly
                              className="w-full rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-700 focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                            />
                          </div>

                          {/* Category Pricing */}
                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <label className="block text-xs font-medium text-gray-700">
                                Pricing Configuration
                              </label>
                              {(!category.pricing || category.pricing.length === 0) && (
                                <button
                                  type="button"
                                  onClick={() => addPricingForCategory(serviceIndex, categoryIndex)}
                                  className="flex items-center gap-1 rounded-lg border border-[#315bd1] bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#315bd1] transition hover:bg-[#315bd1] hover:text-white"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add Pricing
                                </button>
                              )}
                            </div>

                            {category.pricing && category.pricing.length > 0 ? (
                              <div className="space-y-3">
                                {category.pricing.map((pricing, pricingIndex) => (
                                  <div key={pricingIndex} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="mb-3 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                                          {pricingIndex + 1}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">Pricing Configuration</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removePricingForCategory(serviceIndex, categoryIndex, pricingIndex)}
                                        className="rounded-lg p-1 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                                        title="Remove pricing"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>

                                    {/* Calculation Type */}
                                    <div className="mb-3">
                                      <label className="mb-1 block text-xs font-medium text-gray-700">
                                        Calculation Type
                                      </label>
                                      <select
                                        value={pricing.calculationType}
                                        onChange={(e) => updatePricingForCategory(serviceIndex, categoryIndex, pricingIndex, "calculationType", e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                                      >
                                        <option value="FIXED">Fixed</option>
                                        <option value="PERCENTAGE">Percentage</option>
                                      </select>
                                    </div>

                                    {/* Slabs */}
                                    <div>
                                      <div className="mb-3 flex items-center justify-between">
                                        <label className="block text-xs font-medium text-gray-700">
                                          Amount Ranges
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => addSlabForCategory(serviceIndex, categoryIndex, pricingIndex)}
                                          className="flex items-center gap-1 rounded-lg border border-[#315bd1] bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#315bd1] transition hover:bg-[#315bd1] hover:text-white"
                                        >
                                          <Plus className="h-3 w-3" />
                                          Add Range
                                        </button>
                                      </div>

                                      <div className="space-y-3">
                                        {pricing.slabs.map((slab, slabIndex) => (
                                          <PricingSlabCard
                                            key={slabIndex}
                                            slab={slab}
                                            slabIndex={slabIndex}
                                            calculationType={pricing.calculationType}
                                            onUpdate={(field, value) =>
                                              updateSlabForCategory(
                                                serviceIndex,
                                                categoryIndex,
                                                pricingIndex,
                                                slabIndex,
                                                field,
                                                value
                                              )
                                            }
                                            onRemove={() =>
                                              removeSlabForCategory(
                                                serviceIndex,
                                                categoryIndex,
                                                pricingIndex,
                                                slabIndex
                                              )
                                            }
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">No pricing configured for this category.</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No categories added. Pricing will be applied at service level.</p>
                  )}
                </div>
              ) : (
                <>
                  {/* Info box for services without categories */}
                  {!hasCategories(service.serviceName) && (
                    <div className="mb-4 rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <Check className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Service-Level Pricing</p>
                          <p className="text-xs text-gray-600">This service uses service-level pricing configuration</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Service Level Pricing */}
                  {!hasCategories(service.serviceName) && (!service.categories || service.categories.length === 0) && (
                    <div className="mb-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">Service Level Pricing</h4>
                        {(!service.pricing || service.pricing.length === 0) && (
                          <button
                            type="button"
                            onClick={() => addPricing(serviceIndex)}
                            className="flex items-center gap-1 rounded-lg border border-[#315bd1] bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#315bd1] transition hover:bg-[#315bd1] hover:text-white"
                          >
                            <Plus className="h-3 w-3" />
                            Add Pricing
                          </button>
                        )}
                      </div>

                      {service.pricing && service.pricing.length > 0 ? (
                        <div className="space-y-4">
                          {service.pricing.map((pricing, pricingIndex) => (
                            <div key={pricingIndex} className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-4 shadow-sm">
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                                    {pricingIndex + 1}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900">Pricing Configuration</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removePricing(serviceIndex, pricingIndex)}
                                  className="rounded-lg p-1 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                                  title="Remove pricing"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Calculation Type */}
                              <div className="mb-3">
                                <label className="mb-1 block text-xs font-medium text-gray-700">
                                  Calculation Type
                                </label>
                                <select
                                  value={pricing.calculationType}
                                  onChange={(e) => updatePricing(serviceIndex, pricingIndex, "calculationType", e.target.value)}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-1 focus:ring-[#315bd1]"
                                >
                                  <option value="FIXED">Fixed</option>
                                  <option value="PERCENTAGE">Percentage</option>
                                </select>
                              </div>

                              {/* Slabs */}
                              <div>
                                <div className="mb-3 flex items-center justify-between">
                                  <label className="block text-xs font-medium text-gray-700">
                                    Amount Ranges
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => addSlab(serviceIndex, pricingIndex)}
                                    className="flex items-center gap-1 rounded-lg border border-[#315bd1] bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#315bd1] transition hover:bg-[#315bd1] hover:text-white"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Add Range
                                  </button>
                                </div>

                                <div className="space-y-3">
                                  {pricing.slabs.map((slab, slabIndex) => (
                                    <PricingSlabCard
                                      key={slabIndex}
                                      slab={slab}
                                      slabIndex={slabIndex}
                                      calculationType={pricing.calculationType}
                                      onUpdate={(field, value) =>
                                        updateSlab(
                                          serviceIndex,
                                          pricingIndex,
                                          slabIndex,
                                          field,
                                          value
                                        )
                                      }
                                      onRemove={() =>
                                        removeSlab(
                                          serviceIndex,
                                          pricingIndex,
                                          slabIndex
                                        )
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No pricing configured. Click "Add Pricing" to start.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
