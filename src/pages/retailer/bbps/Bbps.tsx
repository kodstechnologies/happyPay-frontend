import React, { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Droplets,
  Flame,
  Fuel,
  GraduationCap,
  Hash,
  Landmark,
  Mail,
  Menu,
  Phone,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Tv,
  Wallet,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import {
  getBbpsCategoriesApi,
  getBillersByCategoryNameApi,
  viewBillApi,
  payBillApi,
  syncBbpsDataApi,
  type BbpsCategoryItem,
  type BillerItem,
  type ViewBillPayload,
  type PayBillPayload,
} from "../../../apis/bbps.apis";
import { getWalletBalanceApi } from "../../../apis/wallet.apis";
import { getAuthUser } from "../../../context/AuthContext";

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== "object" || error === null) {
    return fallback;
  }

  if ("response" in error) {
    const response = (error as { response?: unknown }).response;
    if (typeof response === "object" && response !== null && "data" in response) {
      const data = (response as { data?: unknown }).data;
      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof (data as { message?: unknown }).message === "string"
      ) {
        return (data as { message: string }).message;
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

// =============================================================
// Interfaces & Types
// =============================================================

export interface BillDetails {
  customerName: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  billingPeriod: string;
  amount: number;
  partialPayAllow?: string | boolean;
  customerId?: string;
  rawDetails?: Record<string, unknown>;
}

export interface CategoryVisualMeta {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  badge?: string;
  defaultInputLabel: string;
  defaultInputPlaceholder: string;
}

// =============================================================
// Category Icon & Theme Resolver
// =============================================================

const resolveCategoryMeta = (serviceName = ""): CategoryVisualMeta => {
  const name = serviceName.toLowerCase();

  if (name.includes("electricity") || name.includes("power") || name.includes("bijli")) {
    return {
      icon: <Zap size={26} />,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      badge: "Instant",
      defaultInputLabel: "Consumer Number / Account ID",
      defaultInputPlaceholder: "Enter consumer number",
    };
  }

  if (name.includes("water") || name.includes("jal") || name.includes("pani")) {
    return {
      icon: <Droplets size={26} />,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-500",
      defaultInputLabel: "Consumer Number / K Number",
      defaultInputPlaceholder: "Enter K Number / RR Number",
    };
  }

  if (name.includes("lpg") || name.includes("cylinder")) {
    return {
      icon: <Fuel size={26} />,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-500",
      badge: "Fast Booking",
      defaultInputLabel: "Registered Mobile Number",
      defaultInputPlaceholder: "Enter 10-digit mobile number",
    };
  }

  if (name.includes("gas") || name.includes("piped")) {
    return {
      icon: <Flame size={26} />,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      defaultInputLabel: "BP Number (Business Partner)",
      defaultInputPlaceholder: "Enter 10-digit BP Number",
    };
  }

  if (name.includes("fastag") || name.includes("toll")) {
    return {
      icon: <Banknote size={26} />,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      badge: "Popular",
      defaultInputLabel: "Vehicle Registration Number",
      defaultInputPlaceholder: "e.g. DL01AB1234",
    };
  }

  if (name.includes("life insurance") || name.includes("term insurance")) {
    return {
      icon: <ShieldCheck size={26} />,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
      defaultInputLabel: "Policy Number",
      defaultInputPlaceholder: "Enter insurance policy number",
    };
  }

  if (name.includes("insurance")) {
    return {
      icon: <ShieldCheck size={26} />,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-500",
      defaultInputLabel: "Policy Number",
      defaultInputPlaceholder: "Enter policy number",
    };
  }

  if (name.includes("tax") || name.includes("municipal") || name.includes("nagar")) {
    return {
      icon: <Building2 size={26} />,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      defaultInputLabel: "Property / Assessment Number",
      defaultInputPlaceholder: "Enter property number",
    };
  }

  if (name.includes("credit card") || name.includes("card")) {
    return {
      icon: <CreditCard size={26} />,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      defaultInputLabel: "Credit Card Last 4 Digits / Mobile",
      defaultInputPlaceholder: "Enter last 4 digits of card",
    };
  }

  if (name.includes("loan") || name.includes("emi") || name.includes("finance")) {
    return {
      icon: <Wallet size={26} />,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
      defaultInputLabel: "Loan Account Number (LAN)",
      defaultInputPlaceholder: "Enter loan account number",
    };
  }

  if (name.includes("broadband") || name.includes("internet") || name.includes("fiber")) {
    return {
      icon: <Wifi size={26} />,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
      defaultInputLabel: "Account Number / User ID",
      defaultInputPlaceholder: "Enter broadband account number",
    };
  }

  if (name.includes("dth") || name.includes("cable") || name.includes("tv")) {
    return {
      icon: <Tv size={26} />,
      iconBg: "bg-fuchsia-50",
      iconColor: "text-fuchsia-600",
      defaultInputLabel: "Subscriber ID / Smart Card Number",
      defaultInputPlaceholder: "Enter subscriber ID",
    };
  }

  if (name.includes("mobile") || name.includes("recharge") || name.includes("postpaid")) {
    return {
      icon: <Smartphone size={26} />,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      defaultInputLabel: "Mobile Number",
      defaultInputPlaceholder: "Enter 10-digit mobile number",
    };
  }

  if (name.includes("education") || name.includes("school") || name.includes("college")) {
    return {
      icon: <GraduationCap size={26} />,
      iconBg: "bg-pink-50",
      iconColor: "text-pink-600",
      defaultInputLabel: "Student / Registration Number",
      defaultInputPlaceholder: "Enter student roll number",
    };
  }

  // Fallback
  return {
    icon: <Receipt size={26} />,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    defaultInputLabel: "Customer Account Number",
    defaultInputPlaceholder: "Enter account identification number",
  };
};

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const createBillNumber = () =>
  `BR${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}/${Math.floor(10000 + Math.random() * 89999)}`;

const createReference = () =>
  `BBP${new Date().getFullYear()}${Math.floor(100000 + Math.random() * 899999)}`;

const createTransactionId = () =>
  `TXN${Math.floor(100000000 + Math.random() * 899999999)}`;

// =============================================================
// Main BBPS Component
// =============================================================

const BBPS: React.FC = () => {
  // Categories State from API (GET /api/v1/bbps/categories)
  const [categories, setCategories] = useState<BbpsCategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BbpsCategoryItem | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Category Billers State from API (POST /api/v1/bbps/billers/by-category)
  const [categoryBillers, setCategoryBillers] = useState<BillerItem[]>([]);
  const [loadingBillers, setLoadingBillers] = useState(false);

  // Active Category Biller State
  const [selectedBiller, setSelectedBiller] = useState<BillerItem | null>(null);
  const [showBillerModal, setShowBillerModal] = useState(false);
  const [billerSearch, setBillerSearch] = useState("");

  // Form & Bill Details State
  const [consumerValues, setConsumerValues] = useState<Record<string, string>>({});
  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [consent, setConsent] = useState(false);
  const [screen, setScreen] = useState<"form" | "bill" | "success">("form");
  const [isFetching, setIsFetching] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Wallet & Receipt State
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactionId, setTransactionId] = useState("");
  const [bbpsReference, setBbpsReference] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch Wallet Balance
  const fetchWallet = useCallback(async () => {
    try {
      const res = await getWalletBalanceApi();
      if (res?.data?.availableBalance !== undefined) {
        setWalletBalance(res.data.availableBalance);
      } else if (res?.data?.balance !== undefined) {
        setWalletBalance(res.data.balance);
      }
    } catch {
      // Keep existing balance
    }
  }, []);

  // Fetch Billers dynamically by Category Name (POST /api/v1/bbps/billers/by-category)
  const fetchBillersForCategory = useCallback(async (categoryName: string) => {
    if (!categoryName) return;
    setLoadingBillers(true);
    try {
      const billers = await getBillersByCategoryNameApi(categoryName);
      setCategoryBillers(billers);
      if (billers.length > 0) {
        setSelectedBiller(billers[0]);
      } else {
        setSelectedBiller(null);
      }
    } catch {
      setCategoryBillers([]);
      setSelectedBiller(null);
    } finally {
      setLoadingBillers(false);
    }
  }, []);

  // Fetch Categories from Backend API (GET /api/v1/bbps/categories)
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    setCategoryError(null);

    try {
      const categoriesData = await getBbpsCategoriesApi();

      if (Array.isArray(categoriesData) && categoriesData.length > 0) {
        setCategories(categoriesData);
        const initialCategory = categoriesData[0];
        setSelectedCategory(initialCategory);

        // Fetch sub-category billers for the first selected category
        await fetchBillersForCategory(initialCategory.service_name);
      } else {
        setCategoryError("No BBPS categories available.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load BBPS categories";
      setCategoryError(message);
    } finally {
      setLoadingCategories(false);
    }
  }, [fetchBillersForCategory]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
    fetchWallet();
  }, [fetchCategories, fetchWallet]);

  // Filtered Billers for Modal search
  const filteredBillers = useMemo(() => {
    if (!billerSearch.trim()) {
      return categoryBillers;
    }
    const q = billerSearch.toLowerCase().trim();
    return categoryBillers.filter((biller) =>
      biller.service_name?.toLowerCase().includes(q) ||
      biller.opcode?.toLowerCase().includes(q)
    );
  }, [categoryBillers, billerSearch]);

  // Handle Category Click
  const handleCategoryChange = (category: BbpsCategoryItem) => {
    setSelectedCategory(category);
    setBillerSearch("");
    setConsumerValues({});
    setBillDetails(null);
    setPaymentAmount("");
    setConsent(false);
    setScreen("form");

    // Dynamically fetch billers/sub-categories for this category name
    fetchBillersForCategory(category.service_name);
  };

  const handleBillerSelect = (biller: BillerItem) => {
    setSelectedBiller(biller);
    setShowBillerModal(false);
    setBillerSearch("");
    setConsumerValues({});
    setBillDetails(null);
    setPaymentAmount("");
    setConsent(false);
    setScreen("form");
  };

  const handleInputChange = (field: string, value: string) => {
    setConsumerValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Visual Meta for current category
  const activeMeta = useMemo(() => {
    return resolveCategoryMeta(selectedCategory?.service_name || "");
  }, [selectedCategory]);

  // Check if current category or biller belongs to Life Insurance or Insurance
  const isInsuranceCategory = useMemo(() => {
    const catName = (selectedCategory?.service_name || "").toLowerCase().trim();
    const serviceType = (selectedBiller?.service_type || "").toLowerCase().trim();
    return (
      catName.includes("life insurance") ||
      catName.includes("insurance") ||
      serviceType.includes("life insurance") ||
      serviceType.includes("insurance")
    );
  }, [selectedCategory, selectedBiller]);

  // Lookup logged-in retailer email from in-memory session as a fallback
  const storedRetailerEmail = useMemo(() => {
    return getAuthUser()?.email || "";
  }, []);

  // Dynamic Field Labels based on currently selected Biller
  const primaryFieldLabel = selectedBiller?.CUSTNO || activeMeta.defaultInputLabel;
  const secondaryFieldLabel =
    selectedBiller?.FIELD1 || (isInsuranceCategory ? "Date of Birth (DOB)" : undefined);
  const tertiaryFieldLabel =
    (selectedBiller?.FIELD2 as string) || (isInsuranceCategory ? "Email ID" : undefined);
  const mobileFieldLabel = selectedBiller?.REFMOBILENO || "Mobile Number";

  const handleFetchBill = async () => {
    const primaryInput = (consumerValues[primaryFieldLabel] || "").trim();

    if (!primaryInput) {
      toast.error(`Please enter ${primaryFieldLabel}.`);
      return;
    }

    // Resolve secondary field value (DOB for Insurance / Life Insurance)
    const secondaryInput =
      (secondaryFieldLabel ? consumerValues[secondaryFieldLabel] : "")?.trim() ||
      consumerValues["FIELD1"]?.trim() ||
      consumerValues["Date of Birth (DOB)"]?.trim() ||
      consumerValues["DOB"]?.trim() ||
      consumerValues["dob"]?.trim() ||
      "";

    // Enforce DOB for Insurance and Life Insurance categories
    if (isInsuranceCategory) {
      if (!secondaryInput) {
        toast.error("Please enter Date of Birth (DOB).");
        return;
      }
    } else if (secondaryFieldLabel && !secondaryInput) {
      toast.error(`Please enter ${secondaryFieldLabel}.`);
      return;
    }

    // Resolve tertiary field value (Email ID for Insurance / Life Insurance)
    const tertiaryInput =
      (tertiaryFieldLabel ? consumerValues[tertiaryFieldLabel] : "")?.trim() ||
      consumerValues["FIELD2"]?.trim() ||
      consumerValues["Email ID"]?.trim() ||
      consumerValues["Email"]?.trim() ||
      consumerValues["email"]?.trim() ||
      storedRetailerEmail ||
      "";

    // Enforce Email ID for Insurance and Life Insurance categories
    if (isInsuranceCategory) {
      if (!tertiaryInput) {
        toast.error("Please enter Email ID.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(tertiaryInput)) {
        toast.error("Please enter a valid Email ID (e.g. name@example.com).");
        return;
      }
    } else if (tertiaryFieldLabel && !tertiaryInput) {
      toast.error(`Please enter ${tertiaryFieldLabel}.`);
      return;
    }

    const enteredMobile =
      (mobileFieldLabel && consumerValues[mobileFieldLabel]?.trim()) ||
      consumerValues["REFMOBILENO"]?.trim() ||
      consumerValues["mobile"]?.trim() ||
      consumerValues["Mobile Number"]?.trim() ||
      "";

    if (selectedBiller?.REFMOBILENO && !consumerValues[selectedBiller.REFMOBILENO]?.trim()) {
      toast.error(`Please enter ${selectedBiller.REFMOBILENO}.`);
      return;
    }

    if (enteredMobile && !/^[6-9]\d{9}$/.test(enteredMobile)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    const opcode = String(selectedBiller?.opcode || (selectedBiller?.id ? String(selectedBiller.id) : ""));
    if (!opcode) {
      toast.error("Operator code (opcode) is missing for this biller.");
      return;
    }

    const serviceId = String(
      selectedBiller?.service_id ??
      selectedBiller?.id ??
      selectedCategory?.id ??
      "0"
    );

    setIsFetching(true);

    try {
      // 11-digit unique numeric order ID (e.g. 45645634434)
      const randomOrderId = `${Math.floor(1 + Math.random() * 9)}${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      const refMobileNo =
        enteredMobile ||
        (primaryInput.match(/^[6-9]\d{9}$/) ? primaryInput : "9876543210");

      const custNo = primaryInput;
      const amtValue =
        (selectedBiller?.AMT && consumerValues[selectedBiller.AMT]?.trim()) ||
        consumerValues["AMT"]?.trim() ||
        consumerValues["amount"]?.trim() ||
        paymentAmount.trim() ||
        "0";

      // 6 Required BBPS parameters + FIELD1 + FIELD2 (Email ID for Insurance & Life Insurance)
      const payload: ViewBillPayload = {
        REFMOBILENO: refMobileNo,
        AMT: amtValue,
        CUSTNO: custNo,
        orderid: randomOrderId,
        opcode: opcode,
        service_id: serviceId,
        ...(secondaryInput ? { FIELD1: secondaryInput } : {}),
        ...(tertiaryInput ? { FIELD2: tertiaryInput } : {}),
      };

      const res = await viewBillApi(payload);

      console.log("[BBPS] viewBillApi response:", res);

      // Check if response indicates success
      const isSuccess =
        res?.success !== false &&
        res?.status !== false &&
        res?.status !== "FAILED" &&
        res?.status !== "ERROR";

      if (!isSuccess) {
        toast.error(res?.message || "Unable to fetch bill details for the provided consumer account.");
        return;
      }

      // Extract bill_details from various possible response structures
      const billData = res?.data ?? res;
      const billDetailsObj =
        billData?.bill_details ||
        billData?.billDetails ||
        billData?.data?.bill_details ||
        billData?.data ||
        billData;

      if (!billDetailsObj || typeof billDetailsObj !== "object") {
        toast.error(res?.message || "No bill details returned for this account.");
        return;
      }

      // Parse fields supporting diverse API conventions (Title Case, camelCase, snake_case)
      const customerName =
        billDetailsObj["Customer Name"] ||
        billDetailsObj["customer_name"] ||
        billDetailsObj["customerName"] ||
        billDetailsObj["name"] ||
        "VERIFIED CONSUMER";

      const billNumber =
        billDetailsObj["Bill Number"] ||
        billDetailsObj["bill_number"] ||
        billDetailsObj["billNumber"] ||
        billDetailsObj["billnumber"] ||
        createBillNumber();

      const billDate =
        billDetailsObj["Bill Date"] ||
        billDetailsObj["bill_date"] ||
        billDetailsObj["billDate"] ||
        billDetailsObj["billdate"] ||
        "";

      const dueDate =
        billDetailsObj["Bill Due Date"] ||
        billDetailsObj["due_date"] ||
        billDetailsObj["dueDate"] ||
        billDetailsObj["duedate"] ||
        "";

      const rawAmount =
        billDetailsObj["Bill Amount"] ??
        billDetailsObj["bill_amount"] ??
        billDetailsObj["billAmount"] ??
        billDetailsObj["amount"] ??
        billDetailsObj["dueamount"] ??
        billDetailsObj["due_amount"] ??
        0;
      const amount = Number(rawAmount) || 0;

      const billingPeriod =
        billDetailsObj["DUEFROMTO"] ||
        billDetailsObj["billing_period"] ||
        billDetailsObj["billingPeriod"] ||
        "";

      const customerId =
        billDetailsObj["Customer ID / Account ID"] ||
        billDetailsObj["customer_id"] ||
        billDetailsObj["customerId"] ||
        custNo;

      const partialPayAllow =
        billDetailsObj["Partial Pay Allow"] ??
        billDetailsObj["partial_pay_allow"] ??
        billDetailsObj["partialPayAllow"];

      setBillDetails({
        customerName: String(customerName).trim(),
        billNumber: String(billNumber).trim(),
        billDate: String(billDate).trim(),
        dueDate: String(dueDate).trim(),
        billingPeriod: String(billingPeriod).trim(),
        amount,
        customerId: String(customerId).trim(),
        partialPayAllow,
      });

      setPaymentAmount(amount > 0 ? amount.toFixed(2) : "");
      toast.success(res?.message || "Bill details fetched successfully!");
      setScreen("bill");
    } catch (err: unknown) {
      console.error("[BBPS] handleFetchBill error:", err);
      const errorMsg = getApiErrorMessage(
        err,
        "Failed to connect to BBPS provider network. Please check details and try again."
      );
      toast.error(errorMsg);
    } finally {
      setIsFetching(false);
    }
  };

  // Pay Bill Action (POST /api/v1/bbps/pay-bill)
  const handlePayBill = async () => {
    if (!billDetails) return;

    if (!consent) {
      toast.error("Please confirm customer consent to proceed with payment.");
      return;
    }

    const payValue = parseFloat(paymentAmount);
    if (isNaN(payValue) || payValue <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    if (payValue > walletBalance) {
      toast.error(
        `Insufficient wallet balance. Available: ${formatCurrency(walletBalance)}, Required: ${formatCurrency(payValue)}`
      );
      return;
    }

    setIsPaying(true);

    const primaryInput = consumerValues[primaryFieldLabel] || "";

    try {
      const randomOrderId = `${Math.floor(1 + Math.random() * 9)}${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const enteredMobile =
        (mobileFieldLabel && consumerValues[mobileFieldLabel]?.trim()) ||
        consumerValues["REFMOBILENO"]?.trim() ||
        consumerValues["mobile"]?.trim() ||
        consumerValues["Mobile Number"]?.trim() ||
        "";

      const refMobileNo =
        enteredMobile ||
        (primaryInput.match(/^[6-9]\d{9}$/) ? primaryInput : "9876543210");
      const opcode = String(selectedBiller?.opcode || (selectedBiller?.id ? String(selectedBiller.id) : ""));
      const serviceId = String(
        selectedBiller?.service_id ??
        selectedBiller?.id ??
        selectedCategory?.id ??
        "0"
      );
      const custNo = primaryInput;
      const secondaryInput =
        (secondaryFieldLabel ? consumerValues[secondaryFieldLabel] : "")?.trim() ||
        consumerValues["FIELD1"]?.trim() ||
        consumerValues["Date of Birth (DOB)"]?.trim() ||
        consumerValues["DOB"]?.trim() ||
        consumerValues["dob"]?.trim() ||
        "";

      const tertiaryInput =
        (tertiaryFieldLabel ? consumerValues[tertiaryFieldLabel] : "")?.trim() ||
        consumerValues["FIELD2"]?.trim() ||
        consumerValues["Email ID"]?.trim() ||
        consumerValues["Email"]?.trim() ||
        consumerValues["email"]?.trim() ||
        storedRetailerEmail ||
        "";

      const payload: PayBillPayload = {
        // 6 Required BBPS parameters
        REFMOBILENO: refMobileNo,
        AMT: String(payValue),
        CUSTNO: custNo,
        orderid: randomOrderId,
        opcode: opcode,
        service_id: serviceId,

        // Payment details
        amount: payValue,
        billnumber: billDetails.billNumber,
        billdate: billDetails.billDate,
        duedate: billDetails.dueDate,
        latitude: "28.6139",
        longitude: "77.2090",
        ...(secondaryInput ? { FIELD1: secondaryInput } : {}),
        ...(tertiaryInput ? { FIELD2: tertiaryInput } : {}),
      };

      const res = await payBillApi(payload);

      const payData = res?.data?.data || res?.data || res;
      const isSuccess =
        res?.success !== false &&
        res?.status !== false &&
        payData?.status !== false;

      if (!isSuccess) {
        const errorMsg =
          payData?.message ||
          res?.message ||
          "Bill payment could not be processed by provider.";
        toast.error(errorMsg);
        return;
      }

      const returnedTxnId =
        payData?.txnid ||
        payData?.transaction_id ||
        payData?.txn_id ||
        createTransactionId();

      const returnedRef =
        payData?.operator_ref ||
        payData?.rrn ||
        payData?.referenceid ||
        createReference();

      setWalletBalance((prev) => Math.max(0, prev - payValue));
      fetchWallet();
      setTransactionId(String(returnedTxnId));
      setBbpsReference(String(returnedRef));
      setPaymentDate(
        new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
      toast.success("Bill payment successfully completed!");
      setScreen("success");
    } catch (err: unknown) {
      const errorMsg = getApiErrorMessage(
        err,
        "Payment failed due to provider connection error. Please try again."
      );
      toast.error(errorMsg);
    } finally {
      setIsPaying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewPayment = () => {
    setConsumerValues({});
    setBillDetails(null);
    setPaymentAmount("");
    setConsent(false);
    setScreen("form");
  };

  const handleSyncBbps = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncBbpsDataApi();
      const message =
        res?.message || "BBPS categories and billers synchronized successfully!";
      toast.success(message);
      await fetchCategories();
    } catch (err: unknown) {
      console.error("[BBPS] handleSyncBbps error:", err);
      const errorMsg = getApiErrorMessage(
        err,
        "Failed to synchronize BBPS data. Please try again."
      );
      toast.error(errorMsg);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/60 to-slate-50 text-slate-800 pb-16 font-sans">
      {/* =========================================================
          Top Header
      ========================================================= */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Receipt size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Bharat Bill Payment System
                </h1>
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  BBPS Live
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official NPCI Biller Network Integration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync BBPS Data Button */}
            <button
              type="button"
              onClick={handleSyncBbps}
              // disabled={isSyncing}
              disabled
              title="Sync BBPS Categories & Billers with Database"
              className="flex items-center gap-2 rounded-xl border border-blue-200/90 bg-gradient-to-r from-blue-50 to-indigo-50/80 px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-2xs hover:from-blue-100 hover:to-indigo-100 hover:text-blue-900 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <RefreshCw
                size={14}
                className={isSyncing ? "animate-spin text-blue-600" : "text-blue-600"}
              />
              <span>{isSyncing ? "Syncing..." : "Sync BBPS Data"}</span>
            </button>

            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-1.5 shadow-2xs">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <Wallet size={15} />
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                  Wallet Balance
                </span>
                <span className="text-sm font-black text-emerald-950">
                  {formatCurrency(walletBalance)}
                </span>
              </div>
              <button
                type="button"
                onClick={fetchWallet}
                title="Refresh Wallet Balance"
                className="ml-1 text-emerald-700 hover:text-emerald-950 transition"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          Main Content Container
      ========================================================= */}
      <main className="mx-auto px-4 pt-6 sm:px-6">
        {/* Loading Categories Skeleton */}
        {loadingCategories && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="h-10 w-10 rounded-xl bg-slate-200 mb-2" />
                <div className="h-4 w-20 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {/* Error Loading Categories */}
        {categoryError && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center">
            <p className="text-sm font-semibold text-rose-800">{categoryError}</p>
            <button
              type="button"
              onClick={fetchCategories}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
            >
              <RefreshCw size={13} /> Retry Loading Categories
            </button>
          </div>
        )}

        {/* Dynamic Categories Grid */}
        {!loadingCategories && categories.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Select Utility Category
                </h2>
                <p className="text-xs text-slate-500">
                  Choose a category to view live billers and make instant payments
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {categories.length} Categories Live
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                const meta = resolveCategoryMeta(cat.service_name);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`group relative flex flex-col items-start justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-blue-600 bg-white shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20"
                        : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    {meta.badge && (
                      <span className="absolute top-3 right-3 rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                        {meta.badge}
                      </span>
                    )}

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${meta.iconBg} ${meta.iconColor}`}
                    >
                      {meta.icon}
                    </div>

                    <div className="mt-4">
                      <span
                        className={`block text-xs font-bold transition-colors ${
                          isSelected ? "text-blue-700" : "text-slate-800 group-hover:text-slate-900"
                        }`}
                      >
                        {cat.service_name}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-medium">
                        Live Fetch
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            Active Stage Screens
        ========================================================= */}
        {selectedCategory && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Main Interactive Panel (8 Cols) */}
            <div className="lg:col-span-8">
              {/* Screen 1: Dynamic Biller & Consumer Form */}
              {screen === "form" && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${activeMeta.iconBg} ${activeMeta.iconColor}`}
                      >
                        {activeMeta.icon}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {selectedCategory.service_name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {categoryBillers.length} biller operators available
                        </p>
                      </div>
                    </div>

                    {/* {selectedBiller?.opcode && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
                        Opcode: {selectedBiller.opcode}
                      </span>
                    )} */}
                  </div>


                  <div className="mt-6 space-y-5">
                    {/* Biller Selector Button */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Select Biller Operator
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowBillerModal(true)}
                        className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-left text-sm font-semibold text-slate-800 transition hover:border-blue-400 hover:bg-white focus:outline-none"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Landmark size={18} className="text-slate-400 shrink-0" />
                          <span className="truncate">
                            {selectedBiller?.service_name || "Select Biller"}
                          </span>
                        </div>
                        <ChevronDown size={18} className="text-slate-400 shrink-0 ml-2" />
                      </button>
                    </div>

                    {/* Primary Dynamic Input Field (CUSTNO) */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        {primaryFieldLabel}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                          <Hash size={17} />
                        </div>
                        <input
                          type="text"
                          value={consumerValues[primaryFieldLabel] || ""}
                          onChange={(e) =>
                            handleInputChange(primaryFieldLabel, e.target.value)
                          }
                          placeholder={`Enter ${primaryFieldLabel}`}
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>

                    {/* Secondary Field (FIELD1 - e.g. DOB) */}
                    {secondaryFieldLabel && (
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-700">
                          {secondaryFieldLabel}
                          {isInsuranceCategory && (
                            <span className="ml-1 text-rose-500 font-bold">*</span>
                          )}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                            <CalendarDays size={17} />
                          </div>
                          <input
                            type="text"
                            value={consumerValues[secondaryFieldLabel] || ""}
                            onChange={(e) =>
                              handleInputChange(secondaryFieldLabel, e.target.value)
                            }
                            placeholder={
                              isInsuranceCategory
                                ? "Enter Date of Birth (DD/MM/YYYY or DD-MM-YYYY)"
                                : `Enter ${secondaryFieldLabel} (e.g. DD/MM/YYYY)`
                            }
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/10"
                          />
                        </div>
                      </div>
                    )}

                    {/* Tertiary Field (FIELD2 - e.g. Email ID) */}
                    {tertiaryFieldLabel && (
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-700">
                          {tertiaryFieldLabel}
                          {isInsuranceCategory && (
                            <span className="ml-1 text-rose-500 font-bold">*</span>
                          )}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                            <Mail size={17} />
                          </div>
                          <input
                            type="email"
                            value={
                              consumerValues[tertiaryFieldLabel] !== undefined
                                ? consumerValues[tertiaryFieldLabel]
                                : isInsuranceCategory
                                ? storedRetailerEmail
                                : ""
                            }
                            onChange={(e) =>
                              handleInputChange(tertiaryFieldLabel, e.target.value)
                            }
                            placeholder={
                              isInsuranceCategory
                                ? "Enter Email ID (e.g. name@example.com)"
                                : `Enter ${tertiaryFieldLabel}`
                            }
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/10"
                          />
                        </div>
                      </div>
                    )}

                    {/* Mobile Field (REFMOBILENO) */}
                    {mobileFieldLabel && mobileFieldLabel !== primaryFieldLabel && (
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-700">
                          {mobileFieldLabel} (For SMS Receipt)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                            <Phone size={17} />
                          </div>
                          <input
                            type="tel"
                            maxLength={10}
                            value={consumerValues[mobileFieldLabel] || ""}
                            onChange={(e) =>
                              handleInputChange(mobileFieldLabel, e.target.value)
                            }
                            placeholder="Enter 10-digit mobile number"
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/10"
                          />
                        </div>
                      </div>
                    )}

                    {/* Fetch Bill Action Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isFetching}
                        onClick={handleFetchBill}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
                      >
                        {isFetching ? (
                          <>
                            <RefreshCw size={17} className="animate-spin" /> Fetching Live Bill...
                          </>
                        ) : (
                          <>
                            Fetch Live Bill <ArrowRight size={17} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

          

         





              {/* Screen 2: Bill Presentation & Payment Confirmation */}
              {screen === "bill" && billDetails && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                    <button
                      type="button"
                      onClick={() => setScreen("form")}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      <ArrowLeft size={16} /> Back to Details
                    </button>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                      Bill Fetched
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Biller Operator</span>
                        <span className="font-bold text-slate-900">{selectedBiller?.service_name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Customer Name</span>
                        <span className="font-bold text-slate-900">
                          {billDetails.customerName}
                        </span>
                      </div>
                      {billDetails.customerId && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Customer / Account ID</span>
                          <span className="font-mono font-bold text-slate-900">
                            {billDetails.customerId}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Bill Number</span>
                        <span className="font-mono font-bold text-slate-800">
                          {billDetails.billNumber}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Bill Date</span>
                        <span className="font-medium text-slate-700">
                          {billDetails.billDate}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Due Date</span>
                        <span className="font-bold text-rose-600">
                          {billDetails.dueDate}
                        </span>
                      </div>
                      {billDetails.billingPeriod && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Billing Period</span>
                          <span className="font-medium text-slate-700">
                            {billDetails.billingPeriod}
                          </span>
                        </div>
                      )}
                      {billDetails.partialPayAllow !== undefined && billDetails.partialPayAllow !== "" && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Partial Pay Allowed</span>
                          <span className="font-bold text-slate-800">
                            {String(billDetails.partialPayAllow)}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-800">Total Payable Amount</span>
                        <span className="text-xl font-black text-blue-700">
                          {formatCurrency(billDetails.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Customer Consent Checkbox */}
                    <div className="rounded-xl border border-slate-200 p-4 bg-white">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-600 font-medium leading-relaxed">
                          I confirm that customer consent and cash/funds have been collected for this utility bill payment.
                        </span>
                      </label>
                    </div>

                    <button
                      type="button"
                      disabled={isPaying || !consent}
                      onClick={handlePayBill}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
                    >
                      {isPaying ? (
                        <>
                          <RefreshCw size={17} className="animate-spin" /> Processing Payment...
                        </>
                      ) : (
                        <>
                          Pay {formatCurrency(parseFloat(paymentAmount) || billDetails.amount)} Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Screen 3: Transaction Receipt */}
              {screen === "success" && billDetails && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 text-center print:border-none print:shadow-none">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                    <Check size={32} />
                  </div>

                  <h3 className="text-xl font-black text-slate-900">
                    Bill Payment Successful!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your transaction has been settled via Bharat BillPay.
                  </p>

                  <div className="my-6 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-left text-xs space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transaction ID</span>
                      <span className="font-mono font-bold text-slate-900">{transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">BBPS Reference</span>
                      <span className="font-mono font-bold text-slate-900">{bbpsReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Biller Operator</span>
                      <span className="font-bold text-slate-900">{selectedBiller?.service_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Opcode</span>
                      <span className="font-mono font-bold text-slate-700">{selectedBiller?.opcode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer Name</span>
                      <span className="font-bold text-slate-900">{billDetails.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Date & Time</span>
                      <span className="font-semibold text-slate-800">{paymentDate}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-800">Amount Paid</span>
                      <span className="text-lg font-black text-emerald-600">
                        {formatCurrency(parseFloat(paymentAmount) || billDetails.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center print:hidden">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Printer size={15} /> Print Receipt
                    </button>
                    <button
                      type="button"
                      onClick={handleNewPayment}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition"
                    >
                      <Receipt size={15} /> Pay Another Bill
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side Trust & Operator Details Panel (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Selected Operator Card */}
              {selectedBiller && (
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Landmark size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Active Biller Operator
                      </h4>
                      {/* <p className="text-[11px] text-slate-500">
                        Opcode: {selectedBiller.opcode}
                      </p> */}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-3 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Service Type</span>
                      <span className="font-bold text-slate-800">
                        {selectedBiller.service_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Consumer Field</span>
                      <span className="font-semibold text-slate-700">
                        {primaryFieldLabel}
                      </span>
                    </div>
                    {(selectedBiller.FIELD1 || isInsuranceCategory) && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Secondary Field</span>
                        <span className="font-semibold text-slate-700">
                          {selectedBiller.FIELD1 || "Date of Birth (DOB)"}
                        </span>
                      </div>
                    )}
                    {(selectedBiller.FIELD2 || isInsuranceCategory) && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email Field</span>
                        <span className="font-semibold text-slate-700">
                          {selectedBiller.FIELD2 || "Email ID"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BBPS Trust Card */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      BBPS Assured Payment
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      NPCI National Biller Switch
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-600 space-y-2.5 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Instant bill dues verification direct from utility provider.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Real-time digital payment acknowledgment & receipt.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Instant commission credited to your retailer wallet.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================
          Biller Selection Modal
      ========================================================= */}
      {showBillerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Select {selectedCategory?.service_name} Operator
                </h3>
                <p className="text-xs text-slate-500">
                  {filteredBillers.length} operators available in network
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBillerModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="mt-4">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={billerSearch}
                  onChange={(e) => setBillerSearch(e.target.value)}
                  placeholder="Search operator name or opcode..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Billers List */}
            <div className="mt-4 max-h-80 overflow-y-auto divide-y divide-slate-100 pr-1">
              {loadingBillers ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                  Loading billers from BBPS network...
                </div>
              ) : filteredBillers.length > 0 ? (
                filteredBillers.map((biller) => (
                  <button
                    key={biller.id}
                    type="button"
                    onClick={() => handleBillerSelect(biller)}
                    className="flex w-full items-center justify-between py-3 px-2.5 text-left hover:bg-blue-50/60 rounded-xl transition group"
                  >
                    <div className="py-2 pr-3">
                      <span className="block text-xs font-bold text-slate-800 group-hover:text-blue-700">
                        {biller.service_name}
                      </span>
                      {/* <span className="block text-[10px] font-semibold text-slate-400">
                        Input: {biller.CUSTNO || "Consumer ID"}
                        {biller.FIELD1 ? ` | Secondary: ${biller.FIELD1}` : ""}
                      </span> */}
                    </div>
                    {/* <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-2 py-0.5 shrink-0">
                    #{biller.opcode}
                    </span> */}
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No billers found for "{billerSearch}".
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BBPS;
