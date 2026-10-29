import { useState, forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import {
  Building2,
  CreditCard,
  Hash,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Search,
  Check,
  X,
} from "lucide-react";

import { toast } from "react-toastify";
import {
  updateRetailerBankDetails,
  getBankList,
  type Bank,
  type CurrentRegistrationStepResult,
} from "../../../../services/api/retailer/retailerAuthApi";

export type BankDetailsStepHandle = {
  submit: () => Promise<boolean>;
};

type BankDetailsStepProps = {
  userId?: string;
  distributorId?: string;
  onRegistrationComplete?: () => void;
  initialData?: CurrentRegistrationStepResult["filledData"] | null;
};

const BankDetailsStep = forwardRef<BankDetailsStepHandle, BankDetailsStepProps>(
  ({ userId: userIdProp, distributorId, onRegistrationComplete, initialData }, ref) => {
    const userId =
      userIdProp || localStorage.getItem("retailerUserId") || undefined;

    const [bankName, setBankName] = useState("");
    const [bank_id, setBankId] = useState<string | number | undefined>(undefined);
    const [ifscCode, setIfscCode] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      if (!initialData) return;
      const bankInfo =
        initialData.primaryBank ||
        (initialData.banks && initialData.banks.length > 0
          ? (initialData.banks[0] as {
              bankName?: string;
              bank_id?: string | number;
              ifscCode?: string;
              accountNumber?: string;
            })
          : null);

      if (bankInfo) {
        if (bankInfo.bankName) setBankName(bankInfo.bankName);
        if (bankInfo.bank_id !== undefined) setBankId(bankInfo.bank_id);
        if (bankInfo.ifscCode) setIfscCode(bankInfo.ifscCode);
        if (bankInfo.accountNumber) {
          setAccountNumber(bankInfo.accountNumber);
          setConfirmAccountNumber(bankInfo.accountNumber);
        }
      }
    }, [initialData]);

    // Bank list state & pagination
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [bankSearch, setBankSearch] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const BANKS_PER_PAGE = 50;

    const fetchBanks = async (page: number = 1, append: boolean = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingBanks(true);
      }
      try {
        const response = await getBankList(page, BANKS_PER_PAGE);
        if (response.success && response.data) {
          if (append) {
            setBanks((prev) => {
              const existingIds = new Set(prev.map((b) => b.id || b.name));
              const newItems = response.data.filter((b) => !existingIds.has(b.id || b.name));
              return [...prev, ...newItems];
            });
          } else {
            setBanks(response.data);
          }
          const meta = response.meta as unknown as { totalPages?: number } | undefined;
          if (meta?.totalPages) {
            setTotalPages(meta.totalPages);
          }
        }
      } catch (err) {
        console.error("Failed to fetch bank list:", err);
      } finally {
        setLoadingBanks(false);
        setLoadingMore(false);
      }
    };

    // Fetch bank list on component mount
    useEffect(() => {
      void fetchBanks(1, false);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsDropdownOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLoadMore = () => {
      if (currentPage < totalPages && !loadingMore) {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        void fetchBanks(nextPage, true);
      }
    };

    const handleBankSelect = (bank: Bank) => {
      setBankName(bank.name);
      setBankId(bank.bank_id);
      setIsDropdownOpen(false);
      setBankSearch("");
    };

    const filteredBanks = banks.filter((b) =>
      b.name.toLowerCase().includes(bankSearch.toLowerCase())
    );

  const handleIfscChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 11);

    setIfscCode(value);
  };

  const handleAccountNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 18);

    setAccountNumber(value);
  };

  const handleConfirmAccountNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 18);

    setConfirmAccountNumber(value);
  };

  const accountsMatch =
    accountNumber.length > 0 &&
    confirmAccountNumber.length > 0 &&
    accountNumber === confirmAccountNumber;

  const handleSubmit = async (): Promise<boolean> => {
    if (!userId) {
      toast.error("User not registered. Please complete step 1.");
      return false;
    }
    if (!bankName) {
      toast.error("Bank name is required.");
      return false;
    }
    if (!ifscCode) {
      toast.error("IFSC code is required.");
      return false;
    }
    if (ifscCode.length !== 11) {
      toast.error("Please enter a valid 11-character IFSC code.");
      return false;
    }
    if (!accountNumber) {
      toast.error("Account number is required.");
      return false;
    }
    if (accountNumber !== confirmAccountNumber) {
      toast.error("Account numbers do not match.");
      return false;
    }

    setSubmitting(true);
    try {
      const deviceId = localStorage.getItem("retailerDeviceId") || crypto.randomUUID();
      localStorage.setItem("retailerDeviceId", deviceId);
      const fcmToken = localStorage.getItem("fcmToken") || null;

      const effectiveBankId =
        bank_id !== undefined && bank_id !== null && bank_id !== ""
          ? String(bank_id)
          : banks.find((b) => b.name.toLowerCase() === bankName.trim().toLowerCase())?.bank_id;

      await updateRetailerBankDetails({
        userId,
        bankName,
        bank_id: effectiveBankId ? String(effectiveBankId) : undefined,
        ifscCode,
        accountNumber,
        fcmToken,
        deviceId,
        platform: "web",
        deviceName: navigator.platform || "Web browser",
        distributorId,
      });

      // After successful bank details submission, directly complete registration
      // eKYC flow commented out as per user request
      /*
      // After successful bank details submission, check eKYC status
      setKycStep("Checking eKYC status...");
      const storedUser = JSON.parse(
        localStorage.getItem("retailerUser") || "{}",
      ) as { id?: string; _id?: string; userId?: string; outletId?: string };

      const retailerUserId = storedUser.id || storedUser._id || storedUser.userId || userId;
      const status = await checkDoEkyc(storedUser.outletId, retailerUserId);
      setDoEkycResponse(status);
      setEkycPrompt(readEkycPrompt(status));

      if (isActionRequired(status)) {
        setKycStep("eKYC completed. Click do bio ekyc to capture the fingerprint and send it.");
        // Don't return true yet - wait for biometric capture
        return false;
      } else {
        setKycStep("eKYC check completed. No action required.");
        onRegistrationComplete?.();
        return true;
      }
      */

      // Directly complete registration without eKYC check
      onRegistrationComplete?.();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save bank details");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
  }));

  return (
    <div className="space-y-6">
      {/* BANK NAME */}
      <div>
        <label className="mb-2.5 block text-sm font-semibold text-[#172033]">
          Bank Name
        </label>

        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => !loadingBanks && setIsDropdownOpen(!isDropdownOpen)}
            className={`flex h-[54px] w-full cursor-pointer items-center gap-3 rounded-xl border bg-[#fafbfd] px-4 text-sm transition focus-within:border-[#7c3aed] focus-within:ring-2 focus-within:ring-[#7c3aed]/10 ${
              isDropdownOpen
                ? "border-[#7c3aed] ring-2 ring-[#7c3aed]/10 bg-white"
                : bankName
                  ? "border-[#7c3aed] font-medium text-[#172033]"
                  : "border-[#dfe1e6] text-[#a1a8b5]"
            }`}
          >
            <Building2
              className="h-5 w-5 shrink-0 text-[#8992a3]"
              strokeWidth={2}
            />
            <span className="flex-1 truncate text-sm">
              {loadingBanks && banks.length === 0
                ? "Loading banks..."
                : bankName || "Select bank"}
            </span>

            {bankName && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBankName("");
                }}
                className="p-1 text-[#8992a3] hover:text-[#172033]"
                title="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[#697386] transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              strokeWidth={2.2}
            />
          </div>

          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-[60px] z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {/* Search Bar */}
              <div className="border-b border-slate-100 p-2.5 bg-slate-50/50">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
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
                      className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Bank Items List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredBanks.map((bank) => (
                  <button
                    key={bank.id || bank.bank_id || bank.name}
                    type="button"
                    onClick={() => handleBankSelect(bank)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium transition ${
                      bankName === bank.name
                        ? "bg-purple-50 text-[#7c3aed] font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{bank.name}</span>
                    </div>
                    {bankName === bank.name && (
                      <Check className="h-4 w-4 text-[#7c3aed] shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                ))}

                {filteredBanks.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No banks found matching "{bankSearch}"
                  </div>
                )}

                {/* Pagination: Load More */}
                {currentPage < totalPages && (
                  <div className="border-t border-slate-100 p-2.5 text-center bg-slate-50/60">
                    <button
                      type="button"
                      onClick={handleLoadMore}
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
                          <span>Load more banks ({banks.length} loaded · Page {currentPage}/{totalPages})</span>
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

      {/* IFSC CODE */}
      <div>
        <label className="mb-2.5 block text-sm font-semibold text-[#172033]">
          IFSC Code
        </label>

        <div className="relative">
          <Hash
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />

          <input
            type="text"
            name="ifscCode" value={ifscCode}
            onChange={handleIfscChange}
            placeholder="Enter IFSC code"
            maxLength={11}
            autoComplete="off"
            className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-5 text-sm uppercase tracking-[0.04em] text-[#172033] outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10 ${
              ifscCode
                ? "border-[#7c3aed]"
                : "border-[#dfe1e6]"
            }`}
          />
        </div>

        <p className="mt-2 text-xs text-[#9299a7]">
          Enter the 11-character IFSC code of your bank
          branch.
        </p>
      </div>

      {/* ACCOUNT NUMBER */}
      <div>
        <label className="mb-2.5 block text-sm font-semibold text-[#172033]">
          Account Number
        </label>

        <div className="relative">
          <CreditCard
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />

          <input
            type="password"
            name="accountNumber" value={accountNumber}
            onChange={handleAccountNumberChange}
            placeholder="Enter account number"
            maxLength={18}
            inputMode="numeric"
            autoComplete="off"
            className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-5 text-sm tracking-[0.08em] text-[#172033] outline-none transition placeholder:tracking-normal placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10 ${
              accountNumber
                ? "border-[#7c3aed]"
                : "border-[#dfe1e6]"
            }`}
          />
        </div>
      </div>

      {/* CONFIRM ACCOUNT NUMBER */}
      <div>
        <label className="mb-2.5 block text-sm font-semibold text-[#172033]">
          Confirm Account Number
        </label>

        <div className="relative">
          <CreditCard
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
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
            className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-12 text-sm tracking-[0.08em] text-[#172033] outline-none transition placeholder:tracking-normal placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10 ${
              accountsMatch
                ? "border-[#08ae82]"
                : confirmAccountNumber
                  ? "border-[#d85b5b]"
                  : "border-[#dfe1e6]"
            }`}
          />

          {accountsMatch && (
            <CheckCircle2
              className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#08ae82]"
              strokeWidth={2.2}
            />
          )}
        </div>

        {confirmAccountNumber.length > 0 &&
          accountNumber !== confirmAccountNumber && (
            <p className="mt-2 text-xs font-medium text-[#d85b5b]">
              Account numbers do not match.
            </p>
          )}
      </div>

      {/* Submitting indicator */}
      {submitting && (
        <div className="flex items-center justify-center gap-2 text-[12px] text-[#7c3aed]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving bank details...
        </div>
      )}

      {/* SECURITY INFORMATION */}
      <div className="flex items-start gap-3 rounded-xl border border-[#d9e0f5] bg-[#f1f4ff] px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e4e9ff]">
          <ShieldCheck
            className="h-5 w-5 text-[#7c3aed]"
            strokeWidth={2}
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-[#172033]">
            Your bank details are secure
          </p>

          <p className="mt-1 text-xs leading-5 text-[#697386]">
            Your bank account information will be used for
            retailer payouts and transaction settlements.
          </p>
        </div>
      </div>
    </div>
  );
});

BankDetailsStep.displayName = "BankDetailsStep";

export default BankDetailsStep;