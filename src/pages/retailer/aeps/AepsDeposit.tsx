import React, { useState } from "react";
import {
  CheckCircle2,
  Fingerprint,
  Loader2,
  Printer,
  RefreshCw,
  Landmark,
  UserCircle,
  ChevronDown,
  Settings2,
} from "lucide-react";
import { getWalletBalance, setWalletBalance } from "../../../utils/wallet";

interface AepsDepositProps {
  onBack?: () => void;
}

type Step = "FORM" | "BIOMETRIC";
type TransactionStatus = "IDLE" | "PROCESSING" | "SUCCESS";

const BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
];

const DEVICES = [
  "Mantra MFS100",
  "Morpho E3",
  "StarTek FM220",
];

const AepsDeposit: React.FC<AepsDepositProps> = () => {
  const [step, setStep] = useState<Step>("FORM");
  const [aadhaar, setAadhaar] = useState("");
  const [bank, setBank] = useState("");
  const [amount, setAmount] = useState("");
  const [consent, setConsent] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0]);
  const [isScanning, setIsScanning] = useState(false);
  
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>("IDLE");
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [transactionDate, setTransactionDate] = useState<Date | null>(null);

  const handleAadhaarChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setAadhaar(event.target.value.replace(/\D/g, "").slice(0, 12));
  };

  const handleAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  const resetForm = () => {
    setStep("FORM");
    setAadhaar("");
    setBank("");
    setAmount("");
    setConsent(false);
    setIsScanning(false);
    setTransactionStatus("IDLE");
    setShowReceipt(false);
    setTransactionId("");
    setTransactionDate(null);
  };

  const handleProceedToBiometric = () => {
    if (aadhaar.length !== 12 || !bank || !amount || !consent) {
      return;
    }
    setStep("BIOMETRIC");
  };

  const handleScanAndDeposit = () => {
    setIsScanning(true);

    window.setTimeout(() => {
      setIsScanning(false);
      setTransactionStatus("PROCESSING");

      window.setTimeout(() => {
        setTransactionId(
          `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
        );
        setTransactionDate(new Date());
        
        const currentBalance = getWalletBalance();
        const depositAmount = Number(amount);
        const commission = 5; 
        
        setWalletBalance(currentBalance - depositAmount + commission);

        setTransactionStatus("SUCCESS");
        setShowReceipt(true);
      }, 1800);
    }, 2200);
  };

  const handlePrint = () => {
    window.print();
  };

  const isFormValid =
    aadhaar.length === 12 &&
    bank !== "" &&
    Number(amount) > 0 &&
    consent;

  return (
    <div className="w-full">
      {/* Form Step */}
      {step === "FORM" && (
        <section className="animate-in fade-in duration-500 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Aadhaar */}
              <div>
                <label
                  htmlFor="aadhaar-number"
                  className="text-xs font-semibold text-slate-600"
                >
                  Customer Aadhaar Number <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-[#7c3aed] focus-within:bg-white">
                  <UserCircle className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    id="aadhaar-number"
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    value={aadhaar}
                    onChange={handleAadhaarChange}
                    placeholder="Enter 12-digit Aadhaar number"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-normal"
                  />
                  <span className="text-[10px] text-slate-400">
                    {aadhaar.length}/12
                  </span>
                </div>
              </div>

              {/* Bank Selection */}
              <div>
                <label
                  htmlFor="bank-select"
                  className="text-xs font-semibold text-slate-600"
                >
                  Select Bank <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 flex h-11 relative items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-[#7c3aed] focus-within:bg-white">
                  <Landmark className="h-4 w-4 shrink-0 text-slate-400 pointer-events-none" />
                  <select
                    id="bank-select"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-semibold text-slate-700 outline-none border-none focus:ring-0 cursor-pointer pr-8"
                  >
                    <option value="" disabled>Select customer's bank</option>
                    {BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label
                  htmlFor="deposit-amount"
                  className="text-xs font-semibold text-slate-600"
                >
                  Deposit Amount <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-[#7c3aed] focus-within:bg-white">
                  <span className="mr-2 text-sm font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    id="deposit-amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Enter deposit amount"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="pt-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 bg-white transition-all checked:border-[#7c3aed] checked:bg-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:ring-offset-1"
                  />
                  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                </div>
                <span className="text-xs leading-relaxed text-slate-600 group-hover:text-slate-900 transition-colors">
                  I hereby give my voluntary consent to HappyPay and its partnering bank to use my Aadhaar details for the purpose of authentication to proceed with this Cash Deposit transaction as per UIDAI guidelines.
                </span>
              </label>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleProceedToBiometric}
              disabled={!isFormValid}
              className="mt-8 flex h-12 w-full md:w-auto md:min-w-[200px] mx-auto items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-6 text-sm font-bold text-white transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proceed to Biometric
            </button>
        </section>
      )}

      {/* Biometric Step */}
      {step === "BIOMETRIC" && (
        <section className="animate-in fade-in duration-500 max-w-2xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <button
                  type="button"
                  onClick={() => setStep("FORM")}
                  disabled={isScanning || transactionStatus === "PROCESSING"}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                  aria-label="Go back"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Review & Authenticate
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Verify details and scan fingerprint to deposit.
                  </p>
                </div>
              </div>

              {/* Prefilled Details Card */}
              <div className="rounded-2xl border-2 border-slate-100 bg-white p-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Deposit Amount</p>
                  <p className="text-2xl font-black text-[#7c3aed]">₹{amount}</p>
                </div>
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-slate-500">Aadhaar</p>
                    <p className="text-sm font-bold text-slate-900">XXXX XXXX {aadhaar.slice(-4)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-slate-500">Bank</p>
                    <p className="text-sm font-bold text-slate-900">{bank}</p>
                  </div>
                </div>
              </div>

              {/* Connected Device Configuration */}
              <div className="rounded-2xl border border-[#7c3aed]/15 bg-[#f4f6fd] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7c3aed]">
                      <Fingerprint className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Connected Device</p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        RD Service Ready
                      </p>
                    </div>
                  </div>
                  
                  {/* Device Dropdown to Change */}
                  <div className="relative group">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 cursor-pointer hover:border-[#7c3aed] transition-colors">
                      <Settings2 className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">{selectedDevice}</span>
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </div>
                    {/* Fake Dropdown list for demo */}
                    <div className="absolute right-0 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      {DEVICES.map(d => (
                        <button
                          key={d}
                          onClick={() => setSelectedDevice(d)}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg ${selectedDevice === d ? "bg-[#f3e8ff] text-[#7c3aed]" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleScanAndDeposit}
                disabled={isScanning || transactionStatus === "PROCESSING"}
                className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#7c3aed] px-4 text-sm font-bold text-white transition hover:bg-[#6d28d9] shadow-lg shadow-[#7c3aed]/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Capturing Fingerprint...
                  </>
                ) : transactionStatus === "PROCESSING" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing Deposit...
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-5 w-5" />
                    Capture Fingerprint & Submit
                  </>
                )}
              </button>
            </div>
        </section>
      )}

      {/* Receipt View */}
      {showReceipt && transactionStatus === "SUCCESS" && (
        <div className="flex w-full items-center justify-center bg-white py-6">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-lg border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Transaction Successful
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Aadhaar Cash Deposit Successful
                </h2>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#f7f8fc] p-5 border border-slate-100">
              <div className="flex justify-between border-b border-slate-200 pb-3 text-sm">
                <span className="text-slate-500 font-medium">Transaction ID</span>
                <span className="font-bold text-slate-900">
                  {transactionId || "-"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 py-3 text-sm">
                <span className="text-slate-500 font-medium">Date</span>
                <span className="font-bold text-slate-900">
                  {transactionDate?.toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }) || "-"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 py-3 text-sm">
                <span className="text-slate-500 font-medium">Aadhaar</span>
                <span className="font-bold text-slate-900">
                  XXXX XXXX {aadhaar.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 py-3 text-sm">
                <span className="text-slate-500 font-medium">Bank</span>
                <span className="font-bold text-slate-900">
                  {bank}
                </span>
              </div>
              <div className="flex justify-between pt-3 items-center">
                <span className="text-sm font-bold text-slate-700">
                  Amount Deposited
                </span>
                <span className="text-xl font-black text-[#7c3aed]">
                  ₹{amount}
                </span>
              </div>
            </div>
            
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 flex justify-between items-center">
               <span className="text-xs font-semibold text-emerald-700">Commission Earned</span>
               <span className="text-sm font-bold text-emerald-700">+ ₹5.00</span>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#7c3aed] text-sm font-bold text-white transition hover:bg-[#6d28d9] shadow-md shadow-[#7c3aed]/20"
              >
                <RefreshCw className="h-4 w-4" />
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AepsDeposit;