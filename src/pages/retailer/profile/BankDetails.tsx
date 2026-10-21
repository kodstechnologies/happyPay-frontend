import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  LoaderCircle,
  Save,
  ShieldCheck,
  Upload,
  User,
  WalletCards,
  AlertCircle,
  Search,
} from "lucide-react";

import {
  getRetailerProfile,
  updateRetailerProfile,
} from "../../../services/api/retailer/retailerProfileApi";
import { getBankList } from "../../../services/api/retailer/retailerAuthApi";
import type { RetailerFullProfile, RetailerBank } from "../../../types/retailer/profile";

const FALLBACK_BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Bank of Baroda",
  "Punjab National Bank",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "IndusInd Bank",
  "Yes Bank",
  "IDFC FIRST Bank",
  "Federal Bank",
  "Central Bank of India",
];

const ACCOUNT_TYPES = [
  "Current Account",
  "Savings Account",
  "Overdraft Account",
];

export default function BankDetails() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Profile and Loading state
  const [profile, setProfile] = useState<RetailerFullProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Bank list options
  const [availableBanks, setAvailableBanks] = useState<string[]>(FALLBACK_BANKS);
  const [bankSearch, setBankSearch] = useState("");

  // Form State
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountType, setAccountType] = useState("Current Account");
  const [ifsc, setIfsc] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofFileName, setProofFileName] = useState<string>("");

  // Dropdown UI
  const [openDropdown, setOpenDropdown] = useState<"bank" | "accountType" | null>(null);

  useEffect(() => {
    let ignore = false;

    Promise.allSettled([getRetailerProfile(), getBankList()])
      .then(([profileRes, bankListRes]) => {
        if (ignore) return;

        if (profileRes.status === "fulfilled" && profileRes.value?.data) {
          const prof = profileRes.value.data;
          setProfile(prof);

          const primaryBank: RetailerBank | null =
            prof.primaryBank || prof.banks?.[0] || null;

          if (primaryBank) {
            setBankName(primaryBank.name || "");
            setIfsc(primaryBank.ifscCode || "");
            setAccountNumber(primaryBank.accountNumber || "");
            setConfirmAccountNumber(primaryBank.accountNumber || "");
            setBranchName(primaryBank.branchName || "");
          }

          setAccountHolder(prof.fullName || "");
        } else {
          setError("Unable to load profile data.");
        }

        if (bankListRes.status === "fulfilled" && bankListRes.value?.data) {
          const fetched = bankListRes.value.data.map((b) => b.name).filter(Boolean);
          if (fetched.length > 0) {
            // Combine fetched with fallback, deduplicated
            const merged = Array.from(new Set([...fetched, ...FALLBACK_BANKS]));
            setAvailableBanks(merged);
          }
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          console.error("Failed to load retailer bank details:", err);
          const errorMsg =
            err instanceof Error ? err.message : "Failed to load bank details.";
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

  // Active primary bank reference
  const currentBank: RetailerBank | null =
    profile?.primaryBank || profile?.banks?.[0] || null;

  // Mask account number
  const maskedAccountNumber = currentBank?.accountNumber
    ? currentBank.accountNumber.length >= 4
      ? `•••• •••• •••• ${currentBank.accountNumber.slice(-4)}`
      : currentBank.accountNumber
    : "Not Registered";

  // Filtered banks for search
  const filteredBanks = availableBanks.filter((b) =>
    b.toLowerCase().includes(bankSearch.toLowerCase())
  );

  // Form handlers
  const handleBankSelect = (bank: string) => {
    setBankName(bank);
    setOpenDropdown(null);
    setBankSearch("");
    setError(null);
  };

  const handleAccountTypeSelect = (type: string) => {
    setAccountType(type);
    setOpenDropdown(null);
    setError(null);
  };

  const handleIfscChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "").toUpperCase().slice(0, 11);
    setIfsc(value);
    setError(null);
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setAccountNumber(value);
    setError(null);
  };

  const handleConfirmAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setConfirmAccountNumber(value);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size cannot exceed 10 MB.");
      return;
    }

    setProofFile(file);
    setProofFileName(file.name);
    setError(null);
  };

  // Validation
  const validateForm = () => {
    if (!bankName.trim()) {
      setError("Please select or enter a bank name.");
      return false;
    }

    if (!accountHolder.trim()) {
      setError("Please enter the account holder name.");
      return false;
    }

    if (ifsc.trim().length !== 11) {
      setError("IFSC code must be exactly 11 characters.");
      return false;
    }

    if (accountNumber.trim().length < 8) {
      setError("Please enter a valid account number.");
      return false;
    }

    if (accountNumber !== confirmAccountNumber) {
      setError("Account numbers do not match.");
      return false;
    }

    return true;
  };

  // Real Save Handler
  const handleSave = async () => {
    if (isSaving) return;
    setError(null);
    setSuccessMessage(null);
    setOpenDropdown(null);

    if (!validateForm()) return;

    try {
      setIsSaving(true);

      let payload: FormData | Record<string, unknown>;

      if (proofFile) {
        const formData = new FormData();
        formData.append("bankName", bankName.trim());
        formData.append("accountNumber", accountNumber.trim());
        formData.append("ifscCode", ifsc.trim().toUpperCase());
        formData.append("branchName", branchName.trim());
        formData.append("businessProofDocument", proofFile);
        payload = formData;
      } else {
        payload = {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifsc.trim().toUpperCase(),
          branchName: branchName.trim(),
        };
      }

      const res = await updateRetailerProfile(payload);

      if (res && (res.success || res.data)) {
        // Fetch fresh canonical profile from main profile API (CQS pattern)
        const profileRes = await getRetailerProfile();
        const prof = profileRes?.data || null;

        if (prof) {
          setProfile(prof);
          const updatedPrimary = prof.primaryBank || prof.banks?.[0];
          if (updatedPrimary) {
            setBankName(updatedPrimary.name || "");
            setIfsc(updatedPrimary.ifscCode || "");
            setAccountNumber(updatedPrimary.accountNumber || "");
            setConfirmAccountNumber(updatedPrimary.accountNumber || "");
            setBranchName(updatedPrimary.branchName || "");
          }
        }
        setSuccessMessage("Bank account details successfully updated and synchronized!");
      } else {
        throw new Error("Failed to update bank details.");
      }
    } catch (err: unknown) {
      console.error("Save bank details failed:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Failed to update bank details. Please check the information and try again.";
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-4 pb-8 sm:px-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <header className="mb-5 flex min-h-14 items-center justify-between rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.4)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => navigate("/retailer/profile")}
            disabled={isSaving}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#172033] transition hover:bg-slate-100 disabled:opacity-50"
            aria-label="Go back to Profile"
          >
            <ArrowLeft size={22} />
          </button>

          <div>
            <h1 className="text-base font-bold text-[#172033] text-center">
              Bank Details & Settlement Payout
            </h1>
            <p className="text-[11px] text-slate-500 text-center">
              Manage your registered primary bank account for wallet payouts
            </p>
          </div>

          <div className="w-9" />
        </header>

        {/* Success Toast / Notification */}
        {successMessage && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200 shadow-sm animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-200 shadow-sm">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-44 w-full animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-80 w-full animate-pulse rounded-2xl bg-slate-200" />
          </div>
        ) : (
          <main className="space-y-6">
            {/* ==================================================
                MANAGE BANK SECTION: PRIMARY BANK CARD
            ================================================== */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] p-5 text-white shadow-lg sm:p-6">
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
                      <Building2 size={26} className="text-white" />
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                        Primary Settlement Bank
                      </span>
                      <h2 className="text-base font-bold text-white truncate">
                        {currentBank?.name || "No Bank Registered"}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/40 backdrop-blur-sm">
                    <Check size={14} />
                    <span>{currentBank ? "Active Payout" : "Setup Required"}</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-white/15 pt-4">
                  <div>
                    <span className="text-[11px] text-white/70 block">Account Number</span>
                    <p className="font-mono text-sm font-bold tracking-wider text-white">
                      {maskedAccountNumber}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-white/70 block">Account Holder</span>
                    <p className="text-sm font-bold text-white truncate">
                      {profile?.fullName || accountHolder || "—"}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[11px] text-white/70 block">IFSC Code</span>
                    <p className="font-mono text-sm font-bold text-white">
                      {currentBank?.ifscCode || "—"}
                    </p>
                  </div>
                </div>

                {currentBank?.branchName && (
                  <div className="mt-2 text-xs text-white/80">
                    <span className="text-white/60">Branch: </span>
                    {currentBank.branchName}
                  </div>
                )}
              </div>
            </section>

            {/* Penny Drop Verification Banner */}
            <section className="flex items-start gap-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-slate-700">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <ShieldCheck size={22} />
              </div>

              <div className="text-xs">
                <h3 className="font-bold text-emerald-900">
                  Automated Settlement Payout Active
                </h3>
                <p className="mt-0.5 leading-relaxed text-slate-600">
                  Your registered bank account is synced with your Happy Pay merchant wallet for daily automated payouts and AEPS/DMT settlements.
                </p>
              </div>
            </section>

            {/* ==================================================
                EDIT BANK SECTION: SYNCHRONIZED FORM
            ================================================== */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Edit & Update Settlement Account
                  </h2>
                  <p className="text-xs text-slate-500">
                    Modify bank account details or register a new payout account
                  </p>
                </div>

                <span className="w-fit rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-[#7c3aed]">
                  Live Database Sync
                </span>
              </div>

              {/* Bank Name Dropdown */}
              <div className="mt-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bank Name *
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown(openDropdown === "bank" ? null : "bank")
                    }
                    disabled={isSaving}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-xl border bg-slate-50/70 px-4 text-left transition ${
                      openDropdown === "bank"
                        ? "border-[#7c3aed] ring-1 ring-[#7c3aed]"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Building2 size={20} className="shrink-0 text-slate-400" />
                    <span className="flex-1 text-xs font-semibold text-slate-800">
                      {bankName || "Select your bank"}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-slate-500 transition-transform ${
                        openDropdown === "bank" ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openDropdown === "bank" && (
                    <div className="absolute left-0 right-0 top-[52px] z-40 max-h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      {/* Search in bank list */}
                      <div className="border-b border-slate-100 p-2.5">
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 border border-slate-200">
                          <Search size={14} className="text-slate-400" />
                          <input
                            type="text"
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            placeholder="Search bank name..."
                            className="w-full bg-transparent text-xs text-slate-800 outline-none"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="max-h-[220px] overflow-y-auto">
                        {filteredBanks.map((bank) => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => handleBankSelect(bank)}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium transition ${
                              bankName === bank
                                ? "bg-purple-50 text-[#7c3aed] font-bold"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span>{bank}</span>
                            {bankName === bank && <Check size={16} className="text-[#7c3aed]" />}
                          </button>
                        ))}

                        {filteredBanks.length === 0 && (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No bank found. You can enter custom bank name below.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Holder Name */}
              <div className="mt-4">
                <label
                  htmlFor="account-holder"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Account Holder Name *
                </label>

                <div className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">
                  <User size={20} className="shrink-0 text-slate-400" />
                  <input
                    id="account-holder"
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
                    placeholder="Enter registered account holder name"
                  />
                </div>
              </div>

              {/* Account Type & IFSC */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Account Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Account Type
                  </label>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === "accountType" ? null : "accountType"
                        )
                      }
                      disabled={isSaving}
                      className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-left transition hover:border-slate-300"
                    >
                      <WalletCards size={20} className="shrink-0 text-slate-400" />
                      <span className="flex-1 text-xs font-semibold text-slate-800">
                        {accountType}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-slate-500 transition-transform ${
                          openDropdown === "accountType" ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {openDropdown === "accountType" && (
                      <div className="absolute left-0 right-0 top-[52px] z-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                        {ACCOUNT_TYPES.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleAccountTypeSelect(type)}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium transition ${
                              accountType === type
                                ? "bg-purple-50 text-[#7c3aed] font-bold"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span>{type}</span>
                            {accountType === type && (
                              <Check size={16} className="text-[#7c3aed]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* IFSC Code */}
                <div>
                  <label
                    htmlFor="ifsc"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    IFSC Code *
                  </label>

                  <div className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50/70 px-4 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">
                    <input
                      id="ifsc"
                      type="text"
                      value={ifsc}
                      maxLength={11}
                      onChange={handleIfscChange}
                      className="w-full bg-transparent font-mono text-xs font-semibold uppercase text-slate-800 outline-none"
                      placeholder="e.g. SBIN0001234"
                    />
                  </div>
                </div>
              </div>

              {/* Branch Name */}
              <div className="mt-4">
                <label
                  htmlFor="branch-name"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Branch Name
                </label>

                <div className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50/70 px-4 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">
                  <input
                    id="branch-name"
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
                    placeholder="Enter branch name or city"
                  />
                </div>
              </div>

              {/* Account Number & Confirm Account Number */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Account Number */}
                <div>
                  <label
                    htmlFor="account-number"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Account Number *
                  </label>

                  <div className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">
                    <WalletCards size={20} className="shrink-0 text-slate-400" />
                    <input
                      id="account-number"
                      type="text"
                      inputMode="numeric"
                      value={accountNumber}
                      maxLength={20}
                      onChange={handleAccountNumberChange}
                      className="w-full bg-transparent font-mono text-xs font-semibold text-slate-800 outline-none"
                      placeholder="Enter account number"
                    />
                  </div>
                </div>

                {/* Confirm Account Number */}
                <div>
                  <label
                    htmlFor="confirm-account-number"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Confirm Account Number *
                  </label>

                  <div
                    className={`flex min-h-11 items-center gap-3 rounded-xl border px-4 transition ${
                      confirmAccountNumber.length === 0
                        ? "border-slate-200 bg-slate-50/70"
                        : confirmAccountNumber === accountNumber
                        ? "border-emerald-400 bg-emerald-50/40"
                        : "border-rose-400 bg-rose-50/40"
                    }`}
                  >
                    <CheckCircle2
                      size={20}
                      className={
                        confirmAccountNumber.length === 0
                          ? "shrink-0 text-slate-400"
                          : confirmAccountNumber === accountNumber
                          ? "shrink-0 text-emerald-500"
                          : "shrink-0 text-rose-500"
                      }
                    />
                    <input
                      id="confirm-account-number"
                      type="text"
                      inputMode="numeric"
                      value={confirmAccountNumber}
                      maxLength={20}
                      onChange={handleConfirmAccountNumberChange}
                      className="w-full bg-transparent font-mono text-xs font-semibold text-slate-800 outline-none"
                      placeholder="Re-enter account number"
                    />
                  </div>

                  {confirmAccountNumber.length > 0 &&
                    confirmAccountNumber === accountNumber && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <Check size={14} /> Account numbers match
                      </p>
                    )}

                  {confirmAccountNumber.length > 0 &&
                    confirmAccountNumber !== accountNumber && (
                      <p className="mt-1 text-[11px] font-semibold text-rose-600">
                        Account numbers do not match
                      </p>
                    )}
                </div>
              </div>

              {/* Bank Account Proof Upload */}
              <div className="mt-5 border-t border-slate-100 pt-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Account Proof (Optional)
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Upload a copy of cancelled cheque or bank passbook (JPG, PNG, PDF up to 10MB)
                </p>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7c3aed]">
                    <FileText size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {proofFileName || "No new file selected"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {proofFile
                        ? `${(proofFile.size / 1024 / 1024).toFixed(2)} MB`
                        : "Upload cancelled cheque or passbook"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-[#7c3aed] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#6d28d9] disabled:opacity-50"
                  >
                    <Upload size={14} />
                    <span>Choose</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-7 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => navigate("/retailer/profile")}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#6d28d9] disabled:opacity-50 transition"
                >
                  {isSaving ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      <span>Saving & Synchronizing...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save & Update Bank Account</span>
                    </>
                  )}
                </button>
              </div>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
