import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Store,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Search,
  Eye,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  getDownlineRetailerDetailsApi,
  getDownlineRetailerTransactionsApi,
  type RetailerFullProfile,
  type DownlineTransaction,
  type PaginationMeta,
} from "../../services/api/retailer/retailerAuthApi";
import Pagination from "../../components/common/Pagination";

type TabType = "profile" | "transactions";

interface DocumentPreview {
  label: string;
  url: string;
  type: string;
}

export default function DistributorRetailerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Retailer Profile State
  const [retailer, setRetailer] = useState<RetailerFullProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  // Transactions State
  const [transactions, setTransactions] = useState<DownlineTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [txPagination, setTxPagination] = useState<PaginationMeta | null>(null);
  const [serviceFilter, setServiceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [txSearch, setTxSearch] = useState("");

  // Document Modal Preview
  const [previewDoc, setPreviewDoc] = useState<DocumentPreview | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Fetch Retailer Profile
  const fetchProfile = useCallback(async () => {
    if (!id) return;
    setProfileLoading(true);
    setProfileError("");
    try {
      const res = await getDownlineRetailerDetailsApi(id);
      if (res?.data) {
        setRetailer(res.data);
      } else {
        setProfileError("Retailer details not found");
      }
    } catch (err) {
      console.error("Failed to fetch retailer profile:", err);
      setProfileError(err instanceof Error ? err.message : "Failed to load retailer profile");
    } finally {
      setProfileLoading(false);
    }
  }, [id]);

  // Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    if (!id) return;
    setTxLoading(true);
    setTxError("");
    try {
      const res = await getDownlineRetailerTransactionsApi(id, {
        page: txPage,
        limit: 10,
        service: serviceFilter !== "All" ? serviceFilter : undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
        search: txSearch.trim() || undefined,
      });

      if (res?.data) {
        setTransactions(res.data);
        if (res.meta) {
          setTxPagination(res.meta);
        }
      } else {
        setTransactions([]);
        setTxPagination(null);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setTxError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setTxLoading(false);
    }
  }, [id, txPage, serviceFilter, statusFilter, txSearch]);

  // Load profile on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProfile]);

  // Load transactions when tab is transactions or when filters/page change
  useEffect(() => {
    if (activeTab === "transactions") {
      const timer = setTimeout(() => {
        fetchTransactions();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab, fetchTransactions]);

  // Extract all uploaded documents
  const documents = useMemo<DocumentPreview[]>(() => {
    if (!retailer) return [];
    const docs: DocumentPreview[] = [];

    if (retailer.panDocument) {
      docs.push({ label: "PAN Card", url: retailer.panDocument, type: "Identity" });
    }
    if (retailer.aadhaarDocument?.front) {
      docs.push({ label: "Aadhaar Card (Front)", url: retailer.aadhaarDocument.front, type: "Identity" });
    }
    if (retailer.aadhaarDocument?.back) {
      docs.push({ label: "Aadhaar Card (Back)", url: retailer.aadhaarDocument.back, type: "Identity" });
    }
    if (retailer.selfie) {
      docs.push({ label: "Selfie / Photo", url: retailer.selfie, type: "Personal" });
    }
    if (retailer.shopInsidePhoto) {
      docs.push({ label: "Shop Inside Photo", url: retailer.shopInsidePhoto, type: "Business" });
    }
    if (retailer.shopOutsidePhoto) {
      docs.push({ label: "Shop Outside Photo", url: retailer.shopOutsidePhoto, type: "Business" });
    }
    if (retailer.shopLocationPhoto) {
      docs.push({ label: "Shop Location Photo", url: retailer.shopLocationPhoto, type: "Business" });
    }
    if (retailer.businessProofDocument) {
      docs.push({ label: "Business Proof", url: retailer.businessProofDocument, type: "Business" });
    }

    return docs;
  }, [retailer]);

  // Format dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAddress = (shop?: RetailerFullProfile["shop"]) => {
    if (!shop) return "Address not provided";
    if (shop.completeAddress && typeof shop.completeAddress === "string") return shop.completeAddress;
    if (typeof shop.address === "string") return shop.address;
    if (shop.address && typeof shop.address === "object") {
      const addr = shop.address as { addressLine?: string; city?: string; state?: string; pincode?: string };
      const parts = [addr.addressLine, addr.city, addr.state, addr.pincode].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
    return "Address not provided";
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "active":
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "blocked":
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getTxStatusBadge = (status?: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "failed":
      case "failure":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#7c3aed]" />
        <p className="mt-4 text-sm font-semibold text-slate-600">Loading retailer profile...</p>
      </div>
    );
  }

  if (profileError || !retailer) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">Failed to Load Retailer</h2>
        <p className="mt-2 text-sm text-slate-600">{profileError || "Retailer was not found in your network."}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => navigate("/retailer/distributor")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Retailers
          </button>
          <button
            onClick={() => fetchProfile()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#6d28d9]"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* TOP BAR / BREADCRUMB */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/retailer/distributor")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 text-slate-500" />
          Back to Retailers List
        </button>
      </div>

      {/* HERO CARD */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#f4effe] text-[#7c3aed]">
              <Store className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900">{retailer.fullName || "Retailer Profile"}</h1>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusBadge(
                    retailer.adminApproved || retailer.status
                  )}`}
                >
                  {retailer.adminApproved === "approved"
                    ? "Approved"
                    : retailer.adminApproved === "rejected"
                    ? "Rejected"
                    : retailer.status || "Pending"}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-[#7c3aed]">
                {retailer.shop?.name || "Independent Retailer"}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>+91 {retailer.mobile}</span>
                  {retailer.isMobileVerified && (
                    <span title="Mobile Verified" className="inline-flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    </span>
                  )}
                </div>
                {retailer.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{retailer.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Registered: {formatDate(retailer.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={() => {
                if (activeTab === "profile") fetchProfile();
                else fetchTransactions();
              }}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${profileLoading || txLoading ? "animate-spin text-[#7c3aed]" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* TAB BUTTONS */}
        <div className="mt-6 flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
              activeTab === "profile"
                ? "border-[#7c3aed] text-[#7c3aed]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="h-4 w-4" />
            Complete Profile
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
              activeTab === "transactions"
                ? "border-[#7c3aed] text-[#7c3aed]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Activity className="h-4 w-4" />
            Transaction History
            {txPagination?.total !== undefined && txPagination.total > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {txPagination.total}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE INFORMATION */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* PERSONAL INFORMATION */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#7c3aed]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
                  <p className="text-xs text-slate-500">Retailer personal & identity details</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-y-3.5 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-xs font-medium text-slate-400">Full Name</p>
                  <p className="font-semibold text-slate-800">{retailer.fullName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Father's Name</p>
                  <p className="font-semibold text-slate-800">{retailer.fatherName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Gender</p>
                  <p className="font-semibold text-slate-800 capitalize">{retailer.gender || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Date of Birth</p>
                  <p className="font-semibold text-slate-800">{retailer.dateOfBirth || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Marital Status</p>
                  <p className="font-semibold text-slate-800 capitalize">{retailer.maritalStatus || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Qualification</p>
                  <p className="font-semibold text-slate-800">{retailer.educationalQualification || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">PAN Number</p>
                  <p className="font-mono font-bold text-slate-800">{retailer.panNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Aadhaar Number</p>
                  <p className="font-mono font-bold text-slate-800">
                    {retailer.aadhaarNumber ? `XXXX-XXXX-${retailer.aadhaarNumber.slice(-4)}` : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* SHOP INFORMATION */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Shop & Business Details</h3>
                  <p className="text-xs text-slate-500">Retail outlet establishment address</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-y-3.5 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-xs font-medium text-slate-400">Shop Name</p>
                  <p className="font-semibold text-slate-800">{retailer.shop?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Category</p>
                  <p className="font-semibold text-slate-800">
                    {typeof retailer.shop?.category === "object"
                      ? retailer.shop.category?.name
                      : retailer.shop?.category || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Property Type</p>
                  <p className="font-semibold text-slate-800">
                    {typeof retailer.shop?.propertyType === "object"
                      ? retailer.shop.propertyType?.name
                      : retailer.shop?.propertyType || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Outlet ID</p>
                  <p className="font-mono font-semibold text-slate-800">{retailer.outletId || "Not registered"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-slate-400">Complete Address</p>
                  <p className="font-semibold text-slate-800">
                    {formatAddress(retailer.shop)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BANK ACCOUNTS SECTION */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Bank Accounts</h3>
                <p className="text-xs text-slate-500">Linked settlement bank accounts for this retailer</p>
              </div>
            </div>

            <div className="mt-4">
              {retailer.banks && retailer.banks.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {retailer.banks.map((bank, idx) => (
                    <div
                      key={bank._id || bank.id || idx}
                      className={`relative rounded-xl border p-4 transition ${
                        bank.isPrimary
                          ? "border-[#7c3aed]/40 bg-[#faf7ff]"
                          : "border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-slate-900">{bank.bankName || "Bank"}</span>
                        {bank.isPrimary && (
                          <span className="inline-flex items-center rounded-md bg-[#7c3aed] px-2 py-0.5 text-[10px] font-bold text-white">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="mt-2 font-mono text-sm font-bold text-slate-800">
                        {bank.accountNumber || "—"}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>IFSC: {bank.ifscCode || "—"}</span>
                      </div>
                      {bank.accountHolderName && (
                        <p className="mt-1 text-xs text-slate-500 truncate">
                          Holder: {bank.accountHolderName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                  <CreditCard className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">No bank accounts linked</p>
                  <p className="text-xs text-slate-400">Retailer has not added any bank details yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* UPLOADED DOCUMENTS GALLERY */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Uploaded Documents & Photos</h3>
                  <p className="text-xs text-slate-500">Click any document to inspect full preview</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {documents.length} uploaded
              </span>
            </div>

            <div className="mt-6">
              {documents.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {documents.map((doc, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setPreviewDoc(doc);
                        setZoom(1);
                        setRotation(0);
                      }}
                      className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-[#7c3aed] hover:shadow-md"
                    >
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-200">
                        <img
                          src={doc.url}
                          alt={doc.label}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <p className="mt-2 text-xs font-bold text-slate-800 line-clamp-1">{doc.label}</p>
                      <span className="mt-0.5 inline-block text-[10px] font-medium text-slate-400">{doc.type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <FileText className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">No documents uploaded yet</p>
                  <p className="text-xs text-slate-400">All uploaded identity & shop verification files will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTIONS HISTORY */}
      {activeTab === "transactions" && (
        <div className="space-y-6">
          {/* SEARCH & FILTER BAR */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={txSearch}
                onChange={(e) => {
                  setTxSearch(e.target.value);
                  setTxPage(1);
                }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Service Filter */}
              <select
                value={serviceFilter}
                onChange={(e) => {
                  setServiceFilter(e.target.value);
                  setTxPage(1);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-[#7c3aed]"
              >
                <option value="All">All Services</option>
                <option value="AEPS">AEPS</option>
                <option value="DMT">DMT</option>
                <option value="BBPS">BBPS</option>
                <option value="RECHARGE">Recharge</option>
                <option value="UPI">UPI</option>
                <option value="CMS">CMS</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setTxPage(1);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-[#7c3aed]"
              >
                <option value="All">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          {/* TRANSACTIONS TABLE */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {txLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
                <p className="mt-3 text-sm font-semibold text-slate-500">Fetching transactions...</p>
              </div>
            ) : txError ? (
              <div className="p-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
                <p className="mt-2 text-sm font-bold text-slate-800">{txError}</p>
                <button
                  onClick={() => fetchTransactions()}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#6d28d9]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-20 text-center">
                <Activity className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 text-base font-bold text-slate-900">No Transactions Found</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  {txSearch || serviceFilter !== "All" || statusFilter !== "All"
                    ? "No transactions match your current search and filter criteria."
                    : "This retailer has not processed any customer transactions yet."}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                    <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5 font-bold">Transaction ID</th>
                        <th className="px-5 py-3.5 font-bold">Service</th>
                        <th className="px-5 py-3.5 font-bold">Amount</th>
                        <th className="px-5 py-3.5 font-bold">Status</th>
                        <th className="px-5 py-3.5 font-bold">Narration / Details</th>
                        <th className="px-5 py-3.5 font-bold">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((txn) => {
                        const txnId = txn.id || txn._id || "";
                        return (
                          <tr key={txnId} className="transition hover:bg-slate-50/50">
                            <td className="px-5 py-4 font-mono text-xs font-bold text-slate-800">
                              {txnId.length > 12 ? `${txnId.slice(0, 8)}...${txnId.slice(-4)}` : txnId}
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                                {txn.service || "General"}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-black text-slate-900">
                              ₹{(txn.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${getTxStatusBadge(
                                  txn.status
                                )}`}
                              >
                                {txn.status || "Unknown"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate">
                              {txn.narration || txn.type || "—"}
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span>{formatDate(txn.date || txn.createdAt)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {txPagination && txPagination.totalPages > 1 && (
                  <div className="border-t border-slate-100 p-4">
                    <Pagination
                      currentPage={txPage}
                      totalPages={txPagination.totalPages}
                      totalItems={txPagination.total}
                      pageSize={txPagination.limit || 10}
                      onPageChange={(p) => setTxPage(p)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* DOCUMENT VIEWER MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative flex flex-col max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div>
                <h3 className="text-base font-bold text-slate-900">{previewDoc.label}</h3>
                <span className="text-xs text-slate-400">{previewDoc.type} Document</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
                  title="Rotate"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
                  title="Open Original"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto bg-slate-100/70 p-6 flex items-center justify-center min-h-[350px]">
              <div
                className="transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
              >
                <img
                  src={previewDoc.url}
                  alt={previewDoc.label}
                  className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-md bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
