import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock3,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  UploadCloud,
  FileText,
  Camera,
  Store,
  MapPin,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  Eye,
  X,
  User,
  Building2,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  getRetailerKycDetailsApi,
  reuploadRetailerKycDocumentsApi,
  type RetailerKycData,
  type KycDocumentItem,
  type KycDocStatus,
} from "../../../apis/kyc.apis";
import { logout } from "../../../utils/auth";
import { useAuth } from "../../../context/AuthContext";
import HappyPayLoader from "../../../components/common/HappyPayLoader";

type DocFilter = "all" | "rejected" | "pending" | "approved";

const getFieldIcon = (field: string) => {
  switch (field) {
    case "panDocument":
      return CreditCard;
    case "aadhaarDocument":
      return ShieldCheck;
    case "selfie":
      return Camera;
    case "shopInsidePhoto":
      return Store;
    case "shopOutsidePhoto":
      return Building2;
    case "shopLocationPhoto":
      return MapPin;
    case "businessProofDocument":
    default:
      return FileText;
  }
};

const getStatusBadge = (status: KycDocStatus) => {
  switch (status) {
    case "APPROVED":
      return {
        bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
        badge: "Approved",
        icon: CheckCircle2,
        dot: "bg-emerald-500",
      };
    case "REJECTED":
      return {
        bg: "bg-rose-50 border-rose-200 text-rose-700",
        badge: "Rejected",
        icon: AlertCircle,
        dot: "bg-rose-500",
      };
    case "PENDING":
      return {
        bg: "bg-amber-50 border-amber-200 text-amber-700",
        badge: "Under Review",
        icon: Clock3,
        dot: "bg-amber-500",
      };
    case "NOT_SUBMITTED":
    default:
      return {
        bg: "bg-slate-50 border-slate-200 text-slate-600",
        badge: "Not Submitted",
        icon: AlertTriangle,
        dot: "bg-slate-400",
      };
  }
};

