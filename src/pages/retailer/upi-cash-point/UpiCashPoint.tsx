import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Loader2,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  SmartphoneNfc,
} from "lucide-react";
import { showToast } from "../../../utils/toast";
import { getWalletBalance, setWalletBalance } from "../../../utils/wallet";
import { getGeolocationCoordinates } from "../../../utils/geolocation";
import {
  initiateUpiCashpointPaymentApi,
  merchantRegisterApi,
  merchantRegistrationSendOtpApi,
  merchantRegistrationVerifyApi,
  merchantEkycApi,
} from "../../../apis/upiCashpoint.apis";
import { useAuth } from "../../../context/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UpiCashPointProps {
  onBack?: () => void;
}

/**
 * Screens within the UPI Cashpoint flow — in correct order:
 *   REGISTER → SEND_OTP → VERIFY_OTP → EKYC → PAYMENT → RECEIPT
 */
type Screen =
  | "REGISTER"    // Step 1 – trigger merchant registration
  | "SEND_OTP"    // Step 2 – send OTP to the merchant's mobile
  | "VERIFY_OTP"  // Step 3 – enter & verify OTP
  | "EKYC"        // Step 4 – complete biometric eKYC
  | "PAYMENT"     // Step 5 – amount entry + QR generation
  | "RECEIPT";    // Step 6 – success receipt

const MERCHANT_ID_KEY = "upiCashpoint_merchantId";

// ─── Step progress config ─────────────────────────────────────────────────────

const ONBOARDING_STEPS: { key: Screen; label: string }[] = [
  { key: "REGISTER", label: "Register" },
  { key: "SEND_OTP", label: "Send OTP" },
  { key: "VERIFY_OTP", label: "Verify OTP" },
  { key: "EKYC", label: "eKYC" },
];

const ONBOARDING_SCREEN_SET = new Set<Screen>(
  ONBOARDING_STEPS.map((s) => s.key)
);

// ─── Component ───────────────────────────────────────────────────────────────

