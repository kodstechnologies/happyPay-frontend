import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Building,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Headphones,
  History,
  Lock,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getWalletBalance, setWalletBalance } from "../../../utils/wallet";
import {
  getDistributorSettlementInfoApi,
  transferDistributorSettlementApi,
  getRecentDistributorTransfersApi,
  type AssignedDistributorData,
  type RecentDistributorTransferItem,
} from "../../../apis/wallet.apis";

const formatAmount = (val: number) =>
  val.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function SettlementToDistributor() {
  const navigate = useNavigate();

  // Wallet & Distributor State
  const [balance, setBalance] = useState<number>(getWalletBalance);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDistributor, setHasDistributor] = useState(false);
  const [canTransfer, setCanTransfer] = useState(false);
  const [hasMpin, setHasMpin] = useState(true);
  const [distributor, setDistributor] = useState<AssignedDistributorData | null>(null);
  const [noDistributorMsg, setNoDistributorMsg] = useState("");

  // Transfer Form State
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("Wallet Top-up / Stock Reorder");
  const [mpin, setMpin] = useState("");
  const [showMpin, setShowMpin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // History & Receipt State
  const [recentTransfers, setRecentTransfers] = useState<RecentDistributorTransferItem[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [txnDetails, setTxnDetails] = useState<{
    id: string;
    date: Date;
    amount: number;
    distName: string;
    distId: string;
    contactName: string;
    reason: string;
  } | null>(null);

  const numAmount = Number(amount) || 0;

  // 1. Fetch live distributor info and balance from backend
  const fetchDistributorData = async () => {
    try {
      const res = await getDistributorSettlementInfoApi();
      if (res && res.data) {
        const d = res.data;
        setHasDistributor(Boolean(d.hasDistributor));
        setCanTransfer(Boolean(d.canTransfer));
        setDistributor(d.distributor || null);
        if (d.retailer && typeof d.retailer.hasMpin === "boolean") {
          setHasMpin(d.retailer.hasMpin);
        }
        setNoDistributorMsg(d.message || "No distributor assigned to your account.");

        if (d.wallet) {
          const liveBal = Number(d.wallet.availableBalance ?? d.wallet.balance ?? 0);
          setBalance(liveBal);
          setWalletBalance(liveBal);
        }
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      const msg = errorObj?.response?.data?.message || "Failed to load distributor details.";
      setTransferError(msg);
      setHasDistributor(false);
      setCanTransfer(false);
      setDistributor(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch recent distributor transfers
  const fetchRecentTransfers = async () => {
    try {
      const res = await getRecentDistributorTransfersApi();
      if (res && Array.isArray(res.data)) {
        setRecentTransfers(res.data);
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      console.warn("Could not fetch recent distributor transfers:", errorObj?.message);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getDistributorSettlementInfoApi()
      .then((res) => {
        if (isMounted && res && res.data) {
          const d = res.data;
          setHasDistributor(Boolean(d.hasDistributor));
          setCanTransfer(Boolean(d.canTransfer));
          setDistributor(d.distributor || null);
          if (d.retailer && typeof d.retailer.hasMpin === "boolean") {
            setHasMpin(d.retailer.hasMpin);
          }
          setNoDistributorMsg(d.message || "No distributor assigned to your account.");

          if (d.wallet) {
            const liveBal = Number(d.wallet.availableBalance ?? d.wallet.balance ?? 0);
            setBalance(liveBal);
            setWalletBalance(liveBal);
          }
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const errorObj = err as { response?: { data?: { message?: string } } };
        const msg = errorObj?.response?.data?.message || "Failed to load distributor details.";
        setTransferError(msg);
        setHasDistributor(false);
        setCanTransfer(false);
        setDistributor(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    getRecentDistributorTransfersApi()
      .then((res) => {
        if (isMounted && res && Array.isArray(res.data)) {
          setRecentTransfers(res.data);
        }
      })
      .catch((err: unknown) => {
        const errorObj = err as { message?: string };
        console.warn("Could not fetch recent distributor transfers:", errorObj?.message);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRecent(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuickAmount = (val: number | "full") => {
    if (!hasDistributor || !canTransfer) return;
    if (val === "full") {
      setAmount(balance.toString());
    } else {
      setAmount(val.toString());
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError("");

    if (!hasDistributor || !distributor) {
      const msg = "Settlement disabled: No distributor is assigned to your account.";
      setTransferError(msg);
      toast.error(msg);
      return;
    }
    if (numAmount < 100) {
      const msg = "Minimum transfer amount to distributor is ₹100";
      setTransferError(msg);
      toast.error(msg);
      return;
    }
    if (numAmount > balance) {
      const msg = "Insufficient wallet balance for transfer";
      setTransferError(msg);
      toast.error(msg);
      return;
    }
    if (mpin.length < 4) {
      const msg = "Please enter your 4-digit security MPIN";
      setTransferError(msg);
      toast.error(msg);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await transferDistributorSettlementApi({
        amount: numAmount,
        mpin,
        reason,
        distributorId: distributor.id,
      });

      if (res && res.data) {
        const data = res.data;
        const nextBalance = Number(data.senderBalanceAfter ?? (balance - numAmount));
        setBalance(nextBalance);
        setWalletBalance(nextBalance);

        setTxnDetails({
          id: data.transactionId || data.id,
          date: new Date(data.date || Date.now()),
          amount: data.amount || numAmount,
          distName: data.distributorName || distributor.name,
          distId: distributor.customId || distributor.id,
          contactName: distributor.contactName || distributor.name,
          reason: data.reason || reason,
        });

        setIsSuccess(true);
        fetchRecentTransfers();
        toast.success(`₹${formatAmount(numAmount)} transferred successfully to ${data.distributorName || distributor.name}!`);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      const msg =
        errorObj?.response?.data?.message ||
        "Transfer failed. Please check your MPIN and try again.";
      setTransferError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setAmount("");
    setMpin("");
    setTransferError("");
    setIsSuccess(false);
    setTxnDetails(null);
    setIsLoading(true);
    setIsLoadingRecent(true);
    fetchDistributorData();
    fetchRecentTransfers();
  };

  return (
    <div className="mx-auto w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/retailer")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
              Settlement Services
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Transfer to Distributor
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Settle retailer balance directly to your assigned distributor for stock & limits.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          Direct Distributor Settlement
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Balance Card */}
        <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-medium text-purple-100">
                Available Wallet Balance
              </span>
            </div>
            <button
              type="button"
              onClick={fetchDistributorData}
              title="Refresh Balance"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition"
            >
              <RefreshCw className={`h-4 w-4 text-white ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
            ₹{formatAmount(balance)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-purple-200">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-200" />
            <span>Instant Stock Settlement</span>
          </div>
        </div>

        {/* Assigned Distributor Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Assigned Distributor
            </span>
            {hasDistributor && distributor ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                Linked & Active
              </span>
            ) : (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                Not Assigned
              </span>
            )}
          </div>
          {isLoading ? (
            <div className="mt-3 space-y-2 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          ) : hasDistributor && distributor ? (
            <>
              <p className="mt-2 text-base font-bold text-slate-900 truncate">
                {distributor.name}
              </p>
              <p className="text-xs font-medium text-slate-600 mt-0.5 truncate">
                {distributor.shopName} • {distributor.customId}
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                Zone: {distributor.zone}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm font-bold text-slate-700">
                No Distributor Linked
              </p>
              <p className="text-xs text-rose-600 mt-0.5">
                Transfer functionality is disabled
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                Contact administrator to map a distributor
              </p>
            </>
          )}
        </div>

        {/* Transfer Fee & Limit */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Transfer Fee & Limits
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-600">
            ₹0.00 Charges
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Min: ₹100</span>
            <span>Max: ₹1,00,000</span>
          </div>
        </div>
      </div>

      {/* Negative Scenario Guard Banner: When Retailer Has NO Distributor */}
      {!isLoading && !hasDistributor && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900">
                Distributor Settlement Disabled: No Distributor Assigned
              </h3>
              <p className="text-xs text-rose-700 leading-relaxed">
                {noDistributorMsg ||
                  "Your retailer account is currently not assigned to any authorized distributor in our system. Therefore, transferring settlement funds to a distributor is disabled."}
              </p>
              <p className="text-[11px] text-rose-600 font-medium pt-1">
                👉 If you believe this is an error or need to be mapped to your area distributor for stock top-ups, please reach out to Happy Pay Support or your Regional Relationship Manager.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isSuccess && txnDetails ? (
        /* Success Receipt View */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mx-auto max-w-lg text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Distributor Settlement Successful
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              ₹{formatAmount(txnDetails.amount)} transferred successfully to {txnDetails.distName}.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-5 text-left space-y-3">
              <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-bold text-slate-900">{txnDetails.id}</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Date & Time</span>
                <span className="font-semibold text-slate-700">
                  {txnDetails.date.toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Distributor</span>
                <span className="font-semibold text-slate-900">
                  {txnDetails.distName} ({txnDetails.distId})
                </span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Distributor Contact</span>
                <span className="font-semibold text-slate-800">
                  {txnDetails.contactName}
                </span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Settlement Purpose</span>
                <span className="font-semibold text-slate-700">{txnDetails.reason}</span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="font-bold text-slate-700">Transferred Amount</span>
                <span className="font-bold text-emerald-600 text-base">
                  ₹{formatAmount(txnDetails.amount)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-5 py-3 text-sm font-bold text-white hover:bg-[#6d28d9] transition shadow-sm"
              >
                <RotateCcw className="h-4 w-4" />
                New Settlement
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Transfer Form & Distributor Info Grid */
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Transfer Form Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <form onSubmit={handleTransfer} className="space-y-5">
              {/* Step 1: Destination Distributor Info Card */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  1. Destination Distributor
                </label>
                {isLoading ? (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 animate-pulse space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                ) : hasDistributor && distributor ? (
                  <div className="w-full flex items-start justify-between p-4 rounded-xl border border-[#7c3aed] bg-[#f8f5ff] ring-1 ring-[#7c3aed] text-left">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs bg-[#7c3aed] text-white">
                        <Building className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-slate-900">
                            {distributor.name}
                          </p>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                            Assigned Partner
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Shop: {distributor.shopName} • Contact: {distributor.phone || "N/A"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          ID: {distributor.customId} • {distributor.address}
                        </p>
                      </div>
                    </div>

                    <div className="h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 border-[#7c3aed] bg-[#7c3aed]">
                      <Check className="h-3 w-3 text-white stroke-[3]" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-xs flex items-center gap-2">
                    <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>No authorized destination distributor mapped to your retailer profile.</span>
                  </div>
                )}
              </div>

              {/* Step 2: Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    2. Enter Transfer Amount
                  </label>
                  <span className="text-xs text-slate-500">
                    Available: ₹{formatAmount(balance)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (transferError) setTransferError("");
                    }}
                    placeholder="Enter amount (min ₹100)"
                    min="100"
                    max={balance}
                    disabled={!hasDistributor || !canTransfer || isProcessing}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-9 pr-4 text-lg font-bold text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {/* Quick Selection Chips */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[500, 1000, 2500, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      disabled={!hasDistributor || !canTransfer || isProcessing}
                      onClick={() => handleQuickAmount(val)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +₹{val.toLocaleString("en-IN")}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={!hasDistributor || !canTransfer || isProcessing}
                    onClick={() => handleQuickAmount("full")}
                    className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Full Balance
                  </button>
                </div>
              </div>

              {/* Step 3: Settlement Purpose */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  3. Settlement Purpose / Note
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={!hasDistributor || !canTransfer || isProcessing}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 px-4 text-xs font-bold text-slate-800 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="Wallet Top-up / Stock Reorder">Wallet Top-up / Stock Reorder</option>
                  <option value="Daily Cash Settlement">Daily Cash Settlement</option>
                  <option value="Hardware / Micro-ATM Purchase">Hardware / Micro-ATM Purchase</option>
                  <option value="Other Service Settlement">Other Service Settlement</option>
                </select>
              </div>

              {/* Step 4: Security MPIN */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  4. Security MPIN
                </label>
                <div className="relative">
                  <input
                    type={showMpin ? "text" : "password"}
                    value={mpin}
                    onChange={(e) =>
                      setMpin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="Enter 4-digit MPIN"
                    maxLength={4}
                    disabled={!hasDistributor || !canTransfer || isProcessing}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-4 pr-11 text-base font-bold tracking-widest text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    required
                  />
                  <button
                    type="button"
                    disabled={!hasDistributor || !canTransfer || isProcessing}
                    onClick={() => setShowMpin(!showMpin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                  >
                    {showMpin ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {!hasMpin && (
                  <p className="mt-1.5 text-[11px] text-amber-600 font-medium">
                    Transaction MPIN is not configured on your account.{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/retailer/profile/security")}
                      className="underline font-bold text-amber-700 hover:text-amber-800"
                    >
                      Set up MPIN now
                    </button>
                  </p>
                )}
              </div>

              {transferError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                  {transferError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  !hasDistributor ||
                  !canTransfer ||
                  isProcessing ||
                  numAmount < 100 ||
                  mpin.length < 4
                }
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] py-3.5 text-sm font-bold text-white transition hover:bg-[#6d28d9] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing Settlement...
                  </>
                ) : !hasDistributor || !canTransfer ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Transfer Disabled (No Distributor Assigned)
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Transfer ₹{formatAmount(numAmount)} to Distributor
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Summary & Distributor Info */}
          <div className="space-y-5">
            {/* Transfer Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">
                Settlement Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Distributor</span>
                  <span className="font-semibold text-slate-800">
                    {distributor?.name || "None Assigned"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Distributor ID</span>
                  <span className="font-bold text-purple-700">
                    {distributor?.customId || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Settlement Amount</span>
                  <span className="font-bold text-slate-900">
                    ₹{formatAmount(numAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Transfer Charges</span>
                  <span className="font-semibold text-emerald-600">₹0.00 (Free)</span>
                </div>
                <div className="flex justify-between pt-1 text-sm font-bold">
                  <span className="text-slate-900">Net Transferred</span>
                  <span className="text-[#7c3aed]">₹{formatAmount(numAmount)}</span>
                </div>
              </div>
            </div>

            {/* Distributor Support Contact */}
            <div className="rounded-2xl border border-slate-200 bg-[#f8f5ff] p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7c3aed]">
                <Headphones className="h-4 w-4" />
                <span>Distributor Support Desk</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Need priority stock approval or high-volume limit top-ups? Contact your assigned distributor directly:
              </p>
              {hasDistributor && distributor ? (
                <div className="rounded-xl bg-white p-3 border border-purple-100 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <User className="h-3.5 w-3.5 text-purple-700" />
                    <span>{distributor.contactName}</span>
                  </div>
                  {distributor.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-purple-700" />
                      <a
                        href={`tel:${distributor.phone}`}
                        className="hover:underline text-purple-700 font-medium"
                      >
                        {distributor.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <MapPin className="h-3.5 w-3.5 text-purple-700 shrink-0" />
                    <span className="truncate">{distributor.address}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-white p-3 border border-slate-200 text-xs text-slate-500">
                  No distributor desk currently linked. Contact Happy Pay Support at 1800-XXX-XXXX for assistance.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Distributor Settlements History Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#7c3aed]" />
            <h3 className="font-bold text-slate-900 text-sm">
              Recent Distributor Settlements
            </h3>
          </div>
          <button
            type="button"
            onClick={fetchRecentTransfers}
            className="text-xs text-purple-700 font-bold hover:underline inline-flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isLoadingRecent ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {isLoadingRecent ? (
          <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
            Loading recent distributor transfers...
          </div>
        ) : recentTransfers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 pr-4">Txn ID</th>
                  <th className="py-2.5 pr-4">Distributor</th>
                  <th className="py-2.5 pr-4">Date</th>
                  <th className="py-2.5 pr-4">Amount</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransfers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 pr-4 font-mono font-medium text-slate-700">
                      {item.id}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-slate-900">
                      {item.name}
                      {item.shopName ? ` (${item.shopName})` : ""}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500">
                      {new Date(item.date).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-2.5 pr-4 font-bold text-slate-900">
                      ₹{formatAmount(item.amount)}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No past distributor settlements recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
