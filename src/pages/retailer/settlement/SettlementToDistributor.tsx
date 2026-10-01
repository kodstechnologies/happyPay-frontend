import { useState } from "react";
import {
  ArrowLeft,
  Building,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Headphones,
  MapPin,
  Phone,
  Printer,
  RotateCcw,
  Send,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getWalletBalance, setWalletBalance } from "../../../utils/wallet";

const DISTRIBUTORS = [
  {
    id: "HP-DIST-2088",
    name: "Shree Ganesh Communications",
    contactName: "Ganesh Verma",
    zone: "West Regional Hub",
    phone: "+91 9812345678",
    address: "Shop 12, Commercial Hub, Sector 18",
    isPrimary: true,
  },
  {
    id: "HP-DIST-3142",
    name: "City Digital Distributor Network",
    contactName: "Sunil Patel",
    zone: "North District Point",
    phone: "+91 9898765432",
    address: "Plot 45, Main Market Road",
    isPrimary: false,
  },
];

const formatAmount = (val: number) =>
  val.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function SettlementToDistributor() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(getWalletBalance);
  const [selectedDistId, setSelectedDistId] = useState(DISTRIBUTORS[0].id);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("Wallet Top-up / Stock Reorder");
  const [mpin, setMpin] = useState("");
  const [showMpin, setShowMpin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txnDetails, setTxnDetails] = useState<{
    id: string;
    date: Date;
    amount: number;
    distName: string;
    distId: string;
    contactName: string;
    reason: string;
  } | null>(null);

  const selectedDist =
    DISTRIBUTORS.find((d) => d.id === selectedDistId) || DISTRIBUTORS[0];
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
      alert("Minimum transfer amount to distributor is ₹100");
      return;
    }
    if (numAmount > balance) {
      alert("Insufficient wallet balance for transfer");
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

      const txnId = `HP-DST-${Date.now().toString().slice(-8)}`;
      setTxnDetails({
        id: txnId,
        date: new Date(),
        amount: numAmount,
        distName: selectedDist.name,
        distId: selectedDist.id,
        contactName: selectedDist.contactName,
        reason: reason,
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
            <span className="text-xs font-medium text-purple-100">
              Available Wallet Balance
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
            <span>Instant Stock Settlement</span>
          </div>
        </div>

        {/* Assigned Distributor */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Assigned Distributor
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Linked
            </span>
          </div>
          <p className="mt-2 text-base font-bold text-slate-900 truncate">
            {selectedDist.name}
          </p>
          <p className="text-xs font-medium text-slate-600 mt-0.5">
            {selectedDist.contactName} • {selectedDist.id}
          </p>
          <p className="mt-2 text-[11px] text-slate-400">
            {selectedDist.zone}
          </p>
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
            <span>Max: No Limit</span>
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
              {/* Step 1: Select Distributor */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  1. Select Destination Distributor
                </label>
                <div className="space-y-2.5">
                  {DISTRIBUTORS.map((dist) => {
                    const isSelected = selectedDistId === dist.id;
                    return (
                      <button
                        key={dist.id}
                        type="button"
                        onClick={() => setSelectedDistId(dist.id)}
                        className={`w-full flex items-start justify-between p-4 rounded-xl border text-left transition ${
                          isSelected
                            ? "border-[#7c3aed] bg-[#f8f5ff] ring-1 ring-[#7c3aed]"
                            : "border-slate-200 bg-slate-50 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                            isSelected ? "bg-[#7c3aed] text-white" : "bg-purple-100 text-purple-700"
                          }`}>
                            <Building className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-slate-900">
                                {dist.name}
                              </p>
                              {dist.isPrimary && (
                                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                                  Primary
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              Contact: {dist.contactName} ({dist.phone})
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              ID: {dist.id} • {dist.zone}
                            </p>
                          </div>
                        </div>

                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                          isSelected ? "border-[#7c3aed] bg-[#7c3aed]" : "border-slate-300"
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-white stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Amount */}
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

              {/* Step 3: Reason */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  3. Settlement Purpose / Note
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 px-4 text-xs font-bold text-slate-800 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/20"
                >
                  <option value="Wallet Top-up / Stock Reorder">Wallet Top-up / Stock Reorder</option>
                  <option value="Cash Settlement">Daily Cash Settlement</option>
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
                    {selectedDist.name}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Distributor ID</span>
                  <span className="font-bold text-purple-700">{selectedDist.id}</span>
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
              <div className="rounded-xl bg-white p-3 border border-purple-100 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <User className="h-3.5 w-3.5 text-purple-700" />
                  <span>{selectedDist.contactName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-3.5 w-3.5 text-purple-700" />
                  <span>{selectedDist.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <MapPin className="h-3.5 w-3.5 text-purple-700" />
                  <span>{selectedDist.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
