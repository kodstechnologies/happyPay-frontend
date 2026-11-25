import { showToast } from "../../../../utils/toast";
import { useState, useEffect, useRef } from "react";
import {
  Building2,
  CreditCard,
  CheckCircle2,
  Hash,
  ShieldCheck,
  Star,
  Search,
  Check,
  ChevronDown,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import Modal from "../../../../components/common/Modal";
import { updateRetailerProfile, resubmitBank } from "../../../../services/api/retailer/retailerProfileApi";
import { getBankMasterList, type BankMasterItem } from "../../../../services/api/retailer/retailerAuthApi";
import type {
  RetailerBank,
  RetailerFullProfile,
} from "../../../../types/retailer/profile";

interface BankModalProps {
  open: boolean;
  onClose: () => void;
  bankToEdit?: RetailerBank | null;
  resubmitBankId?: string | null;
  isOnlyBank?: boolean;
  onSuccess: (updatedProfile?: RetailerFullProfile) => void;
  onDeleteRequest?: (bank: RetailerBank) => void;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export default function BankModal({
  open,
  onClose,
  bankToEdit,
  resubmitBankId = null,
  isOnlyBank = false,
  onSuccess,
  onDeleteRequest,
  size = "md",
}: BankModalProps) {
  const isResubmit = Boolean(resubmitBankId);
  const isEdit = Boolean(bankToEdit) && !isResubmit;

  const [bankName, setBankName] = useState(bankToEdit?.name || "");
  const [bank_id, setBankId] = useState<string | number | undefined>(
    bankToEdit?.bank_code || bankToEdit?.bank_id
  );
  const [bankMasterId, setBankMasterId] = useState<string | undefined>(
    bankToEdit?.bankMasterId || undefined
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

  const [availableBanks, setAvailableBanks] = useState<BankMasterItem[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [bankSearch, setBankSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  const handleIfscChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 11);

    setIfscCode(value);
  };

  const handleAccountNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 18);

    setAccountNumber(value);
  };

  const handleConfirmAccountNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 18);

    setConfirmAccountNumber(value);
  };

  const accountsMatch =
    accountNumber.length > 0 &&
    confirmAccountNumber.length > 0 &&
    accountNumber === confirmAccountNumber;

  useEffect(() => {
    if (!open) return;

    let ignore = false;
    getBankMasterList()
      .then((res) => {
        if (ignore) return;
        if (res?.success && res.data) {
          const banks = res.data as BankMasterItem[];
          setAvailableBanks(banks);

          // Pre-link existing bank to its BankMaster record when editing
          if (bankToEdit && !bankToEdit?.bankMasterId && bankToEdit?.name) {
            const matched = banks.find(
              (b) => b.bankName.toLowerCase() === bankToEdit.name.trim().toLowerCase()
            );
            if (matched) {
              setBankMasterId(matched._id);
            }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleBankSelect = (bank: BankMasterItem) => {
    setBankName(bank.bankName);
    setBankId(bank.bankId ?? bank.iin ?? undefined);
    setBankMasterId(bank._id);
    setIsDropdownOpen(false);
    setBankSearch("");
  };

  const filteredBanks = availableBanks.filter(
    (b) =>
      b.bankName.toLowerCase().includes(bankSearch.toLowerCase()) ||
      (b.iin || "").toLowerCase().includes(bankSearch.toLowerCase()) ||
      (b.bankId || "").toLowerCase().includes(bankSearch.toLowerCase())
  );

  if (!open) return null;

  const validate = () => {
    if (!bankName.trim()) {
      showToast("error", "Please select or enter the bank name.");
      return false;
    }
    if (!ifscCode) {
      showToast("error", "IFSC code is required.");
      return false;
    }
    if (ifscCode.length !== 11) {
      showToast("error", "Please enter a valid 11-character IFSC code.");
      return false;
    }
    if (!accountNumber) {
      showToast("error", "Account number is required.");
      return false;
    }
    if (accountNumber !== confirmAccountNumber) {
      showToast("error", "Account numbers do not match.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    

    if (!validate()) return;

    try {
      setIsSubmitting(true);

      // When a BankMaster bank is selected, the payout bank code is resolved
      // server-side via bankMasterId — send an empty bank_code so any stale
      // stored code is cleared and cannot take precedence over the master.
      const matchedMaster = bankMasterId
        ? bankMasterId
        : availableBanks.find(
            (b) => b.bankName.toLowerCase() === bankName.trim().toLowerCase()
          )?._id;

      const hasMasterSelection = Boolean(matchedMaster);
      const legacyBankCode =
        bank_id !== undefined && bank_id !== null && bank_id !== ""
          ? String(bank_id)
          : availableBanks.find(
              (b) => b.bankName.toLowerCase() === bankName.trim().toLowerCase()
            )?.bankId ??
            availableBanks.find(
              (b) => b.bankName.toLowerCase() === bankName.trim().toLowerCase()
            )?.iin;

      if (isResubmit && resubmitBankId) {
        const res = await resubmitBank(resubmitBankId, {
          bankName: bankName.trim(),
          bank_code: hasMasterSelection ? "" : legacyBankCode ? String(legacyBankCode) : undefined,
          bankMasterId: matchedMaster || undefined,
          ifscCode: ifscCode,
          accountNumber: accountNumber,
          branchName: branchName.trim(),
        });
        if (res && (res.success || res.data)) {
          onSuccess(res.data);
          onClose();
        } else {
          throw new Error(res?.message || "Failed to resubmit bank account.");
        }
        return;
      }

      const payload: Record<string, unknown> = {
        action: isEdit ? "EDIT_BANK" : "ADD_BANK",
        bankId: bankToEdit?._id,
        bankName: bankName.trim(),
        bankMasterId: matchedMaster || undefined,
        // Empty string clears a stale stored bank_code on edit so the
        // BankMaster-resolved payout code is used instead.
        bank_code: hasMasterSelection
          ? ""
          : legacyBankCode
            ? String(legacyBankCode)
            : undefined,
        accountNumber: accountNumber,
        confirmAccountNumber: confirmAccountNumber,
        ifscCode: ifscCode,
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
      showToast("error", err, "Failed to save bank account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isResubmit
          ? "Edit & Resubmit Bank Account"
          : isEdit
            ? "Edit Bank Account"
            : "Add Bank Account"
      }
      description={
        isResubmit
          ? "Correct the rejected bank details and resubmit for admin approval"
          : isEdit
            ? "Update your settlement account details"
            : "Link a new account for instant settlement payouts"
      }
      icon={Building2}
      size={size}
      formId="bank-account-modal-form"
      submitLabel={
        isResubmit ? "Resubmit for Approval" : isEdit ? "Save Changes" : "Link Bank Account"
      }
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
                      setBankMasterId(undefined);
                      setBankId(undefined);
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
                        key={bank._id}
                        type="button"
                        onClick={() => handleBankSelect(bank)}
                        className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-xs font-medium transition ${
                          bankMasterId === bank._id || bankName === bank.bankName
                            ? "bg-purple-50 text-[#7c3aed] font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{bank.bankName}</span>
                        </div>
                        {(bankMasterId === bank._id || bankName === bank.bankName) && (
                          <Check className="h-3.5 w-3.5 text-[#7c3aed] shrink-0" strokeWidth={2.5} />
                        )}
                      </button>
                    ))}

                    {filteredBanks.length === 0 && (
                      <div className="p-3.5 text-center text-xs text-slate-400">
                        No banks found matching "{bankSearch}"
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
                <CreditCard
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={2}
                />
                <input
                  type={showAccountNumber ? "text" : "password"}
                  value={accountNumber}
                  onChange={handleAccountNumberChange}
                  placeholder="Enter account number"
                  maxLength={18}
                  inputMode="numeric"
                  autoComplete="off"
                  className={`w-full rounded-xl border bg-white pl-10 pr-10 py-2.5 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    accountNumber
                      ? "border-[#7c3aed]"
                      : "border-slate-200"
                  } focus:border-[#7c3aed] focus:ring-[#7c3aed]/20`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAccountNumber(!showAccountNumber)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showAccountNumber ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm Account Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <CreditCard
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={2}
                />
                <input
                  type="password"
                  value={confirmAccountNumber}
                  onChange={handleConfirmAccountNumberChange}
                  placeholder="Re-enter account number"
                  maxLength={18}
                  inputMode="numeric"
                  autoComplete="off"
                  className={`w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    accountsMatch
                      ? "border-[#08ae82]"
                      : confirmAccountNumber
                        ? "border-[#d85b5b]"
                        : "border-slate-200"
                  } focus:border-[#7c3aed] focus:ring-[#7c3aed]/20`}
                  required
                />
                {accountsMatch && (
                  <CheckCircle2 className="absolute right-3 top-2.5 h-4 w-4 text-[#08ae82] pointer-events-none" />
                )}
              </div>
              {confirmAccountNumber.length > 0 &&
                accountNumber !== confirmAccountNumber && (
                  <p className="mt-2 text-xs font-medium text-[#d85b5b]">
                    Account numbers do not match.
                  </p>
                )}
            </div>
          </div>

          {/* IFSC Code & Branch Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                IFSC Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={2}
                />
                <input
                  type="text"
                  name="ifscCode"
                  value={ifscCode}
                  onChange={handleIfscChange}
                  placeholder="e.g. HDFC0001234"
                  maxLength={11}
                  autoComplete="off"
                  className={`w-full rounded-xl border bg-white pl-10 pr-3.5 py-2.5 text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    ifscCode
                      ? "border-[#7c3aed]"
                      : "border-slate-200"
                  } focus:border-[#7c3aed] focus:ring-[#7c3aed]/20`}
                  required
                />
              </div>
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
          {!isResubmit && (
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
          )}

          {/* Compliance note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Bank account name must match your verified merchant PAN & Aadhaar details.</span>
          </div>
        </form>
    </Modal>
  );
}
