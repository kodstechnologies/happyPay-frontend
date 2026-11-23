import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../../utils/toast";
import {
  ArrowLeft,
  Upload,
  Plus,
  Building2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  createFundRequest,
  getMyFundRequests,
  getMyFundRequestStats,
  getMySavedBankList,
  resubmitFundRequest,

  type FundRequest,
  type FundRequestStats,
  type FundRequestBank,
} from "../../../services/api/retailer/fundRequestApi";

const PAYMENT_MODES = [
  "UPI",
  "NEFT",
  "IMPS",
  "RTGS",
  "CASH",
  "CHEQUE",
  "OTHER",
] as const;

export default function FundRequest() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form state
  const [paymentMode, setPaymentMode] = useState<"UPI" | "NEFT" | "IMPS" | "RTGS" | "CASH" | "CHEQUE" | "OTHER">("UPI");
  const [rrn, setRrn] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [bank, setBank] = useState("");
  const [bankId, setBankId] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branchName, setBranchName] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState("");
  const [notes, setNotes] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Data state
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [stats, setStats] = useState<FundRequestStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [bankList, setBankList] = useState<FundRequestBank[]>([]);
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [bankSearchTerm, setBankSearchTerm] = useState("");

  // Resubmit modal state
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [selectedFundRequest, setSelectedFundRequest] = useState<FundRequest | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const fetchFundRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const status = filterStatus === "ALL" ? undefined : filterStatus;
      const res = await getMyFundRequests(status, pagination.page, pagination.limit);
      if (res?.data) {
        setFundRequests(Array.isArray(res.data.requests) ? res.data.requests : []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
        // Update stats from the counts in the response
        if (res.data.counts) {
          setStats({
            pending: res.data.counts.pending,
            approved: res.data.counts.approved,
            rejected: res.data.counts.rejected,
          });
        }
      }
    } catch (err: unknown) {
      console.error("Failed to fetch fund requests:", err);
      showToast("error", err, "Failed to load fund requests");
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, pagination.page, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getMyFundRequestStats();
      if (res?.data && typeof res.data === 'object') {
        setStats(res.data);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const fetchBankList = useCallback(async () => {
    try {
      const res = await getMySavedBankList();
      if (res?.data && Array.isArray(res.data)) {
        setBankList(res.data);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch bank list:", err);
    }
  }, []);

  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchStats();
    fetchBankList();
  }, []);

  // Refetch whenever the history tab opens or the status filter / pagination
  // changes. The status filter is applied server-side, so a refetch is required.
  // Driving the fetch from this effect (instead of calling fetchFundRequests()
  // right after setState in the onClick handlers) avoids a stale-closure fetch
  // that previously ignored the just-set filterStatus / page.
  useEffect(() => {
    if (activeTab === "history") {
      fetchFundRequests();
    }
  }, [activeTab, filterStatus, pagination.page, pagination.limit]);
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "File size cannot exceed 5 MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      showToast("error", "Only JPG, PNG, and PDF files are allowed");
      return;
    }

    setReceiptFile(file);
    setReceiptFileName(file.name);
  };

  const validateForm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      showToast("error", "Please enter a valid amount");
      return false;
    }

    if (!paymentDate) {
      showToast("error", "Please select payment date");
      return false;
    }

    if (!bank.trim()) {
      showToast("error", "Please enter bank name");
      return false;
    }

    if (!ifscCode.trim()) {
      showToast("error", "IFSC code is required");
      return false;
    }

    if (ifscCode.length !== 11) {
      showToast("error", "Please enter a valid 11-character IFSC code");
      return false;
    }

    if (!accountNumber.trim()) {
      showToast("error", "Account number is required");
      return false;
    }

    if (accountNumber.length < 9 || accountNumber.length > 18) {
      showToast("error", "Account number must be between 9 to 18 digits");
      return false;
    }

    if (!branchName.trim()) {
      showToast("error", "Please enter branch name");
      return false;
    }

    if (!receiptFile) {
      showToast("error", "Please upload receipt slip");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("paymentMode", paymentMode);
      if (rrn.trim()) formData.append("rrn", rrn.trim());
      formData.append("amount", amount);
      formData.append("paymentDate", paymentDate);
      if (bankId) {
        formData.append("bankId", bankId);
      } else {
        formData.append("bank", bank.trim());
        formData.append("ifscCode", ifscCode.trim().toUpperCase());
        formData.append("accountNumber", accountNumber.trim());
        formData.append("branchName", branchName.trim());
      }
      if (bankCode) formData.append("bankCode", bankCode);
      if (receiptFile) formData.append("receiptSlip", receiptFile);
      if (notes.trim()) formData.append("notes", notes.trim());

      const res = await createFundRequest(formData);

      if (res?.success) {
        showToast("success", "Fund request submitted successfully");
        // Reset form
        setPaymentMode("UPI");
        setRrn("");
        setAmount("");
        setPaymentDate("");
        setBank("");
        setBankId("");
        setBankCode("");
        setIfscCode("");
        setAccountNumber("");
        setBranchName("");
        setReceiptFile(null);
        setReceiptFileName("");
        setNotes("");
        setActiveTab("history");
      }
    } catch (err: unknown) {
      console.error("Failed to submit fund request:", err);
      showToast("error", err, "Failed to submit fund request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmit = async () => {
    if (!selectedFundRequest) return;

    try {
      setIsResubmitting(true);

      const formData = new FormData();
      formData.append("paymentMode", paymentMode);
      if (rrn.trim()) formData.append("rrn", rrn.trim());
      formData.append("amount", amount);
      formData.append("paymentDate", paymentDate);
      formData.append("bank", bank.trim());
      if (bankCode) formData.append("bankCode", bankCode);
      formData.append("ifscCode", ifscCode.trim().toUpperCase());
      formData.append("accountNumber", accountNumber.trim());
      formData.append("branchName", branchName.trim());
      if (receiptFile) formData.append("receiptSlip", receiptFile);
      if (notes.trim()) formData.append("notes", notes.trim());

      const res = await resubmitFundRequest(selectedFundRequest._id, formData);

      if (res?.success) {
        showToast("success", "Fund request resubmitted successfully");
        setResubmitModalOpen(false);
        setSelectedFundRequest(null);
        // Reset form
        setPaymentMode("UPI");
        setRrn("");
        setAmount("");
        setPaymentDate("");
        setBank("");
        setBankId("");
        setBankCode("");
        setIfscCode("");
        setAccountNumber("");
        setBranchName("");
        setReceiptFile(null);
        setReceiptFileName("");
        setNotes("");
        fetchFundRequests();
      }
    } catch (err: unknown) {
      console.error("Failed to resubmit fund request:", err);
      showToast("error", err, "Failed to resubmit fund request");
    } finally {
      setIsResubmitting(false);
    }
  };

  const handleOpenResubmitModal = (request: FundRequest) => {
    setSelectedFundRequest(request);
    // Pre-fill form with existing data
    setPaymentMode(request.paymentMode);
    setRrn(request.rrn || "");
    setAmount(request.amount.toString());
    setPaymentDate(request.paymentDate.split("T")[0]);
    setBank(request.bankDetails?.bank || request.bank || "");
    setBankId(request.bankDetails?._id || "");
    setBankCode(request.bankDetails?.bankCode || "");
    setIfscCode(request.bankDetails?.ifscCode || request.ifscCode || "");
    setAccountNumber(request.bankDetails?.accountNumber || request.accountNumber || "");
    setBranchName(request.bankDetails?.branchName || request.branchName || "");
    setReceiptFileName("");
    setReceiptFile(null);
    setNotes(request.notes || "");
    setResubmitModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef3c7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#b45309] border border-[#fbbf24]">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d1fae5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#059669] border border-[#34d399]">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fee2e2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#dc2626] border border-[#f87171]">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-4 pb-8 sm:px-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <header className="mb-5 flex min-h-14 items-center justify-between rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/retailer")}
            disabled={isSubmitting}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280] transition hover:bg-[#f8f5ff] hover:text-[#7c3aed] disabled:opacity-50"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-base font-bold text-[#1f2937] text-center">
              Fund Request
            </h1>
            <p className="text-[11px] text-[#6b7280] text-center">
              Add funds to your wallet
            </p>
          </div>

          <div className="w-9" />
        </header>

        {/* Stats Cards */}
        {stats && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#fbbf24] bg-[#fef3c7] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b45309]">Pending</p>
              <p className="mt-1 text-xl font-bold text-[#78350f]">{stats.pending}</p>
            </div>
            <div className="rounded-lg border border-[#34d399] bg-[#d1fae5] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#059669]">Approved</p>
              <p className="mt-1 text-xl font-bold text-[#065f46]">{stats.approved}</p>
            </div>
            <div className="rounded-lg border border-[#f87171] bg-[#fee2e2] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#dc2626]">Rejected</p>
              <p className="mt-1 text-xl font-bold text-[#991b1b]">{stats.rejected}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-5 flex gap-2 border-b border-[#e5e7eb]">
          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={`px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === "new"
                ? "border-b-2 border-[#7c3aed] text-[#7c3aed]"
                : "text-[#6b7280] hover:text-[#1f2937]"
            }`}
          >
            New Request
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === "history"
                ? "border-b-2 border-[#7c3aed] text-[#7c3aed]"
                : "text-[#6b7280] hover:text-[#1f2937]"
            }`}
          >
            Request History
          </button>
        </div>

        {/* New Request Form */}
        {activeTab === "new" && (
          <div className="rounded-2xl border-2 border-[#d1d5db] bg-white p-6 shadow-lg sm:p-8">
            <h2 className="mb-6 text-base font-bold text-[#1f2937]">
              Submit Fund Request
            </h2>

            <div className="space-y-4">
              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Payment Mode *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-left text-sm text-[#1f2937] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all"
                  >
                    {paymentMode}
                  </button>
                  {dropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border-2 border-[#d1d5db] bg-white shadow-xl">
                      {PAYMENT_MODES.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setPaymentMode(mode);
                            setDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-[#6b7280] hover:bg-[#f8f5ff] hover:text-[#7c3aed] transition first:rounded-t-xl last:rounded-b-xl"
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RRN (optional) */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  RRN / Reference Number (Optional)
                </label>
                <input
                  type="text"
                  value={rrn}
                  onChange={(e) => setRrn(e.target.value)}
                  placeholder="Enter RRN if available"
                  className="w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                  className="w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all"
                />
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all"
                />
              </div>

              {/* Bank Details Section */}
              <div className="rounded-2xl border-2 border-[#d1d5db] bg-gradient-to-br from-[#f9fafb] to-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#374151] flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#7c3aed]" />
                  Bank Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                      Bank Name *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setBankDropdownOpen(!bankDropdownOpen)}
                        className="w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-left text-sm text-[#1f2937] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all"
                      >
                        {bank || "Select bank"}
                      </button>
                      {bankDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full rounded-xl border-2 border-[#d1d5db] bg-white shadow-xl">
                          {/* Search Input */}
                          <div className="border-b border-[#e5e7eb] p-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                              <input
                                type="text"
                                value={bankSearchTerm}
                                onChange={(e) => setBankSearchTerm(e.target.value)}
                                placeholder="Search bank..."
                                className="w-full rounded-lg border border-[#d1d5db] bg-white pl-9 pr-3 py-2 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          {/* Bank List */}
                          <div className="max-h-48 overflow-y-auto">
                            {bankList.length > 0 ? (
                              bankList
                                .filter((bankItem) =>
                                  (bankItem.bank || "").toLowerCase().includes(bankSearchTerm.toLowerCase()) ||
                                  (bankItem.ifscCode || "").toLowerCase().includes(bankSearchTerm.toLowerCase()) ||
                                  (bankItem.accountNumber || "").includes(bankSearchTerm)
                                )
                                .map((bankItem) => (
                                  <button
                                    key={bankItem._id}
                                    type="button"
                                    onClick={() => {
                                      setBank(bankItem.bank);
                                      setBankId(bankItem._id);
                                      setBankCode(bankItem.bankCode || "");
                                      setIfscCode(bankItem.ifscCode || "");
                                      setAccountNumber(bankItem.accountNumber || "");
                                      setBranchName(bankItem.branchName || "");
                                      setBankDropdownOpen(false);
                                      setBankSearchTerm("");
                                    }}
                                    className="w-full px-4 py-3 text-left transition hover:bg-[#f8f5ff]"
                                  >
                                    <p className="text-sm font-semibold text-[#1f2937]">{bankItem.bank}</p>
                                    <p className="mt-0.5 text-xs text-[#6b7280]">
                                      {[
                                        bankItem.ifscCode,
                                        bankItem.branchName,
                                        bankItem.accountNumber ? `Acct •••• ${String(bankItem.accountNumber).slice(-4)}` : null,
                                      ].filter(Boolean).join(" • ")}
                                    </p>
                                  </button>
                                ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-[#6b7280]">
                                No banks available — please contact admin
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                      IFSC Code *
                    </label>
                    <input
                      type="text"
                      value={ifscCode}
                      readOnly={!!bankId}
                      onChange={(e) => {
                        const value = e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 11);
                        setIfscCode(value);
                      }}
                      placeholder="e.g., SBIN0001234"
                      maxLength={11}
                      className={`w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all font-mono ${bankId ? "bg-[#f3f4f6] cursor-not-allowed" : ""}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      readOnly={!!bankId}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter account number"
                      maxLength={18}
                      className={`w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all font-mono ${bankId ? "bg-[#f3f4f6] cursor-not-allowed" : ""}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                      Branch Name *
                    </label>
                    <input
                      type="text"
                      value={branchName}
                      readOnly={!!bankId}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="Enter branch name"
                      className={`w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all ${bankId ? "bg-[#f3f4f6] cursor-not-allowed" : ""}`}
                    />
                  </div>
                </div>
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Receipt Slip *
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-[#d1d5db] bg-gradient-to-br from-[#f9fafb] to-white px-4 py-8 text-center transition-all hover:border-[#7c3aed] hover:bg-[#f8f5ff] hover:shadow-md"
                >
                  {receiptFileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-6 w-6 text-[#7c3aed]" />
                      <span className="text-sm font-medium text-[#1f2937]">{receiptFileName}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-10 w-10 text-[#9ca3af]" />
                      <p className="text-xs text-[#6b7280]">
                        Click to upload receipt (JPG, PNG, PDF - Max 5MB)
                      </p>
                    </div>
                  )}
                </button>
              </div>

              {/* Notes (optional) */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-[#7c3aed]/30 transition-all hover:shadow-xl hover:shadow-[#7c3aed]/40 hover:from-[#6d28d9] hover:to-[#5b21b6] active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Submit Fund Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Request History */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* Filter and Search */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus("ALL");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    filterStatus === "ALL"
                      ? "bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white shadow-lg shadow-[#7c3aed]/30"
                      : "bg-white border-2 border-[#d1d5db] text-[#6b7280] hover:border-[#7c3aed] hover:text-[#7c3aed] hover:bg-[#f8f5ff]"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus("PENDING");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    filterStatus === "PENDING"
                      ? "bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#78350f] shadow-lg shadow-[#fbbf24]/30"
                      : "bg-white border-2 border-[#d1d5db] text-[#6b7280] hover:border-[#fbbf24] hover:text-[#b45309] hover:bg-[#fef3c7]"
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus("APPROVED");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    filterStatus === "APPROVED"
                      ? "bg-gradient-to-r from-[#34d399] to-[#10b981] text-[#065f46] shadow-lg shadow-[#34d399]/30"
                      : "bg-white border-2 border-[#d1d5db] text-[#6b7280] hover:border-[#34d399] hover:text-[#059669] hover:bg-[#d1fae5]"
                  }`}
                >
                  Approved
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus("REJECTED");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    filterStatus === "REJECTED"
                      ? "bg-gradient-to-r from-[#f87171] to-[#ef4444] text-[#991b1b] shadow-lg shadow-[#f87171]/30"
                      : "bg-white border-2 border-[#d1d5db] text-[#6b7280] hover:border-[#f87171] hover:text-[#dc2626] hover:bg-[#fee2e2]"
                  }`}
                >
                  Rejected
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by RRN, bank, amount..."
                    className="w-full rounded-xl border-2 border-[#d1d5db] bg-white pl-10 pr-4 py-2 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchFundRequests}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-2 text-xs font-semibold text-[#6b7280] hover:border-[#7c3aed] hover:text-[#7c3aed] hover:bg-[#f8f5ff] transition-all shadow-sm"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
              </div>
            ) : fundRequests.length === 0 ? (
              <div className="rounded-2xl border-2 border-[#d1d5db] bg-white p-12 text-center shadow-sm">
                <FileText className="mx-auto h-12 w-12 text-[#d1d5db]" />
                <h3 className="mt-4 text-sm font-bold text-[#1f2937]">No Fund Requests</h3>
                <p className="mt-2 text-xs text-[#6b7280]">
                  You haven't submitted any fund requests yet
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border-2 border-[#d1d5db] bg-white shadow-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-[#e5e7eb] bg-gradient-to-r from-[#f9fafb] to-white">
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">
                        Payment Mode
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">
                        Bank
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">
                        Account No.
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">
                        IFSC
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">
                        RRN
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundRequests
                      .filter((request) => {
                        if (!searchTerm.trim()) return true;
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          request.rrn?.toLowerCase().includes(searchLower) ||
                          request.bank?.toLowerCase().includes(searchLower) ||
                          request.amount?.toString().includes(searchLower) ||
                          request.ifscCode?.toLowerCase().includes(searchLower) ||
                          request.accountNumber?.includes(searchLower)
                        );
                      })
                      .map((request) => (
                        <tr
                          key={request._id}
                          className="border-b border-[#e5e7eb] hover:bg-[#f8f5ff] transition-colors"
                        >
                          <td className="px-4 py-4 text-xs text-[#6b7280]">
                            {new Date(request.createdAt).toLocaleDateString("en-GB")}
                          </td>
                          <td className="px-4 py-4">{getStatusBadge(request.status)}</td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] px-3 py-1.5 text-sm font-bold text-white shadow-md">
                              ₹{Number(request.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-[#1f2937]">
                            {request.paymentMode}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-[#1f2937]">
                            {request.bank}
                          </td>
                          <td className="px-4 py-4 font-mono text-sm font-semibold text-[#1f2937]">
                            {request.accountNumber
                              ? `•••• •••• ${request.accountNumber.slice(-4)}`
                              : "—"}
                          </td>
                          <td className="px-4 py-4 font-mono text-sm font-semibold text-[#1f2937]">
                            {request.ifscCode}
                          </td>
                          <td className="px-4 py-4 font-mono text-sm text-[#1f2937]">
                            {request.rrn || "—"}
                          </td>
                        
                          <td className="px-4 py-4">
                            {request.status === "REJECTED" ? (
                              <button
                                type="button"
                                onClick={() => handleOpenResubmitModal(request)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#7c3aed] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#6d28d9] transition-all"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Resubmit
                              </button>
                            ) : (
                              <span className="text-xs text-[#6b7280]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:justify-between">
                <p className="text-xs text-[#6b7280]">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} requests
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
                    }}
                    disabled={pagination.page === 1 || isLoading}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border-2 border-[#d1d5db] bg-white text-[#6b7280] hover:border-[#7c3aed] hover:text-[#7c3aed] hover:bg-[#f8f5ff] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => {
                            setPagination((prev) => ({ ...prev, page: pageNum }));
                          }}
                          disabled={isLoading}
                          className={`w-10 h-10 rounded-xl text-xs font-semibold transition-all ${
                            pagination.page === pageNum
                              ? "bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white shadow-lg shadow-[#7c3aed]/30"
                              : "border-2 border-[#d1d5db] bg-white text-[#6b7280] hover:border-[#7c3aed] hover:text-[#7c3aed] hover:bg-[#f8f5ff]"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
                    }}
                    disabled={pagination.page === pagination.totalPages || isLoading}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border-2 border-[#d1d5db] bg-white text-[#6b7280] hover:border-[#7c3aed] hover:text-[#7c3aed] hover:bg-[#f8f5ff] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resubmit Modal */}
        {resubmitModalOpen && selectedFundRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#7c3aed]">
                    <RefreshCw className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#171717]">
                      Resubmit Fund Request
                    </h2>
                    <p className="text-xs text-slate-500">
                      Update and resubmit your rejected fund request
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResubmitModalOpen(false);
                    setSelectedFundRequest(null);
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5 space-y-4">
                {/* Rejection Reason */}
                {selectedFundRequest.rejectionReason && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <h3 className="text-xs font-bold text-red-700 mb-2">Rejection Reason</h3>
                    <p className="text-xs text-red-900">{selectedFundRequest.rejectionReason}</p>
                  </div>
                )}

                {/* Form */}
                <div className="space-y-4">
                  {/* Payment Mode */}
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                      Payment Mode *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-left text-sm text-[#1f2937] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all"
                      >
                        {paymentMode}
                      </button>
                      {dropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full rounded-xl border-2 border-[#d1d5db] bg-white shadow-xl">
                          {PAYMENT_MODES.map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => {
                                setPaymentMode(mode);
                                setDropdownOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-[#6b7280] hover:bg-[#f8f5ff] hover:text-[#7c3aed] transition first:rounded-t-xl last:rounded-b-xl"
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RRN (optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                      RRN / Reference Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={rrn}
                      onChange={(e) => setRrn(e.target.value)}
                      placeholder="Enter RRN if available"
                      className="w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="1"
                      step="0.01"
                      className="w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all"
                    />
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all"
                    />
                  </div>

                  {/* Bank Details Section */}
                  <div className="rounded-2xl border-2 border-[#d1d5db] bg-gradient-to-br from-[#f9fafb] to-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-bold text-[#374151] flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#7c3aed]" />
                      Bank Details
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                          Bank Name *
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setBankDropdownOpen(!bankDropdownOpen)}
                            className="w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-left text-sm text-[#1f2937] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all"
                          >
                            {bank || "Select bank"}
                          </button>
                          {bankDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full rounded-xl border-2 border-[#d1d5db] bg-white shadow-xl">
                              {/* Search Input */}
                              <div className="border-b border-[#e5e7eb] p-2">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                                  <input
                                    type="text"
                                    value={bankSearchTerm}
                                    onChange={(e) => setBankSearchTerm(e.target.value)}
                                    placeholder="Search bank..."
                                    className="w-full rounded-lg border border-[#d1d5db] bg-white pl-9 pr-3 py-2 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              {/* Bank List */}
                              <div className="max-h-48 overflow-y-auto">
                                {bankList.length > 0 ? (
                                  bankList
                                    .filter((bankItem) =>
                                      (bankItem.bank || "").toLowerCase().includes(bankSearchTerm.toLowerCase()) ||
                                      (bankItem.ifscCode || "").toLowerCase().includes(bankSearchTerm.toLowerCase()) ||
                                      (bankItem.accountNumber || "").includes(bankSearchTerm)
                                    )
                                    .map((bankItem) => (
                                      <button
                                        key={bankItem._id}
                                        type="button"
                                        onClick={() => {
                                          setBank(bankItem.bank);
                                          setBankId(bankItem._id);
                                          setBankCode(bankItem.bankCode || "");
                                          setIfscCode(bankItem.ifscCode || "");
                                          setAccountNumber(bankItem.accountNumber || "");
                                          setBranchName(bankItem.branchName || "");
                                          setBankDropdownOpen(false);
                                          setBankSearchTerm("");
                                        }}
                                        className="w-full px-4 py-3 text-left transition hover:bg-[#f8f5ff]"
                                      >
                                        <p className="text-sm font-semibold text-[#1f2937]">{bankItem.bank}</p>
                                        <p className="mt-0.5 text-xs text-[#6b7280]">
                                          {[
                                            bankItem.ifscCode,
                                            bankItem.branchName,
                                            bankItem.accountNumber ? `Acct •••• ${String(bankItem.accountNumber).slice(-4)}` : null,
                                          ].filter(Boolean).join(" • ")}
                                        </p>
                                      </button>
                                    ))
                                ) : (
                                  <div className="px-4 py-3 text-sm text-[#6b7280]">
                                    No banks available — please contact admin
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                          IFSC Code *
                        </label>
                        <input
                          type="text"
                          value={ifscCode}
                          readOnly={!!bankId}
                          onChange={(e) => {
                            const value = e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, "")
                              .slice(0, 11);
                            setIfscCode(value);
                          }}
                          placeholder="e.g., SBIN0001234"
                          maxLength={11}
                          className={`w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all font-mono ${bankId ? "bg-[#f3f4f6] cursor-not-allowed" : ""}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                          Account Number *
                        </label>
                        <input
                          type="text"
                          value={accountNumber}
                          readOnly={!!bankId}
                          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter account number"
                          maxLength={18}
                          className={`w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all font-mono ${bankId ? "bg-[#f3f4f6] cursor-not-allowed" : ""}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                          Branch Name *
                        </label>
                        <input
                          type="text"
                          value={branchName}
                          readOnly={!!bankId}
                          onChange={(e) => setBranchName(e.target.value)}
                          placeholder="Enter branch name"
                          className={`w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all ${bankId ? "bg-[#f3f4f6] cursor-not-allowed" : ""}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Receipt Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                      Receipt Slip (Optional for resubmit)
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-2xl border-2 border-dashed border-[#d1d5db] bg-gradient-to-br from-[#f9fafb] to-white px-4 py-8 text-center transition-all hover:border-[#7c3aed] hover:bg-[#f8f5ff] hover:shadow-md"
                    >
                      {receiptFileName ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="h-6 w-6 text-[#7c3aed]" />
                          <span className="text-sm font-medium text-[#1f2937]">{receiptFileName}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto h-10 w-10 text-[#9ca3af]" />
                          <p className="text-xs text-[#6b7280]">
                            Click to upload new receipt (JPG, PNG, PDF - Max 5MB)
                          </p>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Notes (optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any additional notes..."
                      rows={3}
                      maxLength={500}
                      className="w-full rounded-xl border-2 border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm hover:border-[#7c3aed] transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResubmitModalOpen(false);
                      setSelectedFundRequest(null);
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResubmit}
                    disabled={isResubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#6d28d9] disabled:opacity-50"
                  >
                    {isResubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Resubmitting...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Resubmit Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
