import { useState } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  History,
  Lock,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getWalletBalance, setWalletBalance } from "../../../utils/wallet";

const RECENT_TRANSFERS = [
  {
    id: "P2P-9812401",
    name: "Ramesh Kumar",
    shopName: "Ramesh Telecom",
    mobile: "9876543210",
    amount: 1500,
    date: "Today, 11:20 AM",
    status: "Success",
  },
  {
    id: "P2P-9811982",
    name: "Pooja Verma",
    shopName: "Verma Digital Center",
    mobile: "9812345678",
    amount: 3000,
    date: "Yesterday",
    status: "Success",
  },
];

const formatAmount = (val: number) =>
  val.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function SettlementToRetailer() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(getWalletBalance);
  const [mobile, setMobile] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedRetailer, setVerifiedRetailer] = useState<{
    name: string;
    shopName: string;
    id: string;
    mobile: string;
  } | null>(null);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [mpin, setMpin] = useState("");
  const [showMpin, setShowMpin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txnDetails, setTxnDetails] = useState<{
    id: string;
    date: Date;
    amount: number;
    recipientName: string;
    shopName: string;
    recipientMobile: string;
    remarks?: string;
  } | null>(null);

  const numAmount = Number(amount) || 0;

  const handleVerify = () => {
    if (mobile.length !== 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerifiedRetailer({
        name: "Sunil Sharma",
        shopName: "Sharma Mobile & CSC Center",
        id: "RET-8842",
        mobile: mobile,
      });
    }, 600);
  };

  const handleQuickAmount = (val: number | "full") => {
    if (val === "full") {
      setAmount(balance.toString());
    } else {
      setAmount(val.toString());
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedRetailer) {
      alert("Please verify recipient retailer mobile number first");
      return;
    }
    if (numAmount < 10) {
      alert("Minimum transfer amount is ₹10");
      return;
    }
    if (numAmount > balance) {
      alert("Insufficient wallet balance");
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

      const txnId = `HP-P2P-${Date.now().toString().slice(-8)}`;
      setTxnDetails({
        id: txnId,
        date: new Date(),
        amount: numAmount,
        recipientName: verifiedRetailer.name,
        shopName: verifiedRetailer.shopName,
        recipientMobile: verifiedRetailer.mobile,
        remarks: remarks,
      });

      setIsProcessing(false);
      setIsSuccess(true);
    }, 1500);
  };

  const handleReset = () => {
    setMobile("");
    setVerifiedRetailer(null);
    setAmount("");
    setRemarks("");
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
              Retailer to Retailer (P2P)
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Instant peer-to-peer wallet balance transfer to another registered retailer.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50/80 px-3.5 py-1.5 text-xs font-semibold text-purple-700">
          <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          Instant Wallet Settlement (0% Fee)
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
            <span>Instant P2P Transfer</span>
          </div>
        </div>

        {/* Transfer Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Transfer Fee
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Free
            </span>
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-600">
            ₹0.00 Charges
          </p>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Unlimited peer-to-peer transfers
          </p>
        </div>

        {/* Security Feature */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Security Level
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-base font-bold text-slate-900">
            MPIN Protected
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Verified retailer verification
          </p>
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
              P2P Transfer Successful
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              ₹{formatAmount(txnDetails.amount)} transferred successfully to {txnDetails.recipientName}.
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
                <span className="text-slate-500">Recipient Retailer</span>
                <span className="font-semibold text-slate-900">
                  {txnDetails.recipientName} ({txnDetails.shopName})
                </span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Recipient Mobile</span>
                <span className="font-semibold text-slate-800">
                  +91 {txnDetails.recipientMobile}
                </span>
              </div>
              {txnDetails.remarks && (
                <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Remarks</span>
                  <span className="font-semibold text-slate-700">{txnDetails.remarks}</span>
                </div>
              )}
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
                New Transfer
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Transfer Form & Recent History Grid */
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Transfer Form Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <form onSubmit={handleTransfer} className="space-y-5">
              {/* Step 1: Recipient Mobile & Verification */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  1. Recipient Retailer Mobile Number
                </label>
                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                        if (verifiedRetailer) setVerifiedRetailer(null);
                      }}
                      placeholder="Enter 10-digit registered mobile"
                      maxLength={10}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/20"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifying || mobile.length !== 10}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#7c3aed] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#6d28d9] disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Search className="h-3.5 w-3.5" />
                        Verify
                      </>
                    )}
                  </button>
                </div>

                {/* Verified Retailer Preview Card */}
                {verifiedRetailer && (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {verifiedRetailer.name}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {verifiedRetailer.shopName} • {verifiedRetailer.id}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Verified Retailer
                    </span>
                  </div>
                )}
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
                    placeholder="Enter amount (min ₹10)"
                    min="10"
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

              {/* Step 3: Remarks (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  3. Remarks / Note (Optional)
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Daily cash adjustment / Emergency balance"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 px-4 text-xs font-medium text-slate-800 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/20"
                />
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
                disabled={
                  isProcessing ||
                  !verifiedRetailer ||
                  numAmount <= 0 ||
                  mpin.length < 4
                }
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] py-3.5 text-sm font-bold text-white transition hover:bg-[#6d28d9] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing P2P Transfer...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4" />
                    Transfer ₹{formatAmount(numAmount)} to Retailer
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Summary & Recent History */}
          <div className="space-y-5">
            {/* Transfer Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">
                Transfer Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Recipient</span>
                  <span className="font-semibold text-slate-800">
                    {verifiedRetailer ? verifiedRetailer.name : "Not Verified"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Transfer Type</span>
                  <span className="font-bold text-purple-700">Wallet-to-Wallet</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Transfer Amount</span>
                  <span className="font-bold text-slate-900">
                    ₹{formatAmount(numAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Transfer Fee</span>
                  <span className="font-semibold text-emerald-600">₹0.00 (Free)</span>
                </div>
                <div className="flex justify-between pt-1 text-sm font-bold">
                  <span className="text-slate-900">Total Deducted</span>
                  <span className="text-[#7c3aed]">₹{formatAmount(numAmount)}</span>
                </div>
              </div>
            </div>

            {/* Recent P2P History */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <History className="h-4 w-4 text-[#7c3aed]" />
                  <span>Recent P2P Transfers</span>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {RECENT_TRANSFERS.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.mobile} • {item.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        ₹{formatAmount(item.amount)}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-600">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
