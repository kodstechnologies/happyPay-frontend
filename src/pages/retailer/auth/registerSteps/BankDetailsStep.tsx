import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import {
  Building2,
  CreditCard,
  Hash,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Fingerprint,
} from "lucide-react";

import { updateRetailerBankDetails, getBankList, type Bank } from "../../../../services/api/retailer/retailerAuthApi";
import {
  checkDoEkyc,
  doBioEkyc,
  parsePidXml,
  readEkycPrompt,
  isActionRequired,
  type EkycPrompt,
} from "../../../../services/api/retailer/aepsApi";
import { mfs110Service } from "../../../../services/bimetric/mfs110.service";
import { getGeolocationCoordinates } from "../../../../utils/geolocation";

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

    // eKYC related state
    const [ekycPrompt, setEkycPrompt] = useState<EkycPrompt | null>(null);
    const [capturingBiometric, setCapturingBiometric] = useState(false);
    const [biometricError, setBiometricError] = useState("");
    const [bioEkycResponse, setBioEkycResponse] = useState<unknown>(null);
    const [doEkycResponse, setDoEkycResponse] = useState<unknown>(null);
    const [kycStep, setKycStep] = useState("");

    // Bank list state
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(false);

  // Fetch bank list on component mount
  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true);
      try {
        const response = await getBankList();
        if (response.success && response.data && response.data.data) {
          setBanks(response.data.data);
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
      await updateRetailerBankDetails({
        userId,
        bankName,
        ifscCode,
        accountNumber,
      });

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save bank details");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const captureBiometric = async () => {
    if (!ekycPrompt) return;

    setBiometricError("");
    setCapturingBiometric(true);
    setKycStep("Capturing fingerprint from the biometric device...");

    try {
      const capture = await mfs110Service.capture(ekycPrompt.pidOptionWadh);
      if (!capture.success || !capture.data) {
        setBiometricError(capture.message || "Fingerprint capture failed.");
        return;
      }

      const coords = await getGeolocationCoordinates({
        fallbackLatitude: "0",
        fallbackLongitude: "0",
        timeout: 5000,
      });

      setKycStep("Fingerprint captured. Calling biometric eKYC...");

      const storedUser = JSON.parse(
        localStorage.getItem("retailerUser") || "{}",
      ) as { id?: string; _id?: string; userId?: string; outletId?: string };
      const retailerUserId = storedUser.id || storedUser._id || storedUser.userId || userId;

      const result = await doBioEkyc({
        userId: retailerUserId,
        outlet_id: ekycPrompt.outletId || storedUser.outletId || "",
        referenceKey: ekycPrompt.referenceKey,
        latitude: coords.latitude,
        longitude: coords.longitude,
        ...parsePidXml(capture.data),
      });

      setBioEkycResponse(result);
      setKycStep("Biometric eKYC response received. Registration complete!");
      onRegistrationComplete?.();
    } catch (error: unknown) {
      setBiometricError(error instanceof Error ? error.message : "Biometric eKYC failed.");
      setKycStep(error instanceof Error ? error.message : "Biometric eKYC failed.");
    } finally {
      setCapturingBiometric(false);
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

      {/* eKYC Status Section */}
      {kycStep && (
        <div className="rounded-xl border border-[#dce4f8] bg-[#f8f5ff] px-4 py-3">
          <p className="text-sm font-bold text-[#172033]">eKYC Status</p>
          <p className="mt-1 text-sm text-[#5c677a]">{kycStep}</p>
          {ekycPrompt && (
            <div className="mt-3 grid gap-2 text-xs text-[#172033]">
              <p><span className="font-semibold">Message:</span> {ekycPrompt.message}</p>
              <p><span className="font-semibold">Outlet:</span> {ekycPrompt.outletId || "—"}</p>
              <p className="break-all">
                <span className="font-semibold">Reference key:</span> {ekycPrompt.referenceKey || "—"}
              </p>
            </div>
          )}
          {doEkycResponse != null && (
            <button
              type="button"
              onClick={captureBiometric}
              disabled={capturingBiometric || !ekycPrompt}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-5 text-sm font-bold text-white disabled:opacity-70"
            >
              {capturingBiometric ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4" />
                  do bio ekyc
                </>
              )}
            </button>
          )}
          {biometricError && (
            <p className="mt-3 text-sm text-red-600">{biometricError}</p>
          )}
          {bioEkycResponse != null && (
            <>
              <p className="mt-3 text-xs font-semibold text-[#172033]">Biometric eKYC response</p>
              <pre className="mt-2 max-h-32 overflow-auto rounded-xl bg-[#f8fafc] p-2 text-[10px] leading-4 text-slate-700">
                {JSON.stringify(bioEkycResponse, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
});

BankDetailsStep.displayName = "BankDetailsStep";

export default BankDetailsStep;