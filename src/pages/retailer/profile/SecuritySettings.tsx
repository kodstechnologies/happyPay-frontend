import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getRetailerProfile } from "../../../services/api/retailer/retailerProfileApi";
import {
  sendMpinOtpApi,
  setupMpinApi,
  changeMpinApi,
} from "../../../services/api/retailer/retailerMpinApi";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder: string;
}

interface PinFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder: string;
}

/* =========================
   PASSWORD FIELD
========================= */

const PasswordField = ({
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
}: PasswordFieldProps) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

/* =========================
   PIN FIELD
========================= */

const PinField = ({
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
}: PinFieldProps) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          inputMode="numeric"
          maxLength={4}
          value={value}
          onChange={(event) => {
            const value = event.target.value.replace(/\D/g, "");
            onChange(value);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm tracking-[0.3em] text-slate-800 outline-none transition placeholder:text-slate-400 placeholder:tracking-normal focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

/* =========================
   SECURITY SETTINGS
========================= */

const SecuritySettings = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  /* =========================
     PASSWORD STATE
  ========================= */

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordMessage, setPasswordMessage] = useState("");

  /* =========================
     MPIN STATE
  ========================= */

  const [isMpinConfigured, setIsMpinConfigured] = useState<boolean>(() => {
    return Boolean(user?.isMpinSet);
  });
  const [pinMode, setPinMode] = useState<"setup" | "change" | "reset">("setup");
  const [showPinForm, setShowPinForm] = useState(false);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [otp, setOtp] = useState("");

  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [maskedMobile, setMaskedMobile] = useState("");

  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [pinMessage, setPinMessage] = useState("");
  const [isPinMessageError, setIsPinMessageError] = useState(false);

  // Synchronize MPIN status from profile
  useEffect(() => {
    let isMounted = true;
    getRetailerProfile()
      .then((res) => {
        if (isMounted && res?.data) {
          const mpinSet = Boolean(res.data.isMpinSet);
          setIsMpinConfigured(mpinSet);
          setPinMode(mpinSet ? "change" : "setup");
          if (res.data.mobile) {
            const m = String(res.data.mobile).trim();
            setMaskedMobile(m.length >= 4 ? `******${m.slice(-4)}` : m);
          }
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch retailer profile for MPIN status:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync with user state if updated
  const [prevUserMpinSet, setPrevUserMpinSet] = useState(user?.isMpinSet);
  if (user?.isMpinSet !== undefined && user?.isMpinSet !== prevUserMpinSet) {
    setPrevUserMpinSet(user?.isMpinSet);
    const mpinSet = Boolean(user.isMpinSet);
    setIsMpinConfigured(mpinSet);
    setPinMode(mpinSet ? "change" : "setup");
  }

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (otpCountdown > 0) {
      timer = setTimeout(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [otpCountdown]);

  /* =========================
     PASSWORD UPDATE
  ========================= */

  const handlePasswordUpdate = () => {
    setPasswordMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage(
        "New password must contain at least 6 characters.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage(
        "New password and confirm password do not match.",
      );
      return;
    }

    setPasswordMessage("Password updated successfully.");

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setTimeout(() => {
      setShowPasswordForm(false);
      setPasswordMessage("");
    }, 1800);
  };

  /* =========================
     MPIN ACTIONS
  ========================= */

  const handleSendOtp = async () => {
    setPinMessage("");
    setIsPinMessageError(false);

    if (pinMode === "change" && !currentPin) {
      setPinMessage("Please enter your current 4-digit MPIN first.");
      setIsPinMessageError(true);
      return;
    }
    if (pinMode === "change" && !/^\d{4}$/.test(currentPin)) {
      setPinMessage("Current MPIN must be exactly 4 numeric digits.");
      setIsPinMessageError(true);
      return;
    }
    if (newPin && !/^\d{4}$/.test(newPin)) {
      setPinMessage("New MPIN must contain exactly 4 numeric digits.");
      setIsPinMessageError(true);
      return;
    }
    if (confirmPin && !/^\d{4}$/.test(confirmPin)) {
      setPinMessage("Confirm MPIN must contain exactly 4 numeric digits.");
      setIsPinMessageError(true);
      return;
    }
    if (newPin && confirmPin && newPin !== confirmPin) {
      setPinMessage("New MPIN and confirm MPIN do not match.");
      setIsPinMessageError(true);
      return;
    }

    try {
      setIsSendingOtp(true);
      const res = await sendMpinOtpApi();
      setOtpSent(true);
      setOtpCountdown(60);
      if (res.data?.mobileMasked) {
        setMaskedMobile(res.data.mobileMasked);
      }
      setPinMessage(res.message || "OTP sent successfully to your registered mobile.");
      setIsPinMessageError(false);
    } catch (err: unknown) {
      console.error("Failed to send MPIN OTP:", err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
      setPinMessage(errorMsg);
      setIsPinMessageError(true);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handlePinSubmit = async () => {
    setPinMessage("");
    setIsPinMessageError(false);

    if (pinMode === "change" && !currentPin) {
      setPinMessage("Please enter your current 4-digit MPIN.");
      setIsPinMessageError(true);
      return;
    }

    if (!newPin || !confirmPin) {
      setPinMessage("Please fill in all MPIN fields.");
      setIsPinMessageError(true);
      return;
    }

    if (!/^\d{4}$/.test(newPin) || !/^\d{4}$/.test(confirmPin)) {
      setPinMessage("MPIN must contain exactly 4 numeric digits.");
      setIsPinMessageError(true);
      return;
    }

    if (newPin !== confirmPin) {
      setPinMessage("New MPIN and confirm MPIN do not match.");
      setIsPinMessageError(true);
      return;
    }

    if (!otp || !/^\d{4}$/.test(otp)) {
      setPinMessage("Please enter the 4-digit OTP sent to your registered mobile.");
      setIsPinMessageError(true);
      return;
    }

    try {
      setIsSubmittingPin(true);
      let res;
      if (pinMode === "setup") {
        res = await setupMpinApi({
          newMpin: newPin,
          confirmMpin: confirmPin,
          otp,
        });
      } else {
        res = await changeMpinApi({
          currentMpin: pinMode === "change" ? currentPin : undefined,
          isReset: pinMode === "reset",
          newMpin: newPin,
          confirmMpin: confirmPin,
          otp,
        });
      }

      setPinMessage(res.message || "Transaction MPIN updated successfully!");
      setIsPinMessageError(false);
      setIsMpinConfigured(true);

      if (refreshUser) {
        await refreshUser();
      }

      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setOtp("");
      setOtpSent(false);

      setTimeout(() => {
        setShowPinForm(false);
        setPinMessage("");
      }, 2500);
    } catch (err: unknown) {
      console.error("Failed to update MPIN:", err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to update MPIN. Please try again.");
      setPinMessage(errorMsg);
      setIsPinMessageError(true);
    } finally {
      setIsSubmittingPin(false);
    }
  };

  return (
    <main className="px-4 pb-6 pt-4 sm:px-6">
      <div className="mx-auto w-full ">

        {/* =========================
            HEADER
        ========================= */}

        <div className="mb-5">
          <button
            type="button"
            onClick={() => navigate("/retailer/profile")}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#7c3aed] transition hover:text-[#6d28d9]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </button>

          <h1 className="text-xl font-bold text-[#172033] sm:text-2xl">
            Security Settings
          </h1>

          <p className="mt-1 text-sm text-[#60708a]">
            Manage your password, transaction PIN and account security
          </p>
        </div>

        {/* =========================
            ACCOUNT SECURITY
        ========================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(23,32,51,0.06)] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf1fc]">
                <ShieldCheck className="h-5 w-5 text-[#7c3aed]" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-[#172033]">
                  Account Security
                </h2>

                <p className="mt-1 text-sm text-[#60708a]">
                  Your account security is protected with multiple
                  verification methods.
                </p>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-sm font-semibold text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Secure
            </div>

          </div>
        </section>

        {/* =========================
            LOGIN PASSWORD
        ========================= */}

        <section className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(23,32,51,0.06)]">

          <div className="p-5 sm:p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf1fc]">
                  <LockKeyhole className="h-4.5 h-[18px] w-[18px] text-[#7c3aed]" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-[#172033]">
                    Login Password
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-[#60708a]">
                    Change your password regularly to keep your
                    retailer account secure.
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Password is protected
                  </div>
                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm((previous) => !previous);
                  setPasswordMessage("");
                }}
                className="w-full rounded-xl border border-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-[#7c3aed] transition hover:bg-[#7c3aed] hover:text-white sm:w-auto"
              >
                {showPasswordForm
                  ? "Cancel"
                  : "Change Password"}
              </button>

            </div>

            {/* PASSWORD FORM */}

            {showPasswordForm && (
              <div className="mt-6 border-t border-slate-100 pt-6">

                <div className="grid gap-5 md:grid-cols-2">

                  <PasswordField
                    label="Current Password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    visible={showCurrentPassword}
                    onToggle={() =>
                      setShowCurrentPassword(
                        (previous) => !previous,
                      )
                    }
                    placeholder="Enter current password"
                  />

                  <div />

                  <PasswordField
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    visible={showNewPassword}
                    onToggle={() =>
                      setShowNewPassword(
                        (previous) => !previous,
                      )
                    }
                    placeholder="Enter new password"
                  />

                  <PasswordField
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    visible={showConfirmPassword}
                    onToggle={() =>
                      setShowConfirmPassword(
                        (previous) => !previous,
                      )
                    }
                    placeholder="Confirm new password"
                  />

                </div>

                {/* PASSWORD REQUIREMENTS */}

                <div className="mt-4 rounded-xl bg-[#f5f7fc] p-4">
                  <p className="text-xs font-semibold text-slate-600">
                    Password requirements
                  </p>

                  <ul className="mt-2 space-y-1 text-xs text-slate-500">
                    <li>
                      • Minimum 6 characters
                    </li>
                    <li>
                      • Avoid using easily guessed passwords
                    </li>
                    <li>
                      • Do not share your password with anyone
                    </li>
                  </ul>
                </div>

                {/* MESSAGE */}

                {passwordMessage && (
                  <div
                    className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
                      passwordMessage.includes(
                        "successfully",
                      )
                        ? "bg-green-50 text-green-700"
                        : "bg-purple-50 text-purple-600"
                    }`}
                  >
                    {passwordMessage}
                  </div>
                )}

                {/* BUTTONS */}

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordMessage("");
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handlePasswordUpdate}
                    className="rounded-xl bg-[#7c3aed] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6d28d9]"
                  >
                    Update Password
                  </button>

                </div>
              </div>
            )}

          </div>
        </section>

        {/* =========================
            TRANSACTION PIN (MPIN)
        ========================= */}

        <section className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(23,32,51,0.06)]">

          <div className="p-5 sm:p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf1fc]">
                  <KeyRound className="h-5 w-5 text-[#7c3aed]" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-[#172033]">
                      Transaction MPIN
                    </h2>
                    {isMpinConfigured ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Enabled & Protected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Not Configured
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm leading-6 text-[#60708a]">
                    Your 4-digit transaction MPIN authorizes wallet settlements, bank transfers, and financial transactions.
                  </p>

                  <div className="mt-2 text-xs font-medium text-slate-500">
                    {isMpinConfigured
                      ? "• MPIN is required for all wallet payouts and settlements"
                      : "• Setup is required to enable wallet settlements and payouts"}
                  </div>
                </div>

              </div>

              {showPinForm ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowPinForm(false);
                    setPinMessage("");
                    setIsPinMessageError(false);
                    setOtpSent(false);
                    setOtp("");
                    setCurrentPin("");
                  }}
                  className="w-full rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                >
                  Cancel
                </button>
              ) : isMpinConfigured ? (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setPinMode("reset");
                      setShowPinForm(true);
                      setPinMessage("");
                      setIsPinMessageError(false);
                      setOtpSent(false);
                      setOtp("");
                      setCurrentPin("");
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#7c3aed]/40 bg-purple-50/70 px-4 py-2.5 text-sm font-semibold text-[#7c3aed] transition hover:bg-purple-100 hover:border-[#7c3aed]"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Reset via Phone OTP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPinMode("change");
                      setShowPinForm(true);
                      setPinMessage("");
                      setIsPinMessageError(false);
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className="rounded-xl bg-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6d28d9]"
                  >
                    Change MPIN
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPinMode("setup");
                    setShowPinForm(true);
                    setPinMessage("");
                    setIsPinMessageError(false);
                    setOtpSent(false);
                    setOtp("");
                  }}
                  className="w-full rounded-xl bg-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6d28d9] sm:w-auto"
                >
                  Set MPIN Now
                </button>
              )}

            </div>

            {/* MPIN FORM */}

            {showPinForm && (
              <div className="mt-6 border-t border-slate-100 pt-6">

                {/* Mode Selector for Configured Users */}
                {isMpinConfigured && (
                  <div className="mb-5 flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPinMode("change");
                        setPinMessage("");
                        setIsPinMessageError(false);
                      }}
                      className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                        pinMode === "change"
                          ? "bg-white text-[#7c3aed] shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Change with Current MPIN
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPinMode("reset");
                        setPinMessage("");
                        setIsPinMessageError(false);
                        setCurrentPin("");
                      }}
                      className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                        pinMode === "reset"
                          ? "bg-white text-[#7c3aed] shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Forgot MPIN? Reset via Phone OTP
                    </button>
                  </div>
                )}

                {/* Informational Banner for Reset Mode */}
                {pinMode === "reset" && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 text-xs text-purple-900">
                    <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[#7c3aed]" />
                    <div className="leading-5">
                      <span className="font-bold">Reset MPIN via Phone OTP: </span>
                      <span>
                        Your current MPIN is <strong>not required</strong>. Request and enter the 4-digit OTP sent to your registered mobile{" "}
                        {maskedMobile ? <span className="font-semibold">({maskedMobile})</span> : null}{" "}
                        to set a new transaction MPIN.
                      </span>
                    </div>
                  </div>
                )}

                <div
                  className={`grid gap-5 ${
                    pinMode === "change" ? "md:grid-cols-3" : "md:grid-cols-2"
                  }`}
                >
                  {pinMode === "change" && (
                    <PinField
                      label="Current MPIN"
                      value={currentPin}
                      onChange={setCurrentPin}
                      visible={showCurrentPin}
                      onToggle={() =>
                        setShowCurrentPin((previous) => !previous)
                      }
                      placeholder="Enter 4-digit PIN"
                    />
                  )}

                  <PinField
                    label={pinMode === "setup" ? "New 4-Digit MPIN" : "New MPIN"}
                    value={newPin}
                    onChange={setNewPin}
                    visible={showNewPin}
                    onToggle={() =>
                      setShowNewPin((previous) => !previous)
                    }
                    placeholder="Enter 4-digit PIN"
                  />

                  <PinField
                    label="Confirm New MPIN"
                    value={confirmPin}
                    onChange={setConfirmPin}
                    visible={showConfirmPin}
                    onToggle={() =>
                      setShowConfirmPin((previous) => !previous)
                    }
                    placeholder="Re-enter 4-digit PIN"
                  />
                </div>

                {/* COMPULSORY OTP VERIFICATION SECTION */}
                <div className="mt-5 rounded-2xl border border-purple-100 bg-[#fbf9fe] p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-[#7c3aed]">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900">
                            Compulsory OTP Verification
                          </h4>
                          <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7c3aed]">
                            Required
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-5 text-slate-600">
                          To {pinMode === "setup" ? "set up" : pinMode === "reset" ? "reset" : "change"} your MPIN, verification via OTP sent to your registered mobile{" "}
                          {maskedMobile ? (
                            <span className="font-semibold text-slate-800">
                              ({maskedMobile})
                            </span>
                          ) : null}{" "}
                          is mandatory.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSendingOtp || otpCountdown > 0}
                      onClick={handleSendOtp}
                      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                        otpCountdown > 0
                          ? "cursor-not-allowed bg-slate-200 text-slate-500"
                          : "bg-[#7c3aed] text-white shadow-sm hover:bg-[#6d28d9] disabled:opacity-50"
                      }`}
                    >
                      {isSendingOtp ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Sending OTP...
                        </>
                      ) : otpCountdown > 0 ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          Resend OTP in {otpCountdown}s
                        </>
                      ) : otpSent ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          Resend OTP
                        </>
                      ) : (
                        <>
                          <Smartphone className="h-4 w-4" />
                          Send OTP to Mobile
                        </>
                      )}
                    </button>
                  </div>

                  {/* OTP Input Field */}
                  {otpSent && (
                    <div className="mt-4 border-t border-purple-100 pt-4">
                      <div className="max-w-xs">
                        <label className="mb-1.5 block text-xs font-semibold text-slate-800">
                          Enter 4-Digit OTP
                        </label>
                        <div className="relative">
                          <input
                            type={showOtp ? "text" : "password"}
                            inputMode="numeric"
                            maxLength={4}
                            value={otp}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                              setOtp(val);
                            }}
                            placeholder="• • • •"
                            autoComplete="one-time-code"
                            className="h-11 w-full rounded-xl border border-purple-200 bg-white px-4 pr-11 text-center text-base tracking-[0.4em] font-semibold text-slate-800 outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOtp((prev) => !prev)}
                            aria-label={showOtp ? "Hide OTP" : "Show OTP"}
                            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          >
                            {showOtp ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Enter the 4-digit OTP received on your phone.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* PIN SECURITY TIPS */}
                <div className="mt-4 rounded-xl bg-[#f5f7fc] p-4">
                  <p className="text-xs font-semibold text-slate-700">
                    MPIN Security Guidelines
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-500">
                    <li>• MPIN must contain exactly 4 numeric digits.</li>
                    <li>• Do not use sequential numbers (e.g. 1234) or repeated numbers (e.g. 1111).</li>
                    <li>• Never disclose your MPIN or SMS OTP to anyone, including HappyPay support.</li>
                  </ul>
                </div>

                {/* FEEDBACK MESSAGE */}
                {pinMessage && (
                  <div
                    className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                      isPinMessageError
                        ? "border border-rose-200 bg-rose-50 text-rose-700"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {isPinMessageError ? (
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    )}
                    <span>{pinMessage}</span>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinForm(false);
                      setPinMessage("");
                      setIsPinMessageError(false);
                      setOtpSent(false);
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      isSubmittingPin ||
                      !otp ||
                      otp.length < 4 ||
                      newPin.length < 4 ||
                      confirmPin.length < 4 ||
                      (pinMode === "change" && (!currentPin || currentPin.length < 4))
                    }
                    onClick={handlePinSubmit}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmittingPin ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Saving MPIN...
                      </>
                    ) : pinMode === "setup" ? (
                      "Verify OTP & Set MPIN"
                    ) : pinMode === "reset" ? (
                      "Verify OTP & Reset MPIN"
                    ) : (
                      "Verify OTP & Update MPIN"
                    )}
                  </button>
                </div>

              </div>
            )}

          </div>
        </section>

        {/* =========================
            TWO FACTOR AUTHENTICATION
        ========================= */}

        <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(23,32,51,0.06)] sm:p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf1fc]">
              <Smartphone className="h-4.5 h-[18px] w-[18px] text-[#7c3aed]" />
            </div>

            <div className="min-w-0 flex-1">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h2 className="text-sm font-semibold text-[#172033]">
                    Two-Factor Authentication
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-[#60708a]">
                    Add an extra layer of protection to your
                    retailer account.
                  </p>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Enabled
                </span>

              </div>

              <div className="mt-5 rounded-xl border border-[#dbe3f7] bg-[#f5f7fc] p-4">

                <div className="flex items-start gap-3">

                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#7c3aed]" />

                  <div>
                    <p className="text-sm font-semibold text-[#172033]">
                      Daily verification enabled
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#60708a]">
                      Your account uses additional authentication
                      before accessing sensitive financial services.
                    </p>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </section>

        {/* =========================
            SECURITY TIPS
        ========================= */}

        <section className="mt-5 rounded-2xl border border-[#dbe3f7] bg-[#f5f7fc] p-5 sm:p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
              <ShieldCheck className="h-5 w-5 text-[#7c3aed]" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#172033]">
                Security Tips
              </h3>

              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#60708a]">
                <li>
                  • Never share your login password or transaction PIN.
                </li>

                <li>
                  • Always log out when using a shared computer.
                </li>

                <li>
                  • Make sure your registered mobile number is active.
                </li>

                <li>
                  • Contact support immediately if you notice suspicious activity.
                </li>
              </ul>
            </div>

          </div>

        </section>

      </div>
    </main>
  );
};

export default SecuritySettings;



