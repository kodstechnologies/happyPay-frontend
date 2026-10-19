import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Banknote,
  ChevronDown,
  Landmark,
  WalletCards,
  ShieldCheck,
  Bike,
  FileText,
  Send,
  CheckCircle2,
  ExternalLink,
  Loader2,
  XCircle,
  X,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import CashCollection from "./CashCollection";
import CashDrop from "./CashDrop";

import { CMS_COMPANIES, type CmsCompany } from "./cmsCompanies";
import {
  initiateCmsPaymentApi,
  type CmsCallbackData,
} from "../../../apis/cms.apis";
import { getGeolocationCoordinates } from "../../../utils/geolocation";

const cmsCompanies = CMS_COMPANIES;

const CompanyIcon = ({
  type,
}: {
  type: CmsCompany["iconType"];
}) => {
  if (type === "bike") return <Bike className="h-5 w-5" />;
  if (type === "car") return <WalletCards className="h-5 w-5" />;
  if (type === "shield") return <ShieldCheck className="h-5 w-5" />;
  if (type === "bank") return <WalletCards className="h-5 w-5" />;
  if (type === "building") return <FileText className="h-5 w-5" />;
  return <Send className="h-5 w-5" />;
};

type CmsTab = "collection" | "drop";
type PluginStatus = "IDLE" | "PROCESSING" | "SUCCESS" | "FAILED";

