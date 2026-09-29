import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Smartphone,
  ArrowRight,
  LockKeyhole,
  Check,
  Fingerprint,
  Send,
  WalletCards,
  CircleDollarSign,
  TrendingUp,
  Bell,
  Store,
  Activity,
  ChevronRight,
} from "lucide-react";

const RetailerLogin = () => {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");

  /* ============================================================
     SEND OTP
  ============================================================ */

  const handleSendOtp = () => {
    setError("");

    if (mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setOtpSent(true);
  };

  /* ============================================================
     VERIFY OTP
  ============================================================ */

  const handleLogin = () => {
    setError("");

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    // Dummy OTP
    if (otp !== "123456") {
      setError("Invalid OTP. Please try again.");
      return;
    }

    localStorage.setItem("token", "dummy-retailer-token");
    localStorage.setItem("role", "retailer");

    navigate("/retailer/kyc-pending", {
      replace: true,
    });
  };

  const handleChangeNumber = () => {
    setOtpSent(false);
    setOtp("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#D8D6D1] p-3 sm:p-4 lg:p-5">
      {/* ============================================================
          MAIN CONTAINER
      ============================================================ */}

      <div
        className="
          mx-auto
          flex
          min-h-[calc(100vh-24px)]
          max-w-[1480px]
          overflow-hidden
          rounded-[28px]
          border
          border-white/80
          bg-[#F7F6F4]
          shadow-[0_30px_80px_rgba(23,37,54,0.16)]
          lg:h-[calc(100vh-40px)]
          lg:min-h-0
        "
      >
        {/* ========================================================
            LEFT — LOGIN
        ======================================================== */}

        <section
          className="
            flex
            w-full
            items-center
            justify-center
            bg-[#F7F6F4]
            px-6
            py-8
            sm:px-10
            lg:w-[43%]
            lg:px-12
            xl:px-16
          "
        >
          <div className="w-full max-w-[390px]">

            {/* ==================================================
                BRAND
            ================================================== */}

            <div className="mb-8 flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#172536]
                  shadow-[0_8px_18px_rgba(23,37,54,0.18)]
                "
              >
                <span className="text-lg font-bold text-white">
                  H
                </span>
              </div>

              <div>
                <p className="text-[16px] font-bold leading-none text-[#172536]">
                  HappyPay
                </p>

                <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#777A81]">
                  Retailer Portal
                </p>
              </div>
            </div>

            {/* ==================================================
                LOGIN HEADER
            ================================================== */}

            <div className="mb-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D9D5EF] bg-[#D9D5EF]/60 px-3 py-1.5">
                {otpSent ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-[#4A3E94]" />
                ) : (
                  <Store className="h-3.5 w-3.5 text-[#4A3E94]" />
                )}

                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#4A3E94]">
                  {otpSent
                    ? "Mobile Verification"
                    : "Retailer Access"}
                </span>
              </div>

              <h1 className="text-[31px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#172536]">
                {otpSent
                  ? "Verify your mobile"
                  : "Welcome back"}
              </h1>

              <p className="mt-3 max-w-[350px] text-[12px] leading-5 text-[#777A81]">
                {otpSent
                  ? `Enter the 6-digit OTP sent to +91 ${mobile}.`
                  : "Sign in securely to manage your transactions, wallet and retailer services."}
              </p>
            </div>

            {/* ==================================================
                PROGRESS
            ================================================== */}

            <div className="mb-7 flex items-center gap-2">
              <div className="h-1 w-12 rounded-full bg-[#4A3E94]" />

              <div
                className={`
                  h-1
                  w-12
                  rounded-full
                  transition-all
                  duration-500
                  ${
                    otpSent
                      ? "bg-[#4A3E94]"
                      : "bg-[#D2D0CD]"
                  }
                `}
              />

              <span className="ml-1 text-[9px] font-medium text-[#999BA0]">
                Step {otpSent ? "2" : "1"} of 2
              </span>
            </div>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-[#E8CACA] bg-[#FBEDED] px-4 py-3 text-[11px] font-medium text-[#B85C5C]">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B85C5C]" />
                {error}
              </div>
            )}

            {/* ==================================================
                MOBILE
            ================================================== */}

            <div>
              <label
                htmlFor="mobile"
                className="mb-2 block text-[11px] font-semibold text-[#172536]"
              >
                Mobile Number
              </label>

              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777A81]" />

                <span className="absolute left-10 top-1/2 -translate-y-1/2 border-r border-[#D5D3D0] pr-2.5 text-[11px] font-medium text-[#686C74]">
                  +91
                </span>

                <input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  maxLength={10}
                  disabled={otpSent}
                  inputMode="numeric"
                  autoComplete="tel"
                  onChange={(e) =>
                    setMobile(
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="Enter your 10-digit mobile number"
                  className="
                    h-[48px]
                    w-full
                    rounded-xl
                    border
                    border-[#CECDCA]
                    bg-white
                    pl-[76px]
                    pr-4
                    text-[13px]
                    text-[#172536]
                    outline-none
                    transition-all
                    placeholder:text-[#A0A1A5]
                    hover:border-[#AAA9A6]
                    focus:border-[#4A3E94]
                    focus:ring-4
                    focus:ring-[#4A3E94]/10
                    disabled:bg-[#E8E6E2]
                  "
                />
              </div>
            </div>

            {/* ==================================================
                OTP
            ================================================== */}

            {otpSent && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="otp"
                    className="text-[11px] font-semibold text-[#172536]"
                  >
                    Verification Code
                  </label>

                  <button
                    type="button"
                    onClick={handleChangeNumber}
                    className="text-[10px] font-semibold text-[#4A3E94] transition hover:text-[#3B317A] hover:underline"
                  >
                    Change number
                  </button>
                </div>

                <input
                  id="otp"
                  type="text"
                  value={otp}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  onChange={(e) =>
                    setOtp(
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="Enter 6-digit OTP"
                  className="
                    h-[50px]
                    w-full
                    rounded-xl
                    border
                    border-[#CECDCA]
                    bg-white
                    px-4
                    text-center
                    text-[17px]
                    font-semibold
                    tracking-[0.55em]
                    text-[#172536]
                    outline-none
                    transition-all
                    placeholder:text-[11px]
                    placeholder:tracking-normal
                    focus:border-[#4A3E94]
                    focus:ring-4
                    focus:ring-[#4A3E94]/10
                  "
                />

                <div className="mt-2 flex justify-between">
                  <span className="text-[9px] text-[#999BA0]">
                    Didn't receive the code?
                  </span>

                  <button
                    type="button"
                    className="text-[9px] font-semibold text-[#4A3E94] hover:text-[#3B317A]"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}

            {/* ==================================================
                BUTTON
            ================================================== */}

            <button
              type="button"
              onClick={
                otpSent
                  ? handleLogin
                  : handleSendOtp
              }
              className="
                group
                mt-6
                flex
                h-[49px]
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#4A3E94]
                text-[12px]
                font-semibold
                text-white
                shadow-[0_10px_25px_rgba(74,62,148,0.20)]
                transition-all
                duration-200
                hover:bg-[#3B317A]
                hover:shadow-[0_12px_28px_rgba(74,62,148,0.27)]
                active:scale-[0.99]
              "
            >
              {otpSent
                ? "Verify & Continue"
                : "Continue with OTP"}

              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>

            {/* ==================================================
                REGISTER
            ================================================== */}

            <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px]">
              <span className="text-[#777A81]">
                New to HappyPay?
              </span>

              <button
                type="button"
                onClick={() =>
                  navigate("/retailer/register")
                }
                className="font-semibold text-[#4A3E94] transition hover:text-[#3B317A] hover:underline"
              >
                Register as a Retailer
              </button>
            </div>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px]">
              <span className="text-[#777A81]">
                Admin access?
              </span>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/login")
                }
                className="font-semibold text-[#4A3E94] transition hover:text-[#3B317A] hover:underline"
              >
                Go to Admin Portal
              </button>
            </div>

            {/* ==================================================
                SECURITY
            ================================================== */}

            <div className="mt-8 border-t border-[#E1E0DE] pt-5">
              <div className="flex items-center justify-center gap-2 text-[9px] text-[#999BA0]">
                <LockKeyhole className="h-3 w-3" />

                <span>
                  Encrypted connection
                </span>

                <span className="text-[#D0CECB]">
                  •
                </span>

                <ShieldCheck className="h-3 w-3 text-[#4F8A68]" />

                <span>
                  Secure OTP
                </span>
              </div>

              <div className="mt-2 flex items-center justify-center gap-1 text-[8px] text-[#AAA8A5]">
                <Check className="h-2.5 w-2.5 text-[#4F8A68]" />

                Demo OTP: 123456
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            RIGHT — RETAILER DASHBOARD PREVIEW
        ======================================================== */}

        <section
          className="
            relative
            hidden
            w-[57%]
            overflow-hidden
            bg-[#172536]
            lg:flex
          "
        >
          {/* ======================================================
              BACKGROUND
          ====================================================== */}

          <div
            className="
              pointer-events-none
              absolute
              -right-40
              -top-40
              h-[550px]
              w-[550px]
              rounded-full
              bg-[#4A3E94]/30
              blur-[120px]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-52
              -left-40
              h-[500px]
              w-[500px]
              rounded-full
              bg-[#4A3E94]/20
              blur-[120px]
            "
          />

          {/* ======================================================
              GRID
          ====================================================== */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              opacity-[0.045]
            "
            style={{
              backgroundImage: `
                linear-gradient(
                  #ffffff 1px,
                  transparent 1px
                ),
                linear-gradient(
                  90deg,
                  #ffffff 1px,
                  transparent 1px
                )
              `,
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative flex h-full w-full flex-col px-9 py-8 xl:px-12">

            {/* ====================================================
                HEADER
            ==================================================== */}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A9A2D0]">
                  HappyPay Retailer
                </p>

                <h2 className="mt-1 text-[21px] font-semibold tracking-[-0.03em] text-white">
                  Everything you need,
                  <br />
                  <span className="text-[#A9A2D0]">
                    in one place.
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6DA882]" />

                <span className="text-[8px] font-medium text-white/55">
                  System Online
                </span>
              </div>
            </div>

            {/* ====================================================
                DASHBOARD AREA
            ==================================================== */}

            <div className="relative mt-7 flex-1">

              {/* ==================================================
                  MAIN DASHBOARD
              ================================================== */}

              <div
                className="
                  absolute
                  left-0
                  top-0
                  w-[88%]
                  rounded-[22px]
                  border
                  border-white/10
                  bg-[#223449]
                  p-4
                  shadow-[0_30px_60px_rgba(0,0,0,0.25)]
                "
              >
                {/* Dashboard Header */}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4A3E94]">
                      <WalletCards className="h-4 w-4 text-white" />
                    </div>

                    <div>
                      <p className="text-[7px] uppercase tracking-wider text-white/35">
                        Available Balance
                      </p>

                      <p className="mt-0.5 text-[20px] font-semibold tracking-tight text-white">
                        ₹32,485.95
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[7px] text-white/30">
                      Retailer ID
                    </p>

                    <p className="mt-1 text-[9px] font-medium text-white/65">
                      HP102458
                    </p>
                  </div>
                </div>

                {/* ==================================================
                    QUICK SERVICES
                ================================================== */}

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {/* AEPS */}

                  <div className="group rounded-xl border border-white/5 bg-white/[0.035] p-3 transition hover:bg-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4A3E94]/25">
                        <Fingerprint className="h-3.5 w-3.5 text-[#B5AFD5]" />
                      </div>

                      <ChevronRight className="h-3 w-3 text-white/20" />
                    </div>

                    <p className="mt-2 text-[8px] font-medium text-white/40">
                      Aadhaar ATM
                    </p>

                    <p className="mt-0.5 text-[11px] font-semibold text-white">
                      AEPS
                    </p>
                  </div>

                  {/* DMT */}

                  <div className="group rounded-xl border border-white/5 bg-white/[0.035] p-3 transition hover:bg-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4A3E94]/25">
                        <Send className="h-3.5 w-3.5 text-[#B5AFD5]" />
                      </div>

                      <ChevronRight className="h-3 w-3 text-white/20" />
                    </div>

                    <p className="mt-2 text-[8px] font-medium text-white/40">
                      Send Money
                    </p>

                    <p className="mt-0.5 text-[11px] font-semibold text-white">
                      DMT
                    </p>
                  </div>

                  {/* CMS */}

                  <div className="group rounded-xl border border-white/5 bg-white/[0.035] p-3 transition hover:bg-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4A3E94]/25">
                        <CircleDollarSign className="h-3.5 w-3.5 text-[#B5AFD5]" />
                      </div>

                      <ChevronRight className="h-3 w-3 text-white/20" />
                    </div>

                    <p className="mt-2 text-[8px] font-medium text-white/40">
                      Cash Services
                    </p>

                    <p className="mt-0.5 text-[11px] font-semibold text-white">
                      CMS
                    </p>
                  </div>
                </div>

                {/* ==================================================
                    OVERVIEW
                ================================================== */}

                <div className="mt-3 grid grid-cols-[1.25fr_0.75fr] gap-2">

                  {/* GRAPH */}

                  <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[7px] uppercase tracking-wider text-white/30">
                          Transaction Overview
                        </p>

                        <p className="mt-1 text-[14px] font-semibold text-white">
                          ₹26,844
                        </p>
                      </div>

                      <div className="flex items-center gap-1 rounded-full bg-[#6DA882]/10 px-2 py-1 text-[7px] font-medium text-[#7BA98C]">
                        <TrendingUp className="h-2.5 w-2.5" />

                        12.8%
                      </div>
                    </div>

                    <div className="relative mt-2 h-14">
                      <svg
                        viewBox="0 0 500 100"
                        className="absolute inset-0 h-full w-full"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="
                            M0 82
                            C45 75 60 80 95 65
                            S150 71 180 52
                            S235 58 265 44
                            S315 51 345 34
                            S400 45 430 27
                            S470 31 500 14
                          "
                          fill="none"
                          stroke="#7168A3"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />

                        <path
                          d="
                            M0 82
                            C45 75 60 80 95 65
                            S150 71 180 52
                            S235 58 265 44
                            S315 51 345 34
                            S400 45 430 27
                            S470 31 500 14
                            L500 100
                            L0 100
                            Z
                          "
                          fill="#4A3E94"
                          opacity="0.08"
                        />
                      </svg>
                    </div>

                    <div className="flex justify-between text-[6px] text-white/20">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>

                  {/* EARNINGS */}

                  <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4A3E94]/20">
                      <Activity className="h-3.5 w-3.5 text-[#A9A2D0]" />
                    </div>

                    <p className="mt-3 text-[7px] uppercase tracking-wider text-white/30">
                      Today's Earnings
                    </p>

                    <p className="mt-1 text-[17px] font-semibold text-white">
                      ₹1,284.50
                    </p>

                    <div className="mt-2 flex items-center gap-1 text-[7px] text-[#7BA98C]">
                      <TrendingUp className="h-2.5 w-2.5" />
                      +8.4% today
                    </div>
                  </div>
                </div>

                {/* ==================================================
                    RECENT TRANSACTIONS
                ================================================== */}

                <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.025] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-semibold text-white/65">
                      Recent Transactions
                    </p>

                    <span className="text-[7px] text-[#A9A2D0]">
                      View all
                    </span>
                  </div>

                  <div className="mt-2 space-y-2">

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#4A3E94]/20">
                          <Fingerprint className="h-3 w-3 text-[#A9A2D0]" />
                        </div>

                        <div>
                          <p className="text-[7px] font-medium text-white/65">
                            AEPS Withdrawal
                          </p>

                          <p className="text-[6px] text-white/25">
                            Today · 10:42 AM
                          </p>
                        </div>
                      </div>

                      <p className="text-[8px] font-semibold text-white">
                        ₹2,500
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#4A3E94]/20">
                          <Send className="h-3 w-3 text-[#A9A2D0]" />
                        </div>

                        <div>
                          <p className="text-[7px] font-medium text-white/65">
                            Money Transfer
                          </p>

                          <p className="text-[6px] text-white/25">
                            Today · 09:28 AM
                          </p>
                        </div>
                      </div>

                      <p className="text-[8px] font-semibold text-white">
                        ₹4,200
                      </p>
                    </div>
                  </div>
                </div>

                {/* BOTTOM STATS */}

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                  <div>
                    <p className="text-[6px] text-white/25">
                      Transactions
                    </p>

                    <p className="mt-0.5 text-[9px] font-semibold text-white">
                      128
                    </p>
                  </div>

                  <div>
                    <p className="text-[6px] text-white/25">
                      Success Rate
                    </p>

                    <p className="mt-0.5 text-[9px] font-semibold text-[#7BA98C]">
                      98.6%
                    </p>
                  </div>

                  <div>
                    <p className="text-[6px] text-white/25">
                      Commission
                    </p>

                    <p className="mt-0.5 text-[9px] font-semibold text-white">
                      ₹1,284
                    </p>
                  </div>
                </div>
              </div>

              {/* ==================================================
                  FLOATING SUCCESS NOTIFICATION
              ================================================== */}

              <div
                className="
                  absolute
                  right-0
                  top-10
                  z-10
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-white/10
                  bg-[#2A3D52]/95
                  px-3
                  py-2.5
                  shadow-[0_18px_35px_rgba(0,0,0,0.28)]
                  backdrop-blur-xl
                "
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4A3E94]/30">
                  <Check className="h-3.5 w-3.5 text-[#B5AFD5]" />
                </div>

                <div>
                  <p className="text-[8px] font-semibold text-white">
                    Transaction Successful
                  </p>

                  <p className="mt-0.5 text-[7px] text-white/40">
                    ₹2,500 transferred
                  </p>
                </div>
              </div>

              {/* ==================================================
                  FLOATING COMMISSION
              ================================================== */}

              <div
                className="
                  absolute
                  bottom-5
                  left-[8%]
                  z-10
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-white/10
                  bg-[#2A3D52]/95
                  px-3
                  py-2
                  shadow-[0_18px_35px_rgba(0,0,0,0.25)]
                "
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#4A3E94]/25">
                  <Bell className="h-3 w-3 text-[#A9A2D0]" />
                </div>

                <div>
                  <p className="text-[8px] font-semibold text-white">
                    ₹85.50 commission earned
                  </p>

                  <p className="text-[7px] text-white/35">
                    DMT transaction
                  </p>
                </div>
              </div>
            </div>

            {/* ====================================================
                BOTTOM
            ==================================================== */}

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-1.5">
                  <Fingerprint className="h-3 w-3 text-white/30" />
                  <span className="text-[8px] text-white/35">
                    AEPS
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Send className="h-3 w-3 text-white/30" />
                  <span className="text-[8px] text-white/35">
                    DMT
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <CircleDollarSign className="h-3 w-3 text-white/30" />
                  <span className="text-[8px] text-white/35">
                    CMS
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[8px] text-white/30">
                <ShieldCheck className="h-3 w-3 text-[#6DA882]" />
                Secure Platform
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================
          FOOTER
      ============================================================ */}

      <p className="mt-3 text-center text-[9px] text-[#8A8C91]">
        © {new Date().getFullYear()} HappyPay · Retailer Portal
      </p>
    </div>
  );
};

export default RetailerLogin;