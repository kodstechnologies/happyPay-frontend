import { useState } from "react";
import { rdService } from "../../../utils/rdService";
import { miniStatement, parsePidXml } from "../../../services/api/retailer/aepsApi";
import { getGeolocationCoordinates } from "../../../utils/geolocation";
import { getToken } from "../../../utils/auth";
import {
  Fingerprint,
  ArrowLeft,
  RefreshCw,
  Printer,
  Copy,
  Check,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Receipt,
  CheckCircle2,
} from "lucide-react";

export interface MiniStatementItem {
  date: string;
  txnType: "DR" | "CR" | string;
  amount: string | number;
  narration: string;
}

export interface MiniStatementData {
  status?: string;
  msg?: string;
  balance?: string | number;
  bankrrn?: string;
  txnid?: string;
  mini_statement?: MiniStatementItem[];
  [key: string]: unknown;
}

export interface MiniStatementProps {
  customerMobile: string;
  customerAadhaar: string;
  selectedBank: {
    iin: string;
    name: string;
  } | null;
  selectedDevicePort: number | null;
  initialData?: MiniStatementData | null;
  onBack: () => void;
  onNewTransaction?: () => void;
}

const MiniStatement = ({
  customerMobile,
  customerAadhaar,
  selectedBank,
  selectedDevicePort,
  initialData,
  onBack,
  onNewTransaction,
}: MiniStatementProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingApi, setIsFetchingApi] = useState(false);
  const [showReceipt, setShowReceipt] = useState(Boolean(initialData));
  const [statementData, setStatementData] = useState<MiniStatementData | null>(
    initialData || null
  );
  const [transactions, setTransactions] = useState<MiniStatementItem[]>(
    initialData?.mini_statement || []
  );
  const [error, setError] = useState("");
  const [copiedTxnId, setCopiedTxnId] = useState(false);

  // Sync initialData if updated from parent
  const [prevInitialData, setPrevInitialData] = useState(initialData);
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    if (initialData) {
      setStatementData(initialData);
      setTransactions(initialData.mini_statement || []);
      setShowReceipt(true);
    }
  }

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

  const handleCopyTxnId = (id: string) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedTxnId(true);
    setTimeout(() => setCopiedTxnId(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const parseProviderTransactions = (raw: Record<string, unknown>): MiniStatementItem[] => {
    const list = (raw.mini_statement || raw.transactions || []) as Array<Record<string, unknown>>;
    if (Array.isArray(list) && list.length > 0) {
      return list.map((item) => ({
        date: String(item.date || ""),
        txnType: String(item.txnType || item.type || "DR").toUpperCase(),
        amount: String(item.amount || "0.00"),
        narration: String(item.narration || item.description || "Bank Transaction"),
      }));
    }
    return [];
  };

  const handleExecute = async () => {
    setIsProcessing(true);
    setIsFetchingApi(false);
    setError("");

    try {
      // 1. Capture fingerprint
      const captureResult = await rdService.captureFingerprint(selectedDevicePort);

      if (!captureResult.success || !captureResult.data) {
        throw new Error(captureResult.message || "Failed to capture fingerprint from device");
      }

      // Close biometric capture modal state immediately upon capture success
      setIsProcessing(false);
      // Transition immediately to fetching service details
      setIsFetchingApi(true);

      const pidDataXML = captureResult.data;
      const pidData = parsePidXml(pidDataXML || "");

      // Get token and extract outletId/referenceKey
      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      const outletId = tokenPayload.outletId || tokenPayload.outletid || "";
      const referenceKey = tokenPayload.referenceKey || "";

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

      const result = await miniStatement(payload);
      const resultData = (result.data || {}) as Record<string, unknown>;

      const parsedTxns = parseProviderTransactions(resultData);
      setTransactions(parsedTxns);
      setStatementData(resultData as MiniStatementData);
      setShowReceipt(true);
    } catch (err) {
      console.error("Mini statement execution failed:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch mini statement from bank");
    } finally {
      setIsProcessing(false);
      setIsFetchingApi(false);
    }
  };

  // Compute summary stats
  const totalCredits = transactions
    .filter((t) => t.txnType === "CR")
    .reduce((acc, t) => acc + (parseFloat(String(t.amount).replace(/[^0-9.]/g, "")) || 0), 0);

  const totalDebits = transactions
    .filter((t) => t.txnType === "DR")
    .reduce((acc, t) => acc + (parseFloat(String(t.amount).replace(/[^0-9.]/g, "")) || 0), 0);

  const rawBalance = statementData?.balance;
  const numericBalance =
    rawBalance !== undefined && rawBalance !== null
      ? parseFloat(String(rawBalance))
      : NaN;
  const displayBalance = !isNaN(numericBalance)
    ? numericBalance.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  const maskedAadhaar = customerAadhaar
    ? `XXXX XXXX ${customerAadhaar.slice(-4)}`
    : "XXXX XXXX ----";
  const displayTxnId = String(statementData?.txnid || statementData?.transactionId || "N/A");
  const displayRrn = String(statementData?.bankrrn || statementData?.rrn || "NA");

  if (showReceipt) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Top Navigation */}
        <section className="print:hidden flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 border border-slate-200"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
                Aadhaar ATM
              </p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Mini Statement
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        </section>

        {/* Printable Statement Container */}
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xl overflow-hidden print:border-none print:shadow-none">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm text-purple-100">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Statement Fetched Successfully</span>
                </div>
                <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {selectedBank?.name}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-purple-200">
                  <span>Aadhaar: <strong className="text-white">{maskedAadhaar}</strong></span>
                  <span>•</span>
                  <span>Mobile: <strong className="text-white">+91 {customerMobile}</strong></span>
                </div>
              </div>

              {/* Balance Box */}
              <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 sm:p-5 border border-white/15 text-left md:text-right min-w-[200px]">
                <p className="text-xs uppercase tracking-wider font-semibold text-purple-200">
                  Available Account Balance
                </p>
                <p className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  ₹ {displayBalance}
                </p>
                <p className="mt-0.5 text-[11px] text-purple-200 flex items-center md:justify-end gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-300 inline" />
                  Live CBS Verified
                </p>
              </div>
            </div>
          </div>

          {/* Meta Details Strip */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Transaction ID:</span>
              <span className="font-mono font-bold text-slate-900">{displayTxnId}</span>
              {displayTxnId !== "N/A" && (
                <button
                  type="button"
                  onClick={() => handleCopyTxnId(displayTxnId)}
                  className="p-1 text-slate-400 hover:text-purple-600 rounded transition"
                  title="Copy Transaction ID"
                >
                  {copiedTxnId ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div>
                <span className="font-semibold text-slate-500">Bank RRN: </span>
                <span className="font-mono font-bold text-slate-800">{displayRrn}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Date: </span>
                <span className="font-bold text-slate-800">{new Date().toLocaleDateString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Statement Content */}
          <div className="p-5 sm:p-7 space-y-6">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Total Transactions
                  </p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {transactions.length}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Receipt className="h-5 w-5" />
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                    Total Credits (+CR)
                  </p>
                  <p className="text-lg font-bold text-emerald-800 mt-0.5">
                    ₹ {totalCredits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ArrowDownLeft className="h-5 w-5" />
                </div>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                    Total Debits (-DR)
                  </p>
                  <p className="text-lg font-bold text-rose-800 mt-0.5">
                    ₹ {totalDebits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span>Recent Account Transactions</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Showing last {transactions.length} records
                </span>
              </div>

              {transactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                  <Receipt className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    No recent transaction records found
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    The bank did not return transaction history entries for this account.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Narration / Remarks</th>
                        <th className="py-3 px-4 text-center">Type</th>
                        <th className="py-3 px-4 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((tx, idx) => {
                        const isCredit = tx.txnType === "CR";
                        return (
                          <tr
                            key={`${tx.date}-${tx.narration}-${idx}`}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                              {tx.date}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[280px] break-words">
                              {tx.narration}
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  isCredit
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {isCredit ? (
                                  <>
                                    <ArrowDownLeft className="h-3 w-3" />
                                    <span>CREDIT</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowUpRight className="h-3 w-3" />
                                    <span>DEBIT</span>
                                  </>
                                )}
                              </span>
                            </td>
                            <td
                              className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                                isCredit ? "text-emerald-600" : "text-slate-900"
                              }`}
                            >
                              {isCredit ? "+" : "-"} ₹ {tx.amount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bottom Notice */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-xs text-slate-500 flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <p>
                This mini statement was fetched live through the NPCI Aadhaar Enabled Payment System (AEPS).
                All transaction details reflect the latest records provided by {selectedBank?.name}.
              </p>
            </div>

            {/* Actions for Web Screen */}
            <div className="print:hidden flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex h-12 w-full sm:flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                PRINT STATEMENT
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNewTransaction) {
                    onNewTransaction();
                  } else {
                    setShowReceipt(false);
                    setStatementData(null);
                    setTransactions([]);
                  }
                }}
                className="flex h-12 w-full sm:flex-1 items-center justify-center gap-2 rounded-xl bg-[#7c3aed] text-sm font-bold text-white shadow-md hover:bg-[#6d28d9] transition"
              >
                <RefreshCw className="h-4 w-4" />
                NEW TRANSACTION
              </button>
            </div>
          </div>
        </div>
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
            ) : isFetchingApi ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-purple-50">
                  <Building2 className="h-12 w-12 text-purple-600 animate-bounce" />
                </div>
                <h3 className="mt-6 text-lg font-bold text-slate-900 sm:text-xl">
                  Fetching Mini Statement Details...
                </h3>
                <p className="mt-2 text-sm text-slate-500 text-center max-w-md">
                  Biometric capture successful. Contacting {selectedBank?.name} CBS gateway. Please wait...
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
                    Click below to capture customer fingerprint and fetch live statement from {selectedBank?.name}
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
