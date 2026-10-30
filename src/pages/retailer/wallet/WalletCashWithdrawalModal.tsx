import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  X,
  Fingerprint,
  Search,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Printer,
  ArrowRight,
  ShieldCheck,
  Loader2,
  LockKeyhole,
  ChevronDown,
} from "lucide-react";
import { rdService, type ActiveDevice } from "../../../utils/rdService";
import {
  parsePidXml,
  cashWithdrawal,
  sendAepsOtp,
  getBankList,
  type Bank,
  type CashWithdrawalPayload,
} from "../../../services/api/retailer/aepsApi";
import { ensureConfirmedLocation } from "../../../utils/geolocation";
import { getToken } from "../../../utils/auth";
import { useAuth } from "../../../context/AuthContext";
import OtpInput from "../../../components/common/OtpInput";

export interface WithdrawalSuccessData {
  amount: number;
  txnid: string;
  rrn?: string;
  bankName: string;
  customerAadhaar: string;
  date: string;
  balance?: number;
}

interface WalletCashWithdrawalModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: WithdrawalSuccessData) => void;
}

type ModalStep = "form" | "otp" | "scanning" | "processing" | "receipt";

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000];

const DEFAULT_POPULAR_BANKS: Bank[] = [
  { id: 1, bank_id: 1, name: "State Bank of India", iin: "607094", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 2, bank_id: 2, name: "Punjab National Bank", iin: "508505", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 3, bank_id: 3, name: "Bank of Baroda", iin: "606985", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 4, bank_id: 4, name: "Canara Bank", iin: "607152", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 5, bank_id: 5, name: "Union Bank of India", iin: "607161", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 6, bank_id: 6, name: "HDFC Bank", iin: "607153", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 7, bank_id: 7, name: "ICICI Bank", iin: "508534", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 8, bank_id: 8, name: "Axis Bank", iin: "607153", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 9, bank_id: 9, name: "Bank of India", iin: "508501", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 10, bank_id: 10, name: "Central Bank of India", iin: "607100", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 11, bank_id: 11, name: "Indian Bank", iin: "607105", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 12, bank_id: 12, name: "Kotak Mahindra Bank", iin: "990309", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 13, bank_id: 13, name: "Airtel Payments Bank", iin: "990320", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 14, bank_id: 14, name: "Paytm Payments Bank", iin: "608032", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 15, bank_id: 15, name: "India Post Payments Bank", iin: "608117", aeps_enabled: 1, aadhaarpay_enabled: 1 },
  { id: 16, bank_id: 16, name: "Fino Payments Bank", iin: "608001", aeps_enabled: 1, aadhaarpay_enabled: 1 },
];

