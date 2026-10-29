import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Phone,
  ShieldCheck,
  MessageSquare,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import {
  sendRetailerRegisterOtp,
  resendRetailerRegisterOtp,
  verifyRetailerRegisterOtp,
} from "../../../../services/api/retailer/retailerAuthApi";

type AccountStepProps = {
  distributorId?: string;
  onAccountCreated?: (userId: string) => void;
  initialMobile?: string;
  initialVerified?: boolean;
  userId?: string;
};

interface ApiErrorData {
  message?: string;
  msg?: string;
  error?: string;
  statusCode?: number;
  data?: {
    message?: string;
    msg?: string;
  } | null;
}

interface ApiErrorResponse {
  response?: {
    status?: number;
    data?: string | ApiErrorData;
  };
  statusCode?: number;
  message?: string;
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null) {
    const apiError = error as ApiErrorResponse;
    const resData = apiError.response?.data;

    if (typeof resData === "string" && resData.trim()) {
      return resData;
    }

    if (typeof resData === "object" && resData !== null) {
      const msg = resData.message || resData.data?.message || resData.msg || resData.error;
      if (typeof msg === "string" && msg.trim()) {
        return msg;
      }
    }

    if (
      typeof apiError.message === "string" &&
      apiError.message.trim() &&
      !apiError.message.toLowerCase().startsWith("request failed with status code")
    ) {
      return apiError.message;
    }
  }

  if (
    error instanceof Error &&
    error.message &&
    !error.message.toLowerCase().startsWith("request failed with status code")
  ) {
    return error.message;
  }

  return fallback;
};

const AccountStep = ({
  distributorId,
  onAccountCreated,
  initialMobile,
  initialVerified,
  userId: userIdProp,
}: AccountStepProps) => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(initialMobile || "");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const [error, setError] = useState("");
  const [isExistingAccount, setIsExistingAccount] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendSuccess, setResendSuccess] = useState("");

  // Countdown timer for Resend OTP (1 minute = 60s)
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const [prevProps, setPrevProps] = useState({
    initialMobile,
    initialVerified,
    userIdProp,
  });

  if (
    prevProps.initialMobile !== initialMobile ||
    prevProps.initialVerified !== initialVerified ||
    prevProps.userIdProp !== userIdProp
  ) {
    setPrevProps({ initialMobile, initialVerified, userIdProp });
    if (initialMobile) setMobile(initialMobile);
    if (initialVerified !== undefined) setOtpVerified(initialVerified);
    if (userIdProp) setUserId(userIdProp);
  }

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
    setResendSuccess("");
    setResendTimer(0);
    setIsExistingAccount(false);
  };

  // ==========================================================
  // SEND OTP (API)
  // ==========================================================

  const handleSendOtp = async () => {
    setIsExistingAccount(false);

    if (mobile.length !== 10) {
      const msg = "Please enter a valid 10-digit mobile number.";
      toast.error(msg);
      return;
    }

    setSending(true);
    setResendSuccess("");
    try {
      const res = await sendRetailerRegisterOtp(mobile);
      console.log(res);
      setOtpSent(true);
      setResendTimer(60);
      toast.success(res.message || "OTP sent successfully!");
      localStorage.setItem("pendingRetailerMobile", mobile);
    } catch (err: unknown) {
      const errorObj = err as ApiErrorResponse | undefined;
      const statusCode = errorObj?.response?.status || errorObj?.statusCode;
      const msg = getApiErrorMessage(err, "Failed to send OTP");

      if (
        statusCode === 409 ||
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already exists")
      ) {
        setIsExistingAccount(true);
        toast.warning("Account already exists. Please login.");
      } else {
        toast.error(msg);
      }
    } finally {
      setSending(false);
    }
  };

  // ==========================================================
  // RESEND OTP (API)
  // ==========================================================

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resending || verifying) return;
    setError("");
    setResendSuccess("");
    setResending(true);
    try {
      await resendRetailerRegisterOtp(mobile);
      setResendTimer(60);
      setResendSuccess("OTP resent successfully!");
      toast.success("OTP resent successfully!");
    } catch (err: unknown) {
      const errorObj = err as { message?: string; statusCode?: number } | undefined;
      const msg = errorObj?.message || "Failed to resend OTP";
      setError(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  // ==========================================================
  // VERIFY OTP (API)
  // ==========================================================

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      const msg = "Please enter the 4-digit OTP.";
      toast.error(msg);
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyRetailerRegisterOtp({
        mobile,
        otp,
        distributorId,
      });

      const id = res.data.user._id;
      setUserId(id);
      setOtpVerified(true);
      toast.success(res.message || "OTP verified successfully!");

      if (!distributorId) {
        localStorage.setItem("retailerUserId", id);
        localStorage.setItem("pendingRetailerMobile", mobile);
      } else {
        localStorage.setItem("subRetailerUserId", id);
      }

      onAccountCreated?.(id);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "OTP verification failed");
      toast.error(msg);
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

      {/* Existing Account Notice */}
      {isExistingAccount && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[14px] font-bold text-amber-900">
            Account already exists
          </p>
          <p className="mt-1 text-[12px] leading-5 text-amber-700">
            This mobile number is already registered or registration is in progress. Please log in to continue your pending registration or access your portal.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/retailer/login?mobile=${mobile}`)}
            className="mt-3.5 inline-flex items-center justify-center rounded-xl bg-[#7c3aed] px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#6d28d9] active:scale-[0.99]"
          >
            Go to Login
          </button>
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
                setResendSuccess("");
                setResendTimer(0);
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

          <div className="mt-3 flex items-center justify-between text-[12px]">
            <span className="text-[#8992a3]">Didn't receive OTP?</span>
            {resendTimer > 0 ? (
              <span className="font-medium text-[#737c8c]">
                Resend in{" "}
                <strong className="font-bold text-[#7c3aed]">
                  {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, "0")}
                </strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending || verifying}
                className="font-semibold text-[#7c3aed] transition hover:underline disabled:opacity-50"
              >
                {resending ? "Resending..." : "Resend OTP"}
              </button>
            )}
          </div>

          {resendSuccess && !error && (
            <p className="mt-2 text-center text-[12px] font-medium text-[#08a77e]">
              {resendSuccess}
            </p>
          )}

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