import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
  RefreshCw,
  Search,
  Tag,

  ArrowRight,
  Eye,
  AlertCircle,
  Crown,
  History,
  X,

} from "lucide-react";
import { toast } from "react-toastify";
import {
  getPlans,
  getSubscribedPlans,
  subscribeToPlan,
  type Plan,
  type UserSubscription,
} from "../../../apis/pricingApi";

export default function RetailerPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"available" | "subscribed">("available");
  const [searchQuery, setSearchQuery] = useState("");

  // Plan Details Modal
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<Plan | null>(null);

  // Subscribe Confirmation Modal
  const [planToSubscribe, setPlanToSubscribe] = useState<Plan | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  // Fetch all data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [plansData, subsData] = await Promise.all([
        getPlans({ status: "ACTIVE" }).catch((err) => {
          console.error("Failed to fetch plans:", err);
          return { data: [], pagination: {} };
        }),
        getSubscribedPlans().catch((err) => {
          console.error("Failed to fetch subscriptions:", err);
          return { data: [], pagination: {} };
        }),
      ]);

      // Extract data from paginated response
      const plansArray = Array.isArray(plansData) ? plansData : plansData?.data || [];
      const subsArray = Array.isArray(subsData) ? subsData : subsData?.data || [];

      setPlans(plansArray);
      setSubscriptions(subsArray);
    } catch (error) {
      console.error("Failed to load plans data:", error);
      toast.error("Could not load plans data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  // Current active subscription
  const activeSubscription = useMemo(() => {
    const now = new Date();
    return (
      subscriptions.find(
        (sub) =>
          !sub.isExpired &&
          !sub.cancelledAt &&
          sub.expiresAt &&
          new Date(sub.expiresAt) > now
      ) || null
    );
  }, [subscriptions]);

  const activePlanId = useMemo(() => {
    if (!activeSubscription) return null;
    if (typeof activeSubscription.planId === "object" && activeSubscription.planId?._id) {
      return activeSubscription.planId._id;
    }
    return String(activeSubscription.planId);
  }, [activeSubscription]);

  const activePlan = useMemo<Plan | null>(() => {
    if (activeSubscription && typeof activeSubscription.planId === "object" && activeSubscription.planId) {
      return activeSubscription.planId as Plan;
    }
    return null;
  }, [activeSubscription]);

  // Filtered available plans
  const filteredPlans = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return plans;
    return plans.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.services?.some((s) => s.serviceId.toLowerCase().includes(q))
    );
  }, [plans, searchQuery]);

  // Handle plan subscription
  const handleConfirmSubscribe = async () => {
    if (!planToSubscribe) return;

    setSubscribing(true);
    try {
      await subscribeToPlan(planToSubscribe._id);
      toast.success(`Successfully subscribed to ${planToSubscribe.name}!`);
      setPlanToSubscribe(null);
      // Re-fetch to update state
      await fetchData(true);
      setActiveTab("subscribed");
    } catch (error: unknown) {
      console.error("Failed to subscribe:", error);
      const msg = (error as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || "Subscription failed. Please try again.";
      toast.error(msg);
    } finally {
      setSubscribing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateDaysRemaining = (expiresAt?: string) => {
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/20">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Plans & Subscriptions
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Subscribe to commission tiers and maximize your earnings per service
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-purple-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Hero Banner: Active Subscription Summary */}
      {activeSubscription && activePlan && (
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl shadow-purple-950/10">
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-purple-200 backdrop-blur-md border border-white/10">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Active Subscription
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {activePlan.name}
                  </h2>
                  <p className="mt-1 max-w-xl text-xs sm:text-sm text-purple-200/80 leading-relaxed">
                    {activePlan.description ||
                      "You are currently enjoying prime commission rates and priority services."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-purple-200">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <span>Subscribed: {formatDate(activeSubscription.subscribedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-purple-400" />
                    <span>Expires: {formatDate(activeSubscription.expiresAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-md border border-white/10">
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">
                    {calculateDaysRemaining(activeSubscription.expiresAt)}
                  </div>
                  <div className="text-[11px] font-medium text-purple-200 uppercase tracking-wider">
                    Days Left
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("subscribed")}
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs sm:text-sm font-bold text-purple-900 shadow-md hover:bg-purple-50 transition-colors"
                >
                  <History className="h-4 w-4" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("available")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "available"
                ? "bg-purple-600 text-white shadow-sm shadow-purple-600/20"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Available Plans ({plans.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("subscribed")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "subscribed"
                ? "bg-purple-600 text-white shadow-sm shadow-purple-600/20"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <History className="h-4 w-4" />
            <span>My Subscriptions ({subscriptions.length})</span>
          </button>
        </div>

        {activeTab === "available" && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plans or services..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10"
            />
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-96 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs animate-pulse flex flex-col"
            >
              <div className="h-12 w-12 rounded-xl bg-slate-200" />
              <div className="mt-4 h-6 w-3/4 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-full rounded bg-slate-100" />
              <div className="mt-6 h-20 w-full rounded-xl bg-slate-100" />
              <div className="mt-auto h-11 w-full rounded-xl bg-slate-200" />
            </div>
          ))}
        </div>
      ) : activeTab === "available" ? (
        /* AVAILABLE PLANS TAB */
        filteredPlans.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
            <Sparkles className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-800">No active plans found</h3>
            <p className="mt-1 text-xs text-slate-500">
              There are currently no active plans available for subscription.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan) => {
              const isCurrentPlan = activePlanId === plan._id;

              return (
                <div
                  key={plan._id}
                  className={`group relative flex flex-col rounded-3xl border bg-white shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden ${
                    isCurrentPlan
                      ? "border-purple-500/80 ring-2 ring-purple-500/10"
                      : "border-slate-200/90 hover:border-purple-300"
                  }`}
                >
                  {/* Top Header Decoration */}
                  <div
                    className={`h-2 w-full ${
                      isCurrentPlan
                        ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500"
                        : "bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all"
                    }`}
                  />

                  <div className="p-6 flex flex-col flex-1">
                    {/* Header: Image & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-2xs">
                        {plan.image ? (
                          <img
                            src={plan.image}
                            alt={plan.name}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Crown className="h-6 w-6 text-purple-600" />
                        )}
                      </div>

                      {isCurrentPlan ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Current Plan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 border border-purple-100">
                          Available
                        </span>
                      )}
                    </div>

                    {/* Plan Title & Description */}
                    <div className="mt-4">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                        {plan.name}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 min-h-[34px] leading-relaxed">
                        {plan.description || "Enjoy premium commissions and priority processing benefits."}
                      </p>
                    </div>

                    {/* Validity Period Chip */}
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-purple-50/60 p-3 border border-purple-100/80">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-semibold text-slate-600">Validity:</span>
                      </div>
                      <span className="text-xs font-extrabold text-purple-900 capitalize">
                        {plan.validityPeriod} {(plan.validityUnit || "MONTHS").toLowerCase()}
                      </span>
                    </div>

                    {/* Services Included */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-purple-600" />
                          Configured Services
                        </span>
                        <span className="text-[11px] font-bold text-purple-600">
                          {plan.services?.length || 0} Total
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                        {plan.services && plan.services.length > 0 ? (
                          <>
                            {plan.services.slice(0, 3).map((s, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700"
                              >
                                <Tag className="h-2.5 w-2.5 text-purple-500" />
                                {s.serviceId}
                              </span>
                            ))}
                            {plan.services.length > 3 && (
                              <span className="inline-flex items-center rounded-lg border border-purple-100 bg-purple-50 px-2 py-1 text-[11px] font-bold text-purple-700">
                                +{plan.services.length - 3} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] italic text-slate-400">
                            General benefits included
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto pt-6 flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedPlanDetails(plan)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        <span>View Benefits & Slabs</span>
                      </button>

                      {isCurrentPlan ? (
                        <button
                          disabled
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-xs sm:text-sm font-bold text-emerald-700 border border-emerald-200 cursor-default"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Active on Your Account</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setPlanToSubscribe(plan)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:from-purple-700 hover:to-indigo-700 hover:shadow-md transition-all active:scale-[0.98]"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>{activeSubscription ? "Switch to this Plan" : "Subscribe Now"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* SUBSCRIBED PLANS TAB */
        subscriptions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
            <History className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-800">No subscriptions found</h3>
            <p className="mt-1 text-xs text-slate-500">
              You have not subscribed to any pricing plans yet.
            </p>
            <button
              onClick={() => setActiveTab("available")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-purple-700 transition-colors"
            >
              <span>Explore Available Plans</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => {
              const plan = typeof sub.planId === "object" ? sub.planId : null;
              const isCurrent =
                !sub.isExpired &&
                !sub.cancelledAt &&
                sub.expiresAt &&
                new Date(sub.expiresAt) > new Date();

              return (
                <div
                  key={sub._id}
                  className={`rounded-2xl border bg-white p-5 sm:p-6 shadow-2xs transition-all ${
                    isCurrent
                      ? "border-emerald-200 ring-1 ring-emerald-500/10"
                      : "border-slate-200/90 opacity-90"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
                        <Crown className="h-6 w-6" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-slate-900">
                            {plan ? plan.name : "Custom Plan"}
                          </h4>
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : sub.cancelledAt ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                              Replaced / Cancelled
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                              Expired
                            </span>
                          )}
                        </div>

                        {plan?.description && (
                          <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                            {plan.description}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>Subscribed: {formatDate(sub.subscribedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>Expires: {formatDate(sub.expiresAt)}</span>
                          </div>
                          {isCurrent && (
                            <span className="font-semibold text-purple-700">
                              ({calculateDaysRemaining(sub.expiresAt)} days remaining)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {plan && (
                        <button
                          onClick={() => setSelectedPlanDetails(plan)}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                          <span>View Plan</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Subscribe Confirmation Modal */}
      {planToSubscribe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-slide-in-right">
            <button
              onClick={() => setPlanToSubscribe(null)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Subscribe to Plan</h3>
                <p className="text-xs text-slate-500">Confirm your subscription selection</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50/50 p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Plan:</span>
                <span className="font-bold text-slate-900">{planToSubscribe.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Validity Period:</span>
                <span className="font-bold text-purple-700">
                  {planToSubscribe.validityPeriod} {(planToSubscribe.validityUnit || "MONTHS").toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Included Services:</span>
                <span className="font-bold text-slate-800">
                  {planToSubscribe.services?.length || 0} configured
                </span>
              </div>
            </div>

            {activeSubscription && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Subscribing to this plan will replace your current active plan and reset your validity period.
                </span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={subscribing}
                onClick={() => setPlanToSubscribe(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={subscribing}
                onClick={handleConfirmSubscribe}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
              >
                {subscribing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Confirm Subscription</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Details & Slabs Modal */}
      {selectedPlanDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setSelectedPlanDetails(null)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedPlanDetails.name}</h3>
                <p className="text-xs text-slate-500">Complete plan benefits & service slabs</p>
              </div>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {selectedPlanDetails.description || "No description provided for this plan."}
            </p>

            <div className="mt-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-600" />
                Configured Services ({selectedPlanDetails.services?.length || 0})
              </h4>

              {selectedPlanDetails.services && selectedPlanDetails.services.length > 0 ? (
                <div className="space-y-3">
                  {selectedPlanDetails.services.map((service, sIdx) => (
                    <div
                      key={sIdx}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">
                          {service.serviceId}
                        </span>
                        <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                          {service.categories?.length || 0} Categories
                        </span>
                      </div>

                      {/* Categories breakdown */}
                      {service.categories && service.categories.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {service.categories.map((cat, cIdx) => (
                            <div
                              key={cIdx}
                              className="rounded-xl border border-slate-200/60 bg-white p-3 text-xs"
                            >
                              <div className="font-semibold text-slate-800">
                                {cat.categoryName}
                              </div>
                              {cat.pricing && cat.pricing.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-slate-600">
                                  {cat.pricing.map((pr, pIdx) => (
                                    <span
                                      key={pIdx}
                                      className="rounded bg-slate-100 px-2 py-0.5 text-slate-700"
                                    >
                                      {pr.type} ({pr.calculationType}) - {pr.slabs?.length || 0} slab(s)
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-slate-400">No services configured for this plan.</p>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPlanDetails(null)}
                className="rounded-xl bg-slate-100 px-5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