export default function Cms() {
  const navigate = useNavigate();

  // Selected company for manual collection/drop fallback flow
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [activeTab, setActiveTab] = useState<CmsTab>("collection");

  // Redirection Plugin states
  const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [redirectionUrl, setRedirectionUrl] = useState<string>("");
  const [pluginStatus, setPluginStatus] = useState<PluginStatus>("IDLE");
  const [txnResult, setTxnResult] = useState<CmsCallbackData | null>(null);
  const popupRef = useRef<Window | null>(null);

  const selectedCompany =
    cmsCompanies.find((company) => company.id === selectedCompanyId) ?? null;

  /* =========================================================
     1. FETCH CMS REDIRECTION URL AT COMPONENT MOUNT
  ========================================================= */
  const loadRedirectionUrl = useCallback(async () => {
    try {
      setIsFetchingUrl(true);
      setFetchError(null);

      // 1. Fetch real geolocation coordinates safely
      const coords = await getGeolocationCoordinates();

      // 2. Call backend POST /api/v1/cms/initiate-payment
      const response = await initiateCmsPaymentApi({
        amount: 10,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      // 3. Extract redirectionUrl safely from response
      const resData = (response?.data || response) as Record<string, unknown>;
      const targetUrl =
        (resData?.redirectionUrl as string) ||
        ((resData?.data as Record<string, unknown>)?.redirectionUrl as string) ||
        ((response as unknown as Record<string, unknown>)?.redirectionUrl as string) ||
        "";

      const status =
        (resData?.status as string) ||
        ((resData?.data as Record<string, unknown>)?.status as string) ||
        (response?.success ? "SUCCESS" : "");

      const msg =
        (resData?.msg as string) ||
        (resData?.message as string) ||
        response?.message ||
        "";

      const isSuccess =
        status === "SUCCESS" ||
        String(status).toLowerCase() === "success" ||
        response?.success === true;

      if (targetUrl && isSuccess) {
        setRedirectionUrl(targetUrl);
      } else if (targetUrl) {
        setRedirectionUrl(targetUrl);
      } else {
        const errorMsg =
          msg || "Airtel CMS redirection URL not returned from server.";
        setFetchError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: unknown) {
      console.error("Error retrieving CMS redirection URL:", err);
      const errorObj = err as {
        response?: { data?: { message?: string; msg?: string } };
        message?: string;
      };
      const errorMsg =
        errorObj?.response?.data?.message ||
        errorObj?.response?.data?.msg ||
        errorObj?.message ||
        "Failed to initiate Airtel CMS gateway. Please try again.";
      setFetchError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsFetchingUrl(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    getGeolocationCoordinates()
      .then((coords) => {
        if (ignore) return null;
        return initiateCmsPaymentApi({
          amount: 10,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      })
      .then((response) => {
        if (ignore || !response) return;

        const resData = (response?.data || response) as Record<string, unknown>;
        const targetUrl =
          (resData?.redirectionUrl as string) ||
          ((resData?.data as Record<string, unknown>)?.redirectionUrl as string) ||
          ((response as unknown as Record<string, unknown>)?.redirectionUrl as string) ||
          "";

        const status =
          (resData?.status as string) ||
          ((resData?.data as Record<string, unknown>)?.status as string) ||
          (response?.success ? "SUCCESS" : "");

        const msg =
          (resData?.msg as string) ||
          (resData?.message as string) ||
          response?.message ||
          "";

        const isSuccess =
          status === "SUCCESS" ||
          String(status).toLowerCase() === "success" ||
          response?.success === true;

        if (targetUrl && isSuccess) {
          setRedirectionUrl(targetUrl);
        } else if (targetUrl) {
          setRedirectionUrl(targetUrl);
        } else {
          const errorMsg =
            msg || "Airtel CMS redirection URL not returned from server.";
          setFetchError(errorMsg);
          toast.error(errorMsg);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          console.error("Error retrieving CMS redirection URL:", err);
          const errorObj = err as {
            response?: { data?: { message?: string; msg?: string } };
            message?: string;
          };
          const errorMsg =
            errorObj?.response?.data?.message ||
            errorObj?.response?.data?.msg ||
            errorObj?.message ||
            "Failed to initiate Airtel CMS gateway. Please try again.";
          setFetchError(errorMsg);
          toast.error(errorMsg);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsFetchingUrl(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  /* =========================================================
     2. CROSS-WINDOW CALLBACK LISTENER
  ========================================================= */
  const handleCallbackResponse = useCallback((data: CmsCallbackData) => {
    const isSuccess =
      data.status === "SUCCESS" ||
      String(data.status).toLowerCase() === "success" ||
      String(data.status).toLowerCase() === "true";

    if (isSuccess) {
      setPluginStatus("SUCCESS");
      setTxnResult({
        status: "SUCCESS",
        txnid: data.txnid || `AIRTEL-${Date.now().toString().slice(-8)}`,
        rrn:
          data.rrn ||
          `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        message:
          data.message ||
          data.msg ||
          "Cash collection processed successfully via Airtel CMS Plugin!",
        amount: data.amount || "5,000.00",
      });
      toast.success(data.message || "CMS Transaction Successful!");
    } else {
      setPluginStatus("FAILED");
      setTxnResult({
        status: "FAILED",
        txnid: data.txnid || `AIRTEL-${Date.now().toString().slice(-8)}`,
        rrn: data.rrn || "-",
        message:
          data.message ||
          data.msg ||
          "Transaction cancelled or failed on Airtel CMS portal.",
        amount: data.amount,
      });
      toast.error(data.message || "CMS Transaction Failed.");
    }
  }, []);

  useEffect(() => {
    const handleMessageEvent = (event: MessageEvent) => {
      if (!event.data) return;

      let payload: CmsCallbackData | null = null;

      if (typeof event.data === "string") {
        try {
          payload = JSON.parse(event.data);
        } catch {
          // Non-JSON message, ignore
        }
      } else if (typeof event.data === "object") {
        payload = event.data as CmsCallbackData;
      }

      if (
        payload &&
        (payload.status ||
          payload.txnid ||
          payload.rrn ||
          payload.bankRefNum ||
          payload.message)
      ) {
        handleCallbackResponse(payload);
      }
    };

    window.addEventListener("message", handleMessageEvent);
    return () => {
      window.removeEventListener("message", handleMessageEvent);
    };
  }, [handleCallbackResponse]);

  /* =========================================================
     3. USER ACTIONS: OPEN PORTAL & CANCEL
  ========================================================= */
  const handleOpenPlugin = () => {
    if (!redirectionUrl) {
      toast.error("Redirection URL is unavailable. Please retry.");
      return;
    }

    setPluginStatus("PROCESSING");
    setTxnResult(null);

    // Open redirection URL in a new window/tab
    const openedWindow = window.open(redirectionUrl, "_blank");
    popupRef.current = openedWindow;
  };

  const handleCancelTransaction = () => {
    setPluginStatus("IDLE");
    setTxnResult(null);

    if (popupRef.current && !popupRef.current.closed) {
      try {
        popupRef.current.close();
      } catch {
        // Suppress browser cross-origin window closure restrictions
      }
    }

    toast.info("CMS Transaction waiting cancelled.");
  };

  /* =========================================================
     4. DUMMY SIMULATION HANDLERS (FOR TESTING AS REQUESTED)
  ========================================================= */
  const handleSimulateDummySuccess = () => {
    handleCallbackResponse({
      status: "SUCCESS",
      txnid: `CMS-${Date.now().toString().slice(-8)}`,
      rrn: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      amount: "5,000.00",
      message: "Cash collection settled successfully with Airtel CMS Plugin.",
    });
  };

  const handleSimulateDummyFailure = () => {
    handleCallbackResponse({
      status: "FAILED",
      txnid: `CMS-${Date.now().toString().slice(-8)}`,
      rrn: "-",
      message:
        "Customer authentication failed or session timed out on Airtel portal.",
    });
  };

  const handleBack = () => {
    if (selectedCompany) {
      setSelectedCompanyId("");
      setActiveTab("collection");
      return;
    }

    navigate("/retailer");
  };

  const handleCompanyChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const companyId = event.target.value;
    setSelectedCompanyId(companyId);
    setActiveTab("collection");
  };

  return (
    <div className="w-full">
      <main className="mt-4">
        {/* TOP BAR */}
        <div className="flex items-center gap-3 mx-auto w-full max-w-5xl">
          <button
            type="button"
            onClick={handleBack}
            className="hp-back"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Cash Management
            </p>

            <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              {selectedCompany ? selectedCompany.name : "CMS Portal"}
            </h1>
          </div>
        </div>

        <div className="mx-auto mt-6 w-full max-w-2xl space-y-4">
          {!selectedCompany ? (
            <>
              {/* =========================================================
                  AIRTEL CMS REDIRECTION PLUGIN INTEGRATION CARD
              ========================================================= */}
              <section className="rounded-[16px] border border-[#eadcff] bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.14)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] text-white shadow-md shadow-[#7c3aed]/20">
                      <WalletCards className="h-6 w-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-[#172033] sm:text-lg">
                          Airtel Payments Bank CMS
                        </h2>
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          Active Plugin
                        </span>
                      </div>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Launch the official Airtel CMS portal to perform real-time Cash Collection & Cash Drop.
                      </p>
                    </div>
                  </div>
                </div>

                {/* --- 2. IDLE / READY STATE --- */}
                {pluginStatus === "IDLE" && (
                  <div className="mt-5 space-y-4">
                    {/* LOADING STATE: While fetching redirection URL at page mount */}
                    {isFetchingUrl && (
                      <div className="rounded-2xl border border-violet-100 bg-[#faf8ff] p-5 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-[#7c3aed]">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">
                              Connecting to Airtel Payments Bank...
                            </h4>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Initiating secure CMS session and retrieving redirection portal link.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ERROR STATE: Failed to fetch redirection URL */}
                    {!isFetchingUrl && fetchError && !redirectionUrl && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                        <div className="flex items-start gap-3">
                          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-rose-900">
                              Failed to Connect to Airtel CMS Gateway
                            </h4>
                            <p className="mt-1 text-xs text-rose-700">{fetchError}</p>
                            <button
                              type="button"
                              onClick={loadRedirectionUrl}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Retry Connection</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* REDIRECT BUTTON: Only shown once redirectionUrl response has arrived */}
                    {!isFetchingUrl && redirectionUrl && (
                      <>
                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs text-slate-600">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-500">Gateway Status:</span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              Ready to Connect
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="font-medium text-slate-500">Service:</span>
                            <span className="font-semibold text-slate-800">Retailer Plugin v2.0</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenPlugin}
                          className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#7c3aed] px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-[#7c3aed]/25 transition hover:bg-[#6d28d9] active:scale-[0.99]"
                        >
                          <ExternalLink className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          <span>Open Airtel CMS Portal</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* --- 3. PROCESSING STATE (WITH CANCEL BUTTON) --- */}
                {pluginStatus === "PROCESSING" && (
                  <div className="mt-5 rounded-2xl border border-violet-100 bg-gradient-to-b from-[#faf7ff] to-white p-5 text-center">
                    <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center">
                      <div className="absolute h-full w-full animate-ping rounded-full bg-[#7c3aed]/20" />
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4ebff] text-[#7c3aed]">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      Processing CMS Session...
                    </h3>

                    <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                      The Airtel CMS portal opened in a new tab. Please complete your transaction there. Waiting for callback response...
                    </p>

                    {/* CANCEL BUTTON */}
                    <div className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={handleCancelTransaction}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
                      >
                        <X className="h-3.5 w-3.5 text-slate-500" />
                        <span>Cancel Transaction</span>
                      </button>
                    </div>

                    {/* DUMMY SIMULATION CONTROLS */}
                    <div className="mt-5 rounded-xl border border-dashed border-violet-200 bg-violet-50/70 p-3.5 text-left">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-violet-900">
                        <Sparkles className="h-3.5 w-3.5 text-[#7c3aed]" />
                        <span>Test Callback (Dummy Response):</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-violet-700">
                        Simulate the external bank callback response right now:
                      </p>

                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSimulateDummySuccess}
                          className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                        >
                          ✓ Simulate Success
                        </button>
                        <button
                          type="button"
                          onClick={handleSimulateDummyFailure}
                          className="flex-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
                        >
                          ✕ Simulate Failure
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- 4. SUCCESS STATE --- */}
                {pluginStatus === "SUCCESS" && (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-emerald-950">
                          CMS Transaction Successful!
                        </h3>
                        <p className="text-xs text-emerald-700">
                          {txnResult?.message || "Transaction settled successfully."}
                        </p>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="mt-4 space-y-2 rounded-xl border border-emerald-100 bg-white p-3.5 text-xs shadow-sm">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Transaction ID:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {txnResult?.txnid}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span>Bank RRN:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {txnResult?.rrn}
                        </span>
                      </div>

                      {txnResult?.amount && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Amount:</span>
                          <span className="font-bold text-emerald-700">
                            ₹{txnResult.amount}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-slate-600">
                        <span>Status:</span>
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                          SUCCESS
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPluginStatus("IDLE");
                          setTxnResult(null);
                        }}
                        className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                      >
                        Start New Transaction
                      </button>
                    </div>
                  </div>
                )}

                {/* --- 5. FAILURE STATE --- */}
                {pluginStatus === "FAILED" && (
                  <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/40 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-sm">
                        <XCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-rose-950">
                          CMS Transaction Failed
                        </h3>
                        <p className="text-xs text-rose-700">
                          {txnResult?.message || "Transaction could not be completed."}
                        </p>
                      </div>
                    </div>

                    {txnResult?.txnid && (
                      <div className="mt-4 rounded-xl border border-rose-100 bg-white p-3 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Reference ID:</span>
                          <span className="font-mono font-semibold text-slate-800">
                            {txnResult.txnid}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPluginStatus("IDLE");
                          setTxnResult(null);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenPlugin}
                        className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700"
                      >
                        Retry Portal
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* COMPANY DROPDOWN / MANUAL FLOW (ALTERNATIVE) */}
              <section className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.12)] sm:p-5">
                <label
                  htmlFor="cms-company"
                  className="mb-2 block text-sm font-bold text-[#172033]"
                >
                  Direct Company Selection (Alternative)
                </label>

                <div className="relative">
                  <select
                    id="cms-company"
                    value={selectedCompanyId}
                    onChange={handleCompanyChange}
                    className="h-14 w-full appearance-none rounded-xl border-2 border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-[#172033] outline-none transition focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
                  >
                    <option value="">Choose a company for direct collection</option>

                    {cmsCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} ({company.shortName})
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c3aed]" />
                </div>

                <p className="mt-2 text-[11px] text-slate-500">
                  Select a partner company if you want to perform manual Cash Collection or Cash Drop without the external portal.
                </p>
              </section>
            </>
          ) : (
            <>
              {/* SELECTED COMPANY MANUAL FLOW */}
              <section className="rounded-[16px] border border-[#eadcff] bg-white p-4 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.14)] sm:p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f4ebff] text-[#7c3aed]">
                    <CompanyIcon type={selectedCompany.iconType} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-[#172033] sm:text-lg">
                        {selectedCompany.name}
                      </h2>

                      <span className="rounded-lg bg-[#f1e8ff] px-2 py-1 text-[10px] font-bold text-[#7c3aed]">
                        {selectedCompany.shortName}
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-[#687286]">
                      {selectedCompany.description}
                    </p>
                  </div>

                  <CheckCircle2 className="hidden h-5 w-5 shrink-0 text-emerald-500 sm:block" />
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCompanyId("")}
                  className="mt-3 text-xs font-bold text-[#7c3aed] hover:underline"
                >
                  Change Company
                </button>
              </section>

              {/* CMS SERVICES TABS */}
              <section className="rounded-[16px] border border-slate-200 bg-white p-1.5 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("collection")}
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-sm font-bold transition ${
                      activeTab === "collection"
                        ? "bg-[#7c3aed] text-white shadow-md"
                        : "text-[#687286] hover:bg-[#f5f0ff] hover:text-[#7c3aed]"
                    }`}
                  >
                    <Banknote className="h-4 w-4" strokeWidth={2} />
                    <span>Cash Collection</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("drop")}
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-sm font-bold transition ${
                      activeTab === "drop"
                        ? "bg-[#7c3aed] text-white shadow-md"
                        : "text-[#687286] hover:bg-[#f5f0ff] hover:text-[#7c3aed]"
                    }`}
                  >
                    <Landmark className="h-4 w-4" strokeWidth={2} />
                    <span>Cash Drop</span>
                  </button>
                </div>
              </section>

              {/* SELECTED CMS FLOW */}
              <div className="mt-4">
                {activeTab === "collection" && (
                  <CashCollection
                    selectedCompanyName={selectedCompany.name}
                    selectedCompanyShortName={selectedCompany.shortName}
                    displayCompanyName={selectedCompany.name}
                    onBack={handleBack}
                  />
                )}

                {activeTab === "drop" && (
                  <CashDrop
                    selectedCompanyName={selectedCompany.name}
                    selectedCompanyShortName={selectedCompany.shortName}
                    displayCompanyName={selectedCompany.name}
                    onBack={handleBack}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}


