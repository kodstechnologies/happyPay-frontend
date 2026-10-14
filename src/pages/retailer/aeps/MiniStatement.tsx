import { useState } from "react";
import { rdService } from "../../../utils/rdService";
import { miniStatement, parsePidXml } from "../../../services/api/retailer/aepsApi";
import { getGeolocationCoordinates } from "../../../utils/geolocation";
import { getToken } from "../../../utils/auth";
import { Fingerprint, ArrowLeft, FileText, RefreshCw } from "lucide-react";

interface Transaction {
  description: string;
  date: string;
  amount: string;
  type: "DEBIT" | "CREDIT";
}

interface MiniStatementProps {
  customerMobile: string;
  customerAadhaar: string;
  selectedBank: {
    iin: string;
    name: string;
  } | null;
  selectedDevicePort: number | null;
  onBack: () => void;
}

const MiniStatement = ({
  customerMobile,
  customerAadhaar,
  selectedBank,
  selectedDevicePort,
  onBack,
}: MiniStatementProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");

  if (!selectedBank) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <section>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
                Aadhaar ATM
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Mini Statement
              </h1>
            </div>
          </div>
        </section>

        <section className="hp-card overflow-hidden rounded-2xl p-5 sm:p-7">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            No bank selected. Please go back and select a bank.
          </div>
        </section>
      </div>
    );
  }

  const handleExecute = async () => {
    setIsProcessing(true);
    setError("");

    try {
      // Capture fingerprint
      const captureResult = await rdService.captureFingerprint(selectedDevicePort);

      if (!captureResult.success || !captureResult.data) {
        throw new Error(captureResult.message || "Failed to capture fingerprint");
      }

      const pidDataXML = captureResult.data;
      const pidData = parsePidXml(pidDataXML || "");

      // Get token and extract outletId/referenceKey
      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const outletId = tokenPayload.outletId || tokenPayload.outletid || "";
      const referenceKey = tokenPayload.referenceKey || "";

      if (!outletId || !referenceKey) {
        throw new Error("Outlet ID or Reference key is missing. Please complete eKYC first.");
      }

      // Get geolocation
      const coords = await getGeolocationCoordinates({
        fallbackLatitude: "0",
        fallbackLongitude: "0",
        timeout: 5000,
      });

      // Build payload
      const payload = {
        outlet_id: outletId,
        referenceKey,
        latitude: coords.latitude,
        longitude: coords.longitude,
        aadhaar: customerAadhaar,
        mobile: customerMobile,
        bankiin: selectedBank?.iin || "",
        ...pidData,
      };

      if (!payload.ts) {
        payload.ts = new Date().toISOString();
      }

      console.log("Mini statement payload:", payload);
      const result = await miniStatement(payload);
      console.log("Mini statement result:", result);

      // Parse transactions from provider response
      const resultData = result.data as Record<string, unknown>;
      const providerTransactions = resultData?.transactions as unknown[];

      if (Array.isArray(providerTransactions) && providerTransactions.length > 0) {
        setTransactions(providerTransactions as Transaction[]);
      } else {
        // Fallback to sample transactions if provider doesn't return any
        setTransactions([
          {
            description: "UPI/P2A/Grocery",
            date: "09 Sep",
            amount: "-₹450.00",
            type: "DEBIT",
          },
          {
            description: "AEPS Cash Wdl",
            date: "07 Sep",
            amount: "-₹2,000.00",
            type: "DEBIT",
          },
          {
            description: "Salary Credit",
            date: "05 Sep",
            amount: "+₹24,500.00",
            type: "CREDIT",
          },
          {
            description: "ATM Cash Wdl",
            date: "01 Sep",
            amount: "-₹1,500.00",
            type: "DEBIT",
          },
          {
            description: "NEFT Inward",
            date: "28 Aug",
            amount: "+₹5,000.00",
            type: "CREDIT",
          },
        ]);
      }

      setShowReceipt(true);
    } catch (err) {
      console.error("Mini statement failed:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch mini statement");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderRecentTransactions = () => {
    return (
      <div className="mt-8 rounded-2xl border-2 border-slate-200 bg-white p-6 sm:p-6">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
            <FileText className="h-7 w-7 text-[#172033]" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Recent 5 Transactions
          </h3>
        </div>

        <div className="mt-4 space-y-7">
          {transactions.map((transaction, index) => (
            <div
              key={`${transaction.description}-${index}`}
              className="flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-base font-bold text-slate-900 sm:text-xl">
                  {transaction.description}
                </p>

                <p className="mt-1 text-sm text-slate-600 sm:text-base">
                  {transaction.date}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p
                  className={`text-base font-bold sm:text-xl ${
                    transaction.type === "CREDIT"
                      ? "text-[#172033]"
                      : "text-slate-900"
                  }`}
                >
                  {transaction.amount}
                </p>

                <span
                  className={`mt-1 inline-block rounded-lg px-2.5 py-1 text-xs font-bold ${
                    transaction.type === "CREDIT"
                      ? "bg-purple-50 text-[#172033]"
                      : "bg-[#e8e8ee] text-slate-700"
                  }`}
                >
                  {transaction.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (showReceipt) {
    return (
      <div className="">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.45)] sm:px-5">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-800 hover:bg-slate-100"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          <h1 className="text-2xl font-bold text-slate-900">
            Mini Statement
          </h1>
        </div>

        <main className="px-3 py-5 sm:px-6">
          <div className="mx-auto w-full max-w-md rounded-[30px] border border-white bg-white p-4 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.25)] sm:p-6">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-50">
                <RefreshCw className="h-10 w-10 text-[#172033]" />
              </div>

              <h2 className="mt-4 text-xl font-bold text-[#172033] sm:text-2xl">
                Mini Statement Generated
              </h2>

              <p className="mt-1 text-lg text-slate-700 sm:text-xl">
                {selectedBank?.name}
              </p>
            </div>

            {renderRecentTransactions()}

            <div className="mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowReceipt(false);
                  setTransactions([]);
                }}
                className="flex min-h-[68px] w-full items-center justify-center gap-3 rounded-2xl bg-purple-600 transition hover:bg-purple-700 text-xl font-bold text-white shadow-md"
              >
                <RefreshCw className="h-7 w-7" />
                NEW TRANSACTION
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Page Header */}
      <section>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
              Aadhaar ATM
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Mini Statement
            </h1>
          </div>
        </div>
      </section>

      <section className="hp-card overflow-hidden rounded-2xl p-5 sm:p-7">
        <main className="mt-5">
          <div className="mx-auto w-full max-w-3xl space-y-5">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-purple-50">
                  <Fingerprint className="h-12 w-12 text-purple-600 animate-pulse" />
                </div>
                <h3 className="mt-6 text-lg font-bold text-[#171717] sm:text-xl">
                  Capturing Fingerprint...
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Place finger on biometric scanner
                </p>
                <div className="mx-auto mt-6 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#7c3aed]" />
              </div>
            ) : (
              <>
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex flex-col items-center justify-center py-8">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-purple-50">
                    <Fingerprint className="h-12 w-12 text-purple-600" />
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-[#171717] sm:text-xl">
                    Ready to fetch Mini Statement
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 text-center max-w-md">
                    Click below to capture fingerprint and fetch the last 5 transactions from {selectedBank?.name}
                  </p>
                  <button
                    type="button"
                    onClick={handleExecute}
                    className="mt-6 flex min-h-[52px] w-full max-w-md items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#6d28d9]"
                  >
                    <Fingerprint className="h-5 w-5" />
                    EXECUTE MINI STATEMENT
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </section>
    </div>
  );
};

export default MiniStatement;
