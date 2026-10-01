import React, { useState, useEffect } from "react";
import { rdService } from "../../../utils/rdService";
import {
  ArrowLeft,
  CheckCircle2,
  Fingerprint,
  Loader2,
  Printer,
  RefreshCw,
  Landmark,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import { getWalletBalance, setWalletBalance } from "../../../utils/wallet";

interface AadhaarPayProps {
  onBack?: () => void;
}

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

const AadhaarPay: React.FC<AadhaarPayProps> = ({ onBack }) => {
  const [aadhaar, setAadhaar] = useState("");
  const [bank, setBank] = useState("");
  const [amount, setAmount] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>("IDLE");
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [transactionDate, setTransactionDate] = useState<Date | null>(null);

  // Biometric States
  const [availableDevices, setAvailableDevices] = useState<import("../../../utils/rdService").ActiveDevice[]>([]);
  const [selectedDevicePort, setSelectedDevicePort] = useState<number | null>(null);
  const [withdrawalDeviceName, setWithdrawalDeviceName] = useState("Scanning...");
  const [isScanningDevices, setIsScanningDevices] = useState(true);
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);

  const handleScanDevices = async () => {
    setIsScanningDevices(true);
    setWithdrawalDeviceName("Scanning...");
    const devices = await rdService.scanAllDevices();
    setAvailableDevices(devices);
    
    if (devices.length > 0) {
      setSelectedDevicePort(devices[0].port);
      setWithdrawalDeviceName(devices[0].name);
    } else {
      setSelectedDevicePort(null);
      setWithdrawalDeviceName("No device found");
    }
    setIsScanningDevices(false);
  };

  useEffect(() => {
    let isMounted = true;
    rdService.scanAllDevices().then((devices) => {
      if (!isMounted) return;
      setAvailableDevices(devices);
      if (devices.length > 0) {
        setSelectedDevicePort(devices[0].port);
        setWithdrawalDeviceName(devices[0].name);
      } else {
        setSelectedDevicePort(null);
        setWithdrawalDeviceName("No device found");
      }
      setIsScanningDevices(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

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
    setAadhaar("");
    setBank("");
    setAmount("");
    setIsScanning(false);
    setTransactionStatus("IDLE");
    setShowReceipt(false);
    setTransactionId("");
    setTransactionDate(null);
  };

  const handleScan = async () => {
    if (aadhaar.length !== 12 || !bank || !amount) {
      return;
    }
    if (!selectedDevicePort) {
      alert("Please connect and select a biometric device first.");
      return;
    }

    setIsScanning(true);

    try {
      const captureResult = await rdService.captureFingerprint(selectedDevicePort);
      
      if (!captureResult.success) {
        setIsScanning(false);
        alert(captureResult.message);
        return;
      }

      setIsScanning(false);
      setTransactionStatus("PROCESSING");

      window.setTimeout(() => {
        setTransactionId(
          `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
        );
        setTransactionDate(new Date());
        
        // Money flow: Add amount to retailer wallet
        const currentBalance = getWalletBalance();
        setWalletBalance(currentBalance + Number(amount));

        setTransactionStatus("SUCCESS");
      }, 1800);
    } catch {
      setIsScanning(false);
      alert("Error interacting with RD Service");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isFormValid =
    aadhaar.length === 12 &&
    bank !== "" &&
    Number(amount) > 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
            AEPS
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Aadhaar Pay
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Accept payments directly using customer's Aadhaar and Biometrics.
          </p>
        </div>
      </div>

      <section className="hp-card rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 shadow-sm">
        {showReceipt && transactionStatus === "SUCCESS" ? (
          <div className="mx-auto max-w-md animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Transaction Successful
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Aadhaar Pay Receipt
                </h2>
              </div>

              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>

            <div className="mt-5 rounded-xl bg-white p-4 border border-slate-200 shadow-sm">
              <div className="flex justify-between border-b border-slate-200 pb-2 text-xs">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-semibold text-slate-900">
                  {transactionId || "-"}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-200 py-2 text-xs">
                <span className="text-slate-500">Date</span>
                <span className="font-semibold text-slate-900">
                  {transactionDate?.toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }) || "-"}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-200 py-2 text-xs">
                <span className="text-slate-500">Aadhaar</span>
                <span className="font-semibold text-slate-900">
                  XXXX XXXX {aadhaar.slice(-4)}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-200 py-2 text-xs">
                <span className="text-slate-500">Bank</span>
                <span className="font-semibold text-slate-900">
                  {bank}
                </span>
              </div>

              <div className="flex justify-between pt-2 items-center">
                <span className="text-sm font-bold text-slate-700">
                  Amount Credited
                </span>
                <span className="text-xl font-black text-[#7c3aed]">
                  ₹{amount}
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#7c3aed] text-sm font-bold text-white transition hover:bg-[#6d28d9]"
              >
                New Transaction
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-md">
          {/* Form */}
          <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3e8ff]">
                  <Fingerprint className="h-5 w-5 text-[#7c3aed]" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Payment Details
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Enter amount and customer information for Aadhaar Pay.
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label
                  htmlFor="transaction-amount"
                  className="text-xs font-semibold text-slate-600"
                >
                  Transaction Amount
                </label>

                <div className="mt-2 flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-[#7c3aed] focus-within:bg-white">
                  <span className="mr-2 text-sm font-bold text-slate-400">
                    ₹
                  </span>

                  <input
                    id="transaction-amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={isScanning || transactionStatus === "PROCESSING"}
                    placeholder="Enter amount"
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Aadhaar */}
              <div className="mt-4">
                <label
                  htmlFor="aadhaar-number"
                  className="text-xs font-semibold text-slate-600"
                >
                  Customer Aadhaar Number
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
                    disabled={isScanning || transactionStatus === "PROCESSING"}
                    placeholder="Enter 12-digit Aadhaar number"
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />

                  <span className="text-[10px] text-slate-400">
                    {aadhaar.length}/12
                  </span>
                </div>
              </div>

              {/* Bank Selection */}
              <div className="mt-4">
                <label
                  htmlFor="bank-select"
                  className="text-xs font-semibold text-slate-600"
                >
                  Customer Bank
                </label>

                <div className="mt-2 flex h-11 relative items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-[#7c3aed] focus-within:bg-white">
                  <Landmark className="h-4 w-4 shrink-0 text-slate-400 pointer-events-none" />

                  <select
                    id="bank-select"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    disabled={isScanning || transactionStatus === "PROCESSING"}
                    className="min-w-0 flex-1 appearance-none bg-transparent text-sm text-slate-700 outline-none border-none focus:ring-0 cursor-pointer pr-8"
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

              {/* Device */}
              <div className="mt-5 relative">
                <button
                  type="button"
                  onClick={() => !isScanningDevices && setIsDeviceDropdownOpen(!isDeviceDropdownOpen)}
                  className="flex w-full items-center justify-between rounded-xl border border-[#7c3aed]/15 bg-[#f4f6fd] p-4 transition-all hover:border-[#7c3aed]/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7c3aed]">
                      <Fingerprint className={`h-5 w-5 text-white ${isScanningDevices ? 'animate-pulse' : ''}`} />
                    </div>

                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">
                        {withdrawalDeviceName}
                      </p>

                      <p className={`mt-1 flex items-center gap-2 text-[11px] font-medium ${availableDevices.length > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${availableDevices.length > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {availableDevices.length > 0 ? "RD Service Active" : isScanningDevices ? "Searching..." : "Not Found"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <RefreshCw 
                      className={`h-4 w-4 text-[#7c3aed] transition-transform ${isScanningDevices ? "animate-spin" : ""}`} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScanDevices();
                      }}
                    />
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isDeviceDropdownOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isDeviceDropdownOpen && availableDevices.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 z-10 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg">
                    {availableDevices.map((device) => (
                      <button
                        key={device.port}
                        type="button"
                        onClick={() => {
                          setSelectedDevicePort(device.port);
                          setWithdrawalDeviceName(device.name);
                          setIsDeviceDropdownOpen(false);
                        }}
                        className={`w-full border-b border-slate-50 px-3 py-3 text-left text-sm transition-colors last:border-0 hover:bg-slate-50 ${
                          selectedDevicePort === device.port ? "bg-purple-50 font-bold text-[#7c3aed]" : "font-medium text-slate-700"
                        }`}
                      >
                        {device.name} <span className="text-xs text-slate-400">(Port: {device.port})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action */}
              {transactionStatus === "SUCCESS" ? (
                <button
                  type="button"
                  onClick={() => setShowReceipt(true)}
                  className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-4 text-sm font-bold text-white transition hover:bg-[#6d28d9]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  View Receipt
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={!isFormValid || isScanning || transactionStatus === "PROCESSING" || !selectedDevicePort}
                  className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-4 text-sm font-bold text-white transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Capturing Fingerprint...
                    </>
                  ) : transactionStatus === "PROCESSING" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing Transaction...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="h-4 w-4" />
                      Start Biometric Authentication
                    </>
                  )}
                </button>
              )}

              {transactionStatus === "SUCCESS" && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  New Transaction
                </button>
              )}
            </div>

          </div>
        )}
      </section>
    </div>
  );
};

export default AadhaarPay;