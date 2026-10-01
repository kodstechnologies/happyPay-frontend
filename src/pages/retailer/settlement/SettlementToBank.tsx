import { useState } from "react";
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
  
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getWalletBalance, setWalletBalance } from "../../../utils/wallet";

const REGISTERED_BANKS = [
  {
    id: "SBI",
    name: "State Bank of India",
    accountNumber: "40918237192",
    ifsc: "SBIN0001234",
    branch: "Main Branch, Mumbai",
    isPrimary: true,
  },
  {
    id: "HDFC",
    name: "HDFC Bank",
    accountNumber: "5010048291034",
    ifsc: "HDFC0000045",
    branch: "Nariman Point Branch",
    isPrimary: false,
  },
];

const formatAmount = (val: number) =>
  val.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function SettlementToBank() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(getWalletBalance);
  const [selectedBankId, setSelectedBankId] = useState(REGISTERED_BANKS[0].id);
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

  const selectedBank =
    REGISTERED_BANKS.find((b) => b.id === selectedBankId) ||
    REGISTERED_BANKS[0];
  const numAmount = Number(amount) || 0;

  const handleQuickAmount = (val: number | "full") => {
    if (val === "full") {
      setAmount(balance.toString());
    } else {
      setAmount(val.toString());
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount < 100) {
      alert("Minimum settlement amount is ₹100");
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
    setTimeout(() => {
      const nextBalance = balance - numAmount;
      setBalance(nextBalance);
      setWalletBalance(nextBalance);

      const txnId = `HP-BNK-${Date.now().toString().slice(-8)}`;
      const utr = `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      setTxnDetails({
        id: txnId,
        date: new Date(),
        amount: numAmount,
        bankName: selectedBank.name,
        accountNumber: selectedBank.accountNumber,
        mode: settlementMode,
        utr: utr,
      });

      setIsProcessing(false);
      setIsSuccess(true);
    }, 1500);
  };

  const handleReset = () => {
    setAmount("");
    setMpin("");
    setIsSuccess(false);
    setTxnDetails(null);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
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
              Transfer to Bank
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Settle your retailer earnings instantly to your registered bank account.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Instant IMPS Active (24x7)
        </div>
      </div>

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
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              Verified
            </span>
          </div>
          <p className="mt-2 text-base font-bold text-slate-900 truncate">
            {selectedBank.name}
          </p>
          <p className="text-xs font-medium text-slate-600 mt-0.5">
            A/C: •••• •••• {selectedBank.accountNumber.slice(-4)}
          </p>
          <p className="mt-2 text-[11px] text-slate-400">
            IFSC: {selectedBank.ifsc}
          </p>
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
            ₹2,00,000.00
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Min: ₹100</span>
            <span>Max/Txn: ₹50,000</span>
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  1. Select Destination Bank Account
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {REGISTERED_BANKS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBankId(b.id)}
                      className={`flex flex-col text-left p-3.5 rounded-xl border transition ${
                        selectedBankId === b.id
                          ? "border-[#7c3aed] bg-[#f8f5ff] ring-1 ring-[#7c3aed]"
                          : "border-slate-200 bg-slate-50 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">
                          {b.name}
                        </span>
                        {b.isPrimary && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 mt-1">
                        A/C: {b.accountNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        IFSC: {b.ifsc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

      
              {/* Step 3: Amount */}
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
                    placeholder="Enter amount (min ₹100)"
                    min="100"
                    max={balance}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-9 pr-4 text-lg font-bold text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/20"
                    required
                  />
                </div>

                {/* Quick Selection Chips */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[500, 1000, 2500, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAmount(val)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:border-slate-300"
                    >
                      +₹{val.toLocaleString("en-IN")}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleQuickAmount("full")}
                    className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 transition hover:bg-purple-100"
                  >
                    Full Balance
                  </button>
                </div>
              </div>

              {/* Step 4: Security MPIN */}
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-4 pr-11 text-base font-bold tracking-widest text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/20"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing || numAmount <= 0 || mpin.length < 4}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] py-3.5 text-sm font-bold text-white transition hover:bg-[#6d28d9] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing Settlement...
                  </>
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
                <li>Ensure the bank account is active before initiating larger transfers.</li>
                <li>Zero convenience fees for retailer settlement payouts.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
