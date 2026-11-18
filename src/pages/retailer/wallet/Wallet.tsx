import { useState, useEffect, useCallback } from "react";
import { showToast } from "../../../utils/toast";
import { WalletCards, ArrowRightLeft, RefreshCw, ShieldCheck, Lock as LockIcon, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getWalletBalance, setWalletBalance } from "../../../utils/wallet";
import { getWalletBalanceApi } from "../../../apis/wallet.apis";
import { useAuth } from "../../../context/AuthContext";

const formatAmount = (amount: number) =>
  amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });



export default function Wallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(getWalletBalance);
  const [holdBalance, setHoldBalance] = useState<number>(0);
  const [walletStatus, setWalletStatus] = useState<string>("active");
  const [isFetchingBalance, setIsFetchingBalance] = useState<boolean>(true);
  const [isWalletLocked, setIsWalletLocked] = useState<boolean>(false);
  const [walletLockReason, setWalletLockReason] = useState<string | null>(null);
  const [walletLockedAt, setWalletLockedAt] = useState<string | null>(null);

  // Load retailer details from in-memory session
  const { user: retailerUser } = useAuth();

  const fetchBalance = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setIsFetchingBalance(true);
    }

    try {
      const response = await getWalletBalanceApi();
      if (response && response.success && response.data) {
        const liveBal = Number(response.data.availableBalance || 0);
        const liveHold = Number(response.data.holdBalance || 0);
        const status = response.data.status || "active";

        setBalance(liveBal);
        setHoldBalance(liveHold);
        setWalletStatus(status);
        setWalletBalance(liveBal);

        // Derive wallet lock state from the balance response (no separate lock-status API)
        setIsWalletLocked(Boolean(response.data.isWalletLocked));
        setWalletLockReason(response.data.reason ?? null);
        setWalletLockedAt(response.data.lockedAt ?? null);
      }
    } catch (error: unknown) {
      console.error("Error fetching live wallet balance:", error);
      showToast("error", error, "Unable to fetch latest balance. Showing cached balance.");
    } finally {
      setIsFetchingBalance(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      setIsFetchingBalance(true);

      try {
        // Fetch balance (response now includes wallet lock state — no separate lock-status API)
        const response = await getWalletBalanceApi();

        if (isMounted && response?.success && response?.data) {
          const liveBal = Number(response.data.availableBalance || 0);
          const liveHold = Number(response.data.holdBalance || 0);
          const status = response.data.status || "active";

          setBalance(liveBal);
          setHoldBalance(liveHold);
          setWalletStatus(status);
          setWalletBalance(liveBal);

          // Derive wallet lock state from the balance response
          setIsWalletLocked(Boolean(response.data.isWalletLocked));
          setWalletLockReason(response.data.reason ?? null);
          setWalletLockedAt(response.data.lockedAt ?? null);
        }
      } catch (error: unknown) {
        if (isMounted) {
          console.error("Error fetching initial data:", error);
          showToast("error", error, "Unable to fetch latest data. Showing cached values.");
        }
      } finally {
        if (isMounted) {
          setIsFetchingBalance(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const retailerId =
    retailerUser?.outletId ||
    retailerUser?.AepsEkyc?.outletId ||
    retailerUser?._id?.slice(-8).toUpperCase() ||
    retailerUser?.id?.slice(-8).toUpperCase() ||
    "HP100245";

  const retailerName = retailerUser?.fullName || "Retailer Partner";

  return (
    <div className="mx-auto w-full space-y-5">
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

      {/* Wallet Locked Warning Banner */}
      {isWalletLocked && (
        <section className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-900">Wallet Locked by Admin</h3>
              <p className="mt-1 text-sm text-red-800">
                Your wallet has been locked by the administrator. All transactions are disabled. Please contact support for assistance.
              </p>
              {walletLockReason && (
                <p className="mt-2 text-xs text-red-700">
                  <span className="font-semibold">Reason:</span> {walletLockReason}
                </p>
              )}
              {walletLockedAt && (
                <p className="mt-1 text-xs text-red-600">
                  Locked on: {new Date(walletLockedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Main Balance & Snapshot Grid */}
      <section className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-[#64748b]">Available Balance</p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${walletStatus === "active"
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
                  <LockIcon className="h-3 w-3" /> On Hold: ₹{formatAmount(holdBalance)}
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
              onClick={() => navigate("/retailer/settlement/bank")}
              disabled={isWalletLocked}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold shadow-sm transition active:scale-[0.98] ${
                isWalletLocked
                  ? "border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
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
    </div>
  );
}