export default function WalletCashWithdrawalModal({
  open,
  onClose,
  onSuccess,
}: WalletCashWithdrawalModalProps) {
  const { user: authUser } = useAuth();

  // Form State
  const [step, setStep] = useState<ModalStep>("form");
  const [amount, setAmount] = useState<string>("500");
  const [aadhaar, setAadhaar] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");

  // Bank State
  const [banks, setBanks] = useState<Bank[]>(DEFAULT_POPULAR_BANKS);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(DEFAULT_POPULAR_BANKS[0]);
  const [bankSearch, setBankSearch] = useState<string>("");
  const [isLoadingBanks, setIsLoadingBanks] = useState<boolean>(() => open);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const BANKS_PER_PAGE = 50;
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  // Close bank dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(e.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Biometric Device State
  const [devices, setDevices] = useState<ActiveDevice[]>([]);
  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const [isScanningDevices, setIsScanningDevices] = useState<boolean>(false);

  // OTP & Session State
  const [otp, setOtp] = useState<string>("");
  const [otpReferenceKey, setOtpReferenceKey] = useState<string>("");

  // Transaction Processing & Error State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Receipt State
  const [receipt, setReceipt] = useState<WithdrawalSuccessData | null>(null);

  // Helper to extract effective outlet ID from user session or JWT
  const getOutletId = useCallback((): string => {
    const directOutlet =
      (authUser as Record<string, unknown> | null)?.outletId ||
      (authUser as Record<string, unknown> | null)?.outlet_id ||
      authUser?.AepsEkyc?.outletId;
    if (directOutlet) return String(directOutlet).trim();

    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const tokenOutlet = payload?.outletId || payload?.outlet_id;
        if (tokenOutlet) return String(tokenOutlet).trim();
      } catch {
        // ignore
      }
    }

    return (
      localStorage.getItem("outlet_id") ||
      sessionStorage.getItem("outlet_id") ||
      ""
    );
  }, [authUser]);

  // Helper to extract default reference key
  const getDefaultReferenceKey = useCallback((): string => {
    const directKey =
      authUser?.AepsEkyc?.referenceKey ||
      (authUser as Record<string, unknown> | null)?.referenceKey;
    if (directKey) return String(directKey).trim();

    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload?.referenceKey) return String(payload.referenceKey).trim();
      } catch {
        // ignore
      }
    }

    return "";
  }, [authUser]);

  // Scan for Biometric Devices
  const scanDevices = useCallback(async () => {
    setIsScanningDevices(true);
    try {
      const detected = await rdService.scanAllDevices();
      setDevices(detected);
      if (detected.length > 0) {
        setSelectedPort(detected[0].port);
      } else {
        setSelectedPort(11100); // Default port fallback
      }
    } catch (err) {
      console.warn("Device scan failed:", err);
      setSelectedPort(11100);
    } finally {
      setIsScanningDevices(false);
    }
  }, []);

  // Track open state transitions to reset form without triggering cascading renders in effects
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStep("form");
      setErrorMessage("");
      setReceipt(null);
      setOtp("");
      setOtpReferenceKey("");
      setCurrentPage(1);
      setIsLoadingBanks(true);
    }
  }

  const handleLoadMoreBanks = async () => {
    if (currentPage < totalPages && !loadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      setLoadingMore(true);
      try {
        const response = await getBankList(nextPage, BANKS_PER_PAGE);
        if (response && response.success && Array.isArray(response.data)) {
          setBanks((prev) => {
            const existing = new Set(prev.map((b) => b.iin || b.bank_id || b.name));
            const newUnique = response.data.filter((b) => !existing.has(b.iin || b.bank_id || b.name));
            return [...prev, ...newUnique];
          });

          if (response.meta && typeof response.meta === "object" && "totalPages" in response.meta) {
            setTotalPages(Number(response.meta.totalPages) || 1);
          }
        }
      } catch (err) {
        console.error("Failed to load more banks:", err);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  // Fetch banks & scan devices when opened
  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    getBankList(1, BANKS_PER_PAGE)
      .then((response) => {
        if (!isMounted) return;
        if (response && response.success && Array.isArray(response.data)) {
          setBanks(response.data);
          const sbi = response.data.find(
            (b) =>
              b.name.toLowerCase().includes("state bank of india") ||
              b.iin === "607094"
          );
          if (sbi) {
            setSelectedBank(sbi);
          } else if (response.data.length > 0) {
            setSelectedBank(response.data[0]);
          }

          if (response.meta && typeof response.meta === "object" && "totalPages" in response.meta) {
            setTotalPages(Number(response.meta.totalPages) || 1);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load bank list:", err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingBanks(false);
        }
      });

    rdService.scanAllDevices()
      .then((detected) => {
        if (!isMounted) return;
        setDevices(detected);
        if (detected.length > 0) {
          setSelectedPort(detected[0].port);
        } else {
          setSelectedPort(11100);
        }
      })
      .catch((err) => {
        console.warn("Device scan failed:", err);
        if (isMounted) setSelectedPort(11100);
      })
      .finally(() => {
        if (isMounted) setIsScanningDevices(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, BANKS_PER_PAGE]);

  // Filtered Banks based on search (shows full bank list when search is empty)
  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return banks;
    const query = bankSearch.toLowerCase().trim();
    return banks.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        (b.iin && b.iin.includes(query))
    );
  }, [banks, bankSearch]);

  // Top Popular Banks
  const popularBanks = useMemo(() => {
    const targets = ["state bank", "punjab national", "bank of baroda", "hdfc", "icici"];
    return targets
      .map((target) => banks.find((b) => b.name.toLowerCase().includes(target)))
      .filter((b): b is Bank => Boolean(b));
  }, [banks]);

  // Aadhaar input formatter: "1234 5678 9012"
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
    setAadhaar(raw);
  };

  const formattedAadhaar = useMemo(() => {
    const parts = aadhaar.match(/.{1,4}/g);
    return parts ? parts.join(" ") : aadhaar;
  }, [aadhaar]);

  // Reset modal state
  const handleClose = () => {
    if (isProcessing) return;
    setStep("form");
    setErrorMessage("");
    setReceipt(null);
    setIsBankDropdownOpen(false);
    setBankSearch("");
    setCurrentPage(1);
    setIsLoadingBanks(false);
    setLoadingMore(false);
    onClose();
  };

  // Perform Cash Withdrawal Transaction
  const executeWithdrawal = async (verifiedOtp?: string) => {
    setErrorMessage("");
    const numericAmount = Number(amount);
    const cleanAadhaar = aadhaar.replace(/\D/g, "");
    const cleanMobile = mobile.replace(/\D/g, "");

    // Validation
    if (!selectedBank) {
      setErrorMessage("Please select a customer bank.");
      return;
    }
    if (cleanAadhaar.length !== 12) {
      setErrorMessage("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    if (cleanMobile.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setErrorMessage("Please enter a valid withdrawal amount.");
      return;
    }

    const outletId = getOutletId();
    if (!outletId) {
      setErrorMessage("Outlet ID not found. Please ensure your AEPS merchant profile is onboarded.");
      return;
    }

    // Step 1: Handle OTP if Amount > ₹5,000
    if (numericAmount > 5000 && !verifiedOtp && step !== "otp") {
      setIsProcessing(true);
      setProcessingMessage("Sending OTP to customer's Aadhaar-linked mobile...");
      try {
        const coords = await ensureConfirmedLocation();
        const refKey = getDefaultReferenceKey();

        const otpRes = await sendAepsOtp({
          outlet_id: outletId,
          referenceKey: refKey,
          latitude: coords.latitude,
          longitude: coords.longitude,
          aadhaar: cleanAadhaar,
          MobileNumber: cleanMobile,
          bankiin: selectedBank.iin,
          amount: numericAmount,
        });

        const resData = (otpRes?.data || otpRes) as Record<string, unknown>;
        const inner = (resData.data as Record<string, unknown>) || resData;

        if (resData.status === false || inner.status === false) {
          const msg =
            (inner.msg as string) ||
            (inner.message as string) ||
            (resData.msg as string) ||
            "Failed to send OTP to customer";
          throw new Error(msg);
        }

        const sessionRef =
          (inner.referenceKey as string) ||
          (inner.refKey as string) ||
          (resData.referenceKey as string) ||
          refKey;

        if (sessionRef) {
          setOtpReferenceKey(sessionRef);
        }

        setStep("otp");
      } catch (err: unknown) {
        console.error("OTP send failed:", err);
        const errObj = err as { message?: string };
        setErrorMessage(errObj.message || "Failed to send OTP. Please check customer mobile.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Step 2: Biometric Fingerprint Capture via RD Service
    setStep("scanning");
    setIsProcessing(true);
    setProcessingMessage("Please place customer's finger on the biometric scanner...");

    try {
      const portToUse = selectedPort || 11100;
      const captureResult = await rdService.captureFingerprint(portToUse, {
        otp: verifiedOtp || otp || undefined,
        fType: "2",
      });

      if (!captureResult.success || !captureResult.data) {
        throw new Error(captureResult.message || "Failed to capture fingerprint from scanner.");
      }

      // Step 3: Parse PID XML
      const pidData = parsePidXml(captureResult.data);

      if (pidData.errCode && String(pidData.errCode) !== "0") {
        throw new Error(pidData.errInfo || `Device capture error (Code: ${pidData.errCode})`);
      }

      // Step 4: Submit to AEPS Cash Withdrawal API
      setStep("processing");
      setProcessingMessage(`Connecting to ${selectedBank.name} CBS to process ₹${numericAmount.toLocaleString("en-IN")}...`);

      const coords = await ensureConfirmedLocation();
      const finalRefKey = otpReferenceKey || getDefaultReferenceKey() || null;

      const payload: CashWithdrawalPayload = {
        outlet_id: outletId,
        referenceKey: numericAmount <= 5000 ? null : finalRefKey,
        latitude: coords.latitude,
        longitude: coords.longitude,
        aadhaar: cleanAadhaar,
        mobile: cleanMobile,
        bankiin: selectedBank.iin,
        amount: numericAmount,
        ...pidData,
        ts: pidData.ts || new Date().toISOString(),
      };

      const response = await cashWithdrawal(payload);
      const resPayload = (response as unknown) as Record<string, unknown>;
      const innerData = ((resPayload.data as Record<string, unknown>) || resPayload) as Record<string, unknown>;

      // Check Provider failure
      if (
        resPayload.status === "FAILED" ||
        resPayload.success === false ||
        innerData.status === "FAILED" ||
        innerData.success === false
      ) {
        const failMsg =
          (innerData.message as string) ||
          (innerData.msg as string) ||
          (resPayload.message as string) ||
          (resPayload.msg as string) ||
          "Cash withdrawal declined by issuing bank.";
        throw new Error(failMsg);
      }

      // Success
      const txnid =
        (innerData.txnid as string) ||
        (innerData.transactionId as string) ||
        (resPayload.txnid as string) ||
        `TXN${Date.now().toString().slice(-10)}`;

      const rrn =
        (innerData.rrn as string) ||
        (innerData.bankRrn as string) ||
        (resPayload.rrn as string) ||
        "—";

      const finalBalance = Number(
        innerData.balance ?? innerData.balanceamount ?? innerData.bankBalance ?? 0
      );

      const receiptData: WithdrawalSuccessData = {
        amount: numericAmount,
        txnid,
        rrn,
        bankName: selectedBank.name,
        customerAadhaar: `•••• •••• ${cleanAadhaar.slice(-4)}`,
        date: new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
        balance: finalBalance > 0 ? finalBalance : undefined,
      };

      setReceipt(receiptData);
      setStep("receipt");

      // Notify parent to refresh live wallet balance
      onSuccess(receiptData);
    } catch (err: unknown) {
      console.error("Withdrawal flow error:", err);
      const errObj = err as {
        response?: { data?: { message?: string; msg?: string } };
        message?: string;
      };
      const apiMsg =
        errObj.response?.data?.message ||
        errObj.response?.data?.msg ||
        errObj.message ||
        "Transaction failed. Please try again.";
      setErrorMessage(apiMsg);
      setStep("form");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#7c3aed]">
              <Fingerprint className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#171717]">
                Recharge Wallet via AEPS Cash Withdrawal
              </h2>
              <p className="text-xs text-slate-500">
                Withdraw customer cash to instantly credit your retailer wallet balance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Global Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 animate-in fade-in duration-150"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Transaction Alert</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage("")}
                className="text-rose-400 hover:text-rose-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STEP: FORM ENTRY */}
          {step === "form" && (
            <div className="space-y-4">
              {/* Biometric Device Status Indicator */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      devices.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    }`}
                  />
                  <span className="font-semibold text-slate-700">
                    Biometric Scanner:
                  </span>
                  <span className="text-slate-600">
                    {devices.length > 0
                      ? `${devices[0].name} (Port ${devices[0].port})`
                      : "Scanning for connected scanner..."}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={scanDevices}
                  disabled={isScanningDevices}
                  title="Rescan USB Biometric Scanner"
                  className="inline-flex items-center gap-1 font-semibold text-[#7c3aed] hover:underline disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isScanningDevices ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>

              {/* Bank Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Customer Bank
                </label>
                {/* Popular Bank Chips */}
                {popularBanks.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {popularBanks.map((bank) => (
                      <button
                        key={bank.id || bank.iin || bank.name}
                        type="button"
                        onClick={() => {
                          setSelectedBank(bank);
                          setIsBankDropdownOpen(false);
                          setBankSearch("");
                        }}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                          selectedBank?.iin === bank.iin
                            ? "border-[#7c3aed] bg-purple-50 text-[#7c3aed] font-bold shadow-xs"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {bank.name.replace(/Bank/i, "").trim()}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bank Search Input & Dropdown Container */}
                <div className="relative" ref={bankDropdownRef}>
                  <div
                    className="relative cursor-pointer"
                    onClick={() => setIsBankDropdownOpen((prev) => !prev)}
                  >
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={bankSearch}
                      onFocus={() => setIsBankDropdownOpen(true)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsBankDropdownOpen(true);
                      }}
                      onChange={(e) => {
                        setBankSearch(e.target.value);
                        setIsBankDropdownOpen(true);
                      }}
                      placeholder={
                        isLoadingBanks
                          ? "Loading available banks..."
                          : selectedBank
                          ? `Selected: ${selectedBank.name}`
                          : "Search or select customer bank..."
                      }
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20"
                    />
                    <ChevronDown
                      className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-transform ${
                        isBankDropdownOpen ? "rotate-180 text-[#7c3aed]" : ""
                      }`}
                    />
                  </div>

                  {/* Dropdown list - Opens immediately on click or focus */}
                  {isBankDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl divide-y divide-slate-50">
                      {filteredBanks.map((bank) => (
                        <button
                          key={bank.id || bank.iin || bank.name}
                          type="button"
                          onClick={() => {
                            setSelectedBank(bank);
                            setIsBankDropdownOpen(false);
                            setBankSearch("");
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                            selectedBank?.iin === bank.iin
                              ? "bg-purple-50 font-bold text-[#7c3aed]"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span>{bank.name}</span>
                          </div>
                         
                        </button>
                      ))}

                      {filteredBanks.length === 0 && (
                        <div className="p-3 text-center text-xs text-slate-500">
                          No matching banks found {bankSearch ? `for "${bankSearch}"` : ""}
                        </div>
                      )}

                      {/* Pagination Option - Directly after the last bank */}
                      {currentPage < totalPages && (
                        <div className="p-2 text-center bg-slate-50/80 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleLoadMoreBanks}
                            disabled={loadingMore}
                            className="inline-flex items-center justify-center gap-1.5 w-full py-1 text-xs font-bold text-[#7c3aed] hover:underline disabled:opacity-50"
                          >
                            {loadingMore ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Loading more banks...</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                <span>Load more banks ({banks.length} loaded · Page {currentPage}/{totalPages})</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Aadhaar Number & Mobile Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    2. Customer Aadhaar Number
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formattedAadhaar}
                    onChange={handleAadhaarChange}
                    placeholder="1234 5678 9012"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm font-semibold tracking-wider text-slate-900 placeholder:text-slate-300 focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    3. Customer Mobile Number
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="10-digit mobile"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm font-semibold tracking-wider text-slate-900 placeholder:text-slate-300 focus:border-[#7c3aed] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20"
                  />
                </div>
              </div>

              {/* Amount Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    4. Withdrawal / Top-Up Amount
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Credited 100% to your wallet
                  </span>
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-lg font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="0.00"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xl font-bold text-slate-900 focus:border-[#7c3aed] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20"
                  />
                </div>

                {/* Preset Amount Chips */}
                <div className="mt-2.5 grid grid-cols-5 gap-1.5">
                  {PRESET_AMOUNTS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(String(val))}
                      className={`rounded-lg border py-2 text-xs font-bold transition ${
                        amount === String(val)
                          ? "border-[#7c3aed] bg-[#7c3aed] text-white shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-[#7c3aed]/40 hover:bg-slate-50"
                      }`}
                    >
                      ₹{val.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>

                {Number(amount) > 5000 && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    NPCI Rule: Withdrawals above ₹5,000 require customer mobile OTP.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP: OTP VERIFICATION (For amounts > ₹5,000) */}
          {step === "otp" && (
            <div className="py-4 space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-[#7c3aed]">
                <LockKeyhole className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Customer 2FA OTP Required
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  An OTP has been dispatched by NPCI to customer's Aadhaar-linked mobile for withdrawal of ₹{Number(amount).toLocaleString("en-IN")}.
                </p>
              </div>

              <div className="flex justify-center py-2">
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  length={6}
                  disabled={isProcessing}
                />
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  disabled={isProcessing}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Back to Details
                </button>
                <button
                  type="button"
                  onClick={() => executeWithdrawal(otp)}
                  disabled={otp.length !== 6 || isProcessing}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#6d28d9] disabled:opacity-50"
                >
                  Verify OTP & Scan Fingerprint
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP: BIOMETRIC SCANNING / PROCESSING IN PROGRESS */}
          {(step === "scanning" || step === "processing") && (
            <div className="py-8 space-y-5 text-center">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-purple-100 animate-ping opacity-75" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#7c3aed] text-white shadow-lg">
                  {step === "scanning" ? (
                    <Fingerprint className="h-10 w-10 animate-pulse" />
                  ) : (
                    <Loader2 className="h-10 w-10 animate-spin" />
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {step === "scanning"
                    ? "Capturing Biometric Fingerprint..."
                    : "Processing with Bank..."}
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 max-w-sm mx-auto">
                  {processingMessage}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-semibold text-[#7c3aed]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secured by NPCI & UIDAI AEPS Gateway
              </div>
            </div>
          )}

          {/* STEP: RECEIPT CONFIRMATION */}
          {step === "receipt" && receipt && (
            <div className="space-y-4 py-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="mt-2 text-base font-bold text-emerald-950">
                  Cash Withdrawal Successful!
                </h3>
                <p className="mt-0.5 text-xs text-emerald-800">
                  ₹{receipt.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} has been credited to your Happy Pay wallet.
                </p>
                <p className="mt-2 text-2xl font-black text-emerald-900 tracking-tight">
                  ₹{receipt.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Receipt Key-Value Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-2.5">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="font-mono font-bold text-slate-900">{receipt.txnid}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Bank RRN</span>
                  <span className="font-mono font-semibold text-slate-800">{receipt.rrn}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Customer Bank</span>
                  <span className="font-semibold text-slate-800">{receipt.bankName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Customer Aadhaar</span>
                  <span className="font-mono font-semibold text-slate-800">{receipt.customerAadhaar}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time</span>
                  <span className="font-medium text-slate-700">{receipt.date}</span>
                </div>
              </div>

              {/* Receipt Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#6d28d9]"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Form View Only) */}
        {step === "form" && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => executeWithdrawal()}
              disabled={
                !amount ||
                Number(amount) <= 0 ||
                aadhaar.length !== 12 ||
                mobile.length !== 10 ||
                !selectedBank ||
                isProcessing
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#6d28d9] disabled:opacity-50 active:scale-[0.98]"
            >
              <Fingerprint className="h-4 w-4" />
              {Number(amount) > 5000 ? "Proceed with OTP" : "Scan Finger & Recharge"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
