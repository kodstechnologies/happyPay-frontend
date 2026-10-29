import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CreditCard,
  LockKeyhole,
  Headphones,
  ChevronRight,
  UserCircle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Receipt,
  Eye,
  Upload,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Store,
  RefreshCw,
  HelpCircle,
  Plus,
  Star,
  LoaderCircle,
  Trash2,
  Settings,
} from "lucide-react";

import {
  getRetailerProfile,
  updateRetailerProfile,
} from "../../../services/api/retailer/retailerProfileApi";
import type {
  RetailerFullProfile,
  RetailerBank,
  DocumentStatus,
} from "../../../types/retailer/profile";

import DocumentViewerModal from "./components/DocumentViewerModal";
import DocumentUploadModal from "./components/DocumentUploadModal";
import EditProfileModal from "./components/EditProfileModal";
import BankModal from "./components/BankModal";
import ConfirmDeleteModal from "../../../components/common/ConfirmDeleteModal";

export default function Profile() {
  const navigate = useNavigate();

  // Profile data & UI states
  const [profile, setProfile] = useState<RetailerFullProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "settings">("overview");

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{
    open: boolean;
    title: string;
    url?: string | null;
    status?: DocumentStatus;
    rejectionReason?: string | null;
  }>({ open: false, title: "" });

  const [uploadingDoc, setUploadingDoc] = useState<{
    open: boolean;
    key: string;
    title: string;
    currentUrl?: string | null;
  }>({ open: false, key: "", title: "" });

  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fetch full profile (for manual retry)
  const fetchProfileData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getRetailerProfile();
      if (res && res.data) {
        setProfile(res.data);
      } else {
        throw new Error("Unable to retrieve profile details.");
      }
    } catch (err: unknown) {
      console.error("Failed to load retailer profile:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Failed to load retailer profile. Please try again.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    getRetailerProfile()
      .then((res) => {
        if (!ignore && res?.data) {
          setProfile(res.data);
        } else if (!ignore) {
          setError("Unable to retrieve profile details.");
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          console.error("Failed to load retailer profile:", err);
          const errorMsg =
            err instanceof Error
              ? err.message
              : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "Failed to load retailer profile. Please try again.";
          setError(errorMsg);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // Silent background refresh that synchronizes canonical profile without full-page spinner flicker
  const refreshProfile = useCallback(async () => {
    try {
      const res = await getRetailerProfile();
      if (res && res.data) {
        setProfile(res.data);
      }
    } catch (err: unknown) {
      console.error("Failed to refresh profile:", err);
    }
  }, []);

  const handleProfileUpdated = (updated?: RetailerFullProfile) => {
    if (updated?.id) {
      setProfile(updated);
    } else {
      refreshProfile();
    }
    showToast("Profile details updated successfully!");
  };

  const handleDocumentUpdated = (updated?: RetailerFullProfile) => {
    if (updated?.id) {
      setProfile(updated);
    } else {
      refreshProfile();
    }
    showToast("Document uploaded successfully and submitted for review!");
  };

  // Bank modal & primary bank action states
  const [bankModalState, setBankModalState] = useState<{
    open: boolean;
    bankToEdit?: RetailerBank | null;
  }>({ open: false, bankToEdit: null });
  const [settingPrimaryBankId, setSettingPrimaryBankId] = useState<string | null>(null);
  const [deletingBank, setDeletingBank] = useState<RetailerBank | null>(null);
  const [isDeletingBank, setIsDeletingBank] = useState(false);

  const handleOpenAddBank = () => {
    setBankModalState({ open: true, bankToEdit: null });
  };

  const handleOpenEditBank = (bank: RetailerBank) => {
    setBankModalState({ open: true, bankToEdit: bank });
  };

  const handleBankUpdated = (updated?: RetailerFullProfile) => {
    if (updated?.id) {
      setProfile(updated);
    } else {
      refreshProfile();
    }
    showToast(
      bankModalState.bankToEdit
        ? "Bank account details updated successfully."
        : "New settlement bank account added successfully."
    );
  };

  const handleSetPrimaryBank = async (bank: RetailerBank) => {
    if (!bank._id || settingPrimaryBankId) return;

    try {
      setSettingPrimaryBankId(bank._id);
      const res = await updateRetailerProfile<RetailerFullProfile>({
        action: "SET_PRIMARY_BANK",
        bankId: bank._id,
      });

      if (res && (res.success || res.data)) {
        if (res.data?.id) {
          setProfile(res.data);
        } else {
          await refreshProfile();
        }
        showToast(`${bank.name || "Bank account"} is now set as your primary settlement account.`);
      } else {
        throw new Error(res?.message || "Failed to update primary bank.");
      }
    } catch (err: unknown) {
      console.error("Failed to set primary bank:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message || "Failed to set primary bank. Please try again.";
      showToast(errorMsg);
    } finally {
      setSettingPrimaryBankId(null);
    }
  };

  const handleConfirmDeleteBank = async () => {
    if (!deletingBank?._id || isDeletingBank) return;

    try {
      setIsDeletingBank(true);
      const res = await updateRetailerProfile<RetailerFullProfile>({
        action: "DELETE_BANK",
        bankId: deletingBank._id,
      });

      if (res && (res.success || res.data)) {
        if (res.data?.id) {
          setProfile(res.data);
        } else {
          await refreshProfile();
        }
        showToast(`${deletingBank.name || "Bank account"} deleted successfully.`);
        setDeletingBank(null);
      } else {
        throw new Error(res?.message || "Failed to delete bank account.");
      }
    } catch (err: unknown) {
      console.error("Failed to delete bank account:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message || "Failed to delete bank account. Please try again.";
      showToast(errorMsg);
    } finally {
      setIsDeletingBank(false);
    }
  };

  // Helper to resolve document status and reviews
  const getDocReview = (docKey: keyof NonNullable<RetailerFullProfile["documentReviews"]>) => {
    const review = profile?.documentReviews?.[docKey];
    const url = profile?.[docKey as keyof RetailerFullProfile] as string | undefined;

    if (!url) {
      return {
        status: "NOT_SUBMITTED" as DocumentStatus,
        rejectionReason: null,
        url: null,
      };
    }

    return {
      status: (review?.status || "PENDING") as DocumentStatus,
      rejectionReason: review?.rejectionReason || null,
      url,
    };
  };

  // Quick navigation options
  const profileOptions = [
    {
      title: "Shop Information",
      description: "Manage your shop and business information",
      icon: Building2,
      path: "/retailer/profile/shop",
    },
    {
      title: "Bank Details",
      description: "View and manage your registered bank details",
      icon: CreditCard,
      path: "/retailer/profile/bank",
    },
    {
      title: "Settlements",
      description: "View and manage your settlements",
      icon: Receipt,
      path: "/retailer/profile/settlements",
    },
    {
      title: "Security Settings",
      description: "Manage your password, transaction MPIN and account security",
      icon: LockKeyhole,
      path: "/retailer/profile/security",
      badge: profile?.isMpinSet ? "MPIN Protected" : "Setup MPIN",
      badgeType: profile?.isMpinSet ? "success" : "warning",
    },
    {
      title: "Help & Support",
      description: "Get help and contact support",
      icon: Headphones,
      path: "/retailer/profile/support",
    },
  ];

  // List of all 7 tracked documents
  const documentItems = [
    {
      key: "panDocument",
      title: "PAN Card",
      category: "Identity Proof",
      ...getDocReview("panDocument"),
    },
    {
      key: "aadhaarDocument",
      title: "Aadhaar Card",
      category: "Address & Identity",
      ...getDocReview("aadhaarDocument"),
    },
    {
      key: "selfie",
      title: "Retailer Selfie / Photo",
      category: "Biometric Proof",
      ...getDocReview("selfie"),
    },
    {
      key: "businessProofDocument",
      title: `Business Proof (${
        typeof profile?.businessProofType === "object" && profile?.businessProofType?.name
          ? profile.businessProofType.name
          : "GST / License"
      })`,
      category: "Business Proof",
      ...getDocReview("businessProofDocument"),
    },
    {
      key: "shopInsidePhoto",
      title: "Inside Shop View",
      category: "Store Photo",
      ...getDocReview("shopInsidePhoto"),
    },
    {
      key: "shopOutsidePhoto",
      title: "Outside Shop / Signboard",
      category: "Store Photo",
      ...getDocReview("shopOutsidePhoto"),
    },
    {
      key: "shopLocationPhoto",
      title: "Shop Location / Landmark",
      category: "Premises Photo",
      ...getDocReview("shopLocationPhoto"),
    },
  ];

  // Badge component for doc status
  const renderStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-3 w-3" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <ShieldAlert className="h-3 w-3" /> Action Required
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
            <HelpCircle className="h-3 w-3" /> Not Uploaded
          </span>
        );
    }
  };

  // Rejection check across all documents
  const rejectedDocsCount = documentItems.filter((d) => d.status === "REJECTED").length;

  return (
    <div className="">
      <div className="w-full">
        {/* Toast Notification */}
        {successToast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-600 px-4 py-3 text-white shadow-xl animate-fade-in">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-xs font-semibold">{successToast}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Retailer Profile
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Manage your merchant profile, store information, and verification documents
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchProfileData}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              title="Refresh profile data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            {profile && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#7c3aed] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#6d28d9] transition"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-rose-50 p-4 border border-rose-100 text-rose-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <p className="text-xs font-medium">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchProfileData}
              className="rounded-lg bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-200 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !profile ? (
          <div className="space-y-4">
            <div className="h-44 w-full animate-pulse rounded-[1.5rem] bg-slate-200" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
            </div>
          </div>
        ) : profile ? (
          <>
            {/* Hero Profile Card */}
            <section className="hp-retailer-gradient-card relative mb-6 overflow-hidden rounded-[1.5rem] p-6 text-white shadow-lg">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">
                {/* Avatar */}
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 overflow-hidden border border-white/20 shadow-inner">
                  {profile.selfie ? (
                    <img
                      src={profile.selfie}
                      alt={profile.fullName || "Retailer"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle className="h-10 w-10 text-white" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-white">
                      {profile.fullName || "Happy Pay Retailer"}
                    </h2>
                    {profile.outletId && (
                      <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-mono font-medium text-white/90">
                        Outlet ID: {profile.outletId}
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-xs text-white/80">
                    {profile.shop?.name || "Merchant Business Store"} • {profile.mobile}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {/* Active */}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      {profile.status === "active" ? "Active" : profile.status}
                    </span>

                    {/* Admin Approval Status */}
                    {profile.adminApproved === "approved" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/25 px-3 py-1 text-xs font-medium text-emerald-200 border border-emerald-400/30 backdrop-blur-sm">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                        KYC Approved
                      </span>
                    ) : profile.adminApproved === "rejected" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/30 px-3 py-1 text-xs font-medium text-rose-200 border border-rose-400/30 backdrop-blur-sm">
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-300" />
                        KYC Action Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/30 px-3 py-1 text-xs font-medium text-amber-200 border border-amber-400/30 backdrop-blur-sm">
                        <Clock className="h-3.5 w-3.5 text-amber-300" />
                        Pending Approval
                      </span>
                    )}

                    {/* eKYC AEPS status */}
                    {profile.eKYCStatus && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90">
                        AEPS eKYC: {profile.eKYCStatus}
                      </span>
                    )}

                    {/* MPIN Status */}
                    <button
                      type="button"
                      onClick={() => navigate("/retailer/profile/security")}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm transition ${
                        profile.isMpinSet
                          ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/35"
                          : "bg-amber-500/30 text-amber-200 border border-amber-400/30 hover:bg-amber-500/40"
                      }`}
                      title={
                        profile.isMpinSet
                          ? "Transaction MPIN is enabled. Click to manage."
                          : "Click to set up your Transaction MPIN."
                      }
                    >
                      <LockKeyhole className="h-3 w-3" />
                      <span>{profile.isMpinSet ? "MPIN Active" : "Set MPIN"}</span>
                    </button>
                  </div>
                </div>

                {/* Edit Button */}
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/30 transition border border-white/20"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Info</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Rejection Notification Banner */}
            {(profile.adminApproved === "rejected" || rejectedDocsCount > 0) && (
              <div className="mb-6 rounded-2xl bg-rose-50 p-4 border border-rose-200 text-rose-900 shadow-sm">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-rose-900">
                      Verification Notice: Correction Required
                    </h3>
                    <p className="mt-0.5 text-xs text-rose-700">
                      {profile.reasonOfRejection ||
                        "One or more documents require your attention. Please review and re-upload the rejected documents below to get verified."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("documents")}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-rose-800 hover:underline"
                    >
                      View & Re-upload Documents <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Notice Banner */}
            {profile.adminApproved === "pending" && rejectedDocsCount === 0 && (
              <div className="mb-6 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-amber-900">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-xs">
                    <span className="font-bold">Application Under Review: </span>
                    Your documents and business details are being verified by our compliance team. You will be notified once approved.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="mb-6 flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
                  activeTab === "overview"
                    ? "border-[#7c3aed] text-[#7c3aed]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <User className="h-4 w-4" />
                <span>Overview & Details</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
                  activeTab === "documents"
                    ? "border-[#7c3aed] text-[#7c3aed]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Documents & KYC Status ({documentItems.length})</span>
                {rejectedDocsCount > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                    {rejectedDocsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/retailer/profile/security")}
                className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW & DETAILS */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Personal Details Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#7c3aed]">
                          <User className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Personal Information
                        </h3>
                      </div>
                      {/* <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="text-xs font-semibold text-[#7c3aed] hover:underline"
                      >
                        Edit
                      </button> */}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Full Name</span>
                        <span className="font-semibold text-slate-800">
                          {profile.fullName || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Father's Name</span>
                        <span className="font-semibold text-slate-800">
                          {profile.fatherName || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Mobile Number</span>
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <span>{profile.mobile}</span>
                          {profile.isMobileVerified && (
                            <span title="Verified">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Email Address</span>
                        <div className="flex items-center gap-1 font-semibold text-slate-800 truncate">
                          <span className="truncate">{profile.email || "—"}</span>
                          {profile.isEmailVerified && (
                            <span title="Verified">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Gender</span>
                        <span className="font-semibold text-slate-800">
                          {profile.gender || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                        <span className="font-semibold text-slate-800">
                          {profile.dateOfBirth
                            ? new Date(profile.dateOfBirth).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Marital Status</span>
                        <span className="font-semibold text-slate-800">
                          {profile.maritalStatus || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Qualification</span>
                        <span className="font-semibold text-slate-800">
                          {profile.educationalQualification || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">PAN Number</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {profile.panNumber || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Aadhaar Number</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {profile.aadhaarNumber
                            ? `•••• •••• ${profile.aadhaarNumber.slice(-4)}`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shop Details Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#7c3aed]">
                          <Store className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Shop & Business Details
                        </h3>
                      </div>
                      {/* <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="text-xs font-semibold text-[#7c3aed] hover:underline"
                      >
                        Edit
                      </button> */}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[11px]">Store Name</span>
                        <span className="font-semibold text-slate-800 text-sm">
                          {profile.shop?.name || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Category</span>
                        <span className="font-semibold text-slate-800">
                          {typeof profile.shop?.category === "object"
                            ? profile.shop?.category?.name
                            : profile.shop?.category || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Property Type</span>
                        <span className="font-semibold text-slate-800">
                          {typeof profile.shop?.propertyType === "object"
                            ? profile.shop?.propertyType?.name
                            : profile.shop?.propertyType || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Business Proof Type</span>
                        <span className="font-semibold text-slate-800">
                          {typeof profile.businessProofType === "object"
                            ? profile.businessProofType?.name
                            : profile.businessProofType || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Pincode</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {profile.shop?.address?.pincode || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">City</span>
                        <span className="font-semibold text-slate-800">
                          {profile.shop?.address?.city || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">State</span>
                        <span className="font-semibold text-slate-800">
                          {profile.shop?.address?.state || "—"}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[11px]">Complete Address</span>
                        <span className="font-semibold text-slate-800 leading-relaxed">
                          {profile.shop?.completeAddress ||
                            profile.shop?.address?.addressLine ||
                            "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settlement Bank Accounts Section */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  {/* Section Header */}
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/60 text-[#7c3aed] border border-purple-200/50 shadow-inner">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                            Settlement Bank Accounts
                          </h3>
                          <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-[#7c3aed] border border-purple-200/60">
                            {profile.banks?.length || 0} Linked
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Funds from payouts, withdrawals, and merchant settlements are routed to your primary account.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenAddBank}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-[#7c3aed]/25 hover:from-[#6d28d9] hover:to-[#5b21b6] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 transition hover:-translate-y-0.5"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Another Account</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate("/retailer/profile/bank")}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                        title="Open full bank documents verification page"
                      >
                        Manage
                      </button>
                    </div>
                  </div>

                  {/* Bank Cards Grid */}
                  {profile.banks && profile.banks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {profile.banks.map((bank, index) => {
                        const isPrimary =
                          Boolean(bank.isPrimary) ||
                          (profile.primaryBank?._id
                            ? profile.primaryBank._id === bank._id
                            : index === 0 && !profile.banks?.some((b) => b.isPrimary));

                        const isSettingThisPrimary = settingPrimaryBankId === bank._id;

                        return (
                          <div
                            key={bank._id || `${bank.accountNumber}-${index}`}
                            onClick={() => handleOpenEditBank(bank)}
                            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-300 cursor-pointer ${
                              isPrimary
                                ? "border-purple-200/90 bg-gradient-to-br from-purple-50/40 via-white to-white shadow-md shadow-purple-500/5 ring-1 ring-[#7c3aed]/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10"
                                : "border-slate-200/80 bg-white shadow-sm hover:-translate-y-1 hover:border-[#7c3aed]/40 hover:shadow-md"
                            }`}
                          >
                            {/* Card Top Accent Bar for Primary */}
                            {isPrimary && (
                              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#7c3aed] via-[#9333ea] to-[#c084fc]" />
                            )}

                            <div>
                              {/* Header & Badges */}
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                                      isPrimary
                                        ? "bg-purple-100/70 text-[#7c3aed]"
                                        : "bg-slate-100 text-slate-600 group-hover:bg-purple-50 group-hover:text-[#7c3aed]"
                                    }`}
                                  >
                                    <Building2 className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="truncate text-sm font-bold text-slate-900 group-hover:text-[#7c3aed] transition">
                                      {bank.name || "Commercial Bank"}
                                    </h4>
                                    <span className="text-[11px] text-slate-400">
                                      {bank.branchName || "Main Branch"}
                                    </span>
                                  </div>
                                </div>

                                {isPrimary ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 shadow-xs">
                                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                    <span>Primary</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-200/80">
                                    Secondary
                                  </span>
                                )}
                              </div>

                              {/* Account Number & IFSC */}
                              <div className="my-3 rounded-xl bg-slate-50/70 p-3 border border-slate-100">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                                    Account Number
                                  </span>
                                  <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                                <p className="font-mono text-sm font-bold text-slate-800 tracking-wider">
                                  {bank.accountNumber
                                    ? `•••• •••• ${bank.accountNumber.slice(-4)}`
                                    : "—"}
                                </p>
                                <div className="mt-2 flex items-center justify-between border-t border-slate-200/50 pt-2 text-[11px]">
                                  <span className="text-slate-400">IFSC:</span>
                                  <span className="font-mono font-bold text-slate-700">
                                    {bank.ifscCode || "—"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7c3aed] group-hover:underline">
                                <Edit3 className="h-3 w-3" />
                                <span>Edit Account</span>
                              </span>

                              <div className="flex items-center gap-1.5">
                                {!isPrimary && (
                                  <button
                                    type="button"
                                    disabled={isSettingThisPrimary}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSetPrimaryBank(bank);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-purple-300 hover:bg-purple-50 hover:text-[#7c3aed] transition disabled:opacity-50"
                                    title="Set as Primary Settlement Account"
                                  >
                                    {isSettingThisPrimary ? (
                                      <>
                                        <LoaderCircle className="h-3 w-3 animate-spin" />
                                        <span>Setting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Star className="h-3 w-3 text-amber-500" />
                                        <span>Set as Primary</span>
                                      </>
                                    )}
                                  </button>
                                )}

                                {profile.banks && profile.banks.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingBank(bank);
                                    }}
                                    className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                    title="Delete bank account"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add Another Bank Action Card Tile */}
                      <button
                        type="button"
                        onClick={handleOpenAddBank}
                        className="group flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 p-6 text-center transition-all duration-300 hover:border-[#7c3aed] hover:bg-purple-50/30 hover:shadow-md"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm border border-slate-200/80 group-hover:border-[#7c3aed]/40 group-hover:bg-[#7c3aed] group-hover:text-white transition-all duration-300">
                          <Plus className="h-5 w-5" />
                        </div>
                        <h4 className="mt-3 text-xs font-bold text-slate-800 group-hover:text-[#7c3aed] transition">
                          Add Another Account
                        </h4>
                        <p className="mt-1 text-[11px] text-slate-400 max-w-[200px]">
                          Connect a secondary savings or current account for flexible payouts.
                        </p>
                      </button>
                    </div>
                  ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#7c3aed] mb-3 border border-purple-100">
                        <Building2 className="h-7 w-7" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        No Settlement Bank Accounts Linked
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 max-w-sm">
                        You need at least one verified bank account to receive retail payouts, AEPS settlements, and cashout transfers.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenAddBank}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#7c3aed]/25 hover:from-[#6d28d9] hover:to-[#5b21b6] transition"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Link Your First Bank Account</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: DOCUMENTS & KYC STATUS */}
            {activeTab === "documents" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Merchant Documents & Verification Status
                    </h3>
                    <p className="text-xs text-slate-500">
                      All uploaded business and identity documents verified by Happy Pay Fintech
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {documentItems.map((doc) => {
                    const isRejected = doc.status === "REJECTED";
                    const isApproved = doc.status === "APPROVED";
                    const hasFile = Boolean(doc.url);

                    return (
                      <div
                        key={doc.key}
                        className={`group flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${
                          isRejected
                            ? "border-rose-300 bg-rose-50/20 shadow-sm"
                            : isApproved
                            ? "border-slate-200 bg-white"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div>
                          {/* Card Top: Category & Status */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              {doc.category}
                            </span>
                            {renderStatusBadge(doc.status)}
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-2">
                            {doc.title}
                          </h4>

                          {/* Document Preview Box */}
                          <div
                            onClick={() => {
                              if (hasFile) {
                                setViewingDoc({
                                  open: true,
                                  title: doc.title,
                                  url: doc.url,
                                  status: doc.status,
                                  rejectionReason: doc.rejectionReason,
                                });
                              } else {
                                setUploadingDoc({
                                  open: true,
                                  key: doc.key,
                                  title: doc.title,
                                  currentUrl: null,
                                });
                              }
                            }}
                            className="relative flex h-28 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-slate-100 border border-slate-200/80 group-hover:border-[#7c3aed]/40 transition"
                          >
                            {hasFile ? (
                              doc.url?.toLowerCase().includes(".pdf") ? (
                                <div className="flex flex-col items-center justify-center text-slate-500">
                                  <FileText className="h-9 w-9 text-purple-600 mb-1" />
                                  <span className="text-[10px] font-semibold text-slate-600">
                                    PDF Document
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <img
                                    src={doc.url!}
                                    alt={doc.title}
                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm flex items-center gap-1">
                                      <Eye className="h-3.5 w-3.5" /> Preview
                                    </span>
                                  </div>
                                </>
                              )
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-400">
                                <Upload className="h-7 w-7 mb-1" />
                                <span className="text-[11px] font-semibold">Click to Upload</span>
                              </div>
                            )}
                          </div>

                          {/* Rejection Note Display */}
                          {isRejected && doc.rejectionReason && (
                            <div className="mt-2.5 rounded-lg bg-rose-50 p-2 text-[11px] text-rose-700 border border-rose-100">
                              <span className="font-semibold block">Reason for Rejection:</span>
                              <span className="leading-tight">{doc.rejectionReason}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
                          {hasFile && (
                            <button
                              type="button"
                              onClick={() =>
                                setViewingDoc({
                                  open: true,
                                  title: doc.title,
                                  url: doc.url,
                                  status: doc.status,
                                  rejectionReason: doc.rejectionReason,
                                })
                              }
                              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setUploadingDoc({
                                open: true,
                                key: doc.key,
                                title: doc.title,
                                currentUrl: doc.url,
                              })
                            }
                            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition ${
                              isRejected
                                ? "bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                                : "border border-purple-200 bg-purple-50 text-[#7c3aed] hover:bg-purple-100"
                            }`}
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>{hasFile ? "Replace" : "Upload"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: SETTINGS & SUB-PAGES */}
            {activeTab === "settings" && (
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Account & Profile Settings
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Access detailed settings for bank accounts, settlements, security, and support
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {profileOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.path}
                        type="button"
                        onClick={() => navigate(option.path)}
                        className="hp-retailer-card group flex w-full items-center gap-4 rounded-[1.25rem] p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/50"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f8f5ff] transition-colors duration-300 group-hover:bg-[#7c3aed]">
                          <Icon className="h-5 w-5 text-[#7c3aed] transition-colors duration-300 group-hover:text-white" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-[15px] font-bold text-[#0f172a]">
                              {option.title}
                            </h4>
                            {option.badge && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  option.badgeType === "success"
                                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border border-amber-200 bg-amber-50 text-amber-700"
                                }`}
                              >
                                {option.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs leading-5 text-[#64748b]">
                            {option.description}
                          </p>
                        </div>

                        <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#7c3aed]" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* Edit Profile Modal */}
        {profile && (
          <EditProfileModal
            open={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            profile={profile}
            onSuccess={handleProfileUpdated}
            size="3xl"
          />
        )}

        {/* Document Viewer Modal */}
        <DocumentViewerModal
          open={viewingDoc.open}
          onClose={() => setViewingDoc({ open: false, title: "" })}
          title={viewingDoc.title}
          docUrl={viewingDoc.url}
          status={viewingDoc.status}
          rejectionReason={viewingDoc.rejectionReason}
        />

        {/* Document Upload Modal */}
        <DocumentUploadModal
          open={uploadingDoc.open}
          onClose={() => setUploadingDoc({ open: false, key: "", title: "" })}
          documentKey={uploadingDoc.key}
          documentTitle={uploadingDoc.title}
          currentUrl={uploadingDoc.currentUrl}
          onSuccess={handleDocumentUpdated}
        />

        {/* Bank Add / Edit Modal */}
        {bankModalState.open && (
          <BankModal
            key={bankModalState.bankToEdit?._id || "new-bank"}
            open={bankModalState.open}
            onClose={() => setBankModalState({ open: false, bankToEdit: null })}
            bankToEdit={bankModalState.bankToEdit}
            isOnlyBank={Boolean(!profile?.banks || profile.banks.length <= 1)}
            onSuccess={handleBankUpdated}
            onDeleteRequest={(bank) => setDeletingBank(bank)}
            size="xl"
          />
        )}

        {/* Delete Bank Confirmation Modal */}
        {deletingBank && (
          <ConfirmDeleteModal
            open={Boolean(deletingBank)}
            onClose={() => setDeletingBank(null)}
            onConfirm={handleConfirmDeleteBank}
            title="Delete Bank Account"
            itemName={deletingBank.name || "this bank account"}
            itemDetail={
              deletingBank.accountNumber
                ? `•••• ${deletingBank.accountNumber.slice(-4)}`
                : undefined
            }
            confirmLabel="Delete Account"
            isLoading={isDeletingBank}
            warningNotice={
              deletingBank.isPrimary ? (
                <span>
                  <strong>Primary Account Notice:</strong> This is currently your primary settlement account. Removing it will automatically designate another linked account as your primary payout destination.
                </span>
              ) : null
            }
          />
        )}
      </div>
    </div>
  );
}
