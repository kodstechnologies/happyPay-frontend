import {
  ArrowLeft,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  X,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Store,
  User,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Pagination from "../../../components/common/Pagination";
import {
  getAdminRetailer,
  getAdminRetailerTransactions,
  getAdminDistributorSubRetailers,
  updateAdminRetailerKyc,
  updateAdminRetailerAccountStatus,
  reviewAdminRetailerDocument,
} from "../../../apis/adminRetailer.apis";
import type {
  AdminRetailer,
  AdminTransaction,
  AdminSubRetailer,
  PaginationMeta,
  TransactionService,
} from "../../../types/admin/retailer";

type Tab = "registration" | "transactions" | "retailers";
type TxFilter = "All" | "AEPS" | "UPI Cashpoint" | "Aadhar pay" | "BBPS" | "DMT" | "CMS" | "Others";
type DocStatus = "pending" | "approved" | "rejected";
type DocFilter = "all" | "pending" | "approved" | "rejected";

interface DocumentItem {
  id: string;
  label: string;
  value: string;
  imageUrl: string;
  status: DocStatus;
  rejectionReason?: string;
  uploadedAt: string;
}

export default function AdminRetailerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("registration");
  const [txFilter, setTxFilter] = useState<TxFilter>("All");
  const [docFilter, setDocFilter] = useState<DocFilter>("all");

  // Retailer data state
  const [liveRetailer, setLiveRetailer] = useState<AdminRetailer | null>(null);
  const [retailerLoading, setRetailerLoading] = useState(true);
  const [retailerError, setRetailerError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Document viewer modal
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Rejection modal state (handles document rejection and overall retailer rejection)
  const [rejectingDoc, setRejectingDoc] = useState<DocumentItem | null>(null);
  const [isRejectingRetailer, setIsRejectingRetailer] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionReasonError, setRejectionReasonError] = useState("");
  const rejectionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Transactions Tab state (real data only)
  const [liveTransactions, setLiveTransactions] = useState<AdminTransaction[]>([]);
  const [txPagination, setTxPagination] = useState<PaginationMeta | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);

  // Retailers tab state (distributor sub-retailers - real data only)
  const [subRetailerSearch, setSubRetailerSearch] = useState("");
  const [subRetailerPage, setSubRetailerPage] = useState(1);
  const SUB_RETAILER_PAGE_SIZE = 8;
  const [liveSubRetailers, setLiveSubRetailers] = useState<AdminSubRetailer[]>([]);
  const [subRetailerPagination, setSubRetailerPagination] = useState<PaginationMeta | null>(null);
  const [subRetailersLoading, setSubRetailersLoading] = useState(false);

  // Sub-Retailer Profile Modal (real data only)
  const [viewingSubRetailer, setViewingSubRetailer] = useState<AdminSubRetailer | null>(null);
  const [modalLiveTx, setModalLiveTx] = useState<AdminTransaction[]>([]);
  const [modalTxPagination, setModalTxPagination] = useState<PaginationMeta | null>(null);
  const [modalTxPage, setModalTxPage] = useState(1);
  const [modalTxFilter, setModalTxFilter] = useState<string>("all");
  const [modalTxLoading, setModalTxLoading] = useState(false);

  // Fetch Retailer Profile from backend API
  const loadRetailer = useCallback(() => {
    if (!id) return;
    setRetailerLoading(true);
    setRetailerError("");

    getAdminRetailer(id)
      .then((res) => {
        if (res) {
          setLiveRetailer(res);
        } else {
          setRetailerError("Retailer not found.");
        }
      })
      .catch((err) => {
        console.error("Could not fetch retailer profile:", err);
        setRetailerError(err?.message || "Failed to load retailer details.");
      })
      .finally(() => {
        setRetailerLoading(false);
      });
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRetailer();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadRetailer]);

  // Memoized real document list derived directly from liveRetailer (Single Source of Truth)
  const documents = useMemo<DocumentItem[]>(() => {
    if (!liveRetailer) {
      return [];
    }

    const docDefs: Array<{
      id: string;
      label: string;
      value: string;
      url?: string;
    }> = [
      {
        id: "panDocument",
        label: "PAN Card",
        value: liveRetailer.panNumber || "-",
        url: liveRetailer.panDocument,
      },
      {
        id: "aadhaarDocument",
        label: "Aadhaar Card",
        value: liveRetailer.aadhaarNumber
          ? liveRetailer.aadhaarNumber.length >= 4
            ? `XXXX-XXXX-${liveRetailer.aadhaarNumber.slice(-4)}`
            : liveRetailer.aadhaarNumber
          : "-",
        url: liveRetailer.aadhaarDocument,
      },
      {
        id: "businessProofDocument",
        label: `Business Proof (${
          typeof liveRetailer.businessProofType === "object" && liveRetailer.businessProofType?.name
            ? liveRetailer.businessProofType.name
            : "GST / Trade Proof"
        })`,
        value:
          typeof liveRetailer.businessProofType === "object" && liveRetailer.businessProofType?.name
            ? liveRetailer.businessProofType.name
            : "Business Registration",
        url: liveRetailer.businessProofDocument,
      },
      {
        id: "selfie",
        label: "Retailer Photo / Selfie",
        value: "Live Identity Photo",
        url: liveRetailer.selfie,
      },
      {
        id: "shopInsidePhoto",
        label: "Shop Inside View",
        value: "Interior Photo",
        url: liveRetailer.shopInsidePhoto,
      },
      {
        id: "shopOutsidePhoto",
        label: "Shop Outside View",
        value: "Exterior Photo",
        url: liveRetailer.shopOutsidePhoto,
      },
      {
        id: "shopLocationPhoto",
        label: "Shop Location View",
        value: "Landmark / Location Photo",
        url: liveRetailer.shopLocationPhoto,
      },
    ];

    const reviews = liveRetailer.documentReviews || {};
    const items: DocumentItem[] = [];

    for (const def of docDefs) {
      if (!def.url) continue; // Show only real uploaded documents
      const review = reviews[def.id] || {};
      const statusRaw = (review.status || "").toLowerCase();
      let status: DocStatus = "pending";
      if (statusRaw === "approved") {
        status = "approved";
      } else if (statusRaw === "rejected") {
        status = "rejected";
      } else if (liveRetailer.adminApproved === "approved") {
        status = "approved";
      }

      items.push({
        id: def.id,
        label: def.label,
        value: def.value,
        imageUrl: def.url,
        status,
        rejectionReason:
          review.rejectionReason ||
          (status === "rejected" ? liveRetailer.reasonOfRejection || undefined : undefined),
        uploadedAt: liveRetailer.updatedAt || liveRetailer.createdAt || new Date().toISOString(),
      });
    }

    return items;
  }, [liveRetailer]);

  // Computed document counts & active filter
  const docCounts = useMemo(() => ({
    all: documents.length,
    approved: documents.filter((d) => d.status === "approved").length,
    pending: documents.filter((d) => d.status === "pending").length,
    rejected: documents.filter((d) => d.status === "rejected").length,
  }), [documents]);

  const filteredDocuments = useMemo(() => {
    if (docFilter === "all") return documents;
    return documents.filter((d) => d.status === docFilter);
  }, [documents, docFilter]);

  // Fetch Live Transactions for Retailer
  useEffect(() => {
    if (activeTab !== "transactions" || !id) return;
    let isMounted = true;

    const timer = window.setTimeout(() => {
      setTxLoading(true);

      const serviceMap: Record<TxFilter, TransactionService | undefined> = {
        All: undefined,
        AEPS: "AEPS",
        DMT: "DMT",
        CMS: "CMS",
        "UPI Cashpoint": "UPI",
        "Aadhar pay": "AEPS",
        BBPS: "BBPS",
        Others: undefined,
      };

      getAdminRetailerTransactions(id, {
        service: serviceMap[txFilter],
        page: txPage,
        limit: 10,
      })
        .then((res) => {
          if (isMounted && res) {
            setLiveTransactions(res.transactions || []);
            setTxPagination(res.pagination || null);
          }
        })
        .catch((err) => {
          console.warn("Could not load live transactions:", err);
          if (isMounted) {
            setLiveTransactions([]);
            setTxPagination(null);
          }
        })
        .finally(() => {
          if (isMounted) setTxLoading(false);
        });
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [activeTab, id, txFilter, txPage]);

  // Fetch Live Sub-Retailers for Distributor
  useEffect(() => {
    if (activeTab !== "retailers" || liveRetailer?.role !== "distributor" || !id) return;
    let isMounted = true;

    const timer = setTimeout(() => {
      setSubRetailersLoading(true);
      getAdminDistributorSubRetailers(id, {
        search: subRetailerSearch.trim() || undefined,
        page: subRetailerPage,
        limit: SUB_RETAILER_PAGE_SIZE,
      })
        .then((res) => {
          if (isMounted && res) {
            setLiveSubRetailers(res.items || []);
            setSubRetailerPagination(res.pagination || null);
          }
        })
        .catch((err) => {
          console.warn("Could not load sub-retailers from API:", err);
          if (isMounted) {
            setLiveSubRetailers([]);
            setSubRetailerPagination(null);
          }
        })
        .finally(() => {
          if (isMounted) setSubRetailersLoading(false);
        });
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeTab, liveRetailer?.role, id, subRetailerSearch, subRetailerPage]);

  // Fetch Sub-Retailer Modal live transactions
  useEffect(() => {
    if (!viewingSubRetailer) return;
    let isMounted = true;

    const timer = window.setTimeout(() => {
      setModalTxLoading(true);

      const serviceMap: Record<string, TransactionService | undefined> = {
        all: undefined,
        AEPS: "AEPS",
        DMT: "DMT",
        CMS: "CMS",
        UPI: "UPI",
        BBPS: "BBPS",
        "Aadhaar Pay": "AEPS",
      };

      getAdminRetailerTransactions(viewingSubRetailer.id, {
        service: serviceMap[modalTxFilter],
        page: modalTxPage,
        limit: 8,
      })
        .then((res) => {
          if (isMounted && res?.transactions) {
            setModalLiveTx(res.transactions);
            setModalTxPagination(res.pagination || null);
          } else if (isMounted) {
            setModalLiveTx([]);
            setModalTxPagination(null);
          }
        })
        .catch(() => {
          if (isMounted) {
            setModalLiveTx([]);
            setModalTxPagination(null);
          }
        })
        .finally(() => {
          if (isMounted) setModalTxLoading(false);
        });
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [viewingSubRetailer, modalTxFilter, modalTxPage]);

  // Focus textarea when rejection modal opens
  useEffect(() => {
    if ((rejectingDoc || isRejectingRetailer) && rejectionTextareaRef.current) {
      rejectionTextareaRef.current.focus();
    }
  }, [rejectingDoc, isRejectingRetailer]);

  // Clear feedback timer
  useEffect(() => {
    if (!actionFeedback) return;
    const timer = setTimeout(() => setActionFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [actionFeedback]);

  // Approve Entire Retailer
  const handleApproveRetailer = async () => {
    if (!id || actionLoading) return;
    setActionLoading(true);
    setActionFeedback(null);

    try {
      await updateAdminRetailerAccountStatus(id, "approved");
      await updateAdminRetailerKyc(id, "approved");
      setLiveRetailer((prev) =>
        prev
          ? {
              ...prev,
              status: "active",
              adminApproved: "approved",
              kycStatus: "approved",
              reasonOfRejection: undefined,
            }
          : prev
      );
      // Optimistically update document reviews on liveRetailer
      setLiveRetailer((prev) => {
        if (!prev) return prev;
        const currentReviews = prev.documentReviews || {};
        const updatedReviews: typeof currentReviews = { ...currentReviews };
        Object.keys(currentReviews).forEach((k) => {
          updatedReviews[k] = { ...updatedReviews[k], status: "APPROVED", rejectionReason: undefined };
        });
        return {
          ...prev,
          status: "active",
          adminApproved: "approved",
          kycStatus: "approved",
          reasonOfRejection: undefined,
          documentReviews: updatedReviews,
        };
      });
      setActionFeedback({ type: "success", message: "Retailer approved successfully!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve retailer.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Individual Document
  const handleApproveDoc = async (docId: string) => {
    // Optimistically update document review on liveRetailer
    setLiveRetailer((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        documentReviews: {
          ...prev.documentReviews,
          [docId]: {
            ...prev.documentReviews?.[docId],
            status: "APPROVED",
            rejectionReason: undefined,
          },
        },
      };
    });

    if (id) {
      try {
        await reviewAdminRetailerDocument({
          retailerId: id,
          documentField: docId,
          action: "approve",
        });
        setActionFeedback({ type: "success", message: "Document verified and approved." });
      } catch (e) {
        console.warn("Could not sync document approval to backend:", e);
      }
    }
  };

  // Rejection Submit (handles both document and overall retailer rejection)
  const handleRejectSubmit = async () => {
    const reason = rejectionReason.trim();
    if (!reason) {
      setRejectionReasonError("Please provide a reason for rejection");
      return;
    }
    if (reason.length < 10) {
      setRejectionReasonError("Rejection reason must be at least 10 characters");
      return;
    }

    setActionLoading(true);

    try {
      if (rejectingDoc) {
        // Individual document rejection: update liveRetailer optimistically
        setLiveRetailer((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            documentReviews: {
              ...prev.documentReviews,
              [rejectingDoc.id]: {
                ...prev.documentReviews?.[rejectingDoc.id],
                status: "REJECTED",
                rejectionReason: reason,
              },
            },
          };
        });

        if (id) {
          await reviewAdminRetailerDocument({
            retailerId: id,
            documentField: rejectingDoc.id,
            action: "reject",
            reason,
          });
        }
        setActionFeedback({ type: "success", message: `Document '${rejectingDoc.label}' rejected.` });
      } else if (isRejectingRetailer) {
        // Overall Retailer rejection
        if (id) {
          await updateAdminRetailerAccountStatus(id, "rejected", reason);
          await updateAdminRetailerKyc(id, "rejected", reason);
          setLiveRetailer((prev) =>
            prev
              ? {
                  ...prev,
                  status: "rejected",
                  adminApproved: "rejected",
                  kycStatus: "rejected",
                  reasonOfRejection: reason,
                  kycRejectionReason: reason,
                }
              : prev
          );
        }
        setActionFeedback({ type: "success", message: "Retailer application rejected." });
      }

      setRejectingDoc(null);
      setIsRejectingRetailer(false);
      setRejectionReason("");
      setRejectionReasonError("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process rejection.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    const link = document.createElement("a");
    link.href = doc.imageUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.download = `${doc.label.replace(/\s+/g, "_")}_${doc.value}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusConfig = (status: DocStatus) => {
    switch (status) {
      case "approved":
        return {
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
          label: "Approved",
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          ring: "ring-emerald-500/20",
        };
      case "rejected":
        return {
          icon: <ShieldAlert className="h-3.5 w-3.5" />,
          label: "Rejected",
          bg: "bg-rose-50",
          text: "text-rose-700",
          border: "border-rose-200",
          ring: "ring-rose-500/20",
        };
      default:
        return {
          icon: <Clock className="h-3.5 w-3.5" />,
          label: "Pending Review",
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          ring: "ring-amber-500/20",
        };
    }
  };

  const txStatusBadge: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
    pending: "bg-amber-100 text-amber-700",
  };

  const kycBadge: Record<string, { bg: string; text: string }> = {
    approved: { bg: "bg-emerald-50", text: "text-emerald-700" },
    pending: { bg: "bg-amber-50", text: "text-amber-700" },
    rejected: { bg: "bg-rose-50", text: "text-rose-700" },
  };

  const statusBadge: Record<string, { bg: string; text: string }> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700" },
    approved: { bg: "bg-emerald-50", text: "text-emerald-700" },
    pending: { bg: "bg-amber-50", text: "text-amber-700" },
    blocked: { bg: "bg-rose-50", text: "text-rose-700" },
    rejected: { bg: "bg-rose-50", text: "text-rose-700" },
    suspended: { bg: "bg-rose-50", text: "text-rose-700" },
  };

  // Loading Skeleton State
  if (retailerLoading) {
    return (
      <div className="mx-auto w-full space-y-6">
        <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
        <div className="hp-card rounded-2xl p-6 space-y-6 border border-slate-100">
          <div className="h-10 animate-pulse rounded-lg bg-slate-100 w-1/3" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Retailer Not Found State
  if (!liveRetailer || retailerError) {
    return (
      <div className="mx-auto w-full  p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <User className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Retailer not found</h3>
        <p className="text-xs text-slate-500 mt-1">
          {retailerError || `No retailer found with ID: ${id}`}
        </p>
        <button
          onClick={() => navigate("/admin/retailers")}
          className="mt-4 px-4 py-2 rounded-lg bg-[#315bd1] text-white text-xs font-bold hover:bg-[#2848a8] transition-colors"
        >
          Back to Retailers List
        </button>
      </div>
    );
  }

  const selected = liveRetailer;

  const isDistributor =
    selected.role === "distributor" ||
    (Array.isArray(selected.role) &&
      selected.role.some((r: unknown) =>
        typeof r === "object" && r !== null
          ? (r as { slug?: string; name?: string }).slug === "distributor" ||
            (r as { slug?: string; name?: string }).name?.toLowerCase() === "distributor"
          : String(r) === "distributor"
      ));

  const roleDisplay = isDistributor ? "distributor" : selected.role || "retailer";

  // Clean helper to extract human readable display names from populated objects or IDs
  const getDisplayName = (val: unknown, defaultName = "-") => {
    if (!val) return defaultName;
    if (typeof val === "object" && val !== null && "name" in val && typeof (val as { name: unknown }).name === "string") {
      return (val as { name: string }).name;
    }
    if (typeof val === "string") {
      if (/^[a-f\d]{24}$/i.test(val)) {
        return defaultName;
      }
      return val;
    }
    return defaultName;
  };

  // Real Personal Info Fields
  const personalInfoFields = [
    { label: "Retailer Name", value: selected.fullName || "-" },
    { label: "Mobile Number", value: selected.mobile || "-" },
    { label: "Email Address", value: selected.email || "-" },
    {
      label: "Gender",
      value:
        selected.gender === "M"
          ? "Male"
          : selected.gender === "F"
          ? "Female"
          : selected.gender || "-",
    },
    {
      label: "Date of Birth",
      value: selected.dateOfBirth
        ? new Date(selected.dateOfBirth).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-",
    },
    { label: "Father Name", value: selected.fatherName || "-" },
    { label: "Marital Status", value: selected.maritalStatus || "-" },
    { label: "Educational Qualification", value: selected.educationalQualification || "-" },
    {
      label: "Verification Status",
      value: `Aadhaar: ${selected.aadhaarVerified ? "Verified" : "Pending"} • Mobile: ${
        selected.isMobileVerified ? "Verified" : "Pending"
      } • Email: ${selected.isEmailVerified ? "Verified" : "Pending"}`,
    },
  ];

  // Real Shop Info Fields
  const shopCategoryName = getDisplayName(selected.shop?.category, "General");
  const propertyTypeName = getDisplayName(selected.shop?.propertyType, "Owned");

  const shopFormattedAddress =
    selected.shop?.completeAddress ||
    [
      selected.shop?.address?.addressLine,
      selected.shop?.address?.city,
      selected.shop?.address?.state,
      selected.shop?.address?.pincode,
    ]
      .filter(Boolean)
      .join(", ") ||
    "-";

  const shopInfoFields = [
    { label: "Shop Name", value: selected.shop?.name || "-" },
    { label: "Shop Category", value: shopCategoryName },
    { label: "Property Type", value: propertyTypeName },
    { label: "Shop Address", value: shopFormattedAddress },
  ];

  const banksList = selected.banks && selected.banks.length > 0 ? selected.banks : [];

  return (
    <div className="mx-auto w-full space-y-6">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button onClick={() => setActionFeedback(null)} className="ml-2 hover:opacity-75">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              {selected.fullName || "Unnamed Retailer"}
            </h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center flex-wrap gap-1">
            
              <span>•</span>
              <span className="uppercase text-[10px] font-bold text-[#315bd1] bg-[#f0f4ff] px-2 py-0.5 rounded-full">
                {roleDisplay}
              </span>
              <span
                className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  statusBadge[selected.status || "active"]?.bg || "bg-slate-100"
                } ${statusBadge[selected.status || "active"]?.text || "text-slate-700"}`}
              >
                {selected.status || "active"}
              </span>
              {selected.adminApproved && (
                <span
                  className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    kycBadge[selected.adminApproved]?.bg || "bg-slate-100"
                  } ${kycBadge[selected.adminApproved]?.text || "text-slate-700"}`}
                >
                  KYC: {selected.adminApproved}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Approve & Reject Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {selected.adminApproved !== "approved" ? (
            <button
              onClick={handleApproveRetailer}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm hover:shadow disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Approve Retailer
            </button>
          ) : (
            <button
              onClick={() => {
                setIsRejectingRetailer(true);
                setRejectingDoc(null);
                setRejectionReason("");
                setRejectionReasonError("");
              }}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-sm hover:shadow disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Reject Retailer
            </button>
          )}

          {selected.adminApproved === "rejected" && (
            <button
              onClick={handleApproveRetailer}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all disabled:opacity-50"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Re-Approve Retailer
            </button>
          )}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="hp-card rounded-2xl p-6 shadow-sm border border-slate-100">
        {/* Navigation Tabs */}
        <div className="flex gap-6 border-b border-slate-100 pb-0">
          <button
            onClick={() => setActiveTab("registration")}
            className={`text-sm font-bold pb-3 px-1 transition-colors ${
              activeTab === "registration"
                ? "text-[#315bd1] border-b-2 border-[#315bd1]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Registration Profile
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`text-sm font-bold pb-3 px-1 transition-colors ${
              activeTab === "transactions"
                ? "text-[#315bd1] border-b-2 border-[#315bd1]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Live Transactions
          </button>
          {isDistributor && (
            <button
              onClick={() => setActiveTab("retailers")}
              className={`text-sm font-bold pb-3 px-1 transition-colors ${
                activeTab === "retailers"
                  ? "text-[#315bd1] border-b-2 border-[#315bd1]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Sub-Retailers
            </button>
          )}
        </div>

        {/* Tab 1: Registration Profile */}
        {activeTab === "registration" && (
          <div className="mt-6 space-y-8 animate-slide-in-right">
            {/* Show Rejection Banner if Rejected */}
            {(selected.reasonOfRejection || selected.kycRejectionReason) &&
              (selected.adminApproved === "rejected" || selected.status === "rejected") && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider mb-1">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    Retailer Application Rejected
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    {selected.reasonOfRejection || selected.kycRejectionReason}
                  </p>
                </div>
              )}

            {/* Personal Information */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-[#315bd1]/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-[#315bd1]" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Personal Information
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {personalInfoFields.map((field, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {field.label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800 break-all">{field.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Shop Information */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Store className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Shop Information
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {shopInfoFields.map((field, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border border-slate-200 bg-slate-50/70 p-4 ${
                      idx === shopInfoFields.length - 1 ? "sm:col-span-2 lg:col-span-3" : ""
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {field.label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800 break-all">{field.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Bank Details */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <CreditCard className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Bank Details ({banksList.length})
                </h3>
              </div>

              {banksList.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {banksList.map((b, idx) => {
                    const maskedAcc = b.accountNumber
                      ? b.accountNumber.length > 4
                        ? `XXXXXXXX${b.accountNumber.slice(-4)}`
                        : b.accountNumber
                      : "-";
                    return (
                      <div
                        key={b._id || idx}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 relative"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {b.isPrimary ? "Primary Account" : `Bank Account #${idx + 1}`}
                          </span>
                          {b.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-800">{b.name || "-"}</p>
                        <div className="mt-2 text-xs space-y-1 text-slate-600">
                          <p>
                            <span className="text-slate-400 font-semibold">A/C:</span>{" "}
                            <span className="font-mono font-bold text-slate-700">{maskedAcc}</span>
                          </p>
                          <p>
                            <span className="text-slate-400 font-semibold">IFSC:</span>{" "}
                            <span className="font-mono font-bold text-slate-700">{b.ifscCode || "-"}</span>
                          </p>
                          {b.branchName && (
                            <p>
                              <span className="text-slate-400 font-semibold">Branch:</span>{" "}
                              <span>{b.branchName}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs font-medium rounded-xl border border-dashed border-slate-200">
                  No bank accounts added by retailer
                </div>
              )}
            </section>

            {/* Documents & KYC Verification */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      Uploaded Documents ({documents.length})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Review and verify submitted retailer identity and shop proofs
                    </p>
                  </div>
                </div>

                {/* Interactive Status Filter Pills */}
                <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl self-start sm:self-auto flex-wrap">
                  <button
                    onClick={() => setDocFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      docFilter === "all"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    All ({docCounts.all})
                  </button>
                  <button
                    onClick={() => setDocFilter("pending")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      docFilter === "pending"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-amber-700 hover:bg-amber-100/60"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                    Pending ({docCounts.pending})
                  </button>
                  <button
                    onClick={() => setDocFilter("approved")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      docFilter === "approved"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-emerald-700 hover:bg-emerald-100/60"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Approved ({docCounts.approved})
                  </button>
                  <button
                    onClick={() => setDocFilter("rejected")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      docFilter === "rejected"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-rose-700 hover:bg-rose-100/60"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                    Rejected ({docCounts.rejected})
                  </button>
                </div>
              </div>

              {filteredDocuments.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDocuments.map((doc) => {
                    const statusConfig = getStatusConfig(doc.status);
                    return (
                      <div
                        key={doc.id}
                        className={`rounded-2xl border ${statusConfig.border} bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col`}
                      >
                        {/* Card Header: Type, Label & Status Badge */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-[#315bd1]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <FileText className="h-4 w-4 text-[#315bd1]" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 truncate" title={doc.label}>
                                {doc.label}
                              </h4>
                              <p className="text-[11px] font-mono font-semibold text-slate-500 truncate mt-0.5">
                                {doc.value}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${statusConfig.bg} ${statusConfig.text} ring-1 ${statusConfig.ring} flex-shrink-0`}
                          >
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Document Image Preview Area */}
                        <div
                          className="relative group aspect-[16/10] bg-slate-900/5 cursor-pointer overflow-hidden flex items-center justify-center p-3 border-b border-slate-100"
                          onClick={() => {
                            setViewingDoc(doc);
                            setZoom(1);
                            setRotation(0);
                          }}
                        >
                          <img
                            src={doc.imageUrl}
                            alt={doc.label}
                            className="max-h-full max-w-full object-contain rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-105"
                          />
                          {/* Hover overlay with preview indicator */}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <span className="bg-white/95 backdrop-blur-sm text-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold shadow-lg flex items-center gap-1.5 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
                              <Eye className="h-3.5 w-3.5 text-[#315bd1]" />
                              Click to Preview
                            </span>
                          </div>
                        </div>

                        {/* Card Details & Rejection reason */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Uploaded{" "}
                              {new Date(doc.uploadedAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          {/* Show rejection reason banner if rejected */}
                          {doc.status === "rejected" && doc.rejectionReason && (
                            <div className="rounded-lg bg-rose-50 border border-rose-100 p-2.5 text-xs text-rose-700">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-0.5">
                                Rejection Reason
                              </p>
                              <p className="line-clamp-2 text-[11px] leading-relaxed">
                                {doc.rejectionReason}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons Footer */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setViewingDoc(doc);
                                  setZoom(1);
                                  setRotation(0);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="View full image"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDownload(doc)}
                                className="p-1.5 rounded-lg text-[#315bd1] hover:bg-[#315bd1]/10 transition-colors"
                                title="Download document"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {doc.status !== "approved" && (
                                <button
                                  onClick={() => handleApproveDoc(doc.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Approve
                                </button>
                              )}
                              {doc.status !== "rejected" && (
                                <button
                                  onClick={() => {
                                    setRejectingDoc(doc);
                                    setIsRejectingRetailer(false);
                                    setRejectionReason("");
                                    setRejectionReasonError("");
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-sm"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Reject
                                </button>
                              )}
                              {doc.status === "approved" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs font-medium rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                  {docFilter === "all"
                    ? "No documents uploaded by retailer"
                    : `No ${docFilter} documents found`}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab 2: Live Transactions */}
        {activeTab === "transactions" && (
          <div className="mt-6 flex flex-col gap-5">
            {/* Service Filters */}
            <div className="flex flex-wrap gap-2">
              {(
                ["All", "AEPS", "UPI Cashpoint", "Aadhar pay", "BBPS", "DMT", "CMS", "Others"] as const
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setTxFilter(tab);
                    setTxPage(1);
                  }}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-colors ${
                    txFilter === tab
                      ? "bg-[#315bd1] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Transactions Content */}
            {txLoading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : liveTransactions.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="hp-table">
                    <thead>
                      <tr>
                        <th>Txn ID</th>
                        <th>Service</th>
                        <th>Type</th>
                        <th>Description / Payee</th>
                        <th>Amount</th>
                        <th>Commission</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveTransactions.map((tx) => (
                        <tr key={tx._id || tx.transactionId}>
                          <td className="font-mono text-xs font-bold text-slate-700">
                            {tx.transactionId}
                          </td>
                          <td>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                              {tx.service}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                tx.type === "credit"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td className="font-medium text-slate-700">
                            {tx.description ||
                              tx.payee?.accountHolderName ||
                              tx.payee?.bankName ||
                              "-"}
                          </td>
                          <td className="font-bold text-slate-800">
                            ₹{tx.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="font-bold text-emerald-600">
                            ₹{(tx.commissionEarned || 0).toFixed(2)}
                          </td>
                          <td>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                                txStatusBadge[tx.status] || "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="text-slate-500">
                            {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={txPage}
                  totalPages={txPagination?.totalPages || 1}
                  onPageChange={setTxPage}
                  totalItems={txPagination?.total || liveTransactions.length}
                  pageSize={txPagination?.limit || 10}
                />
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs font-medium rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                {txFilter === "All"
                  ? "No transactions recorded yet for this retailer"
                  : `No ${txFilter} transactions found for this retailer`}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Sub-Retailers (Distributor only) */}
        {activeTab === "retailers" && selected.role === "distributor" && (
          <div className="mt-6 space-y-4 animate-slide-in-right">
            {/* Search & Stats Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-[#315bd1]" />
                <span className="text-sm font-bold text-slate-700">
                  {subRetailerPagination?.total ?? liveSubRetailers.length} Retailers
                </span>
                <span className="text-xs text-slate-400">under this distributor</span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={subRetailerSearch}
                  onChange={(e) => {
                    setSubRetailerSearch(e.target.value);
                    setSubRetailerPage(1);
                  }}
                  placeholder="Search retailers..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-[#315bd1] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Table */}
            {subRetailersLoading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="hp-table">
                  <thead>
                    <tr>
                      <th>Retailer ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Status</th>
                      <th>KYC</th>
                      <th>Created</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveSubRetailers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500 font-medium">
                          No retailers found under this distributor
                        </td>
                      </tr>
                    ) : (
                      liveSubRetailers.map((sub) => (
                        <tr key={sub.id}>
                          <td className="font-bold text-[#315bd1]">{sub.id}</td>
                          <td className="font-bold text-slate-800">{sub.fullName || "Unnamed Retailer"}</td>
                          <td className="text-slate-600">{sub.email || "-"}</td>
                          <td>{sub.mobile || "-"}</td>
                          <td>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                statusBadge[sub.status]?.bg || "bg-slate-100"
                              } ${statusBadge[sub.status]?.text || "text-slate-600"}`}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                kycBadge[sub.adminApproved]?.bg || "bg-slate-100"
                              } ${kycBadge[sub.adminApproved]?.text || "text-slate-600"}`}
                            >
                              {sub.adminApproved}
                            </span>
                          </td>
                          <td className="text-slate-500">
                            {new Date(sub.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="text-center">
                            <button
                              onClick={() => {
                                setViewingSubRetailer(sub);
                                setModalTxPage(1);
                                setModalTxFilter("all");
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#315bd1]/10 text-[#315bd1] hover:bg-[#315bd1]/20 transition-all duration-200"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={subRetailerPage}
              totalPages={subRetailerPagination?.totalPages || 1}
              onPageChange={setSubRetailerPage}
              totalItems={subRetailerPagination?.total || liveSubRetailers.length}
              pageSize={SUB_RETAILER_PAGE_SIZE}
            />
          </div>
        )}
      </div>

      {/* ── Sub-Retailer Profile Modal (Real data only) ── */}
      {viewingSubRetailer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ animation: "fadeIn 200ms ease-out" }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setViewingSubRetailer(null)}
          />
          <div
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
            style={{ animation: "scaleIn 250ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#315bd1] to-[#4f78e8] flex items-center justify-center shadow-md shadow-[#315bd1]/20">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {viewingSubRetailer.fullName || "Sub-Retailer Profile"}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 font-mono">{viewingSubRetailer.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        statusBadge[viewingSubRetailer.status]?.bg
                      } ${statusBadge[viewingSubRetailer.status]?.text}`}
                    >
                      {viewingSubRetailer.status}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        kycBadge[viewingSubRetailer.adminApproved]?.bg
                      } ${kycBadge[viewingSubRetailer.adminApproved]?.text}`}
                    >
                      KYC: {viewingSubRetailer.adminApproved}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingSubRetailer(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/60 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                      Total Txns
                    </span>
                  </div>
                  <p className="text-lg font-extrabold text-blue-700">
                    {viewingSubRetailer.totalTransactions ?? 0}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                      Volume
                    </span>
                  </div>
                  <p className="text-lg font-extrabold text-emerald-700">
                    ₹{(viewingSubRetailer.totalVolume ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200/60 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Store className="h-3.5 w-3.5 text-violet-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                      Shop
                    </span>
                  </div>
                  <p className="text-sm font-bold text-violet-700 truncate">
                    {viewingSubRetailer.shopName || "-"}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                      Bank
                    </span>
                  </div>
                  <p className="text-sm font-bold text-amber-700 truncate">
                    {viewingSubRetailer.primaryBank?.name || "-"}
                  </p>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Profile Details
                  </h4>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100">
                  {[
                    { icon: <User className="h-3.5 w-3.5" />, label: "Full Name", value: viewingSubRetailer.fullName || "-" },
                    { icon: <Mail className="h-3.5 w-3.5" />, label: "Email", value: viewingSubRetailer.email || "-" },
                    { icon: <Phone className="h-3.5 w-3.5" />, label: "Mobile", value: viewingSubRetailer.mobile || "-" },
                    { icon: <FileText className="h-3.5 w-3.5" />, label: "PAN Number", value: viewingSubRetailer.panNumber || "-" },
                    { icon: <Store className="h-3.5 w-3.5" />, label: "Shop Name", value: viewingSubRetailer.shopName || "-" },
                    { icon: <MapPin className="h-3.5 w-3.5" />, label: "Address", value: viewingSubRetailer.shopAddress || "-" },
                    {
                      icon: <CreditCard className="h-3.5 w-3.5" />,
                      label: "Primary Bank",
                      value: `${viewingSubRetailer.primaryBank?.name || "-"} (${viewingSubRetailer.primaryBank?.ifscCode || "-"})`,
                    },
                    {
                      icon: <CreditCard className="h-3.5 w-3.5" />,
                      label: "Account No",
                      value: viewingSubRetailer.primaryBank?.accountNumber || "-",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-3.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-slate-400">{item.icon}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 break-all">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real Transactions Section */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Transaction History ({modalTxPagination?.total ?? modalLiveTx.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {["all", "AEPS", "DMT", "CMS", "UPI", "BBPS"].map((f) => (
                      <button
                        key={f}
                        onClick={() => {
                          setModalTxFilter(f);
                          setModalTxPage(1);
                        }}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-colors ${
                          modalTxFilter === f
                            ? "bg-[#315bd1] text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {f === "all" ? "All" : f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="hp-table">
                    <thead>
                      <tr>
                        <th>Txn ID</th>
                        <th>Service</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Commission</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalTxLoading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8">
                            <div className="h-6 animate-pulse bg-slate-100 rounded w-1/3 mx-auto" />
                          </td>
                        </tr>
                      ) : modalLiveTx.length > 0 ? (
                        modalLiveTx.map((tx) => (
                          <tr key={tx._id || tx.transactionId}>
                            <td className="font-mono text-xs font-bold text-slate-600">
                              {tx.transactionId}
                            </td>
                            <td>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                                {tx.service}
                              </span>
                            </td>
                            <td className="font-medium text-slate-700">
                              {tx.description || tx.payee?.accountHolderName || "-"}
                            </td>
                            <td className="font-bold text-slate-800">
                              ₹{tx.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="font-bold text-emerald-600">
                              ₹{(tx.commissionEarned || 0).toFixed(2)}
                            </td>
                            <td>
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                                  txStatusBadge[tx.status] || "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="text-slate-500">
                              {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400 text-xs font-medium">
                            No transactions found for this sub-retailer
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {modalTxPagination && modalTxPagination.totalPages > 1 && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    <Pagination
                      currentPage={modalTxPage}
                      totalPages={modalTxPagination.totalPages}
                      onPageChange={setModalTxPage}
                      totalItems={modalTxPagination.total}
                      pageSize={8}
                      compact
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Viewer Modal ── */}
      {viewingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ animation: "fadeIn 200ms ease-out" }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setViewingDoc(null)}
          />

          <div
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            style={{ animation: "scaleIn 250ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#315bd1]/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-[#315bd1]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{viewingDoc.label}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Document Ref: <span className="font-mono font-bold">{viewingDoc.value}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-slate-600 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button
                  onClick={() => handleDownload(viewingDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#315bd1] text-white hover:bg-[#2848a8] transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Image View Area */}
            <div
              className="flex-1 overflow-auto bg-slate-900/5 p-6 flex items-center justify-center"
              style={{ minHeight: "400px" }}
            >
              <div
                className="transition-transform duration-300 ease-out"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
              >
                <img
                  src={viewingDoc.imageUrl}
                  alt={viewingDoc.label}
                  className="max-w-full max-h-[60vh] rounded-lg shadow-xl object-contain bg-white"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const sc = getStatusConfig(viewingDoc.status);
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text} ring-1 ${sc.ring}`}
                    >
                      {sc.icon}
                      {sc.label}
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                {viewingDoc.status !== "approved" && (
                  <button
                    onClick={() => {
                      handleApproveDoc(viewingDoc.id);
                      setViewingDoc((prev) =>
                        prev ? { ...prev, status: "approved", rejectionReason: undefined } : null
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve Document
                  </button>
                )}
                {viewingDoc.status !== "rejected" && (
                  <button
                    onClick={() => {
                      setRejectingDoc(viewingDoc);
                      setIsRejectingRetailer(false);
                      setRejectionReason("");
                      setRejectionReasonError("");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-sm"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject Document
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Rejection Reason Modal (for Document OR Overall Retailer) ── */}
      {(rejectingDoc || isRejectingRetailer) && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ animation: "fadeIn 200ms ease-out" }}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setRejectingDoc(null);
              setIsRejectingRetailer(false);
              setRejectionReason("");
              setRejectionReasonError("");
            }}
          />
          <div
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            style={{ animation: "scaleIn 250ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {rejectingDoc
                      ? `Reject ${rejectingDoc.label}`
                      : `Reject Retailer Application`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rejectingDoc
                      ? `Ref: ${rejectingDoc.value}`
                      : `${selected.fullName || "Retailer"} (${selected.id})`}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 pb-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                ref={rejectionTextareaRef}
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectionReasonError("");
                }}
                placeholder="Please enter a detailed reason for rejection (minimum 10 characters)..."
                rows={4}
                className={`w-full rounded-xl border ${
                  rejectionReasonError
                    ? "border-rose-300 ring-2 ring-rose-500/20"
                    : "border-slate-200"
                } bg-slate-50/80 p-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#315bd1] focus:ring-2 focus:ring-[#315bd1]/20 transition-all resize-none`}
              />
              {rejectionReasonError && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">{rejectionReasonError}</p>
              )}

              {/* Quick rejection reasons */}
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Quick Select Reason
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(rejectingDoc
                    ? [
                        "Document is blurry or unclear",
                        "Name mismatch with registered profile",
                        "Document expired or invalid format",
                        "Information not legible",
                      ]
                    : [
                        "Incomplete KYC documentation submitted",
                        "Information provided fails compliance check",
                        "Bank verification mismatch",
                        "Business proof invalid or unverifiable",
                      ]
                  ).map((reason) => (
                    <button
                      key={reason}
                      onClick={() => {
                        setRejectionReason(reason);
                        setRejectionReasonError("");
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                        rejectionReason === reason
                          ? "bg-rose-100 text-rose-700 ring-1 ring-rose-300"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 mt-2 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => {
                  setRejectingDoc(null);
                  setIsRejectingRetailer(false);
                  setRejectionReason("");
                  setRejectionReasonError("");
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline styles for modal animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