const UpiCashPoint: React.FC<UpiCashPointProps> = ({ onBack }) => {
  const { user } = useAuth();

  // Prefer merchantId from the server (populated after registration),
  // fall back to localStorage for the current session until the next /me refresh.
  const serverMerchantId = user?.UpiEkyc?.merchantId ?? null;
  const resolvedMerchantId = serverMerchantId || localStorage.getItem(MERCHANT_ID_KEY) || "";

  const [merchantId, setMerchantId] = useState<string>(resolvedMerchantId);

  const [screen, setScreen] = useState<Screen>(
    resolvedMerchantId ? "PAYMENT" : "REGISTER",
  );

  // Registration
  const [registering, setRegistering] = useState(false);

  // OTP
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // EKYC
  const [doingEkyc, setDoingEkyc] = useState(false);
  const [pidData, setPidData] = useState("");

  // Payment / QR
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrString, setQrString] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [rrn, setRrn] = useState("");
  const [timeLeft, setTimeLeft] = useState(180);

  // Receipt
  const [transactionDate, setTransactionDate] = useState<Date | null>(null);

  const isValidAmount = Number(amount) > 0;

  // ── QR countdown ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!showQr || timeLeft <= 0 || screen === "RECEIPT") return;

    const timer = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { window.clearInterval(timer); return 0; }
        return t - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [showQr, timeLeft, screen]);

  const formattedTime = `${Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0")}:${(timeLeft % 60).toString().padStart(2, "0")}`;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const saveMerchantId = (id: string) => {
    setMerchantId(id);
    // Store in localStorage as a temporary session cache until the next
    // /me call refreshes the user profile from the server.
    localStorage.setItem(MERCHANT_ID_KEY, id);
  };

  // Clean up stale localStorage entry once the server value is confirmed.
  if (serverMerchantId) {
    localStorage.removeItem(MERCHANT_ID_KEY);
  }

  const resetAll = () => {
    setAmount("");
    setShowQr(false);
    setQrString("");
    setTransactionId("");
    setRrn("");
    setTimeLeft(180);
    setOtp("");
    setPidData("");
    setScreen(merchantId ? "PAYMENT" : "REGISTER");
  };

  // ── Step 1 – Merchant Registration ───────────────────────────────────────

  const handleRegister = async () => {
    const userId = user?.id || user?._id;
    if (!userId) {
      showToast("error", "User session not found. Please log in again.");
      return;
    }

    setRegistering(true);
    try {
      const res = await merchantRegisterApi({ userId });
      const id = String(
        res.data?.merchantId ??
        (res.data as Record<string, unknown>)?.merchant_id ??
        "",
      );
      if (!id) throw new Error(res.message || "Merchant ID not returned");
      saveMerchantId(id);
      showToast("success", res.message || "Merchant registered successfully!");
      // ✅ Next step: Send OTP
      setScreen("SEND_OTP");
    } catch (err) {
      showToast("error", err, "Merchant registration failed. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  // ── Step 2 – Send OTP ────────────────────────────────────────────────────

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await merchantRegistrationSendOtpApi({ merchantId });
      showToast("success", res.message || "OTP sent successfully!");
      // ✅ Next step: Verify OTP
      setScreen("VERIFY_OTP");
    } catch (err) {
      showToast("error", err, "Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Step 3 – Verify OTP ──────────────────────────────────────────────────

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      showToast("error", "Please enter the OTP.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await merchantRegistrationVerifyApi({ merchantId, otp });
      showToast("success", res.message || "OTP verified successfully!");
      // ✅ Next step: eKYC
      setScreen("EKYC");
    } catch (err) {
      showToast("error", err, "OTP verification failed. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ── Step 4 – Merchant eKYC ────────────────────────────────────────────────

  const handleEkyc = async () => {
    if (!pidData.trim()) {
      showToast("error", "Please provide biometric data (pidData).");
      return;
    }

    setDoingEkyc(true);
    try {
      const res = await merchantEkycApi({ merchantId, pidData });
      showToast("success", res.message || "eKYC completed successfully!");
      // ✅ Next step: Payment
      setScreen("PAYMENT");
    } catch (err) {
      showToast("error", err, "eKYC failed. Please try again.");
    } finally {
      setDoingEkyc(false);
    }
  };

  // ── Step 5 – Generate QR ─────────────────────────────────────────────────

  const handleGenerateQr = async () => {
    if (!isValidAmount) {
      showToast("error", "Please enter a valid amount greater than zero.");
      return;
    }

    setIsLoading(true);
    try {
      const coords = await getGeolocationCoordinates();

      const response = await initiateUpiCashpointPaymentApi({
        amount: Number(amount),
        latitude: coords.latitude,
        longitude: coords.longitude,
        merchantLoginId: merchantId,
      });

      const d = (response.data ?? {}) as Record<string, unknown>;
      const txnId = String(d.txnid ?? d.orderid ?? d.txnId ?? `TXN${Date.now()}`);
      const returnedRrn = String(d.rrn ?? d.bankRefNum ?? "");
      const rawQr = String(d.qrString ?? d.qrCode ?? d.upiUri ?? d.intentUrl ?? "");
      const resolvedQr =
        rawQr.trim().length > 0
          ? rawQr
          : `upi://pay?pa=happypay@yesbank&pn=HappyPayCashpoint&am=${Number(amount).toFixed(2)}&cu=INR&tr=${txnId}&tn=UPICashpoint`;

      setTransactionId(txnId);
      setRrn(returnedRrn);
      setQrString(resolvedQr);
      setTimeLeft(180);
      setShowQr(true);

      showToast("success", response.message || "QR generated successfully!");
    } catch (err) {
      showToast("error", err, "Failed to generate QR. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReceived = () => {
    setTransactionDate(new Date());
    try {
      setWalletBalance(getWalletBalance() + Number(amount));
    } catch { /* ignore wallet sync failures */ }
    showToast("success", "Payment confirmed! Disburse cash to the customer.");
    setScreen("RECEIPT");
  };

  // ── Step progress bar (shown only during onboarding steps) ───────────────

  const currentStepIndex = ONBOARDING_STEPS.findIndex((s) => s.key === screen);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
            SERVICES
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            UPI Cash Point
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Accept UPI payments and provide cash to customers securely.
          </p>
        </div>
      </div>

      {/* ── Onboarding step progress bar ── */}
      {ONBOARDING_SCREEN_SET.has(screen) && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Setup Progress
          </p>
          <div className="flex items-center gap-0">
            {ONBOARDING_STEPS.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <React.Fragment key={step.key}>
                  {/* Step bubble */}
                  <div className="flex flex-col items-center gap-1.5 min-w-0">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${isDone
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                            ? "bg-[#7c3aed] text-white ring-4 ring-[#7c3aed]/20"
                            : "bg-slate-100 text-slate-400"
                        }`}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] font-semibold leading-none whitespace-nowrap ${isDone
                          ? "text-emerald-600"
                          : isCurrent
                            ? "text-[#7c3aed]"
                            : "text-slate-400"
                        }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line (between steps) */}
                  {idx < ONBOARDING_STEPS.length - 1 && (
                    <div
                      className={`mx-1 mb-5 h-0.5 flex-1 rounded-full transition-all ${idx < currentStepIndex ? "bg-emerald-400" : "bg-slate-200"
                        }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main card ── */}
      <section className="hp-card rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-10">
        <div className="mx-auto max-w-md">

          {/* ══════════════════════════════════════════════════════════
              SCREEN: REGISTER  (Step 1)
          ══════════════════════════════════════════════════════════ */}
          {screen === "REGISTER" && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3e8ff]">
                <SmartphoneNfc className="h-8 w-8 text-[#7c3aed]" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Register as UPI Merchant
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  One-time registration to activate your UPI Cash Point
                  service. Your KYC details are used automatically.
                </p>
              </div>

              {/* Flow overview */}
              <div className="rounded-xl border border-[#e9d5ff] bg-[#faf5ff] p-4 text-left space-y-2">
                {[
                  "Register your merchant account",
                  "Verify via OTP sent to your mobile",
                  "Complete biometric eKYC",
                  "Start accepting UPI payments",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-600">{step}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-[#e9d5ff] bg-[#faf5ff] p-4 text-left">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7c3aed]" />
                  <p className="text-xs leading-5 text-slate-600">
                    Your registered PAN, Aadhaar, bank account, and shop
                    details are securely sent to the payment network for
                    merchant onboarding.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRegister}
                disabled={registering}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#7c3aed] text-base font-bold text-white shadow-md transition hover:bg-[#6d28d9] hover:shadow-lg disabled:opacity-50"
              >
                {registering ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Registering…</>
                ) : (
                  <><SmartphoneNfc className="h-5 w-5" /> Register Merchant</>
                )}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SCREEN: SEND OTP  (Step 2)
          ══════════════════════════════════════════════════════════ */}
          {screen === "SEND_OTP" && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3e8ff]">
                <SmartphoneNfc className="h-8 w-8 text-[#7c3aed]" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Verify Your Merchant Account
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  An OTP will be sent to your registered mobile number to
                  verify your merchant account.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs text-slate-600">
                <span className="font-semibold">Merchant ID:</span>{" "}
                <span className="font-mono">{merchantId}</span>
              </div>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#7c3aed] text-base font-bold text-white shadow-md transition hover:bg-[#6d28d9] disabled:opacity-50"
              >
                {sendingOtp ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Sending OTP…</>
                ) : (
                  "Send OTP"
                )}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SCREEN: VERIFY OTP  (Step 3)
          ══════════════════════════════════════════════════════════ */}
          {screen === "VERIFY_OTP" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900">
                  Enter OTP
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Enter the OTP sent to your registered mobile number.
                </p>
              </div>

              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter OTP"
                maxLength={6}
                className="h-[54px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10"
              />

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otp.length < 4}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#7c3aed] text-base font-bold text-white shadow-md transition hover:bg-[#6d28d9] disabled:opacity-50"
              >
                {verifyingOtp ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Verifying…</>
                ) : (
                  <><CheckCircle2 className="h-5 w-5" /> Verify OTP</>
                )}
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="w-full text-center text-sm font-semibold text-[#7c3aed] hover:underline disabled:opacity-50"
              >
                {sendingOtp ? "Resending…" : "Resend OTP"}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SCREEN: EKYC  (Step 4)
          ══════════════════════════════════════════════════════════ */}
          {screen === "EKYC" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3e8ff]">
                  <ShieldCheck className="h-8 w-8 text-[#7c3aed]" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Complete Biometric eKYC
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Provide your biometric data to complete the merchant
                  verification process.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs text-slate-600">
                <span className="font-semibold">Merchant ID:</span>{" "}
                <span className="font-mono">{merchantId}</span>
              </div>

              <div>
                <label htmlFor="pidData" className="text-sm font-bold text-slate-700">
                  Biometric Data (pidData)
                </label>
                <textarea
                  id="pidData"
                  value={pidData}
                  onChange={(e) => setPidData(e.target.value)}
                  placeholder="Paste the XML pidData from your biometric device"
                  rows={6}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10"
                />
              </div>

              <button
                type="button"
                onClick={handleEkyc}
                disabled={doingEkyc || !pidData.trim()}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#7c3aed] text-base font-bold text-white shadow-md transition hover:bg-[#6d28d9] disabled:opacity-50"
              >
                {doingEkyc ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Processing eKYC…</>
                ) : (
                  <><ShieldCheck className="h-5 w-5" /> Complete eKYC</>
                )}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SCREEN: PAYMENT  (Step 5 — amount entry + QR)
          ══════════════════════════════════════════════════════════ */}
          {screen === "PAYMENT" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3e8ff]">
                  <QrCode className="h-5 w-5 text-[#7c3aed]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    UPI Cash Transaction
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Enter amount and generate an instant payment QR code.
                  </p>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label htmlFor="upi-amount" className="text-sm font-bold text-slate-700">
                  Cash Amount
                </label>
                <div className="mt-2 flex h-14 items-center rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 transition-all focus-within:border-[#7c3aed] focus-within:bg-white hover:border-slate-300">
                  <span className="mr-3 text-lg font-bold text-slate-400">₹</span>
                  <input
                    id="upi-amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      if (/^\d*\.?\d{0,2}$/.test(e.target.value)) setAmount(e.target.value);
                    }}
                    disabled={showQr || isLoading}
                    placeholder="Enter cash amount"
                    className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Generate QR button */}
              {!showQr && (
                <button
                  type="button"
                  onClick={handleGenerateQr}
                  disabled={!isValidAmount || isLoading}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#7c3aed] text-lg font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#6d28d9] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {isLoading ? (
                    <><Loader2 className="h-6 w-6 animate-spin" /> Connecting to Bank…</>
                  ) : (
                    <><QrCode className="h-6 w-6" /> Generate Payment QR</>
                  )}
                </button>
              )}

              {/* QR display */}
              {showQr && (
                <div className="rounded-2xl border border-slate-200 bg-[#f7f8fc] p-5">
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900">Scan to Pay</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Customer can scan using any UPI app (GPay, PhonePe, Paytm, etc.)
                    </p>

                    {/* QR image */}
                    <div
                      className={`mx-auto mt-5 flex h-52 w-52 items-center justify-center rounded-2xl border-4 border-white bg-white p-2 shadow-sm transition-opacity ${timeLeft <= 0 ? "opacity-30 grayscale" : "opacity-100"
                        }`}
                    >
                      {qrString ? (
                        <img
                          src={
                            qrString.startsWith("http") || qrString.startsWith("data:")
                              ? qrString
                              : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${encodeURIComponent(qrString)}`
                          }
                          alt="UPI QR Code"
                          className="h-44 w-44 rounded-lg object-contain"
                        />
                      ) : (
                        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-white">
                          <QrCode className="h-36 w-36 text-slate-900" />
                          <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-white shadow-sm">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#7c3aed]">
                              <span className="text-[10px] font-black text-white">UPI</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Amount to Collect
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#7c3aed]">₹{amount}</p>

                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-xs">
                      <span
                        className={`h-2 w-2 rounded-full ${timeLeft > 0 ? "animate-pulse bg-emerald-500" : "bg-red-500"
                          }`}
                      />
                      {timeLeft > 0 ? `QR expires in ${formattedTime}` : "QR code expired"}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    {timeLeft > 0 && (
                      <button
                        type="button"
                        onClick={handleConfirmReceived}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        <Check className="h-4 w-4" />
                        Payment Received
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => { setShowQr(false); setTimeLeft(180); }}
                      className="flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    {timeLeft <= 0 && (
                      <button
                        type="button"
                        onClick={handleGenerateQr}
                        disabled={isLoading}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#7c3aed] text-sm font-bold text-white shadow-sm transition hover:bg-[#6d28d9] disabled:opacity-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Generate New QR
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SCREEN: RECEIPT  (Step 6)
          ══════════════════════════════════════════════════════════ */}
          {screen === "RECEIPT" && (
            <div className="animate-in fade-in zoom-in-95 space-y-5 duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                    Payment Received
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">UPI Cash Receipt</h2>
                </div>
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <Row label="Transaction ID" value={transactionId || "-"} />
                <Row
                  label="Date"
                  value={
                    transactionDate?.toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }) ?? "-"
                  }
                />
                <Row label="Payment Via" value="UPI QR / Cashpoint" />
                {rrn && <Row label="Bank Ref. (RRN)" value={rrn} />}
                <div className="flex items-center justify-between pt-3">
                  <span className="text-sm font-bold text-slate-700">Amount</span>
                  <span className="text-xl font-black text-[#7c3aed]">₹{amount}</span>
                </div>
              </div>

              <div className="flex items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-bold text-emerald-600">
                  Disburse Cash: ₹{amount}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#7c3aed] text-sm font-bold text-white transition hover:bg-[#6d28d9]"
                >
                  New Transaction
                </button>
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
};

// ── Small receipt row helper ──────────────────────────────────────────────────
const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between border-b border-slate-100 py-2 text-xs">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-900">{value}</span>
  </div>
);

export default UpiCashPoint;
