import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  CreditCard,
  LockKeyhole,
  Headphones,
  ChevronRight,
  UserCircle,
  ShieldCheck,
  Receipt,
  Store,
  Phone,
  Mail,
  RefreshCw,
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  FileText,
  User as UserIcon,
  Eye,
  ExternalLink,
  X,
  FileCheck,
  Image as ImageIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getRetailerProfile,
  type RetailerProfileData,
} from "../../../services/api/retailer/retailerProfileApi";

interface AttachedDocItem {
  id: string;
  title: string;
  category: string;
  url: string;
  reviewStatus?: string;
  rejectionReason?: string | null;
}

const Profile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<RetailerProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<AttachedDocItem | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRetailerProfile();
      if (response?.data) {
        setProfile(response.data);
      } else {
        throw new Error(response?.message || "Failed to load retailer profile");
      }
    } catch (err: unknown) {
      console.error("Failed to fetch retailer profile:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ||
            "Failed to fetch profile details. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadProfileOnMount = async () => {
      try {
        const response = await getRetailerProfile();
        if (!isMounted) return;
        if (response?.data) {
          setProfile(response.data);
        } else {
          throw new Error(response?.message || "Failed to load retailer profile");
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("Failed to fetch retailer profile:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : (err as { message?: string })?.message ||
              "Failed to fetch profile details. Please try again.";
        setError(errorMessage);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProfileOnMount();

    return () => {
      isMounted = false;
    };
  }, []);

  // Close preview modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewDoc(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      description: "Manage your password and account security",
      icon: LockKeyhole,
      path: "/retailer/profile/security",
    },
    {
      title: "Help & Support",
      description: "Get help and contact support",
      icon: Headphones,
      path: "/retailer/profile/support",
    },
  ];

  // Helper for Category Name
  const getCategoryName = () => {
    if (!profile?.shop?.category) return null;
    if (typeof profile.shop.category === "string") return profile.shop.category;
    return profile.shop.category.name || null;
  };

  // Helper for Property Type Name
  const getPropertyTypeName = () => {
    if (!profile?.shop?.propertyType) return null;
    if (typeof profile.shop.propertyType === "string") return profile.shop.propertyType;
    return profile.shop.propertyType.name || null;
  };

  // Helper for Proof Type Name
  const getProofTypeName = () => {
    if (!profile?.businessProofType) return null;
    if (typeof profile.businessProofType === "string") return profile.businessProofType;
    return profile.businessProofType.name || null;
  };

  // Helper for Full Address
  const getFullAddress = () => {
    if (profile?.shop?.completeAddress) return profile.shop.completeAddress;
    const addr = profile?.shop?.address;
    if (!addr) return null;
    const parts = [addr.addressLine, addr.city, addr.state, addr.pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  // Format Date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Extract all genuinely attached documents from profile
  const getAttachedDocuments = (p: RetailerProfileData): AttachedDocItem[] => {
    const docs: AttachedDocItem[] = [];

    if (p.panDocument) {
      docs.push({
        id: "panDocument",
        title: "PAN Card Document",
        category: "Identity Proof",
        url: p.panDocument,
        reviewStatus: p.documentReviews?.panDocument?.status,
        rejectionReason: p.documentReviews?.panDocument?.rejectionReason,
      });
    }

    if (p.aadhaarDocument) {
      docs.push({
        id: "aadhaarDocument",
        title: "Aadhaar Card Document",
        category: "Address & Identity",
        url: p.aadhaarDocument,
        reviewStatus: p.documentReviews?.aadhaarDocument?.status,
        rejectionReason: p.documentReviews?.aadhaarDocument?.rejectionReason,
      });
    }

    if (p.selfie) {
      docs.push({
        id: "selfie",
        title: "Retailer Live Photo / Selfie",
        category: "Biometric & Verification",
        url: p.selfie,
        reviewStatus: p.documentReviews?.selfie?.status,
        rejectionReason: p.documentReviews?.selfie?.rejectionReason,
      });
    }

    if (p.shopInsidePhoto) {
      docs.push({
        id: "shopInsidePhoto",
        title: "Shop Inside View",
        category: "Shop Verification",
        url: p.shopInsidePhoto,
        reviewStatus: p.documentReviews?.shopInsidePhoto?.status,
        rejectionReason: p.documentReviews?.shopInsidePhoto?.rejectionReason,
      });
    }

    if (p.shopOutsidePhoto) {
      docs.push({
        id: "shopOutsidePhoto",
        title: "Shop Outside / Front View",
        category: "Shop Verification",
        url: p.shopOutsidePhoto,
        reviewStatus: p.documentReviews?.shopOutsidePhoto?.status,
        rejectionReason: p.documentReviews?.shopOutsidePhoto?.rejectionReason,
      });
    }

    if (p.shopLocationPhoto) {
      docs.push({
        id: "shopLocationPhoto",
        title: "Shop Location / Landmark",
        category: "Shop Verification",
        url: p.shopLocationPhoto,
        reviewStatus: p.documentReviews?.shopLocationPhoto?.status,
        rejectionReason: p.documentReviews?.shopLocationPhoto?.rejectionReason,
      });
    }

    if (p.businessProofDocument) {
      const proofLabel = getProofTypeName() || "Business Registration Proof";
      docs.push({
        id: "businessProofDocument",
        title: proofLabel,
        category: "Business Proof",
        url: p.businessProofDocument,
        reviewStatus: p.documentReviews?.businessProofDocument?.status,
        rejectionReason: p.documentReviews?.businessProofDocument?.rejectionReason,
      });
    }

    return docs;
  };

  const attachedDocs = profile ? getAttachedDocuments(profile) : [];

  return (
    <div className="px-4 py-4 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">

        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Profile
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your profile, business information and account settings
            </p>
          </div>

          <button
            type="button"
            onClick={fetchProfile}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#7c3aed]" : "text-slate-500"}`} />
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Unable to fetch profile details</p>
              <p className="mt-0.5 text-xs text-red-600">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchProfile}
              className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="mb-6 space-y-6">
            <div className="animate-pulse rounded-[1.5rem] bg-slate-200 p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-300" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-6 w-48 rounded bg-slate-300" />
                  <div className="h-4 w-72 rounded bg-slate-300" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-6 w-20 rounded-full bg-slate-300" />
                    <div className="h-6 w-24 rounded-full bg-slate-300" />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
            </div>
          </div>
        )}

        {/* Live Profile Data Display */}
        {!loading && profile && (
          <>
            {/* Profile Overview Card */}
            <section className="hp-retailer-gradient-card relative mb-6 overflow-hidden rounded-[1.5rem] p-6 text-white shadow-md">
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">

                {/* Avatar / Selfie */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-2 ring-white/20">
                  {profile.selfie ? (
                    <img
                      src={profile.selfie}
                      alt={profile.fullName || profile.shop?.name || "Retailer Profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle className="h-10 w-10 text-white" />
                  )}
                </div>

                {/* Retailer Information */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-white">
                      {profile.fullName || profile.shop?.name || `Retailer #${profile.id.slice(-6)}`}
                    </h2>

                    {profile.outletId && (
                      <span className="inline-flex items-center rounded-lg bg-black/25 px-2.5 py-0.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                        Outlet ID: {profile.outletId}
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                    {profile.mobile && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-white/70" />
                        +91 {profile.mobile}
                        {profile.isMobileVerified && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                        )}
                      </span>
                    )}

                    {profile.email && (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-white/70" />
                        {profile.email}
                        {profile.isEmailVerified && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Badges from API */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {profile.status && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        <span className={`h-1.5 w-1.5 rounded-full ${profile.status === "active" ? "bg-green-400" : "bg-amber-400"}`} />
                        {profile.status.toUpperCase()}
                      </span>
                    )}

                    {profile.kycStatus && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                        KYC: {profile.kycStatus.toUpperCase()}
                      </span>
                    )}

                    {profile.adminApproved && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        <BadgeCheck className="h-3.5 w-3.5 text-sky-300" />
                        Admin: {profile.adminApproved.toUpperCase()}
                      </span>
                    )}

                    {profile.registrationStatus && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        Reg: {profile.registrationStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Profile Details Sections */}
            <div className="mb-6 space-y-4">

              {/* Personal Details Grid */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5 text-slate-900">
                    <UserIcon className="h-5 w-5 text-[#7c3aed]" />
                    <h3 className="text-sm font-bold">Personal & KYC Details</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {profile.fullName && (
                    <div>
                      <span className="text-xs text-slate-500">Full Name</span>
                      <p className="text-sm font-semibold text-slate-800">{profile.fullName}</p>
                    </div>
                  )}

                  {profile.fatherName && (
                    <div>
                      <span className="text-xs text-slate-500">Father's Name</span>
                      <p className="text-sm font-semibold text-slate-800">{profile.fatherName}</p>
                    </div>
                  )}

                  {profile.dateOfBirth && (
                    <div>
                      <span className="text-xs text-slate-500">Date of Birth</span>
                      <p className="text-sm font-semibold text-slate-800">{formatDate(profile.dateOfBirth)}</p>
                    </div>
                  )}

                  {profile.gender && (
                    <div>
                      <span className="text-xs text-slate-500">Gender</span>
                      <p className="text-sm font-semibold text-slate-800">{profile.gender}</p>
                    </div>
                  )}

                  {profile.maritalStatus && (
                    <div>
                      <span className="text-xs text-slate-500">Marital Status</span>
                      <p className="text-sm font-semibold text-slate-800">{profile.maritalStatus}</p>
                    </div>
                  )}

                  {profile.educationalQualification && (
                    <div>
                      <span className="text-xs text-slate-500">Education</span>
                      <p className="text-sm font-semibold text-slate-800">{profile.educationalQualification}</p>
                    </div>
                  )}

                  {profile.panNumber && (
                    <div>
                      <span className="text-xs text-slate-500">PAN Number</span>
                      <p className="font-mono text-sm font-semibold uppercase text-slate-800">{profile.panNumber}</p>
                    </div>
                  )}

                  {profile.aadhaarNumber && (
                    <div>
                      <span className="text-xs text-slate-500">Aadhaar Number</span>
                      <p className="font-mono text-sm font-semibold text-slate-800">
                        {profile.aadhaarNumber.length >= 4
                          ? `•••• •••• ${profile.aadhaarNumber.slice(-4)}`
                          : profile.aadhaarNumber}
                      </p>
                    </div>
                  )}

                  {profile.createdAt && (
                    <div>
                      <span className="text-xs text-slate-500">Member Since</span>
                      <p className="text-sm font-semibold text-slate-800">{formatDate(profile.createdAt)}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Shop & Business Details */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5 text-slate-900">
                    <Store className="h-5 w-5 text-[#7c3aed]" />
                    <h3 className="text-sm font-bold">Shop & Business Details</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/retailer/profile/shop")}
                    className="text-xs font-bold text-[#7c3aed] hover:underline"
                  >
                    Edit Shop
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {profile.shop?.name && (
                    <div>
                      <span className="text-xs text-slate-500">Shop Name</span>
                      <p className="text-sm font-semibold text-slate-800">{profile.shop.name}</p>
                    </div>
                  )}

                  {getCategoryName() && (
                    <div>
                      <span className="text-xs text-slate-500">Category</span>
                      <p className="text-sm font-semibold text-slate-800">{getCategoryName()}</p>
                    </div>
                  )}

                  {getPropertyTypeName() && (
                    <div>
                      <span className="text-xs text-slate-500">Property Type</span>
                      <p className="text-sm font-semibold text-slate-800">{getPropertyTypeName()}</p>
                    </div>
                  )}

                  {getProofTypeName() && (
                    <div>
                      <span className="text-xs text-slate-500">Business Proof Type</span>
                      <p className="text-sm font-semibold text-slate-800">{getProofTypeName()}</p>
                    </div>
                  )}

                  {getFullAddress() && (
                    <div className="sm:col-span-2">
                      <span className="text-xs text-slate-500">Registered Shop Address</span>
                      <p className="text-sm font-semibold text-slate-800">{getFullAddress()}</p>
                    </div>
                  )}

                  {profile.shop?.location?.latitude !== undefined && profile.shop?.location?.longitude !== undefined && (
                    <div>
                      <span className="text-xs text-slate-500">Geo Coordinates</span>
                      <p className="text-sm font-semibold text-slate-800">
                        {profile.shop.location.latitude}°, {profile.shop.location.longitude}°
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Bank Details Card */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5 text-slate-900">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-sm font-bold">Registered Bank Account</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/retailer/profile/bank")}
                    className="text-xs font-bold text-[#7c3aed] hover:underline"
                  >
                    Manage Banks
                  </button>
                </div>

                {profile.primaryBank || (profile.banks && profile.banks.length > 0) ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                      <span className="text-xs text-slate-500">Bank Name</span>
                      <p className="text-sm font-semibold text-slate-800">
                        {profile.primaryBank?.name || profile.banks?.[0]?.name}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500">Account Number</span>
                      <p className="font-mono text-sm font-semibold text-slate-800">
                        {profile.primaryBank?.accountNumber || profile.banks?.[0]?.accountNumber}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500">IFSC Code</span>
                      <p className="font-mono text-sm font-semibold uppercase text-slate-800">
                        {profile.primaryBank?.ifscCode || profile.banks?.[0]?.ifscCode}
                      </p>
                    </div>

                    {(profile.primaryBank?.branchName || profile.banks?.[0]?.branchName) && (
                      <div>
                        <span className="text-xs text-slate-500">Branch Name</span>
                        <p className="text-sm font-semibold text-slate-800">
                          {profile.primaryBank?.branchName || profile.banks?.[0]?.branchName}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No bank account registered yet.</p>
                )}
              </section>

              {/* Attached Documents Section */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5 text-slate-900">
                    <FileCheck className="h-5 w-5 text-[#7c3aed]" />
                    <div>
                      <h3 className="text-sm font-bold">Attached Verification Documents</h3>
                      <p className="text-xs text-slate-500">Official documents submitted for merchant onboarding</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-[#7c3aed]">
                    {attachedDocs.length} {attachedDocs.length === 1 ? "Document" : "Documents"}
                  </span>
                </div>

                {attachedDocs.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {attachedDocs.map((doc) => {
                      const isPdf = doc.url.toLowerCase().endsWith(".pdf") || doc.url.includes("/raw/upload/");
                      return (
                        <div
                          key={doc.id}
                          className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-200 hover:border-[#7c3aed]/40 hover:bg-white hover:shadow-md"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100/60 text-[#7c3aed]">
                                {isPdf ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                                  {isPdf ? "PDF" : "Image"}
                                </span>
                                {doc.reviewStatus && (
                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                      doc.reviewStatus === "APPROVED"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : doc.reviewStatus === "REJECTED"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {doc.reviewStatus}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-3">
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#7c3aed]">
                                {doc.title}
                              </h4>
                              <p className="mt-0.5 text-xs text-slate-500">{doc.category}</p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center gap-2 border-t border-slate-200/70 pt-3">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#7c3aed] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#6d28d9] focus-visible:outline-none"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Document
                            </button>

                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open in new tab"
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No documents attached yet.
                  </div>
                )}
              </section>

            </div>
          </>
        )}

        {/* Account Settings Options */}
        <section>
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Account Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose an option to manage your account
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
                  {/* Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f8f5ff] transition-colors duration-300 group-hover:bg-[#7c3aed]">
                    <Icon className="h-5 w-5 text-[#7c3aed] transition-colors duration-300 group-hover:text-white" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-bold text-[#0f172a]">
                      {option.title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[#64748b]">
                      {option.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#7c3aed]" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Document Preview Modal / Lightbox */}
        {previewDoc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setPreviewDoc(null)}
          >
            <div
              className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{previewDoc.title}</h3>
                  <p className="text-xs text-slate-500">{previewDoc.category}</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in New Tab
                  </a>

                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Close Preview"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-950/5 p-4 min-h-[400px]">
                {previewDoc.url.toLowerCase().endsWith(".pdf") || previewDoc.url.includes("/raw/upload/") ? (
                  <iframe
                    src={previewDoc.url}
                    title={previewDoc.title}
                    className="h-[65vh] w-full rounded-lg border border-slate-200 bg-white"
                  />
                ) : (
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.title}
                    className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-md"
                  />
                )}
              </div>

              {/* Rejection Notice if applicable */}
              {previewDoc.rejectionReason && (
                <div className="border-t border-red-100 bg-red-50 px-5 py-2.5 text-xs text-red-700">
                  <strong>Rejection Reason:</strong> {previewDoc.rejectionReason}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;





