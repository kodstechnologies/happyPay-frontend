import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import {
  Building2,
  CreditCard,
  Hash,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Loader2,
} from "lucide-react";

import { updateRetailerBankDetails, getBankList, type Bank } from "../../../../services/api/retailer/retailerAuthApi";

export type BankDetailsStepHandle = {
  submit: () => Promise<boolean>;
};

type BankDetailsStepProps = {
  userId?: string;
  onRegistrationComplete?: () => void;
};

const BankDetailsStep = forwardRef<BankDetailsStepHandle, BankDetailsStepProps>(
  ({ userId: userIdProp, onRegistrationComplete }, ref) => {
    const userId =
      userIdProp || localStorage.getItem("retailerUserId") || undefined;

    const [bankName, setBankName] = useState("");
    const [ifscCode, setIfscCode] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Bank list state
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(false);

  // Fetch bank list on component mount
  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true);
      try {
        const response = await getBankList();
        console.log("Bank list API response:", response);
        if (response.success && response.data) {
          setBanks(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch bank list:", err);
      } finally {
        setLoadingBanks(false);
      }
    };

    fetchBanks();
  }, []);

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
    setError("");

    if (!userId) {
      setError("User not registered. Please complete step 1.");
      return false;
    }
    if (!bankName) {
      setError("Bank name is required.");
      return false;
    }
    if (!ifscCode) {
      setError("IFSC code is required.");
      return false;
    }
    if (ifscCode.length !== 11) {
      setError("Please enter a valid 11-character IFSC code.");
      return false;
    }
    if (!accountNumber) {
      setError("Account number is required.");
      return false;
    }
    if (accountNumber !== confirmAccountNumber) {
      setError("Account numbers do not match.");
      return false;
    }

    setSubmitting(true);
    try {
      const deviceId = localStorage.getItem("retailerDeviceId") || crypto.randomUUID();
      localStorage.setItem("retailerDeviceId", deviceId);
      const fcmToken = localStorage.getItem("fcmToken") || null;

      await updateRetailerBankDetails({
        userId,
        bankName,
        ifscCode,
        accountNumber,
        fcmToken,
        deviceId,
        platform: "web",
        deviceName: navigator.platform || "Web browser",
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
      setError(err instanceof Error ? err.message : "Failed to save bank details");
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

        <div className="relative">
          <Building2
            className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />

          <select
            name="bankName" value={bankName}
            onChange={(event) =>
              setBankName(event.target.value)
            }
            disabled={loadingBanks}
            className={`h-[54px] w-full appearance-none rounded-xl border bg-[#fafbfd] pl-12 pr-12 text-sm outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10 disabled:opacity-60 ${
              bankName
                ? "border-[#7c3aed] font-medium text-[#172033]"
                : "border-[#dfe1e6] text-[#a1a8b5]"
            }`}
          >
            <option value="" disabled>
              {loadingBanks ? "Loading banks..." : "Select bank"}
            </option>

            {banks.map((bank) => (
              <option key={bank.id} value={bank.name}>
                {bank.name}
              </option>
            ))}
          </select>

          <ChevronDown
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#697386]"
            strokeWidth={2.2}
          />
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

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-[#f0cccc] bg-[#fff5f5] px-4 py-3">
          <p className="text-[13px] font-medium text-[#c84f4f]">{error}</p>
        </div>
      )}

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