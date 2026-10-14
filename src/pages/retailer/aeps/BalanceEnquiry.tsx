import { useState } from "react";
import { Banknote, ArrowLeft, IdCard, Fingerprint, Phone } from "lucide-react";
import { balanceEnquiry } from "../../../services/api/retailer/aepsApi";
import { getToken } from "../../../utils/auth";
import { mfs110Service } from "../../../services/bimetric/mfs110.service";
import { getGeolocationCoordinates } from "../../../utils/geolocation";
import { parsePidXml } from "../../../services/api/retailer/aepsApi";

interface BalanceEnquiryProps {
  onBack?: () => void;
}

const BalanceEnquiry = ({ onBack }: BalanceEnquiryProps) => {
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isCapturingBiometric, setIsCapturingBiometric] = useState(false);
  const [balanceResult, setBalanceResult] = useState<Record<string, unknown> | null>(null);
  const [balanceError, setBalanceError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const handleBalanceEnquiry = async () => {
    if (aadhaarNumber.length !== 12) {
      setBalanceError("Please enter a valid 12-digit Aadhaar number");
      return;
    }

    if (mobileNumber.length !== 10) {
      setBalanceError("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsCapturingBiometric(true);
    setBalanceError("");
    setBalanceResult(null);
    setStatusMessage("Capturing fingerprint from the biometric device...");

    try {
      // Capture fingerprint from device
      const capture = await mfs110Service.capture("");
      if (!capture.success || !capture.data) {
        throw new Error(capture.message || "Fingerprint capture failed. Please ensure device is connected.");
      }

      setStatusMessage("Fingerprint captured. Checking balance...");

      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      // Decode JWT token to get outletId and referenceKey
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const outletId = tokenPayload.outletId || tokenPayload.outletid || "";
      const referenceKey = tokenPayload.referenceKey || "";

      if (!outletId) {
        throw new Error("Outlet ID is missing from your account. Please complete eKYC first.");
      }

      if (!referenceKey) {
        throw new Error("Reference key is missing from your account. Please complete eKYC first.");
      }

      // Get geolocation
      const coords = await getGeolocationCoordinates({
        fallbackLatitude: "0",
        fallbackLongitude: "0",
        timeout: 5000,
      });

      // Parse captured biometric data
      const pidData = parsePidXml(capture.data);

      const payload = {
        outlet_id: outletId,
        referenceKey,
        latitude: coords.latitude,
        longitude: coords.longitude,
        aadhaar: aadhaarNumber,
        mobile: mobileNumber,
        ...pidData,
      };

      // Ensure ts is present
      if (!payload.ts) {
        payload.ts = new Date().toISOString();
      }

      const result = await balanceEnquiry(payload);
      setBalanceResult(result.data as Record<string, unknown> | null);
      setStatusMessage("Balance enquiry completed successfully.");
    } catch (error: unknown) {
      setBalanceError(error instanceof Error ? error.message : "Failed to check balance");
      setStatusMessage("");
    } finally {
      setIsCapturingBiometric(false);
    }
  };

  const handleAadhaarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, "").slice(0, 12);
    setAadhaarNumber(value);
    setBalanceError("");
  };

  const handleMobileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(value);
    setBalanceError("");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Balance Enquiry</h2>
        <p className="mt-2 text-base text-slate-500">Check your account balance instantly</p>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 mb-4">
            <Banknote className="h-10 w-10 text-emerald-600" />
          </div>
          <p className="text-center text-sm text-slate-600">
            Enter customer Aadhaar number to check balance
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold text-slate-900">
            Aadhaar Number
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3">
            <IdCard className="h-5 w-5 shrink-0 text-emerald-600" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={12}
              value={aadhaarNumber}
              onChange={handleAadhaarChange}
              disabled={isCapturingBiometric}
              placeholder="Enter 12-digit Aadhaar number"
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold text-slate-900">
            Mobile Number
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3">
            <Phone className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="text-slate-400 text-sm">+91</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={mobileNumber}
              onChange={handleMobileChange}
              disabled={isCapturingBiometric}
              placeholder="Enter 10-digit mobile number"
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {statusMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
            {statusMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handleBalanceEnquiry}
          disabled={aadhaarNumber.length !== 12 || mobileNumber.length !== 10 || isCapturingBiometric}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCapturingBiometric ? (
            <>
              <Fingerprint className="h-5 w-5 animate-pulse" />
              CAPTURING FINGERPRINT...
            </>
          ) : (
            <>
              <Banknote className="h-5 w-5" />
              CHECK BALANCE
            </>
          )}
        </button>
      </div>

      {balanceError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {balanceError}
        </div>
      )}

      {balanceResult && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold text-emerald-700 mb-2">Balance Enquiry Result</p>
          <pre className="text-xs text-emerald-800 overflow-auto max-h-32">
            {JSON.stringify(balanceResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default BalanceEnquiry;
