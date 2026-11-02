import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, DollarSign, Percent, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getPlanById, type Plan, type PlanRange } from "../../../apis/pricingApi";
import { showToast } from "../../../utils/toast";

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
        showToast("error", error, "Failed to load plan details");
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-6">
            {plan.imageUrl ? (
              <div className="h-24 w-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                <img src={plan.imageUrl} alt={plan.name} className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    plan.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {plan.status === "ACTIVE" ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {plan.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>
                    Validity: {plan.validityPeriod} {plan.validityUnit.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {formatDate(plan.createdAt || "")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">
              Configured Services ({plan.services?.length || 0})
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (expandedServices.size === plan.services?.length) {
                    setExpandedServices(new Set());
                  } else {
                    setExpandedServices(new Set(plan.services?.map((s) => s.serviceId) || []));
                  }
                }}
                className="text-xs text-[#315bd1] hover:underline font-medium"
              >
                {expandedServices.size === plan.services?.length ? "Collapse All" : "Expand All"}
              </button>
            </div>
          </div>

          {plan.services && plan.services.length > 0 ? (
            <div className="space-y-4">
              {plan.services.map((service) => {
                const isExpanded = expandedServices.has(service.serviceId);
                const categories = service.categories || [];
                const directRanges = service.ranges || [];

                return (
                  <div
                    key={service.serviceId}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  >
                    {/* Service Header */}
                    <div
                      onClick={() => toggleService(service.serviceId)}
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-[#315bd1]">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{service.serviceName}</h4>
                            <span className="text-xs text-gray-500">({service.serviceCode})</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                service.chargeType === "FLAT"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {service.chargeType}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {categories.length > 0
                              ? `${categories.length} Categories configured`
                              : `${directRanges.length} Direct Ranges configured`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          {isExpanded ? "Click to collapse" : "Click to view details"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Service Content */}
                    {isExpanded && (
                      <div className="p-5 bg-gray-50/50 space-y-4">
                        {/* Categories View */}
                        {categories.length > 0 ? (
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Categories & Slabs
                            </h5>
                            {categories.map((cat, idx) => {
                              const catKey = `${service.serviceId}-${cat.categoryId || idx}`;
                              const isCatExpanded = expandedCategories.has(catKey);

                              return (
                                <div
                                  key={catKey}
                                  className="bg-white rounded border border-gray-200 overflow-hidden"
                                >
                                  <div
                                    onClick={() => toggleCategory(catKey)}
                                    className="p-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100/70"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm text-gray-800">
                                        {cat.categoryName}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        ({cat.ranges?.length || 0} ranges)
                                      </span>
                                    </div>
                                    {isCatExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-gray-500" />
                                    )}
                                  </div>

                                  {isCatExpanded && (
                                    <div className="p-3 overflow-x-auto">
                                      <table className="w-full text-left text-xs">
                                        <thead>
                                          <tr className="border-b border-gray-200 text-gray-500 pb-2">
                                            <th className="pb-2 font-medium">Min Amount</th>
                                            <th className="pb-2 font-medium">Max Amount</th>
                                            <th className="pb-2 font-medium">Charge Type</th>
                                            <th className="pb-2 font-medium">Charge</th>
                                            <th className="pb-2 font-medium">Retailer Comm.</th>
                                            <th className="pb-2 font-medium">Distributor Comm.</th>
                                            <th className="pb-2 font-medium">Admin Comm.</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {cat.ranges?.map((range: PlanRange, rIdx: number) => (
                                            <tr key={rIdx} className="text-gray-700">
                                              <td className="py-2">₹{range.minAmount}</td>
                                              <td className="py-2">₹{range.maxAmount}</td>
                                              <td className="py-2">
                                                <span className="inline-flex items-center gap-1 font-medium">
                                                  {range.chargeType === "PERCENTAGE" ? (
                                                    <Percent className="h-3 w-3 text-blue-500" />
                                                  ) : (
                                                    <DollarSign className="h-3 w-3 text-purple-500" />
                                                  )}
                                                  {range.chargeType}
                                                </span>
                                              </td>
                                              <td className="py-2 font-semibold">
                                                {range.chargeType === "PERCENTAGE"
                                                  ? `${range.charge}%`
                                                  : `₹${range.charge}`}
                                              </td>
                                              <td className="py-2 text-green-600 font-medium">
                                                {range.chargeType === "PERCENTAGE"
                                                  ? `${range.retailerRate}%`
                                                  : `₹${range.retailerRate}`}
                                              </td>
                                              <td className="py-2 text-blue-600 font-medium">
                                                {range.chargeType === "PERCENTAGE"
                                                  ? `${range.distributorRate}%`
                                                  : `₹${range.distributorRate}`}
                                              </td>
                                              <td className="py-2 text-purple-600 font-medium">
                                                {range.chargeType === "PERCENTAGE"
                                                  ? `${range.adminRate}%`
                                                  : `₹${range.adminRate}`}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        {/* Direct Ranges View */}
                        {directRanges.length > 0 ? (
                          <div className="bg-white rounded border border-gray-200 p-3">
                            <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                              Configured Ranges
                            </h5>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-gray-200 text-gray-500 pb-2">
                                    <th className="pb-2 font-medium">Min Amount</th>
                                    <th className="pb-2 font-medium">Max Amount</th>
                                    <th className="pb-2 font-medium">Charge Type</th>
                                    <th className="pb-2 font-medium">Charge</th>
                                    <th className="pb-2 font-medium">Retailer Comm.</th>
                                    <th className="pb-2 font-medium">Distributor Comm.</th>
                                    <th className="pb-2 font-medium">Admin Comm.</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {directRanges.map((range: PlanRange, rIdx: number) => (
                                    <tr key={rIdx} className="text-gray-700">
                                      <td className="py-2">₹{range.minAmount}</td>
                                      <td className="py-2">₹{range.maxAmount}</td>
                                      <td className="py-2">
                                        <span className="inline-flex items-center gap-1 font-medium">
                                          {range.chargeType === "PERCENTAGE" ? (
                                            <Percent className="h-3 w-3 text-blue-500" />
                                          ) : (
                                            <DollarSign className="h-3 w-3 text-purple-500" />
                                          )}
                                          {range.chargeType}
                                        </span>
                                      </td>
                                      <td className="py-2 font-semibold">
                                        {range.chargeType === "PERCENTAGE"
                                          ? `${range.charge}%`
                                          : `₹${range.charge}`}
                                      </td>
                                      <td className="py-2 text-green-600 font-medium">
                                        {range.chargeType === "PERCENTAGE"
                                          ? `${range.retailerRate}%`
                                          : `₹${range.retailerRate}`}
                                      </td>
                                      <td className="py-2 text-blue-600 font-medium">
                                        {range.chargeType === "PERCENTAGE"
                                          ? `${range.distributorRate}%`
                                          : `₹${range.distributorRate}`}
                                      </td>
                                      <td className="py-2 text-purple-600 font-medium">
                                        {range.chargeType === "PERCENTAGE"
                                          ? `${range.adminRate}%`
                                          : `₹${range.adminRate}`}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : null}

                        {categories.length === 0 && directRanges.length === 0 ? (
                          <div className="text-center py-4 text-xs text-gray-500">
                            No pricing slabs or categories configured for this service.
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-sm text-gray-500">
              No services configured in this plan yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewPlanDetails;
