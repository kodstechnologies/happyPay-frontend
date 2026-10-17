import { useState, useEffect, useCallback } from "react";
import { Plus, WalletCards, X, ArrowRightLeft, RefreshCw, AlertCircle, ShieldCheck, Lock, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getWalletBalance, setWalletBalance } from "../../../utils/wallet";
import { getWalletBalanceApi, initiatePaymentApi, verifyPaymentApi, recordPaymentFailureApi } from "../../../apis/wallet.apis";
import { loadRazorpayScript } from "../../../utils/razorpay";
import { useAuth } from "../../../context/AuthContext";

const formatAmount = (amount: number) =>
  amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });


interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

interface PaymentNotification {
  type: "success" | "error";
  title: string;
  message: string;
  amount?: number;
  orderId?: string;
  paymentId?: string;
}

interface RazorpayInstance {
  on: (event: string, handler: (response: RazorpayFailureResponse) => void) => void;
  open: () => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpaySuccessResponse) => Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

export default function Wallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(getWalletBalance);
  const [holdBalance, setHoldBalance] = useState<number>(0);
  const [walletStatus, setWalletStatus] = useState<string>("active");
  const [isFetchingBalance, setIsFetchingBalance] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>("");

  const [amount, setAmount] = useState<string>("500");
  const [open, setOpen] = useState<boolean>(false);
  const [paymentNotice, setPaymentNotice] = useState<PaymentNotification | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);


  // Load retailer details from in-memory session
  const { user: retailerUser } = useAuth();

  const fetchBalance = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setIsFetchingBalance(true);
    }
    setFetchError("");
    try {
      const response = await getWalletBalanceApi();
      if (response && response.success && response.data) {
        const liveBal = Number(response.data.balance || 0);
        const liveHold = Number(response.data.holdBalance || 0);
        const status = response.data.status || "active";

        setBalance(liveBal);
        setHoldBalance(liveHold);
        setWalletStatus(status);
        setWalletBalance(liveBal);
      } else {
        setFetchError(response?.message || "Failed to fetch wallet balance");
      }
    } catch (error: unknown) {
      console.error("Error fetching live wallet balance:", error);
      const axiosErr = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const backendError = axiosErr?.response?.data;
      const errorMsg =
        backendError?.message ||
        (Array.isArray(backendError?.errors) ? backendError.errors.join(", ") : "") ||
        "Unable to fetch latest balance. Showing cached balance.";
      setFetchError(errorMsg);
    } finally {
      setIsFetchingBalance(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialBalance = async () => {
      setIsFetchingBalance(true);
      setFetchError("");
      try {
        const response = await getWalletBalanceApi();
        if (isMounted) {
          if (response && response.success && response.data) {
            const liveBal = Number(response.data.balance || 0);
            const liveHold = Number(response.data.holdBalance || 0);
            const status = response.data.status || "active";

            setBalance(liveBal);
            setHoldBalance(liveHold);
            setWalletStatus(status);
            setWalletBalance(liveBal);
          } else {
            setFetchError(response?.message || "Failed to fetch wallet balance");
          }
        }
      } catch (error: unknown) {
        if (isMounted) {
          console.error("Error fetching live wallet balance:", error);
          const axiosErr = error as { response?: { data?: { message?: string; errors?: string[] } } };
          const backendError = axiosErr?.response?.data;
          const errorMsg =
            backendError?.message ||
            (Array.isArray(backendError?.errors) ? backendError.errors.join(", ") : "") ||
            "Unable to fetch latest balance. Showing cached balance.";
          setFetchError(errorMsg);
        }
      } finally {
        if (isMounted) {
          setIsFetchingBalance(false);
        }
      }
    };

    loadInitialBalance();

    return () => {
      isMounted = false;
    };
  }, []);

  const addMoney = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;

    setIsLoading(true);
    setPaymentNotice(null);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setPaymentNotice({
          type: "error",
          title: "Payment SDK Error",
          message: "Failed to load Razorpay SDK. Please check your internet connection.",
        });
        setIsLoading(false);
        return;
      }

      // 1. Initiate payment
      const initiateRes = await initiatePaymentApi(numericAmount, "add_wallet");
      if (!initiateRes.success) {
        setPaymentNotice({
          type: "error",
          title: "Initiation Failed",
          message: initiateRes.message || "Failed to initiate payment.",
        });
        setIsLoading(false);
        return;
      }

      const orderData = initiateRes.data;

      // 2. Open Razorpay checkout
      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_ThS2jwQQemeVvp",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Happy Pay",
        description: "Wallet Topup",
        order_id: orderData.orderId,
        modal: {
          ondismiss: async function () {
            setIsLoading(false);
            // Optionally log user dismissed flow if needed
          },
        },
        handler: async function (response: RazorpaySuccessResponse) {
          try {
            // 3. Verify payment
            const verifyRes = await verifyPaymentApi(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              "add_wallet"
            );

            if (verifyRes.success) {
              setPaymentNotice({
                type: "success",
                title: "Payment Successful!",
                message: `₹${formatAmount(numericAmount)} has been credited to your retailer wallet.`,
                amount: numericAmount,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
              });
              setAmount("500");
              setOpen(false);
              // Fetch latest live balance from server
              await fetchBalance(false);
            } else {
              setPaymentNotice({
                type: "error",
                title: "Verification Failed",
                message: verifyRes.message || "Payment verification failed with server.",
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
              });
            }
          } catch (error: unknown) {
            console.error("Error verifying payment:", error);
            const axiosErr = error as { response?: { data?: { message?: string } } };
            const backendErr = axiosErr?.response?.data;
            setPaymentNotice({
              type: "error",
              title: "Verification Error",
              message: backendErr?.message || "Error verifying payment signature with server.",
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
            });
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: retailerUser?.fullName || "Retailer",
          email: retailerUser?.email || "retailer@happypay.com",
          contact: retailerUser?.mobile || "9999999999",
        },
        theme: {
          color: "#7c3aed",
        },
      };

      const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: RazorpayOptions) => RazorpayInstance }).Razorpay;
      const rzp = new RazorpayConstructor(options);

      rzp.on("payment.failed", async function (response: RazorpayFailureResponse) {
        setIsLoading(false);
        const errReason = response.error?.description || response.error?.reason || "Payment declined or failed";
        const errCode = response.error?.code || "PAYMENT_FAILED";
        const rzpPayId = response.error?.metadata?.payment_id;

        // Record failed transaction end-to-end to backend
        try {
          await recordPaymentFailureApi(
            orderData.orderId,
            rzpPayId,
            errReason,
            errCode,
            "add_wallet"
          );
        } catch (failErr) {
          console.error("Failed to report payment failure to server:", failErr);
        }

        setPaymentNotice({
          type: "error",
          title: "Payment Failed",
          message: errReason,
          orderId: orderData.orderId,
          paymentId: rzpPayId,
        });
      });

      rzp.open();
    } catch (error: unknown) {
      console.error("Payment flow error:", error);
      const axiosErr = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const backendError = axiosErr?.response?.data;
      const errorMsg =
        backendError?.message ||
        (Array.isArray(backendError?.errors) ? backendError.errors.join(", ") : "") ||
        "Something went wrong during payment initiation.";
      setPaymentNotice({
        type: "error",
        title: "Initiation Error",
        message: errorMsg,
      });
      setIsLoading(false);
    }
  };

  const retailerId =
    retailerUser?.outletId ||
    retailerUser?.AepsEkyc?.outletId ||
    retailerUser?._id?.slice(-8).toUpperCase() ||
    retailerUser?.id?.slice(-8).toUpperCase() ||
    "HP100245";

  const retailerName = retailerUser?.fullName || "Retailer Partner";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      {/* Header */}
      <section className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
            Overview
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#171717]">Wallet</h1>
          <p className="mt-1 text-sm text-[#8992a3]">Manage and monitor your live retailer wallet balance.</p>
        </div>
        <button
          type="button"
          onClick={() => fetchBalance(true)}
          disabled={isFetchingBalance}
          title="Refresh Wallet Balance"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-[#7c3aed] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetchingBalance ? "animate-spin text-[#7c3aed]" : ""}`} />
          {isFetchingBalance ? "Syncing..." : "Refresh"}
        </button>
      </section>

      {/* Main Balance & Snapshot Grid */}
      <section className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-[#64748b]">Available Balance</p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    walletStatus === "active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {walletStatus}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                {isFetchingBalance && balance === 0 ? (
                  <div className="h-9 w-40 animate-pulse rounded-lg bg-slate-100" />
                ) : (
                  <p className="text-3xl font-bold tracking-tight text-[#171717]">
                    ₹{formatAmount(balance)}
                  </p>
                )}
              </div>

              {holdBalance > 0 && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-amber-600">
                  <Lock className="h-3 w-3" /> On Hold: ₹{formatAmount(holdBalance)}
                </p>
              )}
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8f5ff] text-[#7c3aed]">
              <WalletCards className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#6d28d9] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add Money
            </button>
            <button
              type="button"
              onClick={() => navigate("/retailer/settlement/bank")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Settlement
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-[#f8f5ff] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64748b]">
              Account Snapshot
            </p>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs text-[#64748b]">Retailer Name</p>
              <p className="mt-1 text-sm font-bold text-[#171717]">{retailerName}</p>
            </div>
            <div>
              <p className="text-xs text-[#64748b]">Retailer / Outlet ID</p>
              <p className="mt-1 text-sm font-bold font-mono text-[#7c3aed]">{retailerId}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Error / Alert feedback */}
      {fetchError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchBalance(true)}
            className="font-bold underline hover:text-amber-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* Payment Result Alert Dialog / Banner */}
      {paymentNotice && (
        <div
          role="status"
          className={`relative rounded-2xl border p-5 shadow-sm transition animate-in fade-in slide-in-from-top-2 duration-200 ${
            paymentNotice.type === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
              : "border-rose-200 bg-rose-50/80 text-rose-950"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  paymentNotice.type === "success"
                    ? "bg-emerald-600 text-white"
                    : "bg-rose-600 text-white"
                }`}
              >
                {paymentNotice.type === "success" ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <XCircle className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold">
                  {paymentNotice.title}
                </h3>
                <p className="mt-1 text-sm text-slate-700">
                  {paymentNotice.message}
                </p>

                {(paymentNotice.orderId || paymentNotice.paymentId) && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
                    {paymentNotice.orderId && (
                      <span className="rounded-lg bg-white/80 px-2.5 py-1 border border-slate-200">
                        Order ID: <span className="font-mono font-semibold text-slate-800">{paymentNotice.orderId}</span>
                      </span>
                    )}
                    {paymentNotice.paymentId && (
                      <span className="rounded-lg bg-white/80 px-2.5 py-1 border border-slate-200">
                        Payment ID: <span className="font-mono font-semibold text-slate-800">{paymentNotice.paymentId}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPaymentNotice(null)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
              title="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}


      {/* Add Money Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#171717]">Add Money to Wallet</h2>
                <p className="mt-1 text-xs text-[#8992a3]">Current balance: ₹{formatAmount(balance)}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-[#f8f5ff] hover:text-[#7c3aed]"
                aria-label="Close add money modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mt-5 block text-xs font-semibold text-slate-600">
              Enter amount
              <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-[#7c3aed] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#7c3aed]/20">
                <span className="text-lg font-semibold text-slate-400">₹</span>
                <input
                  autoFocus
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="0.00"
                  className="h-12 min-w-0 flex-1 bg-transparent px-2 text-xl font-bold text-[#171717] outline-none"
                />
              </div>
            </label>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {["500", "1000", "2000", "5000"].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(value)}
                  className={`rounded-lg border py-2 text-xs font-semibold transition ${
                    amount === value
                      ? "border-[#7c3aed] bg-[#7c3aed] text-white shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-[#7c3aed]/40 hover:bg-slate-50"
                  }`}
                >
                  ₹{value}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={addMoney}
              disabled={!amount || Number(amount) <= 0 || isLoading}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-[#7c3aed] text-sm font-bold text-white shadow-sm transition hover:bg-[#6d28d9] disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Proceed to Pay"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
