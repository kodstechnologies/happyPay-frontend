import { useState, useEffect, useRef } from "react";
import {
  Building2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Star,
  Search,
  Check,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";
import Modal from "../../../../components/common/Modal";
import { updateRetailerProfile } from "../../../../services/api/retailer/retailerProfileApi";
import { getSettlementBankList, type SettlementBank } from "../../../../services/api/retailer/retailerAuthApi";
import type {
  RetailerBank,
  RetailerFullProfile,
} from "../../../../types/retailer/profile";

interface BankModalProps {
  open: boolean;
  onClose: () => void;
  bankToEdit?: RetailerBank | null;
  isOnlyBank?: boolean;
  onSuccess: (updatedProfile?: RetailerFullProfile) => void;
  onDeleteRequest?: (bank: RetailerBank) => void;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const BANKS_PER_PAGE = 50;

export default function BankModal({
  open,
  onClose,
  bankToEdit,
  isOnlyBank = false,
  onSuccess,
  onDeleteRequest,
  size = "md",
}: BankModalProps) {
  const isEdit = Boolean(bankToEdit);

  const [bankName, setBankName] = useState(bankToEdit?.name || "");
  const [bank_id, setBankId] = useState<string | number | undefined>(
    bankToEdit?.bank_code || bankToEdit?.bank_id
  );
  const [accountNumber, setAccountNumber] = useState(bankToEdit?.accountNumber || "");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(
    bankToEdit?.accountNumber || ""
  );
  const [ifscCode, setIfscCode] = useState(bankToEdit?.ifscCode || "");
  const [branchName, setBranchName] = useState(bankToEdit?.branchName || "");
  const [isPrimary, setIsPrimary] = useState(
    Boolean(bankToEdit?.isPrimary) || isOnlyBank
  );

  const [availableBanks, setAvailableBanks] = useState<SettlementBank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bankSearch, setBankSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let ignore = false;
    getSettlementBankList(1, BANKS_PER_PAGE)
      .then((res) => {
        if (ignore) return;
        if (res?.success && res.data) {
          setAvailableBanks(res.data);
          const meta = res.meta as unknown as { totalPages?: number } | undefined;
          if (meta?.totalPages) {
            setTotalPages(meta.totalPages);
          }
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to fetch bank list in BankModal:", err);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoadingBanks(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLoadMoreBanks = async () => {
    if (currentPage < totalPages && !loadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      setLoadingMore(true);
      try {
        const res = await getSettlementBankList(nextPage, BANKS_PER_PAGE);
        if (res?.success && res.data) {
          setAvailableBanks((prev) => {
            const existing = new Set(prev.map((b) => b.code));
            const next = res.data.filter((b) => !existing.has(b.code));
            return [...prev, ...next];
          });
          const meta = res.meta as unknown as { totalPages?: number } | undefined;
          if (meta?.totalPages) {
            setTotalPages(meta.totalPages);
          }
        }
      } catch (err) {
        console.error("Failed to load more banks in BankModal:", err);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  const handleBankSelect = (bank: SettlementBank) => {
    setBankName(bank.description);
    setBankId(bank.code);
    setIsDropdownOpen(false);
    setBankSearch("");
    setError(null);
  };

  const filteredBanks = availableBanks.filter((b) =>
    b.description.toLowerCase().includes(bankSearch.toLowerCase()) ||
    b.code.toLowerCase().includes(bankSearch.toLowerCase())
  );

  if (!open) return null;

  const validate = () => {
    if (!bankName.trim()) {
      setError("Please select or enter the bank name.");
      return false;
    }
    const cleanAcc = accountNumber.trim();
    if (!cleanAcc || cleanAcc.length < 8) {
      setError("Please enter a valid bank account number (minimum 8 digits).");
      return false;
    }
    if (cleanAcc !== confirmAccountNumber.trim()) {
      setError("Account numbers do not match. Please verify.");
      return false;
    }
    const cleanIfsc = ifscCode.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      setError("Please enter a valid 11-digit IFSC code (e.g., HDFC0001234).");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    try {
      setIsSubmitting(true);

      const effectiveBankCode =
        bank_id !== undefined && bank_id !== null && bank_id !== ""
          ? String(bank_id)
          : availableBanks.find(
              (b) => b.description.toLowerCase() === bankName.trim().toLowerCase()
            )?.code;

      const payload: Record<string, unknown> = {
        action: isEdit ? "EDIT_BANK" : "ADD_BANK",
        bankId: bankToEdit?._id,
        bankName: bankName.trim(),
        bank_code: effectiveBankCode ? String(effectiveBankCode) : undefined,
        accountNumber: accountNumber.trim(),
        confirmAccountNumber: confirmAccountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        branchName: branchName.trim(),
        isPrimary: isOnlyBank || isPrimary,
      };

      const res = await updateRetailerProfile(payload);
      if (res && (res.success || res.data)) {
        onSuccess(res.data);
        onClose();
      } else {
        throw new Error(res?.message || "Failed to save bank account.");
      }
    } catch (err: unknown) {
      console.error("Save bank account error:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message || "Failed to save bank account. Please check the details.";
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Bank Account" : "Add Bank Account"}
      description={
        isEdit
          ? "Update your settlement account details"
          : "Link a new account for instant settlement payouts"
      }
      icon={Building2}
      size={size}
      formId="bank-account-modal-form"
      submitLabel={isEdit ? "Save Changes" : "Link Bank Account"}
      isSubmitting={isSubmitting}
      onDelete={
        isEdit && onDeleteRequest && !isOnlyBank
          ? () => {
              if (bankToEdit) {
                onClose();
                onDeleteRequest(bankToEdit);
              }
            }
          : undefined
      }
      deleteLabel="Delete Account"
    >
      <form id="bank-account-modal-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 border border-rose-200/80 text-rose-800 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Bank Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bank Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => !loadingBanks && setIsDropdownOpen(!isDropdownOpen)}
                className={`flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-xl border bg-white px-3.5 py-2.5 text-xs transition focus-within:border-[#7c3aed] focus-within:ring-2 focus-within:ring-[#7c3aed]/20 ${
                  isDropdownOpen
                    ? "border-[#7c3aed] ring-2 ring-[#7c3aed]/20"
                    : bankName
                      ? "border-[#7c3aed] font-medium text-slate-900"
                      : "border-slate-200 text-slate-400"
                }`}
              >
                <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="flex-1 truncate">
                  {loadingBanks && availableBanks.length === 0
                    ? "Loading banks..."
                    : bankName || "Select bank from list..."}
                </span>

                {bankName && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBankName("");
                    }}
                    className="p-0.5 text-slate-400 hover:text-slate-600"
                    title="Clear selection"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-[46px] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  {/* Search Box */}
                  <div className="border-b border-slate-100 p-2 bg-slate-50/70">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
                      <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        placeholder="Search bank name..."
                        className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                        autoFocus
                      />
                      {bankSearch && (
                        <button
                          type="button"
                          onClick={() => setBankSearch("")}
                          className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bank list */}
                  <div className="max-h-52 overflow-y-auto">
                    {filteredBanks.map((bank) => (
                      <button
                        key={bank.code || bank.description}
                        type="button"
                        onClick={() => handleBankSelect(bank)}
                        className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-xs font-medium transition ${
                          bankName === bank.description
                            ? "bg-purple-50 text-[#7c3aed] font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{bank.description}</span>
                        </div>
                        {bankName === bank.description && (
                          <Check className="h-3.5 w-3.5 text-[#7c3aed] shrink-0" strokeWidth={2.5} />
                        )}
                      </button>
                    ))}

                    {filteredBanks.length === 0 && (
                      <div className="p-3.5 text-center text-xs text-slate-400">
                        No banks found matching "{bankSearch}"
                      </div>
                    )}

                    {/* Pagination: Load More */}
                    {currentPage < totalPages && (
                      <div className="border-t border-slate-100 p-2 text-center bg-slate-50/60">
                        <button
                          type="button"
                          onClick={handleLoadMoreBanks}
                          disabled={loadingMore}
                          className="inline-flex items-center justify-center gap-1.5 w-full py-1 text-xs font-bold text-[#7c3aed] hover:underline disabled:opacity-50"
                        >
                          {loadingMore ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Loading more banks...</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5" />
                              <span>Load more banks ({availableBanks.length} loaded · Page {currentPage}/{totalPages})</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Number & Confirm Account Number */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Account Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\s+/g, ""))}
                  placeholder="Enter account number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 transition"
                  required
                />
                <CreditCard className="absolute right-3 top-2.5 h-4 w-4 text-slate-300 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm Account Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={confirmAccountNumber}
                  onChange={(e) =>
                    setConfirmAccountNumber(e.target.value.replace(/\s+/g, ""))
                  }
                  placeholder="Re-enter account number"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    confirmAccountNumber && accountNumber === confirmAccountNumber
                      ? "border-emerald-300 bg-emerald-50/20 focus:border-emerald-500 focus:ring-emerald-500/20"
                      : "border-slate-200 bg-white focus:border-[#7c3aed] focus:ring-[#7c3aed]/20"
                  }`}
                  required
                />
                {confirmAccountNumber && accountNumber === confirmAccountNumber && (
                  <CheckCircle2 className="absolute right-3 top-2.5 h-4 w-4 text-emerald-500 pointer-events-none" />
                )}
              </div>
            </div>
          </div>

          {/* IFSC Code & Branch Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                IFSC Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={11}
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase().trim())}
                placeholder="e.g. HDFC0001234"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 transition"
                required
              />
              <span className="mt-1 block text-[10px] text-slate-400">
                11-character bank branch code
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Branch Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. Connaught Place"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 transition"
              />
            </div>
          </div>

          {/* Primary Bank Toggle */}
          <div className="rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50/60 to-white p-3.5 transition">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPrimary || isOnlyBank}
                disabled={isOnlyBank}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-[#7c3aed] focus:ring-[#7c3aed] border-slate-300"
              />
              <div className="flex-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                  <span>Set as Primary Settlement Account</span>
                  {isOnlyBank && (
                    <span className="text-[10px] text-[#7c3aed] font-medium">
                      (Default)
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  All settlement withdrawals, merchant payouts, and banking cashouts will
                  be routed to this account automatically.
                </p>
              </div>
            </label>
          </div>

          {/* Compliance note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Bank account name must match your verified merchant PAN & Aadhaar details.</span>
          </div>
        </form>
    </Modal>
  );
}
