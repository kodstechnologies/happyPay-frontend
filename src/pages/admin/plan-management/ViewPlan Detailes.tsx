import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, DollarSign, Percent, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getPlanById, type Plan } from "../../../apis/pricingApi";

const ViewPlanDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPlan = async () => {
      if (!id) return;
      try {
        const planData = await getPlanById(id);
        setPlan(planData);
      } catch (error) {
        console.error("Failed to fetch plan:", error);
        alert("Failed to load plan details");
        navigate("/admin/plan-management");
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [id, navigate]);

  const toggleService = (serviceId: string) => {
    setExpandedServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  if (!plan) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gray-500">Plan not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/plan-management")}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Plan Details</h1>
          <p className="mt-1 text-sm text-gray-500">View complete plan information and pricing structure</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="p-6">
            <div className="flex gap-6">
              {/* Plan Image */}
              <div className="flex-shrink-0">
                <div className="h-48 w-48 rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {plan.image ? (
                    <img src={plan.image} alt={plan.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Layers className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No Image</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Plan Details */}
              <div className="flex-1 grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Plan Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{plan.name}</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Description
                  </label>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {plan.description || "No description provided"}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-2">
                    {plan.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Validity Period
                  </label>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{plan.validityPeriod}</span>
                    <span className="text-gray-500">{plan.validityUnit.toLowerCase()}</span>
                  </div>
                </div>

                {plan.createdAt && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Created On
                    </label>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(plan.createdAt)}
                    </div>
                  </div>
                )}

                {plan.updatedAt && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Last Updated
                    </label>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(plan.updatedAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Services Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Services & Pricing Configuration</h2>
            <p className="mt-1 text-sm text-gray-500">
              {plan.services.length} {plan.services.length === 1 ? "service" : "services"} configured
            </p>
          </div>

          {plan.services.length === 0 ? (
            <div className="p-12 text-center">
              <Layers className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No services configured for this plan</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {plan.services.map((service, serviceIndex) => {
                const isServiceExpanded = expandedServices.has(service._id || serviceIndex.toString());
                const hasCategories = service.categories && service.categories.length > 0;
                const hasServicePricing = service.pricing && service.pricing.length > 0;

                return (
                  <div key={service._id || serviceIndex} className="p-6">
                    {/* Service Header */}
                    <div
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-3 -mx-3 transition-colors"
                      onClick={() => toggleService(service._id || serviceIndex.toString())}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Layers className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{service.serviceId}</h3>
                          <p className="text-xs text-gray-500">
                            {hasCategories ? `${service.categories.length} categories` : "Service-level pricing"}
                          </p>
                        </div>
                      </div>
                      {isServiceExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    {/* Service Content */}
                    {isServiceExpanded && (
                      <div className="mt-4 space-y-4">
                        {/* Categories */}
                        {hasCategories && (
                          <div className="space-y-3">
                            {service.categories.map((category, categoryIndex) => {
                              const isCategoryExpanded = expandedCategories.has(
                                category._id || `${serviceIndex}-${categoryIndex}`
                              );
                              const hasPricing = category.pricing && category.pricing.length > 0;

                              return (
                                <div
                                  key={category._id || categoryIndex}
                                  className="border border-gray-200 rounded-lg overflow-hidden"
                                >
                                  {/* Category Header */}
                                  <div
                                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-3 transition-colors"
                                    onClick={() =>
                                      toggleCategory(category._id || `${serviceIndex}-${categoryIndex}`)
                                    }
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="h-8 w-8 rounded bg-purple-50 flex items-center justify-center">
                                        <Layers className="h-4 w-4 text-purple-600" />
                                      </div>
                                      <span className="font-medium text-gray-900 capitalize">
                                        {category.categoryName}
                                      </span>
                                    </div>
                                    {isCategoryExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>

                                  {/* Category Pricing */}
                                  {isCategoryExpanded && (
                                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                                      {!hasPricing ? (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                          No pricing configured
                                        </p>
                                      ) : (
                                        <div className="space-y-4">
                                          {category.pricing.map((pricing, pricingIndex) => (
                                            <PricingSection
                                              key={pricing._id || pricingIndex}
                                              pricing={pricing}
                                              index={pricingIndex}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Service-level Pricing (if no categories) */}
                        {!hasCategories && hasServicePricing && (
                          <div className="space-y-4">
                            {service.pricing?.map((pricing, pricingIndex) => (
                              <PricingSection
                                key={pricing._id || pricingIndex}
                                pricing={pricing}
                                index={pricingIndex}
                              />
                            ))}
                          </div>
                        )}

                        {/* No pricing configured */}
                        {!hasCategories && !hasServicePricing && (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">No pricing configured for this service</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for displaying pricing details
const PricingSection = ({ pricing, index }: { pricing: Pricing; index: number }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Pricing Header */}
      <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase">Pricing #{index + 1}</span>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {pricing.type}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
            {pricing.calculationType}
          </span>
        </div>
      </div>

      {/* Pricing Slabs */}
      <div className="p-4">
        {!pricing.slabs || pricing.slabs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No slabs configured</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-700 text-xs uppercase tracking-wide">
                    Min Amount
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700 text-xs uppercase tracking-wide">
                    Max Amount
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700 text-xs uppercase tracking-wide">
                    Charge
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700 text-xs uppercase tracking-wide">
                    Admin
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700 text-xs uppercase tracking-wide">
                    Distributor
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700 text-xs uppercase tracking-wide">
                    Retailer
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricing.slabs.map((slab: PricingSlab, slabIndex: number) => (
                  <tr key={slabIndex} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 px-3 text-gray-900 font-medium">
                      {slab.minAmount.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {slab.maxAmount ? slab.maxAmount.toLocaleString() : "Unlimited"}
                    </td>
                    <td className="py-2 px-3">
                      {slab.chargeAmount !== null && slab.chargeAmount !== undefined ? (
                        <div className="flex items-center gap-1">
                          {pricing.calculationType === "PERCENTAGE" ? (
                            <Percent className="h-3 w-3 text-gray-400" />
                          ) : (
                            <DollarSign className="h-3 w-3 text-gray-400" />
                          )}
                          <span className="text-gray-900 font-medium">{slab.chargeAmount}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {slab.adminAmount !== null && slab.adminAmount !== undefined ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-900">{slab.adminAmount}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {slab.distributorAmount !== null && slab.distributorAmount !== undefined ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-900">{slab.distributorAmount}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {slab.retailerAmount !== null && slab.retailerAmount !== undefined ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-900">{slab.retailerAmount}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewPlanDetails;
