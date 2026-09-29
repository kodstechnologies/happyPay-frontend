import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

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
     PIN STATE
  ========================= */

  const [showPinForm, setShowPinForm] = useState(false);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [pinMessage, setPinMessage] = useState("");

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
     PIN UPDATE
  ========================= */

  const handlePinUpdate = () => {
    setPinMessage("");

    if (!currentPin || !newPin || !confirmPin) {
      setPinMessage("Please fill in all PIN fields.");
      return;
    }

    if (
      !/^\d{4}$/.test(newPin) ||
      !/^\d{4}$/.test(confirmPin)
    ) {
      setPinMessage(
        "Transaction PIN must contain exactly 4 digits.",
      );
      return;
    }

    if (newPin !== confirmPin) {
      setPinMessage("New PIN and confirm PIN do not match.");
      return;
    }

    setPinMessage("Transaction PIN updated successfully.");

    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");

    setTimeout(() => {
      setShowPinForm(false);
      setPinMessage("");
    }, 1800);
  };

  return (
    <main className="px-4 pb-6 pt-4 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">

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
            TRANSACTION PIN
        ========================= */}

        <section className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(23,32,51,0.06)]">

          <div className="p-5 sm:p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf1fc]">
                  <KeyRound className="h-4.5 h-[18px] w-[18px] text-[#7c3aed]" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-[#172033]">
                    Transaction PIN
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-[#60708a]">
                    Your transaction PIN is required to authorize
                    sensitive financial operations.
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Transaction PIN is enabled
                  </div>
                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPinForm((previous) => !previous);
                  setPinMessage("");
                }}
                className="w-full rounded-xl border border-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-[#7c3aed] transition hover:bg-[#7c3aed] hover:text-white sm:w-auto"
              >
                {showPinForm ? "Cancel" : "Change PIN"}
              </button>

            </div>

            {/* PIN FORM */}

            {showPinForm && (
              <div className="mt-6 border-t border-slate-100 pt-6">

                <div className="grid gap-5 md:grid-cols-3">

                  <PinField
                    label="Current PIN"
                    value={currentPin}
                    onChange={setCurrentPin}
                    visible={showCurrentPin}
                    onToggle={() =>
                      setShowCurrentPin(
                        (previous) => !previous,
                      )
                    }
                    placeholder="4-digit PIN"
                  />

                  <PinField
                    label="New PIN"
                    value={newPin}
                    onChange={setNewPin}
                    visible={showNewPin}
                    onToggle={() =>
                      setShowNewPin(
                        (previous) => !previous,
                      )
                    }
                    placeholder="4-digit PIN"
                  />

                  <PinField
                    label="Confirm New PIN"
                    value={confirmPin}
                    onChange={setConfirmPin}
                    visible={showConfirmPin}
                    onToggle={() =>
                      setShowConfirmPin(
                        (previous) => !previous,
                      )
                    }
                    placeholder="4-digit PIN"
                  />

                </div>

                {/* PIN REQUIREMENTS */}

                <div className="mt-4 rounded-xl bg-[#f5f7fc] p-4">

                  <p className="text-xs font-semibold text-slate-600">
                    Transaction PIN security
                  </p>

                  <ul className="mt-2 space-y-1 text-xs text-slate-500">
                    <li>
                      • PIN must contain exactly 4 digits
                    </li>
                    <li>
                      • Do not share your PIN with anyone
                    </li>
                    <li>
                      • Avoid using predictable PINs
                    </li>
                  </ul>

                </div>

                {/* MESSAGE */}

                {pinMessage && (
                  <div
                    className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
                      pinMessage.includes(
                        "successfully",
                      )
                        ? "bg-green-50 text-green-700"
                        : "bg-purple-50 text-purple-600"
                    }`}
                  >
                    {pinMessage}
                  </div>
                )}

                {/* BUTTONS */}

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={() => {
                      setShowPinForm(false);
                      setPinMessage("");
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handlePinUpdate}
                    className="rounded-xl bg-[#7c3aed] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6d28d9]"
                  >
                    Update PIN
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



