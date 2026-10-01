import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  QrCode,
  RefreshCw,
  XCircle,
  Printer,
} from "lucide-react";
import { getWalletBalance, setWalletBalance } from "../../../utils/wallet";

interface UpiCashPointProps {
  onBack?: () => void;
}

type TransactionStatus = "IDLE" | "PROCESSING" | "SUCCESS" | "FAILED";

const UpiCashPoint: React.FC<UpiCashPointProps> = ({ onBack }) => {
  const [amount, setAmount] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>("IDLE");
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [transactionDate, setTransactionDate] = useState<Date | null>(null);

  const isValidAmount = Number(amount) > 0;

  const resetForm = () => {
    setAmount("");
    setShowQr(false);
    setTimeLeft(180);
    setTransactionStatus("IDLE");
    setShowReceipt(false);
    setTransactionId("");
    setTransactionDate(null);
  };

  const handleAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;

    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  const handleGenerateQr = () => {
    if (!isValidAmount) {
      return;
    }

    setTimeLeft(180);
    setTransactionStatus("IDLE");
    setShowQr(true);

    window.setTimeout(() => {
      setTransactionStatus("PROCESSING");
      window.setTimeout(() => {
        setTransactionId(
          `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
        );
        setTransactionDate(new Date());
        setTransactionStatus("SUCCESS");
        setShowReceipt(true);
        
        const currentBalance = getWalletBalance();
        setWalletBalance(currentBalance + Number(amount));
      }, 1500);
    }, 3000);
  };

  useEffect(() => {
    if (!showQr || timeLeft <= 0 || transactionStatus === "SUCCESS") {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [showQr, timeLeft, transactionStatus]);



  const handleCancelQr = () => {
    setShowQr(false);
    setTimeLeft(180);
    setTransactionStatus("IDLE");
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedTime = `${Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0")}:${(timeLeft % 60)
    .toString()
    .padStart(2, "0")}`;

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
            SERVICES
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            UPI Cash Point
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Accept UPI payments and provide cash to customers securely.
          </p>
        </div>
      </div>

      {/* Main Card */}
      <section className="hp-card rounded-3xl p-8 sm:p-10 bg-white shadow-sm border border-slate-100">
        {showReceipt && transactionStatus === "SUCCESS" ? (
          <div className="mx-auto max-w-md animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Payment Received
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  UPI Cash Receipt
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
                <span className="text-slate-500">Payment Via</span>
                <span className="font-semibold text-slate-900">
                  Amazon Pay
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-200 py-2 text-xs">
                <span className="text-slate-500">Bank Ref. (RRN)</span>
                <span className="font-semibold text-slate-900">
                  429944251
                </span>
              </div>

              <div className="flex justify-between pt-3 items-center">
                <span className="text-sm font-bold text-slate-700">
                  Amount
                </span>
                <span className="text-xl font-black text-[#7c3aed]">
                  ₹{amount}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 border border-emerald-100 flex items-center justify-center">
              <p className="text-sm font-bold text-emerald-600">
                Disburse Cash: ₹{amount}
              </p>
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
          <div className="mx-auto max-w-2xl">
            {/* Form */}
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3e8ff]">
                <QrCode className="h-5 w-5 text-[#7c3aed]" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  UPI Cash Transaction
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Enter amount and generate a payment QR.
                </p>
              </div>
            </div>

            {/* Amount */}
            <div className="mt-8">
              <label
                htmlFor="upi-amount"
                className="text-sm font-bold text-slate-700"
              >
                Cash Amount
              </label>

              <div className="mt-3 flex h-14 items-center rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 focus-within:border-[#7c3aed] focus-within:bg-white transition-all hover:border-slate-300">
                <span className="mr-3 text-lg font-bold text-slate-400">
                  ₹
                </span>

                <input
                  id="upi-amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={handleAmountChange}
                  disabled={showQr}
                  placeholder="Enter cash amount"
                  className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>

            {/* Generate QR */}
            {!showQr && (
              <button
                type="button"
                onClick={handleGenerateQr}
                disabled={!isValidAmount}
                className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#7c3aed] px-4 text-lg font-bold text-white transition-all hover:bg-[#6d28d9] hover:shadow-lg hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none shadow-md"
              >
                <QrCode className="h-6 w-6" />
                Generate Payment QR
              </button>
            )}

            {/* QR State */}
            {showQr && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-[#f7f8fc] p-5">
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900">
                    Scan to Pay
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Customer can scan this QR using any supported UPI app.
                  </p>

                  <div className={`mx-auto mt-5 flex h-48 w-48 items-center justify-center rounded-2xl border-8 border-white bg-white shadow-sm transition-opacity ${timeLeft <= 0 ? 'opacity-30 grayscale' : 'opacity-100'}`}>
                    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-white">
                      <QrCode className="h-36 w-36 text-slate-900" />

                      <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-white shadow-sm">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#7c3aed]">
                          <span className="text-[10px] font-black text-white">
                            UPI
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Amount
                    </p>

                    <p className="mt-1 text-2xl font-bold text-[#7c3aed]">
                      ₹{amount || "0"}
                    </p>
                  </div>

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        timeLeft > 0
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-red-500"
                      }`}
                    />

                    {timeLeft > 0
                      ? `QR expires in ${formattedTime}`
                      : "QR expired"}
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  {transactionStatus === "SUCCESS" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowReceipt(true)}
                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#7c3aed] text-xs font-bold text-white transition hover:bg-[#6d28d9] shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        View Receipt
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition hover:bg-slate-50 shadow-sm"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        New
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleCancelQr}
                        disabled={transactionStatus === "PROCESSING"}
                        className="flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      {timeLeft <= 0 && (
                        <button
                          type="button"
                          onClick={handleGenerateQr}
                          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-800 text-xs font-bold text-white transition hover:bg-slate-700 shadow-sm"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Generate New QR
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Failed */}
            {transactionStatus === "FAILED" && (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="h-6 w-6 text-red-500" />

                  <div>
                    <p className="text-sm font-bold text-red-700">
                      Payment Failed
                    </p>

                    <p className="mt-1 text-xs text-red-600">
                      Please retry the transaction.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default UpiCashPoint;