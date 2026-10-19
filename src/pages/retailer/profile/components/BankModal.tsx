import { useState, useEffect } from "react";
import {
  Building2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import Modal from "../../../../components/common/Modal";
import { updateRetailerProfile } from "../../../../services/api/retailer/retailerProfileApi";
import { getBankList } from "../../../../services/api/retailer/retailerAuthApi";
import type {
  RetailerBank,
  RetailerFullProfile,
} from "../../../../types/retailer/profile";

const POPULAR_BANKS = [
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

interface BankModalProps {
  open: boolean;
  onClose: () => void;
  bankToEdit?: RetailerBank | null;
  isOnlyBank?: boolean;
  onSuccess: (updatedProfile: RetailerFullProfile) => void;
  onDeleteRequest?: (bank: RetailerBank) => void;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

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
  const [accountNumber, setAccountNumber] = useState(bankToEdit?.accountNumber || "");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(
    bankToEdit?.accountNumber || ""
  );
  const [ifscCode, setIfscCode] = useState(bankToEdit?.ifscCode || "");
  const [branchName, setBranchName] = useState(bankToEdit?.branchName || "");
  const [isPrimary, setIsPrimary] = useState(
    Boolean(bankToEdit?.isPrimary) || isOnlyBank
  );

  const [availableBanks, setAvailableBanks] = useState<string[]>(POPULAR_BANKS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch master bank list asynchronously
  useEffect(() => {
    let isMounted = true;
    getBankList()
      .then((res) => {
        if (!isMounted) return;
        if (res?.data && Array.isArray(res.data)) {
          const fetched = res.data.map((b) => b.name).filter(Boolean);
          if (fetched.length > 0) {
            setAvailableBanks(Array.from(new Set([...fetched, ...POPULAR_BANKS])));
          }
        }
      })
      .catch(() => {
        // Keep POPULAR_BANKS fallback
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

      const payload: Record<string, unknown> = {
        action: isEdit ? "EDIT_BANK" : "ADD_BANK",
        bankId: bankToEdit?._id,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        confirmAccountNumber: confirmAccountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        branchName: branchName.trim(),
        isPrimary: isOnlyBank || isPrimary,
      };

      const res = await updateRetailerProfile(payload);
      if (res && res.data) {
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
            <div className="relative">
              <input
                type="text"
                list="bank-list-options"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Select or enter bank name (e.g. HDFC Bank)"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 transition"
                required
              />
              <datalist id="bank-list-options">
                {availableBanks.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
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
