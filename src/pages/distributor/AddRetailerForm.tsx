import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Phone,
  Store,
  UserRound,
  Fingerprint,
  Building2,
  Mail,
  CreditCard,
  MapPin,
  Navigation,
  Upload,
  Camera,
  Loader2,
  ShieldCheck,
  FileBadge,
  Sparkles,
  Calendar,
  AlertCircle,
  FileText,
  Search,
  X,
} from "lucide-react";

import {
  sendRetailerRegisterOtp,
  verifyRetailerRegisterOtp,
  sendRetailerEmailOtp,
  verifyRetailerEmailOtp,
  updateRetailerShopDetails,
  updateRetailerAboutDetails,
  updateRetailerAadhaarDetails,
  updateRetailerBankDetails,
  validatePincodeApi,
  getSettlementBankList,
  type SettlementBank,
} from "../../services/api/retailer/retailerAuthApi";

import {
  getCategories,
  getPropertyTypes,
  getProofTypes,
  type MasterDataItem,
} from "../../services/api/masterData/masterDataApi";

interface AddRetailerFormProps {
  distributorId?: string;
  distributorName?: string;
  onExit: () => void;
  onSuccess: () => void;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
];

const STEPS = [
  { id: 1, title: "Account", label: "Mobile Verification", icon: Phone },
  { id: 2, title: "Business", label: "Shop & Location", icon: Store },
  { id: 3, title: "Profile", label: "Personal Details", icon: UserRound },
  { id: 4, title: "KYC", label: "Aadhaar Identity", icon: Fingerprint },
  { id: 5, title: "Payout", label: "Bank Account", icon: Building2 },
];

