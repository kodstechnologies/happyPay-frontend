import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Printer,
  RotateCcw,
  ShieldCheck,
  Wallet,
  AlertTriangle,
  PlusCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { setWalletBalance } from "../../../utils/wallet";
import {
  getSettlementBankInfoApi,
  initiateSettlementPayoutApi,
  type SettlementBankItem,
  type SettlementRetailerInfo,
  type SettlementLimits,
  type InitiateSettlementPayload,
} from "../../../apis/wallet.apis";
import { getGeolocationCoordinates } from "../../../utils/geolocation";

const formatAmount = (val: number) =>
  val.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function SettlementToBank() {
  const navigate = useNavigate();

  // API State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retailer, setRetailer] = useState<SettlementRetailerInfo | null>(null);
  const [banks, setBanks] = useState<SettlementBankItem[]>([]);
  const [limits, setLimits] = useState<SettlementLimits>({
    minSettlementAmount: 100,
    maxSettlementPerTxn: 50000,
    dailySettlementLimit: 200000,
    supportedModes: ["IMPS", "NEFT"],
  });
  const [balance, setBalance] = useState<number>(0);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [settlementMode] = useState<"IMPS" | "NEFT">("IMPS");
  const [amount, setAmount] = useState("");
  const [mpin, setMpin] = useState("");
  const [showMpin, setShowMpin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txnDetails, setTxnDetails] = useState<{
    id: string;
    date: Date;
    amount: number;
    bankName: string;
    accountNumber: string;
    mode: string;
    utr: string;
  } | null>(null);

  // Fetch live settlement bank & retailer info
  const fetchSettlementInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSettlementBankInfoApi();
      if (response && response.data) {
        const { retailer: retData, wallet: wallData, banks: bankData, primaryBank, limits: limitData } =
          response.data;

        setRetailer(retData);
        setBanks(bankData || []);
        if (limitData) setLimits(limitData);

        const available = wallData?.availableBalance ?? 0;
        setBalance(available);
        setWalletBalance(available);

        // Select primary bank or first available bank
        const activeBankId =
          primaryBank?.id ||
          primaryBank?._id ||
          bankData?.[0]?.id ||
          bankData?.[0]?._id ||
          "";
        setSelectedBankId(activeBankId);
      } else {
        setError(response?.message || "Failed to load settlement details");
      }
    } catch (err: unknown) {
      console.error("Settlement data fetch error:", err);
      const msg = err instanceof Error ? err.message : "Failed to load settlement details. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    getSettlementBankInfoApi()
      .then((response) => {
        if (ignore) return;
        if (response && response.data) {
          const { retailer: retData, wallet: wallData, banks: bankData, primaryBank, limits: limitData } =
            response.data;

          setRetailer(retData);
          setBanks(bankData || []);
          if (limitData) setLimits(limitData);

          const available = wallData?.availableBalance ?? 0;
          setBalance(available);
          setWalletBalance(available);

          // Select primary bank or first available bank
          const activeBankId =
            primaryBank?.id ||
            primaryBank?._id ||
            bankData?.[0]?.id ||
            bankData?.[0]?._id ||
            "";
          setSelectedBankId(activeBankId);
        } else {
          setError(response?.message || "Failed to load settlement details");
        }
      })
      .catch((err: unknown) => {
        if (ignore) return;
        console.error("Settlement data fetch error:", err);
        const msg = err instanceof Error ? err.message : "Failed to load settlement details. Please try again.";
        setError(msg);
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const selectedBank =
    banks.find((b) => (b.id && b.id === selectedBankId) || (b._id && b._id === selectedBankId)) ||
    banks[0] ||
    null;

  const numAmount = Number(amount) || 0;

  const handleQuickAmount = (val: number | "full") => {
    if (val === "full") {
      setAmount(balance.toString());
    } else {
      setAmount(val.toString());
    }
  };

  const [transferError, setTransferError] = useState<string | null>(null);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    if (!retailer?.isKycApproved) {
      alert("Your KYC is not yet approved. Settlements are disabled until approval.");
      return;
    }

    if (!selectedBank) {
      alert("Please select a destination bank account");
      return;
    }

    const minAmt = limits.minSettlementAmount || 100;
    const maxAmt = limits.maxSettlementPerTxn || 50000;

    if (numAmount < minAmt) {
      alert(`Minimum settlement amount is ₹${minAmt}`);
      return;
    }
    if (numAmount > maxAmt) {
      alert(`Maximum settlement amount per transaction is ₹${maxAmt}`);
      return;
    }
    if (numAmount > balance) {
      alert("Insufficient wallet balance for settlement");
      return;
    }
    if (mpin.length < 4) {
      alert("Please enter a valid 4-digit MPIN");
      return;
    }

    setIsProcessing(true);
    try {
      const coords = await getGeolocationCoordinates();
      const bankCode = String(selectedBank.bank_id || selectedBank.id || selectedBank._id || "").trim();

      // Required fields: accountType, branchName, benMobile, bank_code (bank_id), beneficiary_name, ifsc, account_number, amount, mode, lat, long
      const payload: InitiateSettlementPayload = {
        accountType: selectedBank.accountType || "Savings Account",
        branchName: selectedBank.branchName || "",
        benMobile: retailer?.mobile || "",
        bank_code: bankCode,
        bank_name: selectedBank.name,
        beneficiary_name: retailer?.fullName || "",
        ifsc: selectedBank.ifscCode,
        account_number: selectedBank.accountNumber,
        amount: numAmount,
        mode: settlementMode,
        lat: coords.latitude,
        long: coords.longitude,
      };

      const res = await initiateSettlementPayoutApi(payload);

      if (res && res.data) {
        const payoutData = res.data;
        const newBalance = payoutData.balanceAfter ?? balance - numAmount;
        setBalance(newBalance);
        setWalletBalance(newBalance);

        setTxnDetails({
          id: payoutData.txnid || `HP-BNK-${Date.now().toString().slice(-8)}`,
          date: new Date(),
          amount: payoutData.amount || numAmount,
          bankName: payoutData.bankName || selectedBank.name,
          accountNumber: payoutData.accountNumber || selectedBank.accountNumber,
          mode: payoutData.mode || settlementMode,
          utr: payoutData.utr || payoutData.txnid,
        });

        setIsSuccess(true);
      } else {
        throw new Error(res?.message || "Settlement payout failed");
      }
    } catch (err: unknown) {
      console.error("Settlement payout error:", err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Settlement payout failed. Please try again.");
      setTransferError(msg);
      alert(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setAmount("");
    setMpin("");
    setTransferError(null);
    setIsSuccess(false);
    setTxnDetails(null);
  };


  return (
    <div className="mx-auto w-full  space-y-6">
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
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
                Settlement Services
              </p>
              {retailer && (
                <span className="text-[10px] font-medium text-slate-400">
                  • {retailer.fullName || retailer.mobile}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Transfer to Bank
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Settle your retailer earnings instantly to your registered bank account.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {retailer?.isKycApproved ? (
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Instant IMPS Active (24x7)
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-3.5 py-1.5 text-xs font-semibold text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              KYC {retailer?.adminApproved ? retailer.adminApproved.toUpperCase() : "PENDING"}
            </div>
          )}
        </div>
      </div>

      {/* KYC Alert if not approved */}
      {!loading && retailer && !retailer.isKycApproved && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-amber-800">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">Settlement Locked:</span> Your account KYC status is currently{" "}
            <span className="font-bold uppercase underline">{retailer.adminApproved}</span>. Bank settlements are enabled
            once your documentation is reviewed and approved by administrator.
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl border border-slate-200 bg-slate-100/70 animate-pulse p-5" />
            ))}
          </div>
          <div className="h-64 rounded-2xl border border-slate-200 bg-slate-100/70 animate-pulse" />
        </div>
      ) : error ? (
        /* Error State */
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-800">{error}</p>
          <button
            type="button"
            onClick={fetchSettlementInfo}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : (
        <>
          {/* Snapshot Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Balance Card */}
            <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] p-5 text-white shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-purple-100">
                  Available for Settlement
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Wallet className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
                ₹{formatAmount(balance)}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-purple-200">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-200" />
                <span>100% Secure Gateway</span>
              </div>
            </div>

            {/* Selected Bank Snapshot */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Primary Settlement A/C
                </span>
                {selectedBank ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Verified
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    Not Linked
                  </span>
                )}
              </div>
              {selectedBank ? (
                <>
                  <p className="mt-2 text-base font-bold text-slate-900 truncate">
                    {selectedBank.name}
                  </p>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    A/C: {selectedBank.maskedAccountNumber || `•••• •••• ${selectedBank.accountNumber.slice(-4)}`}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    IFSC: {selectedBank.ifscCode} {selectedBank.branchName ? `• ${selectedBank.branchName}` : ""}
                  </p>
                </>
              ) : (
                <div className="mt-2 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">No bank account linked</p>
                  <button
                    type="button"
                    onClick={() => navigate("/retailer/profile/bank-details")}
                    className="mt-2 text-[11px] font-bold text-[#7c3aed] hover:underline inline-flex items-center gap-1"
                  >
                    <PlusCircle className="h-3 w-3" /> Link Bank Account
                  </button>
                </div>
              )}
            </div>

            {/* Limits & Timing */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Daily Settlement Limit
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-base font-bold text-slate-900">
                ₹{formatAmount(limits.dailySettlementLimit)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>Min: ₹{formatAmount(limits.minSettlementAmount)}</span>
                <span>Max/Txn: ₹{formatAmount(limits.maxSettlementPerTxn)}</span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          {isSuccess && txnDetails ? (
            /* Success Receipt View */
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="mx-auto max-w-lg text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Settlement Initiated Successfully
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  ₹{formatAmount(txnDetails.amount)} has been dispatched to your bank account via {txnDetails.mode}.
                </p>

                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-5 text-left space-y-3">
                  <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Transaction ID</span>
                    <span className="font-bold text-slate-900">{txnDetails.id}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Bank Reference (UTR)</span>
                    <span className="font-bold text-slate-900">{txnDetails.utr}</span>
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
                    <span className="text-slate-500">Settlement Account</span>
                    <span className="font-semibold text-slate-900">
                      {txnDetails.bankName} (•••• {txnDetails.accountNumber.slice(-4)})
                    </span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Settlement Mode</span>
                    <span className="font-bold text-purple-700">{txnDetails.mode}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="font-bold text-slate-700">Net Transferred</span>
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
            /* Transfer Form & Summary Grid */
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              {/* Transfer Form Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <form onSubmit={handleTransfer} className="space-y-5">
                  {/* Step 1: Select Bank Account */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        1. Select Destination Bank Account
                      </label>
                      <button
                        type="button"
                        onClick={() => navigate("/retailer/profile/bank-details")}
                        className="text-xs font-semibold text-[#7c3aed] hover:underline inline-flex items-center gap-1"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> Add / Manage
                      </button>
                    </div>

                    {banks.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center">
                        <Building2 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">No bank account linked</p>
                        <p className="text-xs text-slate-500 mt-1">
                          You need to add a verified bank account in your profile to settle funds.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate("/retailer/profile/bank-details")}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#7c3aed] px-4 py-2 text-xs font-bold text-white hover:bg-[#6d28d9] transition shadow-sm"
                        >
                          <PlusCircle className="h-3.5 w-3.5" /> Link Bank Account Now
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {banks.map((b) => {
                          const bankKey = b.id || b._id;
                          const isSelected = selectedBankId === bankKey;
                          return (
                            <button
                              key={bankKey}
                              type="button"
                              onClick={() => setSelectedBankId(bankKey)}
                              className={`flex flex-col text-left p-3.5 rounded-xl border transition ${
                                isSelected
                                  ? "border-[#7c3aed] bg-[#f8f5ff] ring-1 ring-[#7c3aed]"
                                  : "border-slate-200 bg-slate-50 hover:bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-slate-900 truncate">
                                  {b.name}
                                </span>
                                {b.isPrimary && (
                                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 mt-1">
                                A/C: {b.maskedAccountNumber || b.accountNumber}
                              </span>
                              <span className="text-[11px] text-slate-400 mt-0.5">
                                IFSC: {b.ifscCode}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Step 2: Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        2. Enter Settlement Amount
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
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`Enter amount (min ₹${limits.minSettlementAmount})`}
                        min={limits.minSettlementAmount}
                        max={balance}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-9 pr-4 text-lg font-bold text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/20"
                        required
                        disabled={banks.length === 0 || !retailer?.isKycApproved}
                      />
                    </div>

                    {/* Quick Selection Chips */}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {[500, 1000, 2500, 5000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleQuickAmount(val)}
                          disabled={banks.length === 0 || !retailer?.isKycApproved}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50"
                        >
                          +₹{val.toLocaleString("en-IN")}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleQuickAmount("full")}
                        disabled={banks.length === 0 || !retailer?.isKycApproved}
                        className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50"
                      >
                        Full Balance
                      </button>
                    </div>
                  </div>

                  {/* Step 3: Security MPIN */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      3. Security MPIN
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
                        disabled={banks.length === 0 || !retailer?.isKycApproved}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-4 pr-11 text-base font-bold tracking-widest text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/20 disabled:opacity-50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowMpin(!showMpin)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showMpin ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {transferError && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span>{transferError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={
                      isProcessing ||
                      numAmount <= 0 ||
                      mpin.length < 4 ||
                      banks.length === 0 ||
                      !retailer?.isKycApproved
                    }
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] py-3.5 text-sm font-bold text-white transition hover:bg-[#6d28d9] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing Settlement...
                      </>
                    ) : !retailer?.isKycApproved ? (
                      "Settlement Disabled (KYC Pending)"
                    ) : banks.length === 0 ? (
                      "Link a Bank Account to Settle"
                    ) : (
                      <>
                        <Building2 className="h-4 w-4" />
                        Transfer ₹{formatAmount(numAmount)} to Bank
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Summary & Guidelines Card */}
              <div className="space-y-5">
                {/* Important Notes */}
                <div className="rounded-2xl border border-slate-200 bg-[#f8f5ff] p-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7c3aed]">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Settlement Guidelines</span>
                  </div>
                  <ul className="mt-3 space-y-2 text-xs text-slate-600 list-disc list-inside leading-relaxed">
                    <li>IMPS transfers are credited instantly into your verified account 24x7.</li>
                    <li>Ensure the destination bank account is active and verified.</li>
                    <li>Zero convenience fees for retailer settlement payouts.</li>
                    <li>
                      Per-transaction limit is ₹{formatAmount(limits.maxSettlementPerTxn)}.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

