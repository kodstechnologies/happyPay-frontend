/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { getFCMToken } from "../../../config/firebase";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
  LockKeyhole,
  Check,
} from "lucide-react";


const RetailerLogin = () => {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [error, setError] = useState("");


  const handleMobileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 10);

    setMobile(value);
    setError("");
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
  };

  // ============================================================
  // SEND OTP
  // ============================================================

  const handleSendOtp = () => {
    setError("");

    if (mobile.length !== 10) {
      setError(
        "Please enter a valid 10-digit mobile number.",
      );
      return;
    }

    /*
     * ==========================================================
     * REGISTERED MOBILE CHECK
     * ==========================================================
     *
     * Registration stores the completed retailer mobile as:
     *
     * registeredRetailerMobile
     *
     * Only that number is allowed to continue.
     */

    // Removed registered mobile check to allow any user

    // Correct registered number.
    setOtpSent(true);
  };

  // ============================================================
  // OTP CHANGE
  // ============================================================

  const handleOtpChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 4);

    setOtp(value);
    setError("");

    if (value.length === 4) {
      if (value === "1234") {
        setOtpVerified(true);
      } else {
        setOtpVerified(false);
        setError("Invalid OTP. Please enter the correct OTP.");
      }
    } else {
      setOtpVerified(false);
    }
  };

  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin = async () => {
    setError("");

    // Removed registered mobile check to allow any user

    if (otp.length !== 4) {
      setError("Please enter the 4-digit OTP.");
      return;
    }

    try {
      // 1. Get the FCM Token
      let fcmToken = null;
      try {
        fcmToken = await getFCMToken();
        if (fcmToken) {
          console.log("FCM Token retrieved:", fcmToken);
          localStorage.setItem("fcmToken", fcmToken);
        }
      } catch (e) {
        console.error("Failed to get FCM token", e);
      }

      // Mocking the backend call as requested
      setTimeout(() => {
        const dummyResponse = {
          success: true,
          data: {
            accessToken: "dummy_retailer_token_12345",
          }
        };

        if (dummyResponse.success && dummyResponse.data) {
          localStorage.setItem("token", dummyResponse.data.accessToken);
          localStorage.setItem("retailerMobile", mobile);
          localStorage.setItem("role", "retailer");
          
          navigate("/retailer", { replace: true });
        } else {
          setError("Login failed");
        }
      }, 500);
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    }
  };

  // ============================================================
  // CHANGE MOBILE
  // ============================================================

  const handleChangeMobile = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[1180px] items-center justify-center">
        <div className="w-full overflow-hidden rounded-[24px] border border-white bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
          <div className="grid h-[560px] lg:grid-cols-[0.9fr_1.1fr]">
            {/* LEFT — PREMIUM LOGIN */}
            <section className="flex flex-col items-center justify-center px-6 py-6 sm:px-10 lg:px-14 xl:px-20 overflow-y-auto custom-scrollbar">
              <div className="w-full max-w-[430px] my-auto">
                {/* BRAND */}
                <div className="mb-10 flex items-center gap-3">
                  <img src="/happy-favicon.jpeg" alt="Happy Pay Logo" className="h-12 w-auto object-contain" />
                </div>

                {/* HEADER */}
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#dce4f8] bg-[#f3f6ff] px-3 py-1.5">
                    {otpSent ? (
                      <ShieldCheck className="h-4 w-4 text-[#7c3aed]" />
                    ) : (
                      <Smartphone className="h-4 w-4 text-[#7c3aed]" />
                    )}

                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7c3aed]">
                      {otpSent ? "Mobile Verification" : "Secure Retailer Access"}
                    </span>
                  </div>

                  <h1 className="mt-5 text-[34px] font-bold leading-tight tracking-[-0.035em] text-[#172033] sm:text-[38px]">
                    {otpSent ? "Verify your mobile" : "Welcome back"}
                  </h1>

                  <p className="mt-3 max-w-[410px] text-[14px] leading-6 text-[#737c8c]">
                    {otpSent
                      ? `Enter the 4-digit verification code sent to +91 ${mobile}.`
                      : "Sign in securely with the mobile number registered to your HappyPay retailer account."}
                  </p>
                </div>

                {/* STEP INDICATOR */}
                <div className="mt-8 flex items-center gap-2">
                  <div className="h-1.5 w-14 rounded-full bg-[#7c3aed]" />
                  <div
                    className={`h-1.5 w-14 rounded-full transition-all duration-300 ${otpSent ? "bg-[#7c3aed]" : "bg-[#dce1e9]"
                      }`}
                  />
                  <span className="ml-1 text-[11px] font-medium text-[#8992a3]">
                    Step {otpSent ? "2" : "1"} of 2
                  </span>
                </div>

                {/* ERROR */}
                {error && (
                  <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#f0cccc] bg-[#fff5f5] px-4 py-3.5">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#c84f4f]" />
                    <p className="text-[13px] leading-5 text-[#c84f4f]">
                      {error}
                    </p>
                  </div>
                )}

                {/* MOBILE */}
                {!otpSent && (
                  <div className={error ? "mt-5" : "mt-8"}>
                  <label
                    htmlFor="retailer-login-mobile"
                    className="mb-2.5 block text-[13px] font-semibold text-[#172033]"
                  >
                    Mobile Number
                  </label>

                  <div className="relative">
                    <Smartphone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]" />

                    <span className="pointer-events-none absolute left-[52px] top-1/2 -translate-y-1/2">
                      <span className="border-r border-[#d9dde5] pr-3 text-[14px] font-semibold text-[#687286]">
                        +91
                      </span>
                    </span>

                    <input
                      id="retailer-login-mobile"
                      type="tel"
                      value={mobile}
                      onChange={handleMobileChange}
                      placeholder="Enter registered mobile number"
                      maxLength={10}
                      inputMode="numeric"
                      autoComplete="tel"
                      disabled={otpSent}
                      className="h-[58px] w-full rounded-2xl border border-[#dfe3e9] bg-[#fafbfd] pl-[105px] pr-4 text-[15px] font-medium text-[#172033] outline-none transition placeholder:text-[#a1a8b5] hover:border-[#c5cad4] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 disabled:bg-[#f1f3f6]"
                    />
                  </div>
                </div>
                )}

                {/* OTP */}
                {otpSent && (
                  <div className="mt-5">
                    <div className="mb-2.5 flex items-center justify-between">
                      <label
                        htmlFor="retailer-login-otp"
                        className="text-[13px] font-semibold text-[#172033]"
                      >
                        Verification Code
                      </label>

                      <button
                        type="button"
                        onClick={handleChangeMobile}
                        className="text-[12px] font-semibold text-[#7c3aed] hover:underline"
                      >
                        Change number
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        id="retailer-login-otp"
                        type="text"
                        value={otp}
                        onChange={handleOtpChange}
                        placeholder="Enter 4-digit OTP"
                        maxLength={4}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        disabled={otpVerified}
                        className={`h-[58px] w-full rounded-2xl border bg-[#fafbfd] px-4 text-center text-[19px] font-bold tracking-[0.5em] text-[#172033] outline-none transition placeholder:text-[11px] placeholder:tracking-normal focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 ${otpVerified
                          ? "border-[#b9e8d4] bg-[#f4fcf8]"
                          : "border-[#dfe3e9]"
                          }`}
                      />
                      {otpVerified && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-[#08a77e]">
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[11px] text-[#9299a7]">
                        Didn't receive the code?
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setOtp("");
                          setError("");
                          setOtpVerified(false);
                        }}
                        className="text-[11px] font-semibold text-[#7c3aed] hover:underline"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )}

                {/* PRIMARY ACTION */}
                <button
                  type="button"
                  onClick={otpSent ? handleLogin : handleSendOtp}
                  className={`mt-7 flex h-[58px] w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-bold text-white shadow-[0_12px_26px_rgba(49,91,209,0.22)] transition active:scale-[0.99] ${otpVerified
                    ? "bg-[#08ae82] hover:bg-[#079b74]"
                    : "bg-[#7c3aed] hover:bg-[#294fb8]"
                    }`}
                >
                  {otpVerified
                    ? "Login to Retailer Portal"
                    : otpSent
                      ? "Verify & Continue"
                      : "Continue with OTP"}

                  {otpVerified ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </button>

                {/* REGISTER */}
                <div className="mt-7 text-center">
                  <p className="text-[12px] text-[#737c8c]">
                    Don't have a HappyPay retailer account?
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/retailer/register")}
                    className="mt-1.5 text-[13px] font-bold text-[#7c3aed] hover:underline"
                  >
                    Register as a Retailer
                  </button>
                </div>

                {/* SECURITY */}
                <div className="mt-8 border-t border-[#edf0f4] pt-5">
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-[#8992a3]">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#7c3aed]" />
                      Secure OTP authentication
                    </span>

                    <span className="text-[#d2d5db]">•</span>

                    <span className="flex items-center gap-1.5">
                      <LockKeyhole className="h-3.5 w-3.5 text-[#7c3aed]" />
                      Protected access
                    </span>
                  </div>

                  <p className="mt-3 text-center text-[10px] text-[#a1a8b5]">
                    Demo OTP: 1234
                  </p>
                </div>
              </div>
            </section>

            {/* RIGHT — PREMIUM BRAND PANEL */}
            <section className="relative hidden w-full items-center justify-center bg-white lg:flex">
              <img src="/happy-favicon.jpeg" alt="Happy Pay Logo" className="w-[80%] max-w-sm object-contain" />
            </section>
          </div>
        </div>

        <p className="fixed bottom-3 left-0 right-0 text-center text-[10px] text-[#8992a3]">
          © {new Date().getFullYear()} HappyPay · Retailer Portal
        </p>
      </div>
    </div>
  );
};

export default RetailerLogin;