const extractMasterDataList = (data: unknown): MasterDataItem[] => {
  if (Array.isArray(data)) return data as MasterDataItem[];
  if (data && typeof data === "object" && "data" in data) {
    const inner = (data as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as MasterDataItem[];
  }
  return [];
};

export default function AddRetailerForm({
  distributorId,
  distributorName,
  onExit,
  onSuccess,
}: AddRetailerFormProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [userId, setUserId] = useState<string>(() => {
    return localStorage.getItem("subRetailerUserId") || "";
  });

  // Global status & alerts
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState<boolean>(false);

  // ==========================================================
  // STEP 1 STATE: Mobile Account
  // ==========================================================
  const [mobile, setMobile] = useState("");
  const [mobileOtp, setMobileOtp] = useState(["", "", "", ""]);
  const [isMobileOtpSent, setIsMobileOtpSent] = useState(false);
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // ==========================================================
  // STEP 2 STATE: Shop, Email, Master Data, Address & State
  // ==========================================================
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);

  const [panNumber, setPanNumber] = useState("");
  const [panFile, setPanFile] = useState<File | null>(null);

  const [shopName, setShopName] = useState("");
  const [shopCategory, setShopCategory] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState(""); // <-- Requested field in user model
  const [pincode, setPincode] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeValid, setPincodeValid] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsDetecting, setGpsDetecting] = useState(false);

  const [insideShopFile, setInsideShopFile] = useState<File | null>(null);
  const [outsideShopFile, setOutsideShopFile] = useState<File | null>(null);
  const [shopLocationFile, setShopLocationFile] = useState<File | null>(null);
  const [businessProofType, setBusinessProofType] = useState("");
  const [businessProofFile, setBusinessProofFile] = useState<File | null>(null);

  // Master data
  const [categories, setCategories] = useState<MasterDataItem[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<MasterDataItem[]>([]);
  const [proofTypes, setProofTypes] = useState<MasterDataItem[]>([]);

  // ==========================================================
  // STEP 3 STATE: Personal Details
  // ==========================================================
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "T">("M");
  const [maritalStatus, setMaritalStatus] = useState("Single");
  const [educationalQualification, setEducationalQualification] = useState("Graduate");
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // ==========================================================
  // STEP 4 STATE: Aadhaar Identity
  // ==========================================================
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarConsent, setAadhaarConsent] = useState(true);
  const [aadhaarMobileLinked, setAadhaarMobileLinked] = useState<"yes" | "no">("yes");
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);

  // ==========================================================
  // STEP 5 STATE: Bank Details
  // ==========================================================
  const [bankList, setBankList] = useState<SettlementBank[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState<SettlementBank | null>(null);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [ifscCode, setIfscCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  // Close bank dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(e.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Master Data on mount
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [catRes, propRes, proofRes, bankRes] = await Promise.all([
          getCategories().catch(() => [] as MasterDataItem[]),
          getPropertyTypes().catch(() => [] as MasterDataItem[]),
          getProofTypes().catch(() => [] as MasterDataItem[]),
          getSettlementBankList(1, 100).catch(() => ({ success: false, data: [] as SettlementBank[] })),
        ]);
        const catList = extractMasterDataList(catRes);
        const propList = extractMasterDataList(propRes);
        const proofList = extractMasterDataList(proofRes);

        setCategories(catList.filter((c) => c.isActive));
        setPropertyTypes(propList.filter((p) => p.isActive));
        setProofTypes(proofList.filter((p) => p.isActive));
        if (bankRes?.data) setBankList(bankRes.data);
      } catch (err) {
        console.error("Failed to load registration master data:", err);
      }
    };
    fetchMasters();
  }, []);

  const [prevStep, setPrevStep] = useState(currentStep);
  if (currentStep !== prevStep) {
    setPrevStep(currentStep);
    setError("");
    setSuccessMsg("");
  }

  // Auto-scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // ==========================================================
  // STEP 1 HANDLERS: Mobile & OTP
  // ==========================================================
  const handleSendMobileOtp = async () => {
    setError("");
    if (mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsSubmitting(true);
    try {
      await sendRetailerRegisterOtp(mobile);
      setIsMobileOtpSent(true);
      setOtpTimer(45);
      setSuccessMsg("OTP has been sent to +91 " + mobile);
      // Focus first OTP field
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const e = err as { message?: string; statusCode?: number };
      if (e?.statusCode === 409 || e?.message?.includes("already registered")) {
        setError("This mobile number is already registered. Please use another number.");
      } else {
        setError(e?.message || "Failed to send OTP. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpBoxChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...mobileOtp];
    newOtp[index] = cleaned;
    setMobileOtp(newOtp);

    // Auto move to next input
    if (cleaned && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !mobileOtp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyMobileOtp = async () => {
    setError("");
    const fullOtp = mobileOtp.join("");
    if (fullOtp.length !== 4) {
      setError("Please enter the complete 4-digit OTP.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await verifyRetailerRegisterOtp({
        mobile,
        otp: fullOtp,
        distributorId,
      });

      const newUserId = res?.data?.user?._id;
      if (!newUserId) {
        throw new Error("Unable to retrieve created user identifier.");
      }
      setUserId(newUserId);
      localStorage.setItem("subRetailerUserId", newUserId);
      setIsMobileVerified(true);
      setSuccessMsg("Mobile verified successfully!");

      // Advance to step 2
      setTimeout(() => {
        setCurrentStep(2);
      }, 600);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Invalid OTP entered. Please check and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // STEP 2 HANDLERS: Shop, Email, Pincode & GPS
  // ==========================================================
  const handleSendEmailOtp = async () => {
    setError("");
    if (!userId) {
      setError("Session expired or missing user. Please restart from Step 1.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSendingEmailOtp(true);
    try {
      await sendRetailerEmailOtp({ userId, email: email.trim() });
      setIsEmailOtpSent(true);
      setSuccessMsg("Verification OTP sent to " + email);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Failed to send email OTP.");
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setError("");
    if (!emailOtp.trim()) {
      setError("Please enter the OTP sent to your email.");
      return;
    }
    setVerifyingEmailOtp(true);
    try {
      await verifyRetailerEmailOtp({
        userId,
        email: email.trim(),
        otp: emailOtp.trim(),
      });
      setIsEmailVerified(true);
      setSuccessMsg("Email successfully verified!");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Invalid email OTP. Please verify again.");
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  // Pincode validation with automatic City and State auto-population
  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(val);
    setPincodeValid(false);
    setPincodeError("");

    if (val.length === 6) {
      setPincodeLoading(true);
      try {
        const res = await validatePincodeApi(val);
        if (res?.data) {
          setPincodeValid(true);
          if (res.data.city && !city) setCity(res.data.city);
          if (res.data.state) setState(res.data.state);
        } else {
          setPincodeError("Pincode not recognized.");
        }
      } catch {
        setPincodeError("Failed to validate pincode.");
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // GPS Coordinates detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setGpsDetecting(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setGpsDetecting(false);
        setSuccessMsg("GPS Coordinates captured successfully!");
      },
      (err) => {
        console.warn("GPS detection error:", err);
        setError("Unable to retrieve coordinates. Please allow location permissions or enter manually.");
        setGpsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Step 2 Submission
  const handleSaveShopDetails = async () => {
    setError("");
    if (!isEmailVerified) {
      setError("Please complete email verification before proceeding.");
      return;
    }
    if (!panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber.toUpperCase())) {
      setError("Please enter a valid 10-character PAN number (e.g. ABCDE1234F).");
      return;
    }
    if (!shopName.trim()) {
      setError("Shop name is required.");
      return;
    }
    if (!shopCategory) {
      setError("Please select a Shop Category.");
      return;
    }
    if (!propertyType) {
      setError("Please select a Property Type.");
      return;
    }
    if (!address.trim() || address.trim().length < 10) {
      setError("Please enter a complete address (minimum 10 characters).");
      return;
    }
    if (!city.trim()) {
      setError("City is required.");
      return;
    }
    if (!state.trim()) {
      setError("State is required.");
      return;
    }
    if (!pincode || pincode.length !== 6) {
      setError("Please enter a valid 6-digit Pincode.");
      return;
    }
    if (latitude == null || longitude == null) {
      setError("Shop coordinates (Latitude & Longitude) are required. Click 'Detect via GPS' or enter manually.");
      return;
    }
    if (!businessProofType) {
      setError("Please select an Address / Business Proof Type.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRetailerShopDetails({
        userId,
        panNumber: panNumber.toUpperCase(),
        shopName: shopName.trim(),
        shopCategory,
        propertyType,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        latitude,
        longitude,
        businessProofType,
        distributorId,
        panDocument: panFile,
        shopInsidePhoto: insideShopFile,
        shopOutsidePhoto: outsideShopFile,
        shopLocationPhoto: shopLocationFile,
        businessProofDocument: businessProofFile,
      });

      setSuccessMsg("Shop details saved successfully!");
      setTimeout(() => setCurrentStep(3), 500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Failed to save shop details. Please check all fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // STEP 3 HANDLERS: Personal Details
  // ==========================================================
  const handleSaveAboutDetails = async () => {
    setError("");
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!dateOfBirth) {
      setError("Date of birth is required.");
      return;
    }
    if (!selfieFile) {
      setError("Retailer selfie / portrait photo is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRetailerAboutDetails({
        userId,
        fullName: fullName.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        dateOfBirth,
        gender,
        maritalStatus,
        educationalQualification,
        selfie: selfieFile,
      });

      setSuccessMsg("Personal details saved successfully!");
      setTimeout(() => setCurrentStep(4), 500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Failed to save personal details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // STEP 4 HANDLERS: Aadhaar Identity
  // ==========================================================
  const handleSaveAadhaarDetails = async () => {
    setError("");
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, "");
    if (cleanAadhaar.length !== 12) {
      setError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    if (!aadhaarConsent) {
      setError("Aadhaar consent is mandatory to proceed with statutory KYC.");
      return;
    }
    if (!aadhaarFile) {
      setError("Aadhaar document (image or PDF) is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRetailerAadhaarDetails({
        userId,
        aadhaarNumber: cleanAadhaar,
        aadhaarDocument: aadhaarFile,
        aadhaarConsent: true,
        isAdharConsentGiven: true,
        aadhaarMobileLinked: aadhaarMobileLinked === "yes",
      });

      setSuccessMsg("Aadhaar KYC verified and saved!");
      setTimeout(() => setCurrentStep(5), 500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Failed to save Aadhaar details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // STEP 5 HANDLERS: Bank Details & Complete Onboarding
  // ==========================================================
  const handleCompleteRegistration = async () => {
    setError("");
    if (!selectedBank && !bankSearch.trim()) {
      setError("Please select or specify the Retailer's bank name.");
      return;
    }
    if (!ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
      setError("Please enter a valid 11-character IFSC code (e.g. SBIN0001234).");
      return;
    }
    if (!accountNumber || accountNumber.length < 9) {
      setError("Please enter a valid bank account number (9 to 18 digits).");
      return;
    }
    if (accountNumber !== confirmAccountNumber) {
      setError("Account numbers do not match. Please verify.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRetailerBankDetails({
        userId,
        bankName: selectedBank?.description || bankSearch.trim(),
        bank_code: selectedBank?.code || undefined,
        ifscCode: ifscCode.toUpperCase(),
        accountNumber: accountNumber.trim(),
        distributorId,
      });

      // Clear local working cache
      localStorage.removeItem("subRetailerUserId");
      setIsCompletedModalOpen(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || "Failed to complete retailer registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file preview utilities
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview?: (url: string | null) => void
  ) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (setPreview && f.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(f));
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* =======================================================
          TOP EXECUTIVE HEADER & BREADCRUMB
      ======================================================= */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Distributor Network</span>
            <span>/</span>
            <span className="text-[#7c3aed]">Retailer Onboarding</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Onboard New Retailer
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-[#7c3aed] ring-1 ring-inset ring-[#7c3aed]/20">
              <Sparkles className="h-3.5 w-3.5 text-[#7c3aed]" />
              Downline Assignment: {distributorName || "Active Distributor"}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Register and verify KYC credentials for a new merchant under your distribution network.
          </p>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit to Retailer List</span>
        </button>
      </div>

      {/* =======================================================
          MODERN STEPPER BAR
      ======================================================= */}
      <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex min-w-[720px] items-center justify-between">
          {STEPS.map((s, index) => {
            const isCompleted = s.id < currentStep;
            const isActive = s.id === currentStep;
            const Icon = s.icon;

            return (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : isActive
                        ? "bg-gradient-to-tr from-[#7c3aed] to-[#6d28d9] text-white shadow-lg shadow-violet-500/30 ring-4 ring-violet-100"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 stroke-[2.5]" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isActive
                          ? "text-[#7c3aed]"
                          : isCompleted
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }`}
                    >
                      Step 0{s.id}
                    </p>
                    <p
                      className={`text-sm font-extrabold ${
                        isActive
                          ? "text-slate-900"
                          : isCompleted
                          ? "text-slate-700"
                          : "text-slate-400"
                      }`}
                    >
                      {s.title}
                    </p>
                  </div>
                </div>

                {index < STEPS.length - 1 && (
                  <div className="mx-4 h-0.5 flex-1 bg-slate-100">
                    <div
                      className={`h-full transition-all duration-500 ${
                        s.id < currentStep ? "bg-emerald-500" : "bg-transparent"
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* =======================================================
          ALERT NOTIFICATIONS (ERROR / SUCCESS)
      ======================================================= */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm font-semibold text-rose-800 shadow-sm animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="text-rose-400 hover:text-rose-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm font-semibold text-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* =======================================================
          STEP 1: MOBILE & ACCOUNT CREATION
      ======================================================= */}
      {currentStep === 1 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form & Inputs */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Retailer Mobile Verification</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the retailer's 10-digit mobile number. We will dispatch a 4-digit verification code.
                </p>
              </div>

              {/* Mobile Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                      +91
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                        setIsMobileOtpSent(false);
                        setMobileOtp(["", "", "", ""]);
                      }}
                      placeholder="Enter 10-digit phone number"
                      disabled={isMobileVerified || isMobileOtpSent}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-14 pr-4 font-mono text-base font-bold text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-violet-500/10 disabled:opacity-75"
                    />
                  </div>

                  {!isMobileOtpSent && (
                    <button
                      type="button"
                      onClick={handleSendMobileOtp}
                      disabled={mobile.length !== 10 || isSubmitting}
                      className="flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-[#7c3aed] px-6 text-sm font-bold text-white shadow-md shadow-violet-500/20 transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      Send OTP
                    </button>
                  )}
                </div>
              </div>

              {/* 4-Digit Segmented OTP Input */}
              {isMobileOtpSent && !isMobileVerified && (
                <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Enter Verification Code</p>
                      <p className="text-xs text-slate-500">Code sent to +91 {mobile}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileOtpSent(false);
                        setMobileOtp(["", "", "", ""]);
                      }}
                      className="text-xs font-bold text-[#7c3aed] hover:underline"
                    >
                      Change Number
                    </button>
                  </div>

                  <div className="flex justify-center gap-3">
                    {mobileOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="h-14 w-14 rounded-2xl border border-slate-200 bg-white text-center font-mono text-xl font-black text-slate-900 shadow-sm outline-none transition focus:border-[#7c3aed] focus:ring-4 focus:ring-violet-500/20"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs font-semibold text-slate-500">
                      {otpTimer > 0 ? (
                        <span>Resend code in <strong className="text-slate-800">{otpTimer}s</strong></span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendMobileOtp}
                          className="font-bold text-[#7c3aed] hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyMobileOtp}
                      disabled={mobileOtp.join("").length !== 4 || isSubmitting}
                      className="flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 stroke-[2.5]" />
                      )}
                      Verify & Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Downline security badge */}
              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-[#7c3aed] shrink-0 mt-0.5" />
                <span>
                  Completing this registration will automatically map this merchant to your distributor code. The retailer will appear in your downline dashboard with pending KYC status.
                </span>
              </div>
            </div>

            {/* Right Column: Executive Onboarding Guide Card */}
            <div className="lg:col-span-5 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/50 via-slate-50 to-indigo-50/30 p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7c3aed] text-white shadow-md shadow-violet-500/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Onboarding Guidelines</h3>
                  <p className="text-[11px] text-slate-500">What you need to complete registration</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-xs border border-slate-100">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[#7c3aed] font-bold text-[11px]">
                    1
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Business Premises & Photos</p>
                    <p className="text-slate-500 text-[11px]">Shop Name, Pincode, State & store photos (inside, outside, location).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-xs border border-slate-100">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[#7c3aed] font-bold text-[11px]">
                    2
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Identity & Statutory Proofs</p>
                    <p className="text-slate-500 text-[11px]">Valid PAN Card, Aadhaar document, and retailer selfie portrait.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-xs border border-slate-100">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[#7c3aed] font-bold text-[11px]">
                    3
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Payout Settlement Account</p>
                    <p className="text-slate-500 text-[11px]">Bank account number and IFSC code for fast wallet transfers.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 flex items-center gap-3 text-xs text-emerald-800 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Instant commission tracking activated upon onboarding approval.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          STEP 2: SHOP DETAILS, STATE & LOCATION
      ======================================================= */}
      {currentStep === 2 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Shop, Location & Business Proofs</h2>
            <p className="mt-1 text-sm text-slate-500">
              Provide merchant business premises information, state, coordinates, and statutory shop proofs.
            </p>
          </div>

          {/* Section A: Email Verification */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <Mail className="h-4 w-4 text-[#7c3aed]" />
              <span>Business Email Verification <span className="text-rose-500">*</span></span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="email"
                placeholder="retailer.business@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsEmailVerified(false);
                  setIsEmailOtpSent(false);
                }}
                disabled={isEmailVerified}
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-[#7c3aed] focus:ring-2 focus:ring-violet-500/10 disabled:opacity-80"
              />

              {!isEmailVerified && (
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  disabled={sendingEmailOtp || !email.trim()}
                  className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-violet-200 bg-white px-5 text-xs font-bold text-[#7c3aed] shadow-sm transition hover:bg-violet-50 disabled:opacity-50"
                >
                  {sendingEmailOtp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                  {isEmailOtpSent ? "Resend Email OTP" : "Send Email OTP"}
                </button>
              )}

              {isEmailVerified && (
                <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Email Verified
                </span>
              )}
            </div>

            {/* Email OTP Input if sent */}
            {isEmailOtpSent && !isEmailVerified && (
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter OTP"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-10 w-40 rounded-xl border border-slate-200 bg-white px-3 font-mono text-center text-sm font-bold tracking-widest outline-none focus:border-[#7c3aed]"
                />
                <button
                  type="button"
                  onClick={handleVerifyEmailOtp}
                  disabled={verifyingEmailOtp || !emailOtp}
                  className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {verifyingEmailOtp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Verify OTP
                </button>
              </div>
            )}
          </div>

          {/* Section B: PAN Card & Document */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                PAN Card Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 font-mono text-sm font-bold uppercase text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Upload PAN Document (Image or PDF)
              </label>
              <label className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 transition hover:border-[#7c3aed] hover:bg-violet-50/30">
                <div className="flex items-center gap-2 truncate text-xs font-semibold text-slate-600">
                  <Upload className="h-4 w-4 text-[#7c3aed]" />
                  <span className="truncate">{panFile ? panFile.name : "Choose PAN document"}</span>
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, setPanFile)}
                  className="hidden"
                />
                {panFile && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
              </label>
            </div>
          </div>

          {/* Section C: Shop Business Information */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Store / Shop Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Sharma Telecom & Retail"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-violet-500/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Shop Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={shopCategory}
                onChange={(e) => setShopCategory(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#7c3aed] focus:bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Property Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#7c3aed] focus:bg-white"
              >
                <option value="">Select Property Type</option>
                {propertyTypes.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section D: Address, City, State & Pincode (State field added as requested) */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Complete Physical Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop number, building name, street, nearby landmark"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-violet-500/10"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {/* Pincode with real-time validator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Pincode <span className="text-rose-500">*</span>
                  </label>
                  {pincodeLoading && <Loader2 className="h-3 w-3 animate-spin text-[#7c3aed]" />}
                  {pincodeValid && <span className="text-[11px] font-bold text-emerald-600">✓ Valid</span>}
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={handlePincodeChange}
                  placeholder="6-digit Pincode"
                  className={`h-11 w-full rounded-xl border px-4 font-mono text-sm font-bold outline-none transition ${
                    pincodeValid
                      ? "border-emerald-300 bg-emerald-50/30 text-emerald-900"
                      : "border-slate-200 bg-slate-50/60 text-slate-900 focus:border-[#7c3aed] focus:bg-white"
                  }`}
                />
                {pincodeError && <p className="text-[11px] font-semibold text-rose-500">{pincodeError}</p>}
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white"
                />
              </div>

              {/* State (Added to User Model & Form) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  State <span className="text-rose-500">*</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#7c3aed] focus:bg-white"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section E: GPS Coordinates */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Store Geotagging & Coordinates <span className="text-rose-500">*</span></p>
                <p className="text-xs text-slate-500">Provide accurate coordinates for merchant verification and regulatory compliance.</p>
              </div>
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={gpsDetecting}
                className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3.5 py-2 text-xs font-bold text-[#7c3aed] shadow-sm transition hover:bg-violet-50 disabled:opacity-50"
              >
                <Navigation className={`h-3.5 w-3.5 ${gpsDetecting ? "animate-spin text-[#7c3aed]" : ""}`} />
                {gpsDetecting ? "Locating..." : "Detect via GPS"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude (e.g. 19.0760)"
                  value={latitude ?? ""}
                  onChange={(e) => setLatitude(e.target.value === "" ? null : parseFloat(e.target.value))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 font-mono text-xs font-bold text-slate-800 outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude (e.g. 72.8777)"
                  value={longitude ?? ""}
                  onChange={(e) => setLongitude(e.target.value === "" ? null : parseFloat(e.target.value))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 font-mono text-xs font-bold text-slate-800 outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>
          </div>

          {/* Section F: Storefront Media & Proofs */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Storefront Photographs & Business Proof</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Inside Shop */}
              <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-5 text-center transition hover:border-[#7c3aed] hover:bg-violet-50/20 cursor-pointer">
                <Camera className="h-6 w-6 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Inside Shop Photo</span>
                <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                  {insideShopFile ? insideShopFile.name : "Upload inside view"}
                </span>
                {insideShopFile && <span className="text-[10px] font-bold text-emerald-600">✓ Uploaded</span>}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setInsideShopFile)}
                  className="hidden"
                />
              </label>

              {/* Outside Shop */}
              <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-5 text-center transition hover:border-[#7c3aed] hover:bg-violet-50/20 cursor-pointer">
                <Camera className="h-6 w-6 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Outside Shop Photo</span>
                <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                  {outsideShopFile ? outsideShopFile.name : "Upload exterior signage"}
                </span>
                {outsideShopFile && <span className="text-[10px] font-bold text-emerald-600">✓ Uploaded</span>}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setOutsideShopFile)}
                  className="hidden"
                />
              </label>

              {/* Shop Location Photo */}
              <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-5 text-center transition hover:border-[#7c3aed] hover:bg-violet-50/20 cursor-pointer">
                <Camera className="h-6 w-6 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Location Photo</span>
                <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                  {shopLocationFile ? shopLocationFile.name : "Upload street perspective"}
                </span>
                {shopLocationFile && <span className="text-[10px] font-bold text-emerald-600">✓ Uploaded</span>}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setShopLocationFile)}
                  className="hidden"
                />
              </label>
            </div>

            {/* Business Proof Selection & Document */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Business Proof Document Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={businessProofType}
                  onChange={(e) => setBusinessProofType(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#7c3aed] focus:bg-white"
                >
                  <option value="">Select Proof Document Type</option>
                  {proofTypes.map((pt) => (
                    <option key={pt._id} value={pt._id}>{pt.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Upload Business Proof Document
                </label>
                <label className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 transition hover:border-[#7c3aed] hover:bg-violet-50/30">
                  <div className="flex items-center gap-2 truncate text-xs font-semibold text-slate-600">
                    <FileBadge className="h-4 w-4 text-[#7c3aed]" />
                    <span className="truncate">{businessProofFile ? businessProofFile.name : "Upload GST / Trade License / Bill"}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, setBusinessProofFile)}
                    className="hidden"
                  />
                  {businessProofFile && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                </label>
              </div>
            </div>
          </div>

          {/* Step 2 Actions */}
          <div className="flex items-center justify-between border-t border-slate-200/80 pt-6">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            <button
              type="button"
              onClick={handleSaveShopDetails}
              disabled={isSubmitting}
              className="flex h-11 items-center gap-2 rounded-xl bg-[#7c3aed] px-7 text-sm font-bold text-white shadow-md shadow-violet-500/20 transition hover:bg-[#6d28d9] disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Save & Continue to Profile
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          STEP 3: PERSONAL DETAILS & SELFIE
      ======================================================= */}
      {currentStep === 3 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Personal Information & Portrait</h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter the merchant's personal KYC details and capture/upload their portrait photograph.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="As per PAN card and Aadhaar"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                />
              </div>
            </div>

            {/* Father's Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Father / Guardian Name
              </label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="Father's full name"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white"
              />
            </div>

            {/* Mother's Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Mother Name
              </label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="Mother's full name"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Gender <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: "M", label: "Male" },
                  { code: "F", label: "Female" },
                  { code: "T", label: "Other" },
                ].map((g) => (
                  <button
                    key={g.code}
                    type="button"
                    onClick={() => setGender(g.code as "M" | "F" | "T")}
                    className={`h-11 rounded-xl border text-xs font-bold transition ${
                      gender === g.code
                        ? "border-[#7c3aed] bg-violet-50 text-[#7c3aed] shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Marital Status */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Marital Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#7c3aed] focus:bg-white"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            {/* Educational Qualification */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Educational Qualification <span className="text-rose-500">*</span>
              </label>
              <select
                value={educationalQualification}
                onChange={(e) => setEducationalQualification(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#7c3aed] focus:bg-white"
              >
                <option value="10th Standard or Below">10th Standard or Below</option>
                <option value="12th Standard / Higher Secondary">12th Standard / Higher Secondary</option>
                <option value="Diploma">Diploma</option>
                <option value="Graduate">Graduate</option>
                <option value="Post Graduate">Post Graduate</option>
                <option value="Professional Degree">Professional Degree</option>
              </select>
            </div>
          </div>

          {/* Selfie / Portrait Upload */}
          <div className="pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
              Retailer Live Portrait / Selfie <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm flex items-center justify-center">
                {selfiePreview ? (
                  <img src={selfiePreview} alt="Retailer Selfie" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-12 w-12 text-slate-300" />
                )}
              </div>

              <div className="space-y-2 flex-1 text-center sm:text-left">
                <p className="text-sm font-bold text-slate-800">Front Facing Photo</p>
                <p className="text-xs text-slate-500">
                  Take or upload a clean, well-lit photo of the retailer's face with eyes open and without sunglasses.
                </p>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#7c3aed] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#6d28d9]">
                  <Camera className="h-3.5 w-3.5" />
                  <span>{selfieFile ? "Change Photo" : "Upload Selfie"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setSelfieFile, setSelfiePreview)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Step 3 Actions */}
          <div className="flex items-center justify-between border-t border-slate-200/80 pt-6">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            <button
              type="button"
              onClick={handleSaveAboutDetails}
              disabled={isSubmitting}
              className="flex h-11 items-center gap-2 rounded-xl bg-[#7c3aed] px-7 text-sm font-bold text-white shadow-md shadow-violet-500/20 transition hover:bg-[#6d28d9] disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Save & Continue to KYC
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          STEP 4: AADHAAR IDENTITY KYC
      ======================================================= */}
      {currentStep === 4 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Aadhaar Identity & Statutory KYC</h2>
            <p className="mt-1 text-sm text-slate-500">
              Provide the merchant's 12-digit Aadhaar number and statutory identification document.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Number, Linked status, consent */}
            <div className="lg:col-span-7 space-y-6">
              {/* Aadhaar Number */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  12-Digit Aadhaar Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    maxLength={14}
                    value={aadhaarNumber}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "").slice(0, 12);
                      const formatted = clean.replace(/(.{4})/g, "$1 ").trim();
                      setAadhaarNumber(formatted);
                    }}
                    placeholder="0000 0000 0000"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-12 pr-4 font-mono text-base font-bold text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                  />
                </div>
              </div>

              {/* Mobile Linked Radio */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Is Mobile Number Linked with Aadhaar? <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAadhaarMobileLinked("yes")}
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition ${
                      aadhaarMobileLinked === "yes"
                        ? "border-[#7c3aed] bg-violet-50 text-[#7c3aed]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Yes, Linked
                  </button>
                  <button
                    type="button"
                    onClick={() => setAadhaarMobileLinked("no")}
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition ${
                      aadhaarMobileLinked === "no"
                        ? "border-[#7c3aed] bg-violet-50 text-[#7c3aed]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    No, Not Linked
                  </button>
                </div>
              </div>

              {/* Statutory Consent Checkbox */}
              <div className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
                <input
                  type="checkbox"
                  id="aadhaar-consent-cb"
                  checked={aadhaarConsent}
                  onChange={(e) => setAadhaarConsent(e.target.checked)}
                  className="h-4 w-4 rounded text-[#7c3aed] focus:ring-violet-500 mt-0.5 cursor-pointer"
                />
                <label htmlFor="aadhaar-consent-cb" className="text-xs leading-5 text-slate-600 cursor-pointer">
                  I hereby declare that the Aadhaar details provided belong to the merchant being onboarded and consent is granted for identity verification for financial onboarding under HappyPay policies.
                </label>
              </div>
            </div>

            {/* Right Column: Aadhaar Document Upload & Guidelines */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Upload Aadhaar Document <span className="text-rose-500">*</span>
                </label>
                <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center cursor-pointer transition hover:border-[#7c3aed] hover:bg-violet-50/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-[#7c3aed]">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {aadhaarFile ? aadhaarFile.name : "Click or drag Aadhaar file"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Front & Back scan / e-Aadhaar PDF up to 10MB</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#7c3aed] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs">
                    <Upload className="h-3.5 w-3.5" />
                    {aadhaarFile ? "Replace File" : "Select Document"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, setAadhaarFile)}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <ShieldCheck className="h-4 w-4 text-[#7c3aed]" />
                  <span>UIDAI Compliance & Security</span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-500 list-disc list-inside">
                  <li>Masked Aadhaar is accepted and recommended.</li>
                  <li>Ensure all 12 digits, name, and photo are legible.</li>
                  <li>Encrypted data transmission under UIDAI e-KYC standards.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 4 Actions */}
          <div className="flex items-center justify-between border-t border-slate-200/80 pt-6">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            <button
              type="button"
              onClick={handleSaveAadhaarDetails}
              disabled={isSubmitting || !aadhaarConsent}
              className="flex h-11 items-center gap-2 rounded-xl bg-[#7c3aed] px-7 text-sm font-bold text-white shadow-md shadow-violet-500/20 transition hover:bg-[#6d28d9] disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Save & Continue to Bank
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          STEP 5: PAYOUT BANK & FINAL CONFIRMATION
      ======================================================= */}
      {currentStep === 5 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Payout Settlement Bank Account</h2>
            <p className="mt-1 text-sm text-slate-500">
              Provide the primary bank account for AEPS, DMT, and commercial wallet settlements.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Searchable Bank Selector */}
            <div className="space-y-2 relative" ref={bankDropdownRef}>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Select Bank <span className="text-rose-500">*</span>
              </label>
              <div
                onClick={() => setIsBankDropdownOpen((prev) => !prev)}
                className="flex h-12 w-full cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 px-4 text-sm font-semibold text-slate-800 transition hover:bg-white focus:border-[#7c3aed]"
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {selectedBank ? selectedBank.description : bankSearch || "Choose a bank from list"}
                  </span>
                </div>
                <Search className="h-4 w-4 text-slate-400" />
              </div>

              {/* Dropdown popup */}
              {isBankDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="sticky top-0 bg-white p-1 pb-2">
                    <input
                      type="text"
                      placeholder="Search bank name..."
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                  <div className="divide-y divide-slate-100">
                    {bankList
                      .filter((b) =>
                        b.description.toLowerCase().includes(bankSearch.toLowerCase()) ||
                        b.code.toLowerCase().includes(bankSearch.toLowerCase())
                      )
                      .slice(0, 50)
                      .map((b) => (
                        <div
                          key={b.code || b.description}
                          onClick={() => {
                            setSelectedBank(b);
                            setIsBankDropdownOpen(false);
                          }}
                          className="flex items-center justify-between p-2.5 text-xs font-semibold text-slate-700 hover:bg-violet-50 hover:text-[#7c3aed] cursor-pointer rounded-lg transition"
                        >
                          <span>{b.description}</span>
                          {selectedBank?.code === b.code && <Check className="h-3.5 w-3.5 text-[#7c3aed]" />}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* IFSC Code */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                IFSC Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={11}
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="e.g. SBIN0001234"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 font-mono text-sm font-bold uppercase text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-violet-500/10"
              />
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Account Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 18))}
                placeholder="Enter account number"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 font-mono text-sm font-bold text-slate-900 outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-violet-500/10"
              />
            </div>

            {/* Confirm Account Number */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Confirm Account Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={confirmAccountNumber}
                onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 18))}
                placeholder="Re-enter account number"
                className={`h-12 w-full rounded-2xl border px-4 font-mono text-sm font-bold outline-none transition ${
                  confirmAccountNumber && confirmAccountNumber !== accountNumber
                    ? "border-rose-300 bg-rose-50/30 text-rose-900"
                    : confirmAccountNumber && confirmAccountNumber === accountNumber
                    ? "border-emerald-300 bg-emerald-50/30 text-emerald-900"
                    : "border-slate-200 bg-slate-50/60 text-slate-900 focus:border-[#7c3aed] focus:bg-white"
                }`}
              />
              {confirmAccountNumber && confirmAccountNumber !== accountNumber && (
                <p className="text-[11px] font-semibold text-rose-500">Account numbers do not match.</p>
              )}
            </div>
          </div>

          {/* Pre-Submission Summary Checklist */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Onboarding Summary Review</p>
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div className="rounded-xl bg-white p-3 shadow-xs">
                <span className="text-slate-400 block text-[10px]">Merchant</span>
                <span className="font-bold text-slate-900 truncate block">{fullName || "Not set"}</span>
                <span className="text-slate-500 font-mono text-[11px]">+91 {mobile}</span>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-xs">
                <span className="text-slate-400 block text-[10px]">Business & State</span>
                <span className="font-bold text-slate-900 truncate block">{shopName || "Not set"}</span>
                <span className="text-[#7c3aed] font-semibold text-[11px]">{state || city || "State not set"}</span>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-xs">
                <span className="text-slate-400 block text-[10px]">PAN & Aadhaar</span>
                <span className="font-bold font-mono text-slate-900 block">{panNumber || "—"}</span>
                <span className="text-slate-500 font-mono text-[11px]">{aadhaarNumber || "—"}</span>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-xs">
                <span className="text-slate-400 block text-[10px]">Network Owner</span>
                <span className="font-bold text-slate-900 truncate block">{distributorName || "Active Distributor"}</span>
                <span className="text-emerald-600 font-semibold text-[11px]">Direct Downline</span>
              </div>
            </div>
          </div>

          {/* Step 5 Actions */}
          <div className="flex items-center justify-between border-t border-slate-200/80 pt-6">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            <button
              type="button"
              onClick={handleCompleteRegistration}
              disabled={isSubmitting}
              className="flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Onboarding...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>Submit & Complete Onboarding</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          SUCCESS COMPLETION MODAL
      ======================================================= */}
      {isCompletedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Retailer Successfully Onboarded!</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>{fullName}</strong> ({shopName}) has been registered and mapped under your downline network. Identity documents have been forwarded for administrative KYC verification.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={onSuccess}
                className="h-11 w-full rounded-xl bg-[#7c3aed] text-sm font-bold text-white shadow-md shadow-violet-500/20 transition hover:bg-[#6d28d9]"
              >
                View in Distributor Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCompletedModalOpen(false);
                  setCurrentStep(1);
                  setMobile("");
                  setMobileOtp(["", "", "", ""]);
                  setIsMobileOtpSent(false);
                  setIsMobileVerified(false);
                  setFullName("");
                  setFatherName("");
                  setMotherName("");
                  setDateOfBirth("");
                  setGender("M");
                  setMaritalStatus("Single");
                  setEducationalQualification("Graduate");
                  setSelfieFile(null);
                  setSelfiePreview(null);
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Onboard Another Retailer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