const RetailerKycPending: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [kycData, setKycData] = useState<RetailerKycData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Staged files for re-uploading
  const [stagedFiles, setStagedFiles] = useState<Record<string, File>>({});
  const [stagedPreviews, setStagedPreviews] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [isSubmittingAll, setIsSubmittingAll] = useState<boolean>(false);

  // Active document filter tab
  const [activeFilter, setActiveFilter] = useState<DocFilter>("all");

  // Document preview modal
  const [previewModal, setPreviewModal] = useState<{ url: string; title: string } | null>(null);

  // Profile accordion collapse
  const [isProfileExpanded, setIsProfileExpanded] = useState<boolean>(false);

  // Fetch KYC details from live API
  const fetchKycDetails = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const response = await getRetailerKycDetailsApi();
      if (response && response.success && response.data) {
        setKycData(response.data);
      } else {
        throw new Error(response?.message || "Failed to retrieve KYC details");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load KYC status. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function loadInitialKyc() {
      try {
        const response = await getRetailerKycDetailsApi();
        if (!ignore) {
          if (response && response.success && response.data) {
            setKycData(response.data);
          } else {
            throw new Error(response?.message || "Failed to retrieve KYC details");
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Failed to load KYC status. Please try again.";
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitialKyc();

    return () => {
      ignore = true;
    };
  }, []);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(stagedPreviews).forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [stagedPreviews]);

  const handleLogout = () => {
    logout();
    navigate("/retailer/login", { replace: true });
  };

  const handleGoToDashboard = () => {
    navigate("/retailer", { replace: true });
  };

  // Stage a file for a specific document field
  const handleFileSelect = (field: string, file: File | null) => {
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(`File size exceeds 10MB limit for ${file.name}`);
      return;
    }

    // Clean up old preview URL if any
    if (stagedPreviews[field] && stagedPreviews[field].startsWith("blob:")) {
      URL.revokeObjectURL(stagedPreviews[field]);
    }

    const previewUrl = URL.createObjectURL(file);
    setStagedFiles((prev) => ({ ...prev, [field]: file }));
    setStagedPreviews((prev) => ({ ...prev, [field]: previewUrl }));
    setError(null);
  };

  const handleRemoveStagedFile = (field: string) => {
    if (stagedPreviews[field] && stagedPreviews[field].startsWith("blob:")) {
      URL.revokeObjectURL(stagedPreviews[field]);
    }
    setStagedFiles((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setStagedPreviews((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Re-upload a single document
  const handleUploadSingle = async (field: string) => {
    const file = stagedFiles[field];
    if (!file) return;

    setUploadingField(field);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append(field, file);

      const response = await reuploadRetailerKycDocumentsApi(formData);
      if (response && response.success && response.data) {
        setKycData(response.data);
        handleRemoveStagedFile(field);
        setSuccessMessage(`"${response.data.documents.find((d) => d.field === field)?.title || "Document"}" re-uploaded successfully.`);
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        throw new Error(response?.message || "Failed to re-upload document");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(msg);
    } finally {
      setUploadingField(null);
    }
  };

  // Re-upload all staged documents in batch
  const handleUploadAllStaged = async () => {
    const fields = Object.keys(stagedFiles);
    if (fields.length === 0) return;

    setIsSubmittingAll(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      fields.forEach((f) => {
        formData.append(f, stagedFiles[f]);
      });

      const response = await reuploadRetailerKycDocumentsApi(formData);
      if (response && response.success && response.data) {
        setKycData(response.data);
        // Clear all staged
        Object.values(stagedPreviews).forEach((url) => {
          if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
        });
        setStagedFiles({});
        setStagedPreviews({});
        setSuccessMessage(`${fields.length} document(s) re-uploaded and submitted for review.`);
        if (refreshUser) {
          await refreshUser();
        }
      } else {
        throw new Error(response?.message || "Failed to re-upload documents");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Batch upload failed. Please try again.";
      setError(msg);
    } finally {
      setIsSubmittingAll(false);
    }
  };

  // Filtered documents list
  const filteredDocuments = useMemo(() => {
    if (!kycData?.documents) return [];
    if (activeFilter === "all") return kycData.documents;
    if (activeFilter === "rejected") return kycData.documents.filter((d) => d.status === "REJECTED");
    if (activeFilter === "pending") return kycData.documents.filter((d) => d.status === "PENDING");
    if (activeFilter === "approved") return kycData.documents.filter((d) => d.status === "APPROVED");
    return kycData.documents;
  }, [kycData, activeFilter]);

  const stagedCount = Object.keys(stagedFiles).length;

  if (loading) {
    return (
      <HappyPayLoader
        variant="fullscreen"
        message="Loading KYC Details..."
        subtitle="Retrieving your retailer verification status"
      />
    );
  }

  const overallStatus = kycData?.summary?.overallStatus || "pending";
  const totalDocs = kycData?.summary?.totalDocuments || 7;
  const approvedCount = kycData?.summary?.approvedCount ?? 0;
  const rejectedCount = kycData?.summary?.rejectedCount ?? 0;

  // Strict status precedence: Rejection takes absolute precedence
  const isRejected = overallStatus === "rejected" || rejectedCount > 0;
  const isAllApproved = overallStatus === "approved" && !isRejected && approvedCount === totalDocs;
  const hasRejectedDocs = isRejected;

  return (
    <div className="hp-retailer-canvas min-h-screen text-slate-800 antialiased pb-24">
      {/* ======================================================== */}
      {/* 1. TOP STICKY HEADER */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#9333ea] text-white shadow-md shadow-purple-500/20 font-bold text-lg">
              HP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-slate-900 text-base">HappyPay</span>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                  Retailer Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">KYC Verification & Document Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status indicator */}
            <div
              className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                isAllApproved
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : isRejected
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isAllApproved ? "bg-emerald-500" : isRejected ? "bg-rose-500" : "bg-amber-500 animate-pulse"
                }`}
              />
              {isAllApproved
                ? "KYC Approved"
                : overallStatus === "rejected"
                ? "KYC Rejected"
                : isRejected
                ? "Action Required"
                : "Under Review"}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchKycDetails(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              title="Refresh KYC Status"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-purple-600" : ""}`} />
              <span className="hidden sm:inline">{refreshing ? "Checking..." : "Refresh"}</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 space-y-6">
        {/* ======================================================== */}
        {/* TOAST / ALERTS */}
        {/* ======================================================== */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-rose-800 shadow-sm animate-in fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Verification Notice</p>
              <p className="mt-0.5 text-rose-700">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="rounded-lg p-1 text-rose-500 hover:bg-rose-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-800 shadow-sm animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Success</p>
              <p className="mt-0.5 text-emerald-700">{successMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="rounded-lg p-1 text-emerald-500 hover:bg-emerald-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. DYNAMIC STATUS HERO BANNER */}
        {/* ======================================================== */}
        {isAllApproved ? (
          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 p-6 sm:p-8 text-white shadow-xl shadow-emerald-500/15">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md ring-4 ring-white/10">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm mb-2">
                    <Sparkles className="h-3 w-3" /> All Documents Verified
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Retailer KYC Approved!
                  </h1>
                  <p className="mt-2 text-sm text-emerald-50 max-w-xl leading-relaxed">
                    Congratulations! Your identity and store credentials have been verified by the HappyPay compliance team. Your account is fully active.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoToDashboard}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-emerald-800 shadow-lg shadow-black/10 transition hover:bg-emerald-50 active:scale-95 shrink-0"
              >
                Go to Retailer Portal
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : hasRejectedDocs ? (
          <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50/50 p-6 sm:p-8 shadow-lg shadow-rose-500/5">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 ring-4 ring-rose-50">
                <AlertTriangle className="h-8 w-8 text-rose-600" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700 mb-2">
                  {overallStatus === "rejected" ? "Application Rejected" : "Action Required"}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {overallStatus === "rejected"
                    ? "KYC Verification Rejected"
                    : "KYC Verification Requires Attention"}
                </h1>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-2xl">
                  {overallStatus === "rejected"
                    ? "Your retailer KYC application was rejected by the admin. Please review the rejection remark below and re-upload the requested documents to resubmit."
                    : "One or more of your documents were rejected during admin verification. Please review the highlighted documents below, attach new clear copies (images or PDF up to 10MB), and resubmit."}
                </p>

                {kycData?.summary?.reasonOfRejection && (
                  <div className="mt-4 rounded-2xl bg-white border border-rose-200 p-4 shadow-2xs">
                    <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                      Admin Rejection Remark:
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      "{kycData.summary.reasonOfRejection}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-purple-200/80 bg-gradient-to-br from-[#7c3aed]/10 via-white to-purple-50/60 p-6 sm:p-8 shadow-lg shadow-purple-500/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 ring-4 ring-purple-50">
                  <Clock3 className="h-8 w-8 text-purple-700 animate-pulse" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 mb-2">
                    Review in Progress
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    KYC Verification Under Review
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
                    Your registration and submitted documents have been received. Our compliance team is verifying your details. Reviews typically complete within 24–48 business hours.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-200/60 bg-white/80 p-4 text-center shrink-0 shadow-2xs">
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">Estimated Review Time</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">24–48 Hours</p>
                <p className="text-[11px] text-slate-500 mt-1">Live status updates automatically</p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. KPI COUNTER STRIP */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-xs font-medium text-slate-500">Total Documents</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{kycData?.summary?.totalDocuments || 7}</p>
            <p className="text-[11px] text-slate-400 mt-1">Required for verification</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-emerald-700">Approved</p>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{kycData?.summary?.approvedCount || 0}</p>
            <p className="text-[11px] text-emerald-600/80 mt-1">Successfully verified</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-amber-700">Under Review</p>
              <Clock3 className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-700">{kycData?.summary?.pendingCount || 0}</p>
            <p className="text-[11px] text-amber-600/80 mt-1">Pending admin decision</p>
          </div>

          <div
            className={`rounded-2xl border p-4 shadow-2xs ${
              (kycData?.summary?.rejectedCount ?? 0) > 0
                ? "border-rose-300 bg-rose-50/80"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <p
                className={`text-xs font-medium ${
                  (kycData?.summary?.rejectedCount ?? 0) > 0 ? "text-rose-700" : "text-slate-500"
                }`}
              >
                Needs Re-upload
              </p>
              <AlertCircle
                className={`h-4 w-4 ${
                  (kycData?.summary?.rejectedCount ?? 0) > 0 ? "text-rose-600" : "text-slate-400"
                }`}
              />
            </div>
            <p
              className={`mt-1 text-2xl font-bold ${
                (kycData?.summary?.rejectedCount ?? 0) > 0 ? "text-rose-700" : "text-slate-900"
              }`}
            >
              {kycData?.summary?.rejectedCount || 0}
            </p>
            <p
              className={`text-[11px] mt-1 ${
                (kycData?.summary?.rejectedCount ?? 0) > 0 ? "text-rose-600 font-semibold" : "text-slate-400"
              }`}
            >
              {(kycData?.summary?.rejectedCount ?? 0) > 0 ? "Action required below" : "None flagged"}
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. RETAILER PERSONAL & OUTLET PROFILE CARD */}
        {/* ======================================================== */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div
            onClick={() => setIsProfileExpanded(!isProfileExpanded)}
            className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50/80 transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 font-bold border border-purple-100">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {kycData?.retailer?.fullName || "Retailer Profile"}
                </h3>
                <p className="text-xs text-slate-500">
                  Mobile: {kycData?.retailer?.mobile || "-"} • Shop: {kycData?.shop?.name || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">
              <span>{isProfileExpanded ? "Hide Details" : "View Full Profile"}</span>
              <ChevronRight
                className={`h-4 w-4 transition-transform duration-200 ${isProfileExpanded ? "rotate-90" : ""}`}
              />
            </div>
          </div>

          {isProfileExpanded && (
            <div className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-6">
              {/* Personal Details */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-xl bg-white border border-slate-200/80 p-3 shadow-2xs">
                    <p className="text-[11px] text-slate-400">Full Name</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {kycData?.retailer?.fullName || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200/80 p-3 shadow-2xs">
                    <p className="text-[11px] text-slate-400">Father's Name</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {kycData?.retailer?.fatherName || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200/80 p-3 shadow-2xs">
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Mobile Number
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                      {kycData?.retailer?.mobile || "-"}
                      {kycData?.retailer?.isMobileVerified && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200/80 p-3 shadow-2xs">
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email Address
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
                      {kycData?.retailer?.email || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200/80 p-3 shadow-2xs">
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Date of Birth
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {kycData?.retailer?.dateOfBirth
                        ? new Date(kycData.retailer.dateOfBirth).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200/80 p-3 shadow-2xs">
                    <p className="text-[11px] text-slate-400">Gender / Marital</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {kycData?.retailer?.gender || "-"} • {kycData?.retailer?.maritalStatus || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200/80 p-3 shadow-2xs">
                    <p className="text-[11px] text-slate-400">Qualification</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {kycData?.retailer?.educationalQualification || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shop & Bank Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="h-4 w-4 text-purple-700" />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Shop / Outlet Details
                    </h5>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{kycData?.shop?.name || "-"}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {kycData?.shop?.completeAddress ||
                      [
                        kycData?.shop?.address?.addressLine,
                        kycData?.shop?.address?.city,
                        kycData?.shop?.address?.state,
                        kycData?.shop?.address?.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ") ||
                      "Address not provided"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-purple-700" />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Settlement Bank Account
                    </h5>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{kycData?.bank?.name || "Primary Bank"}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    A/C: {kycData?.bank?.accountNumber ? `•••• •••• ${kycData.bank.accountNumber.slice(-4)}` : "-"} • IFSC: {kycData?.bank?.ifscCode || "-"}
                  </p>
                  {kycData?.bank?.branchName && (
                    <p className="text-xs text-slate-400 mt-0.5">Branch: {kycData.bank.branchName}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 5. DOCUMENTS VERIFICATION & RE-UPLOAD SECTION */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Submitted KYC Documents</h2>
              <p className="text-xs text-slate-500">
                Review document statuses, see rejection reasons, and re-upload files directly if requested.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex rounded-xl bg-slate-200/70 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({kycData?.summary?.totalDocuments || 7})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("rejected")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeFilter === "rejected"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-rose-600"
                }`}
              >
                Needs Action ({kycData?.summary?.rejectedCount || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("pending")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeFilter === "pending"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-amber-700"
                }`}
              >
                Pending ({kycData?.summary?.pendingCount || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("approved")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeFilter === "approved"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-emerald-700"
                }`}
              >
                Approved ({kycData?.summary?.approvedCount || 0})
              </button>
            </div>
          </div>

          {/* Staged Bulk Action Alert Bar */}
          {stagedCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 p-4 text-white shadow-lg shadow-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                  <UploadCloud className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">
                    {stagedCount} Replacement Document{stagedCount > 1 ? "s" : ""} Selected
                  </p>
                  <p className="text-xs text-purple-200">
                    Ready to resubmit for compliance review.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSubmittingAll}
                onClick={handleUploadAllStaged}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-purple-700 shadow-md transition hover:bg-purple-50 active:scale-95 disabled:opacity-50"
              >
                {isSubmittingAll ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Submitting Documents...
                  </>
                ) : (
                  <>
                    Submit All ({stagedCount}) Documents <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Grid of Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocuments.map((doc: KycDocumentItem) => {
              const IconComponent = getFieldIcon(doc.field);
              const badge = getStatusBadge(doc.status);
              const StatusIcon = badge.icon;
              const stagedFile = stagedFiles[doc.field];
              const isUploadingThis = uploadingField === doc.field;
              const isRejected = doc.status === "REJECTED";

              return (
                <div
                  key={doc.field}
                  className={`rounded-3xl border bg-white shadow-2xs transition-all overflow-hidden flex flex-col justify-between ${
                    isRejected
                      ? "border-rose-300 ring-2 ring-rose-100 hover:shadow-md"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="p-5 space-y-4">
                    {/* Top Row: Icon, Title, Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                            isRejected
                              ? "bg-rose-100 text-rose-700"
                              : doc.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-purple-50 text-purple-700"
                          }`}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-snug">{doc.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {doc.documentNumber || doc.documentType || "Verification Document"}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${badge.bg}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {badge.badge}
                      </div>
                    </div>

                    {/* Rejection Alert Callout if Rejected */}
                    {isRejected && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>Rejection Reason:</span>
                        </div>
                        <p className="text-xs text-rose-800 font-medium pl-5 leading-relaxed">
                          {doc.rejectionReason || "Please upload a clearer and complete image of this document."}
                        </p>
                      </div>
                    )}

                    {/* Document Current Thumbnail / Preview */}
                    <div className="relative rounded-2xl border border-slate-100 bg-slate-50/80 p-3 overflow-hidden">
                      {doc.url ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 truncate">
                            <div className="h-12 w-12 rounded-xl bg-slate-200/80 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                              {doc.url.toLowerCase().endsWith(".pdf") ? (
                                <FileText className="h-6 w-6 text-slate-600" />
                              ) : (
                                <img
                                  src={doc.url}
                                  alt={doc.title}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    // Fallback to icon if preview fails
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              )}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-slate-800 truncate">Submitted File</p>
                              <p className="text-[11px] text-slate-400">
                                {doc.reviewedAt
                                  ? `Reviewed ${new Date(doc.reviewedAt).toLocaleDateString()}`
                                  : "Uploaded on file"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPreviewModal({ url: doc.url!, title: doc.title })}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100 shrink-0"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-xs text-slate-400 font-medium">No document uploaded yet</p>
                        </div>
                      )}
                    </div>

                    {/* Staged New File Preview (if selected by user) */}
                    {stagedFile && (
                      <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <UploadCloud className="h-4 w-4 text-purple-700 shrink-0" />
                            <span className="text-xs font-semibold text-purple-900 truncate">
                              {stagedFile.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveStagedFile(doc.field)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-purple-100 hover:text-slate-600"
                            title="Remove file"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-purple-600 font-medium">
                          Size: {(stagedFile.size / 1024).toFixed(1)} KB • Staged for re-upload
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: File Upload Dropzone / Button */}
                  <div className="p-4 bg-slate-50/60 border-t border-slate-100">
                    {stagedFile ? (
                      <button
                        type="button"
                        disabled={isUploadingThis || isSubmittingAll}
                        onClick={() => handleUploadSingle(doc.field)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition hover:opacity-95 active:scale-95 disabled:opacity-50"
                      >
                        {isUploadingThis ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-3.5 w-3.5" /> Upload & Resubmit Now
                          </>
                        )}
                      </button>
                    ) : (
                      <label
                        className={`flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-xs font-semibold cursor-pointer transition active:scale-95 ${
                          isRejected
                            ? "border-rose-300 bg-rose-50/40 text-rose-700 hover:bg-rose-100/60"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <UploadCloud className="h-4 w-4" />
                        <span>{isRejected ? "Choose Replacement File" : "Re-upload Document"}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            handleFileSelect(doc.field, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
              <Info className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-800">No documents found</p>
              <p className="text-xs text-slate-400 mt-1">There are no documents matching this filter tab.</p>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 6. HELP & SUPPORT FOOTER */}
        {/* ======================================================== */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Info className="h-4 w-4 text-purple-700 shrink-0" />
            <span>
              Need assistance with your KYC verification? Our compliance team is here to help during standard business hours.
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 font-medium">
            <a
              href="mailto:support@happypayfintech.com"
              className="text-purple-700 hover:underline"
            >
              support@happypayfintech.com
            </a>
            <span>•</span>
            <span className="text-slate-400">HappyPay Verification Gateway v2.4</span>
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* 7. PREVIEW MODAL */}
      {/* ======================================================== */}
      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{previewModal.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-2xl bg-slate-50 flex items-center justify-center p-2 border border-slate-200">
              {previewModal.url.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewModal.url}
                  title={previewModal.title}
                  className="w-full h-[60vh] rounded-xl"
                />
              ) : (
                <img
                  src={previewModal.url}
                  alt={previewModal.title}
                  className="max-h-[60vh] w-auto object-contain rounded-xl shadow-xs"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={previewModal.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-1"
              >
                Open Original in New Tab <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetailerKycPending;
