import { useState, useRef } from "react";
import {
  CreditCard,
  Phone,
  ShieldCheck,
  MessageSquare,
  CheckCircle2,
  Upload,
  FileText,
  Loader2,
} from "lucide-react";

import {
  sendRetailerRegisterOtp,
  verifyRetailerRegisterOtp,
} from "../../../../services/api/retailer/retailerAuthApi";

type AccountStepProps = {
  onAccountCreated?: (userId: string) => void;
};

const AccountStep = ({ onAccountCreated }: AccountStepProps) => {
  const [pan, setPan] = useState("");
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const panInputRef = useRef<HTMLInputElement | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);

  // ==========================================================
  // PAN
  // ==========================================================

  const handlePanChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);
    setPan(value);
  };

  const handlePanUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setPanFile(file);
  };

  // ==========================================================
  // MOBILE
  // ==========================================================

  const handleMobileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, "").slice(0, 10);
    setMobile(value);
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
    setError("");
  };

  // ==========================================================
  // SEND OTP (API)
  // ==========================================================

  const handleSendOtp = async () => {
    setError("");

    if (mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSending(true);
    try {
      const res = await sendRetailerRegisterOtp(mobile);
     console.log(res)
      setOtpSent(true);
      localStorage.setItem("pendingRetailerMobile", mobile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  // ==========================================================
  // VERIFY OTP (API)
  // ==========================================================

  const handleVerifyOtp = async () => {
    setError("");

    if (otp.length !== 4) {
      setError("Please enter the 4-digit OTP.");
      return;
    }
    if (!pan) {
      setError("PAN number is required.");
      return;
    }
    if (!panFile) {
      setError("PAN document is required.");
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyRetailerRegisterOtp({
        mobile,
        otp,
        panNumber: pan,
        panDocument: panFile,
      });

      const id = res.data.user._id;
      setUserId(id);
      setOtpVerified(true);

      localStorage.setItem("retailerUserId", id);
      localStorage.setItem("pendingRetailerMobile", mobile);

      onAccountCreated?.(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OTP verification failed";
      setError(msg);
      setOtpVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-5">
      {/* PAN + PAN Document */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="registration-pan"
            className="mb-2.5 block text-[15px] font-semibold text-[#172033]"
          >
            PAN Number
          </label>
          <div className="relative">
            <CreditCard
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
              strokeWidth={2}
            />
            <input
              id="registration-pan"
              name="pan"
              type="text"
              value={pan}
              onChange={handlePanChange}
              placeholder="Enter PAN number"
              maxLength={10}
              autoComplete="off"
              disabled={otpVerified}
              className={`h-[58px] w-full rounded-xl border bg-[#fafbfd] pl-11 pr-5 text-[15px] font-semibold uppercase tracking-[0.04em] text-[#172033] outline-none transition-all placeholder:normal-case placeholder:tracking-normal placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${pan ? "border-[#7c3aed]" : "border-[#dfe3e9]"
                }`}
            />
          </div>
          <p className="mt-2 text-[12px] leading-5 text-[#9299a7]">
            Enter your 10-character PAN number.
          </p>
        </div>

        <div>
          <label className="mb-2.5 block text-[15px] font-semibold text-[#172033]">
            PAN Document
          </label>
          <input
            ref={panInputRef}
            type="file"
            accept="image/*,.pdf"
            name="panDocument"
            onChange={handlePanUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => panInputRef.current?.click()}
            disabled={otpVerified}
            className="group flex h-[58px] w-full items-center justify-between gap-3 rounded-xl border border-[#dfe1e6] bg-[#fafbfd] px-4 text-left transition hover:border-[#7c3aed] hover:bg-[#f7f9ff] disabled:opacity-60"
          >
            <div className="flex min-w-0 items-center gap-3">
              {panFile ? (
                <CheckCircle2
                  className="h-5 w-5 shrink-0 text-[#08ae82]"
                  strokeWidth={2}
                />
              ) : (
                <FileText
                  className="h-5 w-5 shrink-0 text-[#7c3aed]"
                  strokeWidth={2}
                />
              )}
              <p className="truncate text-[15px] font-medium text-[#172033]">
                {panFile ? panFile.name : "Upload PAN"}
              </p>
            </div>
            <Upload
              className="h-4.5 w-4.5 shrink-0 text-[#7c3aed] transition group-hover:scale-105"
              strokeWidth={2.3}
            />
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div>
        <label
          htmlFor="registration-mobile"
          className="mb-2.5 block text-[15px] font-semibold text-[#172033]"
        >
          Mobile Number
        </label>
        <div className="relative">
          <Phone
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />
          <span className="pointer-events-none absolute left-[39px] top-1/2 flex -translate-y-1/2 items-center">
            <span className="border-r border-[#d9dde5] pr-3 text-[14px] font-semibold text-[#687286]">
              +91
            </span>
          </span>
          <input
            id="registration-mobile"
            name="mobile"
            type="tel"
            value={mobile}
            onChange={handleMobileChange}
            placeholder="Enter 10-digit mobile number"
            maxLength={10}
            inputMode="numeric"
            autoComplete="tel"
            readOnly={otpVerified}
            className={`h-[58px] w-full rounded-xl border bg-[#fafbfd] pl-[82px] pr-12 text-[15px] font-medium text-[#172033] outline-none transition-all placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${otpVerified
              ? "cursor-not-allowed border-[#b9e8d4] bg-[#f4fcf8]"
              : mobile
                ? "border-[#7c3aed]"
                : "border-[#dfe3e9]"
              }`}
          />
          {otpVerified && (
            <CheckCircle2
              className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#08a77e]"
              strokeWidth={2.2}
            />
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-2xl border border-[#dbe3f7] bg-[#f3f6ff] px-5 py-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <ShieldCheck className="h-5 w-5 text-[#7c3aed]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#172033]">
              Mobile verification
            </p>
            <p className="mt-1 text-[12px] leading-5 text-[#697386]">
              Your mobile number will be verified using a one-time password
              (OTP).
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-[#f0cccc] bg-[#fff5f5] px-4 py-3">
          <p className="text-[13px] font-medium text-[#c84f4f]">{error}</p>
        </div>
      )}

      {/* Send OTP */}
      {!otpSent && !otpVerified && (
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={mobile.length !== 10 || sending}
          className={`flex h-[54px] w-full items-center justify-center gap-2 rounded-xl border text-[14px] font-semibold transition-all ${mobile.length === 10 && !sending
            ? "border-[#c7d2ee] bg-white text-[#7c3aed] shadow-sm hover:border-[#7c3aed] hover:bg-[#f3f6ff]"
            : "cursor-not-allowed border-[#e0e3e8] bg-[#f7f8fa] text-[#a2a8b4]"
            }`}
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MessageSquare className="h-5 w-5" strokeWidth={2} />
          )}
          {sending ? "SENDING..." : "SEND MOBILE OTP"}
        </button>
      )}

      {/* OTP + Verify */}
      {otpSent && !otpVerified && (
        <div className="rounded-2xl border border-[#e1e5ec] bg-[#fafbfd] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[14px] font-semibold text-[#172033]">
                Enter OTP
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[#8992a3]">
                Enter the 4-digit OTP sent to +91 {mobile}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setError("");
              }}
              className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-semibold text-[#7c3aed] transition hover:bg-[#f8f5ff] hover:underline"
            >
              Change
            </button>
          </div>

          <input
            type="text"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="Enter 4-digit OTP"
            maxLength={4}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="mt-4 h-[58px] w-full rounded-xl border border-[#dfe3e9] bg-white px-4 text-center text-[18px] font-bold tracking-[0.4em] text-[#172033] outline-none transition-all placeholder:text-[#a1a8b5] placeholder:tracking-normal focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
          />

          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={verifying || otp.length !== 4}
            className="mt-4 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#7c3aed] text-[14px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {verifying ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" strokeWidth={2.2} />
            )}
            {verifying ? "VERIFYING..." : "VERIFY & CREATE ACCOUNT"}
          </button>
        </div>
      )}

      {/* Verified */}
      {otpVerified && (
        <div className="rounded-2xl border border-[#cce9dc] bg-[#f2fbf7] px-5 py-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <CheckCircle2
                className="h-5 w-5 text-[#08a77e]"
                strokeWidth={2.2}
              />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#087b5d]">
                Account created successfully
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[#5f756c]">
                Your HappyPay retailer account has been created.
                {userId && (
                  <>
                    {" "}
                    User ID: <span className="font-mono">{userId}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-[#9aa1ae]">
        <ShieldCheck className="h-3.5 w-3.5 text-[#7c3aed]" strokeWidth={2} />
        <span>Your mobile number is securely verified.</span>
      </div>
    </div>
  );
};

export default AccountStep;