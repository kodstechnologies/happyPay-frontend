import { useState, useEffect, useRef, useCallback } from "react";
import { rdService } from "../../../utils/rdService";
import { getDeviceInfo } from "../../../apis/bioKyc";
import MiniStatement, { type MiniStatementData } from "./MiniStatement";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Banknote,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  Fingerprint,
  IdCard,
  Phone,
  Play,
  ShieldCheck,
  WalletCards,
  Printer,
  RefreshCw,
  LockKeyhole,
  ReceiptText,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import OtpInput from "../../../components/common/OtpInput";
import StepIndicator from "../../../components/common/StepIndicator";
import {
  checkAepsLoginStatus,
  verifyTfa,
  parsePidXml,
  balanceEnquiry,
  miniStatement,
  cashWithdrawal,
  cashDeposit,
  sendAepsOtp,
  onboardAepsMerchant,
  checkDoEkyc,
  doBioEkyc,
  readEkycPrompt,
  type EkycPrompt,
  type TfaPayload,
  type CashWithdrawalPayload,
  type CashDepositPayload,
  type AepsServicePayload,
} from "../../../services/api/retailer/aepsApi";
import { getRetailerAadhaarAndMobile, getBankList } from "../../../services/api/retailer/retailerAuthApi";
import { getGeolocationCoordinates } from "../../../utils/geolocation";
import { getToken } from "../../../utils/auth";
import { useAuth } from "../../../context/AuthContext";

type Step = 0 | 1 | 2 | 3 | 4 | 5;

type ServiceId =
  | "cash-withdrawal"
  | "balance-check"
  | "mini-statement"
  | "balance-withdrawal"
  | "cash-deposit";

type ModalType =
  | ""
  | "amount"
  | "otp"
  | "biometric"
  | "balance-enquiry";

type ReceiptType =
  | ""
  | "withdrawal"
  | "balance"
  | "mini-statement"
  | "balance-withdrawal"
  | "cash-deposit";

interface Bank {
  id: number;
  bank_id: number;
  name: string;
  iin: string;
  aeps_enabled: number;
  aadhaarpay_enabled: number;
}

interface Transaction {
  description: string;
  date: string;
  amount: string;
  type: "DEBIT" | "CREDIT";
}

interface ReceiptData {
  receiptType: ReceiptType;
  bankName: string;
  amount: number;
  balance: number;
  aadhaar: string;
  mobile: string;
  transactionId: string;
  rrn: string;
  biometricDevice: string;
  authMode: string;
  status: string;
  message?: string;
  transactions: Transaction[];
}

// interface AepsLoginStatusData {
//   actcode?: string;
//   provider?: {
//     actcode?: string;
//     data?: {
//       actcode?: string;
//     };
//   } | null;
// }

// interface AepsLoginStatusResponse {
//   data?: AepsLoginStatusData;
// }

interface ApiErrorLike {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const apiError = error as ApiErrorLike;

    return (
      apiError.response?.data?.message ||
      apiError.message ||
      fallback
    );
  }

  return fallback;
};

const isRecord = (
  value: unknown
): value is Record<string, unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
};

const extractActcode = (response: unknown): string => {
  if (!isRecord(response)) {
    return "";
  }

  const data = isRecord(response.data)
    ? response.data
    : undefined;

  if (!data) {
    return "";
  }

  const provider = isRecord(data.provider)
    ? data.provider
    : undefined;

  const providerData =
    provider && isRecord(provider.data)
      ? provider.data
      : undefined;

  const value =
    providerData?.actcode ??
    provider?.actcode ??
    data.actcode;

  return typeof value === "string" ? value : "";
};



/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

const generateTransactionId = () => {
  return `AEPS${Date.now()}${Math.floor(
    100 + Math.random() * 900
  )}`;
};

const generateRRN = () => {
  return `${Math.floor(
    10000000000 +
    Math.random() * 89999999999
  )}`;
};

/*
 * ============================================================
 * PROGRESS HEADER
 * ============================================================
 */

const ProgressHeader = ({ step }: { step: Step }) => {
  const progressSteps = [
    { label: "Mobile" },
    { label: "Aadhaar" },
    { label: "Bank" },
    { label: "Review" },
    { label: "Service" },
  ];

  const activeProgress = step - 1;

  return (
    <StepIndicator
      steps={progressSteps}
      currentStep={activeProgress}
    />
  );
};

/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

const Aeps = () => {
  const navigate = useNavigate();
  const { user: authUser, isLoading: isAuthLoading, refreshUser } = useAuth();

  // Onboarding States
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardedOutletId, setOnboardedOutletId] = useState<string>("");
  const [onboardError, setOnboardError] = useState("");
  const [onboardSuccess, setOnboardSuccess] = useState("");

  // Local state to track biometric completion during this browser session
  const [bioKycCompletedLocally, setBioKycCompletedLocally] = useState<boolean>(false);

  // 1. PRIORITY 1: Check Database via Auth Context First:
  const isBioKycDoneInDb = Boolean(
    authUser?.eKYCStatus === "COMPLETED" ||
    authUser?.AepsEkyc?.eKYCStatus === "COMPLETED"
  );

  // 2. Comprehensive Bio KYC status: If DB says COMPLETED or completed in this session -> DONE!
  const isBioKycDone = isBioKycDoneInDb || bioKycCompletedLocally;

  const [isCheckingKyc, setIsCheckingKyc] = useState<boolean>(false);
  const [isDoingBioKyc, setIsDoingBioKyc] = useState<boolean>(false);
  const [ekycPrompt, setEkycPrompt] = useState<EkycPrompt | null>(null);
  const [bioKycError, setBioKycError] = useState<string>("");
  const [bioKycSuccess, setBioKycSuccess] = useState<string>("");

  const token = getToken();
  let tokenOutletId = "";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      tokenOutletId = payload.outletId || payload.outletid || "";
    } catch {
      // ignore
    }
  }

  const isOnboarded = Boolean(
    onboardedOutletId ||
    authUser?.outletId ||
    authUser?.AepsEkyc?.outletId ||
    tokenOutletId
  );

  // Check eKYC status from server ONLY if onboarded and NOT yet completed in DB
  const checkKycStatus = useCallback(async (forcedOutletId?: string) => {
    // If already completed in database or session, do NOT call check API
    if (isBioKycDone) {
      return;
    }

    const effectiveOutletId =
      forcedOutletId ||
      onboardedOutletId ||
      authUser?.outletId ||
      authUser?.AepsEkyc?.outletId ||
      tokenOutletId ||
      "";

    const userId = authUser?.id || authUser?._id;
    if (!effectiveOutletId || !userId) return;

    setIsCheckingKyc(true);
    setBioKycError("");
    try {
      const response = await checkDoEkyc(effectiveOutletId, userId);
      const prompt = readEkycPrompt(response);
      setEkycPrompt(prompt);

      const statusData = response?.data;
      const rawResponse = response as unknown as Record<string, unknown> | undefined;
      const providerStatus =
        (typeof statusData?.status === "string" ? statusData.status : "") ||
        (typeof rawResponse?.status === "string" ? String(rawResponse.status) : "");
      const isCompleted =
        statusData?.eKYCStatus === "COMPLETED" ||
        providerStatus === "NO-ACTION-REQUIRED" ||
        statusData?.kycRequired === false;

      if (isCompleted) {
        setBioKycCompletedLocally(true);
        if (refreshUser) {
          void refreshUser();
        }
      }
    } catch (err: unknown) {
      console.warn("eKYC status check:", err);
    } finally {
      setIsCheckingKyc(false);
    }
  }, [isBioKycDone, authUser, onboardedOutletId, tokenOutletId, refreshUser]);

  useEffect(() => {
    // Wait for auth context to load from DB first
    if (isAuthLoading || isBioKycDone || !isOnboarded) return;

    let isMounted = true;
    const verifyKyc = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      await checkKycStatus();
    };

    void verifyKyc();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, isBioKycDone, isOnboarded, checkKycStatus]);

  /*
   * Step 0 = Retailer 2FA
   * Step 1 = Mobile Number
   * Step 2 = Aadhaar Number
   * Step 3 = Bank Selection
   * Step 4 = Review
   * Step 5 = Services (Cash Withdrawal, Balance Enquiry)
   */

  const [step, setStep] = useState<Step>(0);

  // Real Biometric States
  const [availableDevices, setAvailableDevices] = useState<(import("../../../utils/rdService").ActiveDevice & {
    model?: string;
    serialNumber?: string;
    detailedInfo?: string;
  })[]>([]);
  const [selectedDevicePort, setSelectedDevicePort] = useState<number | null>(null);
  const [withdrawalDeviceName, setWithdrawalDeviceName] = useState("Scanning...");
  const [isScanningDevices, setIsScanningDevices] = useState(true);
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);

  const handleScanDevices = async () => {
    setIsScanningDevices(true);
    setWithdrawalDeviceName("Scanning...");
    
    try {
      console.log("=== Starting Manual Device Scan ===");
      const devices = await rdService.scanAllDevices();
      
      // Enhanced device info gathering using getDeviceInfo
      const enhancedDevices = await Promise.all(
        devices.map(async (device) => {
          try {
            console.log(`Getting detailed info for device on port ${device.port}...`);
            const deviceInfoResponse = await getDeviceInfo(device.port);
            const deviceInfo = deviceInfoResponse.data;
            
            // Extract more detailed device information
            let enhancedName = device.name;
            let deviceModel = "";
            let serialNumber = "";
            
            if (typeof deviceInfo === "string") {
              // Extract device model from info attribute
              const modelMatch = deviceInfo.match(/mi="([^"]+)"/i);
              if (modelMatch) {
                deviceModel = modelMatch[1];
                enhancedName = `${deviceModel}`;
              }
              
              // Extract serial number
              const serialMatch = deviceInfo.match(/ci="([^"]+)"/i);
              if (serialMatch) {
                serialNumber = serialMatch[1];
              }
              
              console.log(`Device ${device.port}: Model=${deviceModel}, Serial=${serialNumber}`);
            }
            
            return {
              ...device,
              name: enhancedName || device.name,
              model: deviceModel,
              serialNumber: serialNumber,
              detailedInfo: deviceInfo
            };
          } catch (error) {
            console.log(`Could not get detailed info for device on port ${device.port}:`, error);
            return device; // Return original device info if detailed info fails
          }
        })
      );
      
      setAvailableDevices(enhancedDevices);

      if (enhancedDevices.length > 0) {
        setSelectedDevicePort(enhancedDevices[0].port);
        setWithdrawalDeviceName(enhancedDevices[0].name);
        console.log(`=== Scan Success: Found ${enhancedDevices.length} device(s) ===`);
      } else {
        setSelectedDevicePort(null);
        setWithdrawalDeviceName("No device found");
        console.log("=== Scan Complete: No devices found ===");
        alert("No biometric devices found. Please ensure:\n1. RD Service is running\n2. Device is connected via USB\n3. Device driver is installed");
      }
    } catch (error) {
      console.error("=== Device Scanning Failed ===", error);
      setSelectedDevicePort(null);
      setWithdrawalDeviceName("Scan failed");
      alert(`Device scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setIsScanningDevices(false);
  };

  useEffect(() => {
    let isMounted = true;
    
    const scanAndEnhanceDevices = async () => {
      try {
        const devices = await rdService.scanAllDevices();
        
        if (!isMounted) return;
        
        // Enhanced device info gathering using getDeviceInfo
        const enhancedDevices = await Promise.all(
          devices.map(async (device) => {
            try {
              console.log(`Getting detailed info for device on port ${device.port}...`);
              const deviceInfoResponse = await getDeviceInfo(device.port);
              const deviceInfo = deviceInfoResponse.data;
              
              // Extract more detailed device information
              let enhancedName = device.name;
              let deviceModel = "";
              let serialNumber = "";
              
              if (typeof deviceInfo === "string") {
                // Extract device model from mi attribute
                const modelMatch = deviceInfo.match(/mi="([^"]+)"/i);
                if (modelMatch) {
                  deviceModel = modelMatch[1];
                  enhancedName = `${deviceModel}`;
                }
                
                // Extract serial number from ci attribute
                const serialMatch = deviceInfo.match(/ci="([^"]+)"/i);
                if (serialMatch) {
                  serialNumber = serialMatch[1];
                }
                
                console.log(`Device ${device.port}: Model=${deviceModel}, Serial=${serialNumber}`);
              }
              
              return {
                ...device,
                name: enhancedName || device.name,
                model: deviceModel,
                serialNumber: serialNumber,
                detailedInfo: deviceInfo
              };
            } catch (error) {
              console.log(`Could not get detailed info for device on port ${device.port}:`, error);
              return device; // Return original device info if detailed info fails
            }
          })
        );
        
        if (!isMounted) return;
        
        setAvailableDevices(enhancedDevices);
        
        if (enhancedDevices.length > 0) {
          setSelectedDevicePort(enhancedDevices[0].port);
          setWithdrawalDeviceName(enhancedDevices[0].name);
        } else {
          setSelectedDevicePort(null);
          setWithdrawalDeviceName("No device found");
        }
      } catch (error) {
        console.error("Initial device scan failed:", error);
        if (isMounted) {
          setSelectedDevicePort(null);
          setWithdrawalDeviceName("Scan failed");
        }
      } finally {
        if (isMounted) {
          setIsScanningDevices(false);
        }
      }
    };

    scanAndEnhanceDevices();
    
    return () => {
      isMounted = false;
    };
  }, []);

  /*
   * Retailer authentication & 2FA State
   */
  const [retailerAadhaar, setRetailerAadhaar] = useState("");

  const [isCapturingRetailer, setIsCapturingRetailer] =
    useState(false);

  const [isVerifyingTfa, setIsVerifyingTfa] =
    useState(false);

  const [capturedPidData, setCapturedPidData] =
    useState<string>("");

  const [retailerAuthenticated, setRetailerAuthenticated] =
    useState(false);

  const [actcode, setActcode] = useState("");

  const [isCheckingLoginStatus, setIsCheckingLoginStatus] =
    useState(true);

  const [tfaError, setTfaError] = useState("");

  const [tfaStatusMessage, setTfaStatusMessage] =
    useState("");

  const fetchLoginStatus = useCallback(async (): Promise<void> => {
    try {
      const token = getToken();
      if (!token) {
        setRetailerAuthenticated(false);
        setActcode("");
        setTfaStatusMessage("");
        setTfaError(
          "Authentication token not found. Please login again."
        );
        return;
      }

      // Decode JWT token or use authUser / newly onboarded outletId
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const outletId =
        onboardedOutletId ||
        authUser?.outletId ||
        authUser?.AepsEkyc?.outletId ||
        tokenPayload.outletId ||
        tokenPayload.outletid ||
        "";

      if (!outletId) {
        setRetailerAuthenticated(false);
        setActcode("");
        setTfaStatusMessage("");
        setTfaError(
          "Merchant is not onboarded to AEPS yet. Please click 'Onboard to AEPS' above to activate your account."
        );
        return;
      }

      const response = await checkAepsLoginStatus(outletId);
      const currentActcode = extractActcode(response);

      setActcode(currentActcode);

      if (!currentActcode) {
        setRetailerAuthenticated(false);
        setTfaStatusMessage("");
        setTfaError(
          "Unable to determine AEPS login status. Please refresh and try again."
        );
        return;
      }

      if (currentActcode === "LOGINREQUIRED") {
        setRetailerAuthenticated(false);
        setTfaError("");
        setTfaStatusMessage(
          "Daily 2FA authentication is required. Verify using Aadhaar and fingerprint."
        );
        return;
      }

      setRetailerAuthenticated(true);
      setTfaError("");
      setTfaStatusMessage(
        "Daily 2FA is completed or not required for today."
      );
    } catch (error: unknown) {
      console.error(
        "Failed to check AEPS login status:",
        error
      );

      setRetailerAuthenticated(false);
      setTfaStatusMessage("");
      setTfaError(
        getErrorMessage(
          error,
          "Failed to check AEPS login status."
        )
      );
    } finally {
      setIsCheckingLoginStatus(false);
    }
  }, [onboardedOutletId, authUser]);

  const handleRefreshLoginStatus = (): void => {
    setIsCheckingLoginStatus(true);
    setTfaError("");
    void fetchLoginStatus();
  };

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      await fetchLoginStatus();
    };

    void checkStatus();

    return () => {
      isMounted = false;
    };
  }, [fetchLoginStatus]);

  // Fetch retailer Aadhaar on mount
  useEffect(() => {
    const fetchRetailerDetails = async () => {
      try {
        const token = getToken();
        if (!token) {
          console.error("Authentication token not found.");
          return;
        }

        // Decode JWT token to get userId
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const userId = tokenPayload.id || tokenPayload._id || tokenPayload.userId;

        if (userId) {
          const response = await getRetailerAadhaarAndMobile(userId);
          if (response.success && response.data) {
            if (response.data.aadhaarNumber) {
              setRetailerAadhaar(response.data.aadhaarNumber);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch retailer details:", error);
      }
    };

    void fetchRetailerDetails();
  }, []);

  /*
   * Customer Mobile
   */
  const [customerMobile, setCustomerMobile] = useState("");

  /*
   * Customer Aadhaar
   */
  const [customerAadhaar, setCustomerAadhaar] =
    useState("");

  /*
   * Bank
   */
  const [selectedBank, setSelectedBank] =
    useState<Bank | null>(null);
  const [availableBanks, setAvailableBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [banksFetched, setBanksFetched] = useState(false);
  const bankSelectRef = useRef<HTMLSelectElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const BANKS_PER_PAGE = 50;

  // Fetch bank list when dropdown is opened
  const fetchBanks = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoadingBanks(true);
    }
    
    try {
      const response = await getBankList(page, BANKS_PER_PAGE);
      if (response.success && response.data) {
        if (append) {
          setAvailableBanks(prev => [...prev, ...response.data]);
        } else {
          setAvailableBanks([...response.data]);
        }
        setBanksFetched(true);
        // Update total pages from meta if available
        if (response.meta && typeof response.meta === 'object' && 'totalPages' in response.meta) {
          setTotalPages((response.meta as { totalPages: number }).totalPages);
        }
      }
    } catch (err) {
      console.error("Failed to fetch bank list:", err);
    } finally {
      setLoadingBanks(false);
      setLoadingMore(false);
    }
  };

  const handleBankDropdownOpen = () => {
    if (!banksFetched) {
      void fetchBanks(1, false);
    }
  };

  const handleLoadMoreBanks = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      void fetchBanks(nextPage, true);
    }
  };



  const [consent, setConsent] =
    useState(false);

  /*
   * AEPS service
   */
  const [selectedService, setSelectedService] =
    useState<ServiceId | "">("");

  /*
   * Modal
   */
  const [modalType, setModalType] = useState<ModalType>("");
  const [balWithBalanceChecked, setBalWithBalanceChecked] = useState(false);
  const [fetchedBalance, setFetchedBalance] = useState<number | null>(null);

  /*
   * Processing state
   */
  const [isProcessing, setIsProcessing] =
    useState(false);
  const [isFetchingService, setIsFetchingService] = useState(false);
  const [serviceFetchingMessage, setServiceFetchingMessage] = useState("");

  /*
   * Withdrawal amount
   */
  const [withdrawalAmount, setWithdrawalAmount] =
    useState(1000);

  /*
   * OTP
   */
  const [otp, setOtp] = useState("");
  const [otpReferenceKey, setOtpReferenceKey] = useState("");

  /*
   * Receipt & Mini Statement
   */
  const [showReceipt, setShowReceipt] =
    useState(false);

  const [receiptData, setReceiptData] =
    useState<ReceiptData | null>(null);

  const [showMiniStatement, setShowMiniStatement] = useState(false);
  const [miniStatementResult, setMiniStatementResult] = useState<MiniStatementData | null>(null);
  const [copiedReceiptTxnId, setCopiedReceiptTxnId] = useState(false);

  /*
   * ============================================================
   * COMMON HELPERS
   * ============================================================
   */

  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };


  const handleCustomerAadhaarChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 12);

    setCustomerAadhaar(value);
  };

  /*
   * ============================================================
   * RETAILER 2FA
   * ============================================================
   */

  /*
   * Step 1: Scan Biometric Device & Capture Fingerprint
   */
  const handleScanAndCaptureBiometric = async (): Promise<void> => {
    if (retailerAadhaar.length !== 12) {
      setTfaError(
        "Please enter a valid 12-digit Aadhaar number before scanning."
      );
      return;
    }

    setIsCapturingRetailer(true);
    setTfaError("");
    setTfaStatusMessage("");

    try {
      let targetPort = selectedDevicePort;

      // If no device is currently selected or scanned, scan and auto-select
      if (targetPort === null || availableDevices.length === 0) {
        setIsScanningDevices(true);
        setWithdrawalDeviceName("Scanning devices...");
        
        try {
          console.log("=== Auto-scanning for biometric devices ===");
          const devices = await rdService.scanAllDevices();
          
          // Enhanced device info gathering
          const enhancedDevices = await Promise.all(
            devices.map(async (device) => {
              try {
                const deviceInfoResponse = await getDeviceInfo(device.port);
                const deviceInfo = deviceInfoResponse.data;
                
                let enhancedName = device.name;
                let deviceModel = "";
                
                if (typeof deviceInfo === "string") {
                  const modelMatch = deviceInfo.match(/mi="([^"]+)"/i);
                  if (modelMatch) {
                    deviceModel = modelMatch[1];
                    enhancedName = `${deviceModel}`;
                  }
                }
                
                return {
                  ...device,
                  name: enhancedName || device.name,
                  model: deviceModel,
                  detailedInfo: deviceInfo
                };
              } catch (error) {
                console.log(`Could not get detailed info for device on port ${device.port}:`, error);
                return device;
              }
            })
          );
          
          setAvailableDevices(enhancedDevices);
          setIsScanningDevices(false);

          if (enhancedDevices.length > 0) {
            targetPort = enhancedDevices[0].port;
            setSelectedDevicePort(enhancedDevices[0].port);
            setWithdrawalDeviceName(enhancedDevices[0].name);
            console.log(`Auto-selected device: ${enhancedDevices[0].name} on port ${targetPort}`);
          } else {
            setSelectedDevicePort(null);
            setWithdrawalDeviceName("No device found");
            throw new Error(
              "No Biometric Device found. Please connect your USB RD Service scanner and retry."
            );
          }
        } catch (error) {
          setIsScanningDevices(false);
          throw error;
        }
      }

      // Call RD Service API to capture fingerprint
      console.log(`=== Starting fingerprint capture on port ${targetPort} ===`);
      setTfaStatusMessage(`Capturing fingerprint from ${withdrawalDeviceName}...`);
      
      const captureResult = await rdService.captureFingerprint(targetPort);
      
      console.log("=== Capture Result ===", captureResult);

      if (!captureResult.success || !captureResult.data) {
        throw new Error(
          captureResult.message ||
          "Failed to capture fingerprint from device."
        );
      }

      setCapturedPidData(captureResult.data);
      setTfaStatusMessage(
        "Fingerprint captured successfully! Click 'VERIFY 2FA' below to authenticate."
      );
      console.log("=== Fingerprint Capture Successful ===");
    } catch (error: unknown) {
      console.error("=== Biometric Capture Failed ===", error);
      setCapturedPidData("");
      setTfaError(
        getErrorMessage(
          error,
          "Failed to capture fingerprint from device. Please check scanner connection."
        )
      );
    } finally {
      setIsCapturingRetailer(false);
    }
  };

  /*
   * Step 2: Verify TFA API call using captured biometric data
   */
  const handleVerifyTfa = async (): Promise<void> => {
    if (retailerAadhaar.length !== 12) {
      setTfaError(
        "Please enter a valid 12-digit Aadhaar number."
      );
      return;
    }

    if (!capturedPidData) {
      setTfaError(
        "Please scan and capture fingerprint first."
      );
      return;
    }

    setIsVerifyingTfa(true);
    setTfaError("");
    setTfaStatusMessage("");

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      // Decode JWT token to get outletId and referenceKey
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const outletId = tokenPayload.outletId || tokenPayload.outletid || "";
      const referenceKey = tokenPayload.referenceKey || "";

      if (!outletId) {
        throw new Error(
          "Outlet ID is missing. Please check your retailer account."
        );
      }

      let currentActcode = actcode;

      // Refresh login status if actcode is not available.
      if (!currentActcode) {
        const statusResponse =
          await checkAepsLoginStatus(outletId);

        currentActcode = extractActcode(statusResponse);
        setActcode(currentActcode);
      }

      if (!currentActcode) {
        throw new Error(
          "Unable to determine AEPS login status. Please refresh and try again."
        );
      }

      // The provider indicates that daily 2FA is not required.
      if (currentActcode !== "LOGINREQUIRED") {
        setRetailerAuthenticated(true);
        setCapturedPidData("");
        setTfaStatusMessage(
          "Daily 2FA is completed or not required for today."
        );
        return;
      }

      // Obtain geolocation coordinates.
      const coords = await getGeolocationCoordinates({
        fallbackLatitude: "0",
        fallbackLongitude: "0",
        timeout: 5000,
      });

      // Parse the captured RD Service PID XML.
      const pidData = parsePidXml(capturedPidData);

      // Send the biometric data for TFA verification.
      const payload: TfaPayload = {
        actcode: currentActcode,
        aadhaar: retailerAadhaar,
        outlet_id: outletId,
        referenceKey,
        latitude: coords.latitude,
        longitude: coords.longitude,
        // ts: pidData.ts || new Date().toISOString(),
        ...pidData,
        ts: pidData.ts || new Date().toISOString(),
      };

      const result = await verifyTfa(payload);

      console.log("verifyTfa response:", result);

      setRetailerAuthenticated(true);
      setCapturedPidData("");
      setTfaError("");
      setTfaStatusMessage(
        "TFA verified successfully."
      );
    } catch (error: unknown) {
      console.error(
        "Retailer 2FA verification failed:",
        error
      );

      setRetailerAuthenticated(false);
      setTfaError(
        getErrorMessage(
          error,
          "Biometric 2FA verification failed. Please try again."
        )
      );
    } finally {
      setIsVerifyingTfa(false);
    }
  };

  const handleStartTransaction = () => {
    setStep(1);
  };

  /*
   * ============================================================
   * BANK SELECTION
   * ============================================================
   */



  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
  };

  /*
   * ============================================================
   * SERVICE HANDLERS
   * ============================================================
   */

  const handleServiceClick = (
    serviceId: ServiceId
  ) => {
    setSelectedService(serviceId);

    if (
      serviceId === "cash-withdrawal" ||
      serviceId === "cash-deposit"
    ) {
      setModalType("amount");
    } else if (serviceId === "balance-withdrawal") {
      setBalWithBalanceChecked(false);
      setFetchedBalance(null);
      setModalType("biometric");
      startBiometric(serviceId);
    } else {
      setModalType("biometric");
      startBiometric(serviceId);
    }
  };

  /*
   * ============================================================
   * SERVICE HELPERS
   * ============================================================
   */

  const getSelectedBankName = () => {
    return selectedBank?.name || "ICICI Bank";
  };

  const getCustomerAadhaarDisplay = () => {
    return `XXXX XXXX ${customerAadhaar.slice(-4) || "9999"
      }`;
  };

  /*
   * ============================================================
   * BIOMETRIC
   * ============================================================
   *
   * IMPORTANT:
   *
   * serviceId is passed directly into this function.
   *
   * This prevents the React state timing issue where:
   *
   * setSelectedService(...)
   * startBiometric()
   *
   * could use the previous service value.
   */

  const prepareAepsPayload = async (
    pidData: ReturnType<typeof parsePidXml>,
    overrideReferenceKey?: string
  ): Promise<AepsServicePayload> => {
    const token = getToken();
    let tokenOutletId = "";
    let tokenRefKey = "";
    if (token) {
      try {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        tokenOutletId = tokenPayload.outletId || tokenPayload.outletid || "";
        tokenRefKey = tokenPayload.referenceKey || "";
      } catch (e) {
        console.warn("Failed to parse token payload", e);
      }
    }

    const outletId =
      authUser?.AepsEkyc?.outletId ||
      authUser?.outletId ||
      tokenOutletId ||
      "";

    const retailerRefKey =
      authUser?.AepsEkyc?.referenceKey ||
      authUser?.referenceKey ||
      tokenRefKey ||
      "";

    const referenceKey = overrideReferenceKey || retailerRefKey;

    const coords = await getGeolocationCoordinates({
      fallbackLatitude: "0",
      fallbackLongitude: "0",
      timeout: 5000,
    });

    return {
      outlet_id: outletId,
      referenceKey,
      latitude: coords.latitude,
      longitude: coords.longitude,
      aadhaar: customerAadhaar,
      mobile: customerMobile,
      bankiin: selectedBank?.iin || "",
      ...pidData,
      ts: pidData.ts || new Date().toISOString(),
    };
  };

  const createReceipt = (
    type: ReceiptType,
    amount: number,
    resultData: Record<string, unknown>,
    fallbackStatus = "SUCCESS"
  ): ReceiptData => {
    const rawBalance =
      resultData.balance ??
      resultData.balanceamount ??
      resultData.bankBalance ??
      resultData.accountBalance;
    const numericBalance = Number(rawBalance);

    const transactionId =
      (resultData.txnid as string) ||
      (resultData.transactionId as string) ||
      (resultData.clientRefId as string) ||
      (resultData.ackno as string) ||
      generateTransactionId();

    const rrn =
      (resultData.rrn as string) ||
      (resultData.bankrrn as string) ||
      (resultData.bankRrn as string) ||
      generateRRN();

    const status =
      (resultData.status as string) ||
      (resultData.txnStatus as string) ||
      fallbackStatus;

    const message =
      (resultData.msg as string) ||
      (resultData.message as string) ||
      "Transaction Successful";

    return {
      receiptType: type,
      bankName: selectedBank?.name || getSelectedBankName(),
      amount,
      balance: isNaN(numericBalance) ? 0 : numericBalance,
      aadhaar: getCustomerAadhaarDisplay(),
      mobile: `+91 ${customerMobile}`,
      transactionId,
      rrn,
      biometricDevice: withdrawalDeviceName || "Mantra MFS100",
      authMode: "Biometric / AEPS Verified",
      status,
      message,
      transactions: [],
    };
  };

  const startBiometric = async (
    serviceId: ServiceId
  ) => {
    setIsProcessing(true);

    try {
      // 1. Actually capture the fingerprint using RD service
      const captureResult = await rdService.captureFingerprint(selectedDevicePort);

      if (!captureResult.success) {
        setIsProcessing(false);
        setModalType("");
        alert(captureResult.message || "Failed to capture fingerprint from device");
        return;
      }

      // Close biometric modal immediately upon capture success
      setModalType("");
      setIsProcessing(false);

      // 2. Parse the captured RD Service PID XML
      const pidDataXML = captureResult.data;
      console.log("Captured PidData XML ready for backend:", pidDataXML);
      const pidData = parsePidXml(pidDataXML || "");

      // 3. Initiate dedicated fetching state
      setIsFetchingService(true);
      const bankName = selectedBank?.name || "Bank CBS";

      /*
       * B. BALANCE CHECK
       */
      if (serviceId === "balance-check") {
        setServiceFetchingMessage(`Fetching account balance from ${bankName}...`);
        try {
          const payload = await prepareAepsPayload(pidData);
          console.log("Balance enquiry payload:", payload);
          const result = await balanceEnquiry(payload);
          console.log("Balance enquiry result:", result);

          const resultData = (result.data || {}) as Record<string, unknown>;
          setReceiptData(createReceipt("balance", 0, resultData));
          setShowReceipt(true);
        } catch (error) {
          console.error("Balance enquiry failed:", error);
          alert(getErrorMessage(error, "Failed to check balance"));
        } finally {
          setIsFetchingService(false);
        }
        return;
      }

      /*
       * C. MINI STATEMENT
       */
      if (serviceId === "mini-statement") {
        setServiceFetchingMessage(`Fetching mini statement from ${bankName}...`);
        try {
          const payload = await prepareAepsPayload(pidData);
          console.log("Mini statement payload:", payload);
          const result = await miniStatement(payload);
          console.log("Mini statement result:", result);

          const resultData = (result.data || {}) as Record<string, unknown>;
          setMiniStatementResult(resultData as MiniStatementData);
          setShowMiniStatement(true);
        } catch (error) {
          console.error("Mini statement failed:", error);
          alert(getErrorMessage(error, "Failed to fetch mini statement"));
        } finally {
          setIsFetchingService(false);
        }
        return;
      }

      /*
       * A. CASH WITHDRAWAL
       */
      if (serviceId === "cash-withdrawal") {
        setServiceFetchingMessage(`Processing cash withdrawal of ₹${withdrawalAmount.toLocaleString("en-IN")} with ${bankName}...`);
        try {
          const refKeyToUse =
            withdrawalAmount > 5000 && otpReferenceKey
              ? otpReferenceKey
              : (authUser?.AepsEkyc?.referenceKey || undefined);
          const basePayload = await prepareAepsPayload(pidData, refKeyToUse);
          const payload: CashWithdrawalPayload = {
            ...basePayload,
            amount: withdrawalAmount,
            ...(otp ? { otp } : {}),
          };

          console.log("Cash withdrawal payload:", payload);
          const result = await cashWithdrawal(payload);
          console.log("Cash withdrawal result:", result);

          const resultData = (result.data || {}) as Record<string, unknown>;
          setReceiptData(createReceipt("withdrawal", withdrawalAmount, resultData));
          setModalType("");
          setOtp("");
          setOtpReferenceKey("");
          setShowReceipt(true);
        } catch (error) {
          console.error("Cash withdrawal failed:", error);
          alert(getErrorMessage(error, "Failed to complete cash withdrawal"));
        } finally {
          setIsFetchingService(false);
        }
        return;
      }

      /*
       * D. BALANCE CHECK + WITHDRAWAL
       */
      if (serviceId === "balance-withdrawal") {
        if (!balWithBalanceChecked) {
          setServiceFetchingMessage(`Step 1: Checking account balance with ${bankName}...`);
          try {
            const payload = await prepareAepsPayload(pidData);
            const result = await balanceEnquiry(payload);
            const resultData = (result.data || {}) as Record<string, unknown>;
            const rawBalance =
              resultData.balance ??
              resultData.balanceamount ??
              resultData.bankBalance;
            const numericBalance = Number(rawBalance);
            const verifiedBalance = isNaN(numericBalance) ? 0 : numericBalance;

            setBalWithBalanceChecked(true);
            setFetchedBalance(verifiedBalance);

            // Auto-adjust default amount if balance is positive and less than current default
            if (verifiedBalance > 0 && verifiedBalance < withdrawalAmount) {
              setWithdrawalAmount(Math.min(1000, verifiedBalance));
            }
            setModalType("amount");
          } catch (error) {
            console.error("Balance check failed in balance-withdrawal:", error);
            alert(getErrorMessage(error, "Failed to check balance"));
          } finally {
            setIsFetchingService(false);
          }
        } else {
          setServiceFetchingMessage(`Step 2: Authorizing withdrawal of ₹${withdrawalAmount.toLocaleString("en-IN")} with ${bankName}...`);
          try {
            const refKeyToUse =
              withdrawalAmount > 5000 && otpReferenceKey
                ? otpReferenceKey
                : (authUser?.AepsEkyc?.referenceKey || undefined);
            const basePayload = await prepareAepsPayload(pidData, refKeyToUse);
            const payload: CashWithdrawalPayload = {
              ...basePayload,
              amount: withdrawalAmount,
              ...(otp ? { otp } : {}),
            };

            const result = await cashWithdrawal(payload);
            const resultData = (result.data || {}) as Record<string, unknown>;
            setReceiptData(createReceipt("balance-withdrawal", withdrawalAmount, resultData));
            setModalType("");
            setOtp("");
            setOtpReferenceKey("");
            setBalWithBalanceChecked(false);
            setFetchedBalance(null);
            setShowReceipt(true);
          } catch (error) {
            console.error("Withdrawal failed:", error);
            alert(getErrorMessage(error, "Failed to complete withdrawal"));
          } finally {
            setIsFetchingService(false);
          }
        }
        return;
      }

      /*
       * E. CASH DEPOSIT
       */
      if (serviceId === "cash-deposit") {
        setServiceFetchingMessage(`Processing cash deposit of ₹${withdrawalAmount.toLocaleString("en-IN")} with ${bankName}...`);
        try {
          // Pass the correct referenceKey from context from AepsEkyc object of retailer
          const cashDepositRefKey =
            authUser?.AepsEkyc?.referenceKey ||
            authUser?.referenceKey ||
            "";

          const basePayload = await prepareAepsPayload(pidData, cashDepositRefKey);
          const rawPid = pidData as Record<string, unknown>;
          const payload: CashDepositPayload = {
            ...basePayload,
            referenceKey: cashDepositRefKey || basePayload.referenceKey,
            amount: withdrawalAmount,
            txnid: generateTransactionId(),
            pidDatatype: (rawPid.PidDatatype as string) || "X",
            Piddata: (rawPid.Piddata as string) || "",
            sysid: (rawPid.sysid as string) || "SYS01",
            nmPoints: (rawPid.nmPoints as string) || "0",
            qScore: (rawPid.qScore as string) || "100",
            pCount: (rawPid.pCount as string) || "0",
            pType: (rawPid.pType as string) || "0",
            iCount: (rawPid.iCount as string) || "0",
            iType: (rawPid.iType as string) || "0",
            fCount: (rawPid.fCount as string) || "1",
            fType: (rawPid.fType as string) || "2",
            srno: (rawPid.srno as string) || "SR001",
            mi: (rawPid.mi as string) || "Mantra",
            errCode: (rawPid.errCode as string) || "0",
            errInfo: (rawPid.errInfo as string) || "",
            sessionKey: (rawPid.sessionKey as string) || "",
            rdsVer: (rawPid.rdsVer as string) || "1.0",
            rdsId: (rawPid.rdsId as string) || "MFS100",
            dpId: (rawPid.dpId as string) || "MFS100",
            mc: (rawPid.mc as string) || "",
            hmac: (rawPid.hmac as string) || "",
            ci: (rawPid.ci as string) || "",
            dc: (rawPid.dc as string) || "",
            mobile: customerMobile,
            bankiin: selectedBank?.iin || "",
          };

          console.log("Cash deposit payload:", payload);
          const result = await cashDeposit(payload);
          console.log("Cash deposit result:", result);

          const resultData = (result.data || {}) as Record<string, unknown>;
          setReceiptData(createReceipt("cash-deposit", withdrawalAmount, resultData));
          setModalType("");
          setShowReceipt(true);
        } catch (error) {
          console.error("Cash deposit failed:", error);
          alert(getErrorMessage(error, "Failed to complete cash deposit"));
        } finally {
          setIsFetchingService(false);
        }
        return;
      }
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      setIsFetchingService(false);
      setModalType("");
      alert("Something went wrong with the Biometric Scanner.");
    }
  };

  /*
   * ============================================================
   * SERVICE CLICK
   * ============================================================
   */



  /*
   * ============================================================
   * AMOUNT CONFIRM
   * ============================================================
   */

  const handleConfirmAmount = async () => {
    if (withdrawalAmount <= 0) {
      return;
    }

    if (
      selectedService !==
      "cash-withdrawal" &&
      selectedService !==
      "balance-withdrawal" &&
      selectedService !==
      "cash-deposit"
    ) {
      return;
    }

    if (selectedService === "cash-deposit") {
      setModalType("biometric");
      startBiometric("cash-deposit");
      return;
    }

    if (
      selectedService === "balance-withdrawal" &&
      fetchedBalance !== null &&
      withdrawalAmount > fetchedBalance
    ) {
      alert(`Withdrawal amount cannot exceed available balance of ₹${fetchedBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
      return;
    }

    /*
     * More than ₹5,000 requires OTP first.
     */
    if (withdrawalAmount > 5000) {
      setOtp("");
      setOtpReferenceKey("");
      setIsProcessing(true);
      try {
        const token = getToken();
        if (!token) {
          throw new Error("Authentication token not found. Please login again.");
        }

        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        const outletId = tokenPayload.outletId || tokenPayload.outletid || "";
        const referenceKey = tokenPayload.referenceKey || "";
        if (!outletId || !referenceKey) {
          throw new Error(
            "Outlet ID or Reference key is missing. Please complete eKYC first."
          );
        }

        const coords = await getGeolocationCoordinates({
          fallbackLatitude: "0",
          fallbackLongitude: "0",
          timeout: 5000,
        });

        const otpResponse = await sendAepsOtp({
          outlet_id: outletId,
          referenceKey,
          latitude: coords.latitude,
          longitude: coords.longitude,
          aadhaar: customerAadhaar,
          MobileNumber: customerMobile,
          bankiin: selectedBank?.iin || "",
          amount: withdrawalAmount,
        });

        const responseData = otpResponse?.data as Record<string, unknown> | undefined;
        const innerData =
          (responseData?.data as Record<string, unknown> | undefined) || responseData;
        const sessionRefKey =
          (innerData?.referenceKey as string) ||
          (responseData?.referenceKey as string) ||
          "";

        if (sessionRefKey) {
          setOtpReferenceKey(sessionRefKey);
        }

        setModalType("otp");
      } catch (otpErr) {
        console.error("Failed to send OTP:", otpErr);
        alert(getErrorMessage(otpErr, "Failed to send OTP. Please try again."));
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    /*
     * ₹5,000 or below:
     * biometric directly.
     */
    setModalType("biometric");

    startBiometric(selectedService);
  };


  /*
   * ============================================================
   * RECEIPT HOME
   * ============================================================
   */

  const handleReceiptHome = () => {
    setShowReceipt(false);
    setReceiptData(null);
    setShowMiniStatement(false);
    setMiniStatementResult(null);
    setIsFetchingService(false);
    setSelectedService("");
    setWithdrawalAmount(1000);
    setOtp("");
    setOtpReferenceKey("");
    setModalType("");
    setBalWithBalanceChecked(false);
    setFetchedBalance(null);
    setStep(5);
  };

  /*
   * ============================================================
   * START NEW TRANSACTION
   * ============================================================
   */

  const handleStartNewTransaction = () => {
    setShowReceipt(false);
    setReceiptData(null);
    setShowMiniStatement(false);
    setMiniStatementResult(null);
    setIsFetchingService(false);
    setSelectedService("");
    setWithdrawalAmount(1000);
    setOtp("");
    setOtpReferenceKey("");
    setModalType("");
    setBalWithBalanceChecked(false);
    setFetchedBalance(null);
    setStep(5);
  };

  /*
   * ============================================================
   * PRINT
   * ============================================================
   */

  const handlePrintReceipt = () => {
    window.print();
  };

  /*
   * ============================================================
   * BACK
   * ============================================================
   */

  const handleBack = () => {
    /*
     * Close receipt first.
     */
    if (showReceipt) {
      setShowReceipt(false);
      setReceiptData(null);
      return;
    }

    /*
     * Close modal first.
     */
    if (modalType) {
      if (!isProcessing) {
        setModalType("");
      }
      return;
    }



    if (step === 0) {
      navigate("/retailer");
      return;
    }

    if (step === 1) {
      setStep(0);
      return;
    }

    if (step === 2) {
      setStep(1);
      return;
    }

    if (step === 3) {
      setStep(2);
      return;
    }

    if (step === 4) {
      setStep(3);
    }
  };

  /*
   * ============================================================
   * STEP 0
   * RETAILER AUTH
   * ============================================================
   */

  const handleOnboardMerchant = async () => {
    setIsOnboarding(true);
    setOnboardError("");
    setOnboardSuccess("");

    try {
      const res = await onboardAepsMerchant();
      if (res.success && res.data) {
        setOnboardSuccess("Merchant onboarded successfully to AEPS!");
        if (res.data.outletId) {
          setOnboardedOutletId(res.data.outletId);
        }
        if (refreshUser) {
          await refreshUser();
        }
        if (res.data.eKYCStatus === "COMPLETED") {
          setBioKycCompletedLocally(true);
          setIsCheckingLoginStatus(true);
          setTfaError("");
          void fetchLoginStatus();
        } else {
          void checkKycStatus(res.data.outletId);
        }
      } else {
        setOnboardError(res.message || "Failed to onboard to AEPS.");
      }
    } catch (err: unknown) {
      setOnboardError(getErrorMessage(err, "Failed to onboard to AEPS gateway."));
    } finally {
      setIsOnboarding(false);
    }
  };

  const handleDoBioKyc = async () => {
    const effectiveOutletId =
      onboardedOutletId ||
      authUser?.outletId ||
      authUser?.AepsEkyc?.outletId ||
      tokenOutletId ||
      ekycPrompt?.outletId ||
      "";

    const userId = authUser?.id || authUser?._id;

    if (!effectiveOutletId || !userId) {
      setBioKycError("Outlet ID or User ID missing. Please ensure your account is onboarded.");
      return;
    }

    setIsDoingBioKyc(true);
    setBioKycError("");
    setBioKycSuccess("");

    try {
      let targetPort = selectedDevicePort;

      // Auto-scan if no device selected
      if (targetPort === null || availableDevices.length === 0) {
        setIsScanningDevices(true);
        setWithdrawalDeviceName("Scanning devices...");
        const devices = await rdService.scanAllDevices();
        setAvailableDevices(devices);
        setIsScanningDevices(false);

        if (devices.length > 0) {
          targetPort = devices[0].port;
          setSelectedDevicePort(devices[0].port);
          setWithdrawalDeviceName(devices[0].name);
        } else {
          setSelectedDevicePort(null);
          setWithdrawalDeviceName("No device found");
          throw new Error("No biometric device found. Please connect your USB RD Service scanner and retry.");
        }
      }

      // Capture fingerprint with WADH from ekycPrompt if available, and fType: "2" (ISO 19794-2)
      const captureResult = await rdService.captureFingerprint(targetPort, {
        wadh: ekycPrompt?.pidOptionWadh,
        fType: "2",
      });

      if (!captureResult.success || !captureResult.data) {
        throw new Error(captureResult.message || "Failed to capture fingerprint from device.");
      }

      // Geolocation
      const coords = await getGeolocationCoordinates({
        fallbackLatitude: "0",
        fallbackLongitude: "0",
        timeout: 5000,
      });

      const parsedData = parsePidXml(captureResult.data);

      const refKey =
        ekycPrompt?.referenceKey ||
        authUser?.AepsEkyc?.referenceKey ||
        localStorage.getItem("referenceKey") ||
        "";

      await doBioEkyc({
        userId,
        outlet_id: effectiveOutletId,
        referenceKey: refKey,
        latitude: coords.latitude,
        longitude: coords.longitude,
        ...parsedData,
      });

      setBioKycSuccess("Biometric eKYC completed successfully!");
      setBioKycCompletedLocally(true);
      localStorage.setItem("outletId", effectiveOutletId);
      if (refKey) localStorage.setItem("referenceKey", refKey);

      if (refreshUser) {
        await refreshUser();
      }

      // Refresh 2FA login status
      setIsCheckingLoginStatus(true);
      void fetchLoginStatus();
    } catch (err: unknown) {
      console.error("Biometric eKYC failed:", err);
      setBioKycError(getErrorMessage(err, "Biometric eKYC verification failed. Please check scanner and retry."));
    } finally {
      setIsDoingBioKyc(false);
    }
  };

  const renderRetailerAuth = () => {
    return (
      <>
        {/* Onboard Merchant Action Banner (Visible only when NOT onboarded) */}
        {!isOnboarded && (
          <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-white to-purple-50 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    AEPS Merchant Onboarding Required
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Activate your merchant account on the AEPS gateway to start performing Aadhaar ATM, Cash Withdrawal, and Balance Enquiry transactions.
                  </p>
                  {onboardError && (
                    <p className="mt-2 text-xs font-semibold text-red-600">{onboardError}</p>
                  )}
                  {onboardSuccess && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600">{onboardSuccess}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleOnboardMerchant}
                disabled={isOnboarding}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-purple-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOnboarding ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Onboarding...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4" />
                    <span>Onboard to AEPS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Biometric eKYC Action Banner (Visible ONLY when NOT loading auth, ONBOARDED, and Bio KYC NOT done in DB/session) */}
        {!isAuthLoading && isOnboarded && !isBioKycDone && (
          <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Biometric eKYC Verification Required
                    </h3>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                      Pending
                    </span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {ekycPrompt?.message || "Please complete one-time biometric eKYC using your registered fingerprint scanner to activate AEPS cash transactions."}
                  </p>
                  {bioKycError && (
                    <p className="mt-2 text-xs font-semibold text-red-600">{bioKycError}</p>
                  )}
                  {bioKycSuccess && (
                    <p className="mt-2 text-xs font-semibold text-emerald-600">{bioKycSuccess}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDoBioKyc}
                  disabled={isDoingBioKyc || isCheckingKyc}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-amber-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDoingBioKyc ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verifying Biometric...</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="h-4 w-4" />
                      <span>Do Bio KYC</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2FA + Biometric Device */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-purple-100 bg-white p-3 text-slate-900 shadow-sm sm:p-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-[#171717] sm:text-base">
                      Retailer Daily 2FA Active
                    </h2>

                    <p className="mt-0.5 text-xs text-[#8992a3] sm:text-sm">
                      NPCI Mandatory Biometric Verification
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRefreshLoginStatus}
                  disabled={isCheckingLoginStatus}
                  title="Refresh Login Status"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-100 text-purple-600 hover:bg-purple-50 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isCheckingLoginStatus ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              <p className="mt-3 text-xs leading-5 text-[#596273] sm:text-sm">
                As per regulatory compliance, complete 2FA authentication once
                every morning before initiating cash transactions.
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-purple-50 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">2FA Status:</span>
              {isCheckingLoginStatus ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-purple-600">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Checking...
                </span>
              ) : retailerAuthenticated ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                  <Check className="h-3.5 w-3.5" /> 2FA Verified
                </span>
              ) : actcode === "LOGINREQUIRED" ? (
                <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                  Login Required
                </span>
              ) : actcode ? (
                <span className="font-bold text-purple-600">{actcode}</span>
              ) : (
                <span className="font-medium text-slate-500">Ready</span>
              )}
            </div>
          </div>

          <div className="flex h-full flex-col rounded-2xl border border-purple-100 bg-white p-3 shadow-sm sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Select Biometric Device
              </h2>

              <span className="rounded-full bg-purple-50 px-2 py-1 text-[10px] font-semibold text-purple-600 sm:text-xs">
                ✓ USB / OTG
              </span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => !isScanningDevices && setIsDeviceDropdownOpen(!isDeviceDropdownOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-purple-100 bg-white p-3 transition-all hover:border-purple-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                    <Fingerprint className={`h-5 w-5 text-purple-600 ${isScanningDevices ? 'animate-pulse' : ''}`} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-[#171717]">{withdrawalDeviceName}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-[#087f5b]">
                      <span className={`h-2 w-2 rounded-full ${availableDevices.length > 0 ? 'bg-[#20a873]' : 'bg-red-500'}`} />
                      {availableDevices.length > 0 ? "Ready · RD Service Active" : isScanningDevices ? "Searching..." : "Not Found"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScanDevices();
                    }}
                    disabled={isScanningDevices}
                    className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                    title="Scan for devices"
                  >
                    <RefreshCw className={`h-3 w-3 transition-transform ${isScanningDevices ? "animate-spin" : ""}`} />
                    Scan
                  </button>
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isDeviceDropdownOpen ? "rotate-90" : ""}`} />
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
                      className={`w-full border-b border-slate-50 px-3 py-3 text-left text-sm transition-colors last:border-0 hover:bg-slate-50 ${selectedDevicePort === device.port ? "bg-purple-50/50 font-bold text-purple-600" : "font-medium text-slate-700"
                        }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="font-semibold">{device.name}</div>
                        <div className="text-xs text-slate-500">
                          Port: {device.port}
                          {device.model && ` • Model: ${device.model}`}
                          {device.serialNumber && ` • S/N: ${device.serialNumber.slice(0, 8)}...`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Debug Information */}
            {/* {process.env.NODE_ENV === 'development' && (
              <div className="mt-3 text-xs text-slate-500">
                <div>Debug Info:</div>
                <div>Available Devices: {availableDevices.length}</div>
                <div>Selected Port: {selectedDevicePort || 'None'}</div>
                <div>Scanning: {isScanningDevices ? 'Yes' : 'No'}</div>
              </div>
            )} */}
          </div>
        </div>

        {tfaError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {tfaError}
          </div>
        )}

        {tfaStatusMessage && !tfaError && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm font-medium text-purple-700">
            {tfaStatusMessage}
          </div>
        )}

        {isCapturingRetailer && (
          <div className="rounded-2xl border-2 border-[#172033] bg-white p-5 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-50">
              <Fingerprint className="h-10 w-10 animate-pulse text-[#172033]" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Capturing Biometric Fingerprint...
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Place your finger on {withdrawalDeviceName || "the biometric"} scanner
            </p>

            <div className="mx-auto mt-5 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#172033]" />
          </div>
        )}

        {retailerAuthenticated && !isCapturingRetailer && (
          <>
            <div className="rounded-2xl border-2 border-[#cbd3e3] bg-purple-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-600 transition hover:bg-purple-700">
                  <Check className="h-6 w-6 text-white" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-[#172033]">
                    Retailer 2FA Authentication Success
                  </h2>

                  <p className="mt-0.5 text-sm text-slate-700">
                    Verified with UIDAI
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartTransaction}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#6d28d9]"
            >
              <Play className="h-5 w-5 fill-current" />
              START TRANSACTION
            </button>
          </>
        )}

        {!retailerAuthenticated && !isCapturingRetailer && (
          <>
            {!capturedPidData ? (
              <button
                type="button"
                onClick={handleScanAndCaptureBiometric}
                disabled={retailerAadhaar.length !== 12 || isScanningDevices || !isOnboarded || !isBioKycDone}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Fingerprint className="h-5 w-5" />
                {!isOnboarded
                  ? "ONBOARDING REQUIRED"
                  : !isBioKycDone
                  ? "BIOMETRIC EKYC REQUIRED FIRST"
                  : isScanningDevices
                  ? "SCANNING BIOMETRIC DEVICES..."
                  : "SCAN DEVICE & CAPTURE BIOMETRIC"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">
                        Biometric Fingerprint Captured
                      </p>
                      <p className="text-xs text-emerald-700">
                        Device: {withdrawalDeviceName} · Ready for TFA verification
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleScanAndCaptureBiometric}
                    disabled={isVerifyingTfa}
                    className="text-xs font-bold text-purple-700 underline hover:text-purple-900"
                  >
                    Recapture
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyTfa}
                  disabled={isVerifyingTfa || retailerAadhaar.length !== 12}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isVerifyingTfa ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      VERIFYING 2FA...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      VERIFY 2FA
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  /*
   * ============================================================
   * STEP 1: CUSTOMER MOBILE
   * ============================================================
   */
  const renderCustomerMobile = () => {
    return (
      <>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Step 1: Customer Mobile Number
          </h2>
          <p className="mt-2 text-base text-slate-500">
            Enter the customer's registered mobile number
          </p>
        </div>

        <section className="w-full max-w-2xl">
          <label
            htmlFor="customer-mobile"
            className="mb-2 block text-sm font-bold text-slate-900"
          >
            Mobile Number
          </label>

          <div className="flex min-h-[52px] items-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4">
            <span className="text-sm font-bold text-slate-500">+91</span>
            <input
              id="customer-mobile"
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={customerMobile}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                setCustomerMobile(value);
              }}
              placeholder="Enter 10-digit mobile number"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </div>
        </section>

        <button
          type="button"
          onClick={() => setStep(2)}
          disabled={customerMobile.length !== 10}
          className="flex min-h-[48px] w-full max-w-2xl items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-[#cbd0d6]"
        >
          <ArrowRight className="h-5 w-5" />
          CONTINUE TO AADHAAR
        </button>
      </>
    );
  };

 



  const renderCustomerAadhaar = () => {
    return (
      <>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Step 2: Customer Aadhaar Number
          </h2>

          <p className="mt-2 text-base text-slate-500">
            Enter the customer's Aadhaar number for verification
          </p>
        </div>

        <section className="w-full max-w-2xl">
          <label
            htmlFor="customer-aadhaar"
            className="mb-2 block text-sm font-bold text-slate-900"
          >
            Aadhaar Number
          </label>

          <div className="flex min-h-[52px] items-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4">
            <IdCard className="h-5 w-5 shrink-0 text-slate-400" />

            <input
              id="customer-aadhaar"
              type="text"
              inputMode="numeric"
              maxLength={12}
              value={customerAadhaar}
              onChange={handleCustomerAadhaarChange}
              placeholder="Enter 12-digit Aadhaar number"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </div>
        </section>

        <button
          type="button"
          onClick={() => setStep(3)}
          disabled={customerAadhaar.length !== 12}
          className="flex min-h-[48px] w-full max-w-2xl items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-[#cbd0d6]"
        >
          <ArrowRight className="h-5 w-5" />
          CONTINUE TO BANK SELECTION
        </button>
      </>
    );
  };

  /*
   * ============================================================
   * STEP 3: BANK SELECTION
   * ============================================================
   */

  const renderBankSelection = () => {
    return (
      <>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Step 3: Bank Selection
          </h2>

          <p className="mt-2 text-base text-slate-500">
            Select the customer's linked bank account
          </p>
        </div>

        <section>
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Select Bank
          </h3>

          <div className="relative">
            <Building2 className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#7c3aed]" />
            <select
              ref={bankSelectRef}
              value={selectedBank?.iin || ""}
              onChange={(e) => {
                const bank = availableBanks.find(b => b.iin === e.target.value);
                if (bank) handleBankSelect(bank);
              }}
              onFocus={handleBankDropdownOpen}
              onClick={handleBankDropdownOpen}
              disabled={loadingBanks}
              className="w-full appearance-none rounded-2xl border-2 border-slate-200 bg-white py-4 pl-14 pr-12 text-lg font-bold text-slate-900 outline-none hover:border-[#7c3aed]/50 focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="" disabled>{loadingBanks ? "Loading banks..." : "PLEASE SELECT BANK"}</option>
              {availableBanks.map(bank => (
                <option key={bank.iin} value={bank.iin}>{bank.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
          </div>

          {banksFetched && currentPage < totalPages && (
            <button
              type="button"
              onClick={handleLoadMoreBanks}
              disabled={loadingMore}
              className="mt-3 flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading more banks...
                </>
              ) : (
                <>
                  <ArrowDown className="h-4 w-4" />
                  Load more banks ({currentPage} / {totalPages})
                </>
              )}
            </button>
          )}
        </section>

        <label className="flex cursor-pointer items-start gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) =>
              setConsent(
                event.target.checked
              )
            }
            className="mt-1 h-8 w-8 accent-[#172033]"
          />

          <span className="text-base leading-6 text-slate-800 sm:text-lg">
            I hereby give consent to use my
            Aadhaar number and biometric data
            for fetching balance and cash
            withdrawal as per NPCI guidelines.
          </span>
        </label>

        <button
          type="button"
          onClick={() => setStep(4)}
          disabled={!selectedBank || !consent}
          className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-purple-600 shadow-md transition-all hover:-translate-y-0.5 hover:bg-purple-700 text-lg font-bold text-white shadow-md disabled:bg-[#aab2c0] sm:text-xl"
        >
          <ArrowRight className="h-7 w-7" />
          PROCEED TO REVIEW
        </button>
      </>
    );
  };

  /*
   * ============================================================
   * STEP 4: REVIEW
   * ============================================================
   */

  const renderReview = () => {
    return (
      <>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Step 4: Verify Your Details
          </h2>

          <p className="mt-2 text-base text-slate-500">
            Please confirm the details before proceeding to services
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Collected Information
          </h3>

          <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white">
            <div className="flex items-center gap-4 border-b-2 border-slate-200 p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50">
                <Phone className="h-7 w-7 text-[#172033]" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-500">
                  Mobile Number
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  +91 {customerMobile}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#172033]"
              >
                <Edit3 className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 border-b-2 border-slate-200 p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50">
                <IdCard className="h-7 w-7 text-[#172033]" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-500">
                  Aadhaar Number
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {getCustomerAadhaarDisplay()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#172033]"
              >
                <Edit3 className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50">
                <Building2 className="h-7 w-7 text-[#172033]" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-500">
                  Linked Bank
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {selectedBank?.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#172033]"
              >
                <Edit3 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setStep(5)}
          className="mt-8 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-purple-600 shadow-md transition-all hover:-translate-y-0.5 hover:bg-purple-700 text-lg font-bold text-white shadow-md sm:text-xl"
        >
          <ArrowRight className="h-7 w-7" />
          PROCEED TO SERVICES
        </button>
      </>
    );
  };

  /*
   * ============================================================
   * STEP 5
   * AEPS SERVICES
   * ============================================================
   */

  const services: {
    id: ServiceId;
    title: string;
    description: string;
    icon: React.ElementType;
    iconClass: string;
    bgClass: string;
  }[] = [
      {
        id: "cash-withdrawal",
        title: "Cash Withdrawal",
        description: "Withdraw cash from A/C",
        icon: WalletCards,
        iconClass: "text-[#172033]",
        bgClass: "bg-purple-50",
      },
      {
        id: "balance-check",
        title: "Balance Enquiry",
        description: "Enquire A/C balance",
        icon: Banknote,
        iconClass: "text-[#172033]",
        bgClass: "bg-purple-50",
      },
      {
        id: "mini-statement",
        title: "Mini Statement",
        description: "Last 5 transactions",
        icon: ReceiptText,
        iconClass: "text-[#172033]",
        bgClass: "bg-purple-50",
      },
      {
        id: "balance-withdrawal",
        title: "Bal+Withdraw",
        description: "Check & withdraw",
        icon: ArrowRight,
        iconClass: "text-[#172033]",
        bgClass: "bg-purple-50",
      },
      {
        id: "cash-deposit",
        title: "Cash Deposit",
        description: "Deposit cash into A/C",
        icon: ArrowDown,
        iconClass: "text-[#172033]",
        bgClass: "bg-purple-50",
      },
    ];

  const renderServices = () => {
    return (
      <>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Step 5: Select AEPS Service
          </h2>

          <p className="mt-2 text-base text-slate-500">
            Select the transaction you want to
            perform.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {services.map((service) => {
            const Icon = service.icon;

            const selected =
              selectedService ===
              service.id;

            return (
              <button
                type="button"
                key={service.id}
                onClick={() =>
                  handleServiceClick(
                    service.id
                  )
                }
                className={`rounded-2xl border-2 p-5 text-left transition ${selected
                  ? "border-[#172033] shadow-md"
                  : "border-[#d8d8d8]"
                  } bg-white shadow-sm hover:shadow-md transition-shadow hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-24px_rgba(15,23,42,0.45)]`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${service.bgClass}`}
                >
                  <Icon
                    className={`h-8 w-8 ${service.iconClass}`}
                  />
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  {service.title}
                </h3>

                <p className="mt-1 text-base text-slate-700">
                  {service.description}
                </p>
              </button>
            );
          })}
        </div>
      </>
    );
  };





  /*
   * ============================================================
   * BIOMETRIC MODAL
   * ============================================================
   */

  const renderBiometricModal = () => {
    if (modalType !== "biometric") {
      return null;
    }

    let title = "Biometric Authentication";
    let subtitle = "Capturing Fingerprint...";
    let hint = "Place finger on Mantra MFS100";

    if (
      selectedService ===
      "balance-check"
    ) {
      title = "Balance Check";
      hint = "Place finger to verify account balance";
    }

    if (
      selectedService ===
      "mini-statement"
    ) {
      title = "Mini Statement";
      hint = "Place finger to generate mini statement";
    }

    if (
      selectedService ===
      "balance-withdrawal"
    ) {
      if (!balWithBalanceChecked) {
        title = "Step 1: Check Account Balance";
        subtitle = "Verifying Bank Balance...";
        hint = "Place customer finger to fetch live account balance";
      } else {
        title = `Step 2: Authorize Withdrawal (₹${withdrawalAmount.toLocaleString("en-IN")})`;
        subtitle = "Authorizing Cash Withdrawal...";
        hint = `Place customer finger to withdraw ₹${withdrawalAmount.toLocaleString("en-IN")}`;
      }
    }

    if (
      selectedService ===
      "cash-withdrawal"
    ) {
      title =
        withdrawalAmount > 5000
          ? "Biometric Authentication (> ₹5,000)"
          : "Biometric Authentication (≤ ₹5,000)";
      hint = `Place finger to withdraw ₹${withdrawalAmount.toLocaleString("en-IN")}`;
    }

    return (
      <div className="flex items-center justify-center py-8 w-full">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-purple-100 bg-white p-5 text-center shadow-md sm:p-6">
          <h2 className="text-left text-2xl font-bold text-slate-900 sm:text-2xl">
            {title}
          </h2>

          <div className="mx-auto mt-7 flex h-28 w-28 items-center justify-center rounded-full bg-purple-50">
            <Fingerprint className="h-12 w-12 text-purple-600" />
          </div>

          <h3 className="mt-6 text-lg font-bold text-[#171717] sm:text-xl">
            {subtitle}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {hint}
          </p>

          <div className="mx-auto mt-6 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#7c3aed]" />
        </div>
      </div>
    );
  };

  /*
   * ============================================================
   * AMOUNT MODAL
   * ============================================================
   */

  const amountOptions = [
    500,
    1000,
    2000,
    3000,
    5000,
    7000,
    10000,
  ];

  const renderAmountModal = () => {
    if (modalType !== "amount") {
      return null;
    }

    const isDeposit = selectedService === "cash-deposit";
    const requiresOtp = !isDeposit && withdrawalAmount > 5000;
    const isBalanceWithdrawal = selectedService === "balance-withdrawal";
    const hasFetchedBalance = isBalanceWithdrawal && fetchedBalance !== null;
    const isZeroBalance = hasFetchedBalance && fetchedBalance <= 0;
    const isAmountExceeded = hasFetchedBalance && withdrawalAmount > fetchedBalance;
    const isConfirmDisabled =
      withdrawalAmount <= 0 || (isBalanceWithdrawal && (isZeroBalance || isAmountExceeded));

    return (
      <div className="flex items-center justify-center py-8 w-full">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-purple-100 bg-white p-5 shadow-md sm:p-6">
          <div className="mx-auto mb-7 h-1.5 w-16 rounded-full bg-slate-200 sm:hidden" />

          {isBalanceWithdrawal && hasFetchedBalance && (
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
              <span>Step 2 of 2: Cash Withdrawal</span>
            </div>
          )}

          <h2 className="text-2xl font-bold text-slate-900">
            {isDeposit
              ? "Enter Deposit Amount"
              : isBalanceWithdrawal
              ? "Select Withdrawal Amount"
              : "Enter Withdrawal Amount"}
          </h2>

          <p className="mt-2 text-base text-slate-600 sm:text-lg">
            {isDeposit
              ? "Customer fingerprint will be validated to deposit cash"
              : "Amounts above ₹5,000 require Mobile OTP + Biometric validation"}
          </p>

          {hasFetchedBalance && (
            <div
              className={`mt-5 rounded-xl border p-4 text-center ${
                isZeroBalance
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider">
                Live Available Balance
              </p>
              <p className="mt-1 text-2xl font-bold">
                ₹{fetchedBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              {isZeroBalance && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  Account has ₹0.00 balance. Withdrawal cannot be processed.
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex min-h-[68px] items-center rounded-xl border border-slate-200 bg-[#f8f5ff] px-4">
            <span className="text-2xl font-bold text-purple-600">
              ₹
            </span>

            <input
              type="number"
              value={withdrawalAmount}
              onChange={(event) =>
                setWithdrawalAmount(
                  Number(
                    event.target.value
                  )
                )
              }
              className="ml-2 w-full bg-transparent text-2xl font-bold text-slate-900 outline-none"
              disabled={isZeroBalance}
            />
          </div>

          {isAmountExceeded && (
            <div className="mt-2 text-sm font-medium text-amber-600">
              Amount exceeds available balance of ₹{fetchedBalance?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          )}

          <div className="mt-5 grid grid-cols-4 gap-2">
            {amountOptions.map(
              (amount) => {
                const active =
                  withdrawalAmount ===
                  amount;
                const optionExceeds = hasFetchedBalance && amount > (fetchedBalance || 0);

                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() =>
                      setWithdrawalAmount(
                        amount
                      )
                    }
                    disabled={optionExceeds || isZeroBalance}
                    className={`min-h-[48px] rounded-xl border px-2 text-sm font-semibold transition sm:text-base ${
                      active
                        ? "border-[#7c3aed] bg-purple-50 text-purple-600"
                        : optionExceeds || isZeroBalance
                        ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {active && (
                      <Check className="mr-1 inline h-4 w-4" />
                    )}
                    ₹{amount}
                  </button>
                );
              }
            )}
          </div>

          {isDeposit ? (
            <div className="mt-7 flex items-start gap-4 rounded-2xl border-2 border-[#d8deec] bg-purple-50 p-5">
              <Fingerprint className="mt-1 h-7 w-7 shrink-0 text-[#172033]" />

              <p className="text-base font-semibold text-[#172033] sm:text-lg">
                Customer Biometric Fingerprint will be validated to deposit cash.
              </p>
            </div>
          ) : requiresOtp ? (
            <div className="mt-7 flex items-start gap-4 rounded-2xl border-2 border-[#d8deec] bg-purple-50 p-5">
              <LockKeyhole className="mt-1 h-7 w-7 shrink-0 text-[#172033]" />

              <p className="text-base font-semibold text-[#172033] sm:text-lg">
                Amount is &gt; ₹5,000: Both
                Customer OTP and Fingerprint
                will be required.
              </p>
            </div>
          ) : (
            <div className="mt-7 flex items-start gap-4 rounded-2xl border-2 border-[#d8deec] bg-purple-50 p-5">
              <Fingerprint className="mt-1 h-7 w-7 shrink-0 text-[#172033]" />

              <p className="text-base font-semibold text-[#172033] sm:text-lg">
                Amount is ≤ ₹5,000: Only
                Fingerprint Biometric will be
                required.
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setModalType("");
                setOtp("");
                setOtpReferenceKey("");
                if (selectedService === "balance-withdrawal") {
                  setBalWithBalanceChecked(false);
                  setFetchedBalance(null);
                }
              }}
              className="min-h-[52px] rounded-xl border border-slate-200 bg-white px-5 text-base font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={
                handleConfirmAmount
              }
              disabled={
                isConfirmDisabled
              }
              className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-purple-600 text-base font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {isDeposit ? "CONFIRM DEPOSIT" : "CONFIRM AMOUNT"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /*
   * ============================================================
   * OTP MODAL
   * ============================================================
   */

  const renderOtpModal = () => {
    if (modalType !== "otp") {
      return null;
    }

    function handleVerifyOtp(): void {
      if (otp.length !== 6 || !selectedService) {
        return;
      }

      setModalType("biometric");
      startBiometric(selectedService);
    }

    return (
      <div className="flex items-center justify-center py-8 w-full">
        <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white bg-white p-7 shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
              <ShieldCheck className="h-7 w-7 text-[#172033]" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 sm:text-2xl">
              Customer OTP Required
            </h2>
          </div>

          <p className="mt-7 text-base leading-7 text-slate-600 sm:text-lg">
            As per AEPS security rules,
            transactions exceeding ₹5,000
            require OTP verification.
          </p>

          <div className="mt-6 inline-flex rounded-2xl bg-purple-50 px-5 py-3 text-base font-bold text-[#172033]">
            Amount:{" "}
            {formatCurrency(
              withdrawalAmount
            )}{" "}
            • Sent to +91 {customerMobile}
          </div>

          <div className="mt-7">
            <OtpInput
              value={otp}
              onChange={setOtp}
              length={6}
              disabled={isProcessing}
            />
          </div>

          <div className="mt-7 flex items-center justify-end gap-5">
            <button
              type="button"
              onClick={() => {
                setModalType("");
                setOtp("");
                setOtpReferenceKey("");
              }}
              className="px-4 py-3 text-lg font-bold text-[#172033]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                handleVerifyOtp
              }
              disabled={otp.length !== 6}
              className="min-h-[52px] min-w-[190px] rounded-2xl bg-purple-600 px-6 text-lg font-bold text-white shadow-md hover:bg-purple-700 disabled:bg-[#aab2c0]"
            >
              VERIFY OTP
            </button>
          </div>
        </div>
      </div>
    );
  };

  /*
   * ============================================================
   * RECEIPT HELPERS
   * ============================================================
   */

  const getReceiptTitle = (
    type: ReceiptType
  ) => {
    switch (type) {
      case "withdrawal":
        return "Cash Withdrawal Successful";

      case "balance":
        return "Balance Enquiry Successful";

      case "mini-statement":
        return "Mini Statement Generated";

      case "balance-withdrawal":
        return "Withdrawal & Balance Check Successful";

      case "cash-deposit":
        return "Cash Deposit Successful";

      default:
        return "";
    }
  };

  const renderReceiptRow = (
    label: string,
    value: React.ReactNode,
    valueClass = "text-slate-900"
  ) => {
    return (
      <div className="flex items-center justify-between gap-4">
        <span className="shrink-0 text-base text-slate-600 sm:text-lg">
          {label}
        </span>

        <span
          className={`break-all text-right text-base font-semibold sm:text-lg ${valueClass}`}
        >
          {value}
        </span>
      </div>
    );
  };

  /*
   * ============================================================
   * RECEIPT SCREEN
   * ============================================================
   */

  const renderReceipt = () => {
    if (!showReceipt || !receiptData) {
      return null;
    }

    const isWithdrawal =
      receiptData.receiptType ===
      "withdrawal" ||
      receiptData.receiptType ===
      "balance-withdrawal";

    const isDeposit = receiptData.receiptType === "cash-deposit";
    const isBalance = receiptData.receiptType === "balance";

    if (isBalance) {
      const numericBal = receiptData.balance;
      const formattedBal = isNaN(numericBal)
        ? "0.00"
        : numericBal.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

      return (
        <div className="mx-auto w-full space-y-6">
          {/* Top Bar */}
          <div className="print:hidden flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReceiptHome}
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
                  Balance Enquiry
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrintReceipt}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>Print Receipt</span>
            </button>
          </div>

          {/* Receipt Main Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xl overflow-hidden print:border-none print:shadow-none">
            {/* Bank & Hero Balance Banner */}
            <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 p-6 sm:p-8 text-white relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm text-purple-100">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                    <span>{receiptData.message || "Balance Enquiry Completed Successfully"}</span>
                  </div>
                  <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {receiptData.bankName}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-purple-200">
                    <span>Aadhaar: <strong className="text-white">{receiptData.aadhaar}</strong></span>
                    <span>•</span>
                    <span>Mobile: <strong className="text-white">{receiptData.mobile}</strong></span>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 backdrop-blur-md p-5 border border-white/15 text-left md:text-right min-w-[220px]">
                  <p className="text-xs uppercase tracking-wider font-semibold text-purple-200">
                    Available Account Balance
                  </p>
                  <p className="mt-1 text-3xl sm:text-4xl font-black text-white">
                    ₹ {formattedBal}
                  </p>
                  <p className="mt-1 text-[11px] text-purple-200 flex items-center md:justify-end gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300 inline" />
                    Live CBS Balance Verified
                  </p>
                </div>
              </div>
            </div>

            {/* Meta Details Grid */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Transaction Audit Information
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <span className="text-sm text-slate-500">Transaction ID</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {receiptData.transactionId}
                      </span>
                      {receiptData.transactionId && receiptData.transactionId !== "NA" && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(receiptData.transactionId);
                            setCopiedReceiptTxnId(true);
                            setTimeout(() => setCopiedReceiptTxnId(false), 2000);
                          }}
                          className="p-1 text-slate-400 hover:text-purple-600 rounded transition"
                          title="Copy Transaction ID"
                        >
                          {copiedReceiptTxnId ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <span className="text-sm text-slate-500">Bank RRN</span>
                    <span className="font-mono text-sm font-bold text-slate-800">
                      {receiptData.rrn}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <span className="text-sm text-slate-500">Date & Time</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {new Date().toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <span className="text-sm text-slate-500">Authentication Mode</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {receiptData.authMode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <span className="text-sm text-slate-500">Biometric Device</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {receiptData.biometricDevice}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <span className="text-sm text-slate-500">Status</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      {receiptData.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="print:hidden flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="flex h-12 w-full sm:flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  <Printer className="h-4 w-4 text-slate-500" />
                  PRINT RECEIPT
                </button>

                <button
                  type="button"
                  onClick={handleStartNewTransaction}
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
      <div className="">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.45)] sm:px-5">
          <button
            type="button"
            onClick={handleReceiptHome}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-800 hover:bg-slate-100"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          <h1 className="text-2xl font-bold text-slate-900">
            AEPS Receipt
          </h1>
        </div>

        <main className="px-3 py-5 sm:px-6">
          <div className="mx-auto w-full max-w-md rounded-[30px] border border-white bg-white p-4 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.25)] sm:p-6">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-50">
                <Check className="h-10 w-10 text-[#172033]" />
              </div>

              <h2 className="mt-4 text-xl font-bold text-[#172033] sm:text-2xl">
                {getReceiptTitle(receiptData.receiptType)}
              </h2>

              <p className="mt-1 text-lg text-slate-700 sm:text-xl">
                {receiptData.bankName}
              </p>
            </div>

            <div className="mt-8 rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] sm:p-7">
              {isWithdrawal && (
                <>
                  <div className="text-center rounded-[16px] bg-[#f8f9fc] border border-slate-100 p-4 shadow-sm sm:p-5">
                    <p className="text-3xl font-bold text-slate-900 sm:text-4xl">
                      ₹{receiptData.amount.toFixed(2)}
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
                      Amount Withdrawn
                    </p>
                  </div>

                  <div className="my-6 border-t border-slate-100" />
                </>
              )}

              {isDeposit && (
                <>
                  <div className="text-center rounded-[16px] bg-[#f8f9fc] border border-slate-100 p-4 shadow-sm sm:p-5">
                    <p className="text-3xl font-bold text-slate-900 sm:text-4xl">
                      ₹{receiptData.amount.toFixed(2)}
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
                      Amount Deposited
                    </p>
                  </div>

                  <div className="my-6 border-t border-slate-100" />
                </>
              )}

              <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
                {renderReceiptRow(
                  "Account Balance",
                  formatCurrency(receiptData.balance),
                  "text-[#172033]"
                )}

                {renderReceiptRow(
                  "Customer Aadhaar",
                  receiptData.aadhaar
                )}

                {renderReceiptRow(
                  "Customer Mobile",
                  receiptData.mobile
                )}

                {renderReceiptRow(
                  "Bank Name",
                  receiptData.bankName
                )}

                {renderReceiptRow(
                  "Transaction ID",
                  <span className="inline-flex items-center gap-1">
                    <span>{receiptData.transactionId}</span>
                    {receiptData.transactionId && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(receiptData.transactionId);
                          setCopiedReceiptTxnId(true);
                          setTimeout(() => setCopiedReceiptTxnId(false), 2000);
                        }}
                        className="p-0.5 text-slate-400 hover:text-purple-600 rounded"
                        title="Copy"
                      >
                        {copiedReceiptTxnId ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </span>
                )}

                {renderReceiptRow(
                  "RRN Number",
                  receiptData.rrn
                )}

                {renderReceiptRow(
                  "Biometric Device",
                  receiptData.biometricDevice
                )}

                {renderReceiptRow(
                  "Auth Mode",
                  receiptData.authMode
                )}

                {renderReceiptRow(
                  "Transaction Status",
                  receiptData.status,
                  "text-emerald-600 font-bold"
                )}
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#cbd3e3] bg-transparent text-lg font-bold text-[#172033]"
              >
                <Printer className="h-5 w-5" />
                PRINT RECEIPT
              </button>

              <button
                type="button"
                onClick={handleStartNewTransaction}
                className="flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-purple-600 transition hover:bg-purple-700 text-lg font-bold text-white shadow-md"
              >
                <RefreshCw className="h-5 w-5" />
                NEW TRANSACTION
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  };

  const renderServiceFetchingOverlay = () => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white p-6 sm:p-7 text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 ring-8 ring-purple-50/50">
            <Building2 className="h-9 w-9 text-purple-600 animate-pulse" />
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Biometric Captured</span>
          </div>

          <h3 className="mt-3 text-lg sm:text-xl font-bold text-slate-900">
            {selectedBank?.name || "Bank CBS Gateway"}
          </h3>

          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            {serviceFetchingMessage || "Fetching service details from bank..."}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#7c3aed] border-t-transparent" />
            <span className="text-xs font-semibold text-slate-600">
              Communicating with CBS gateway...
            </span>
          </div>
        </div>
      </div>
    );
  };

  /*
   * ============================================================
   * MAIN RENDER
   * ============================================================
   */

  if (showReceipt) {
    return renderReceipt();
  }

  if (showMiniStatement) {
    if (!selectedBank) {
      setShowMiniStatement(false);
      return null;
    }
    return (
      <MiniStatement
        customerMobile={customerMobile}
        customerAadhaar={customerAadhaar}
        selectedBank={selectedBank}
        selectedDevicePort={selectedDevicePort}
        initialData={miniStatementResult}
        onBack={() => {
          setShowMiniStatement(false);
          setMiniStatementResult(null);
        }}
        onNewTransaction={() => {
          setShowMiniStatement(false);
          setMiniStatementResult(null);
          handleStartNewTransaction();
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full  space-y-6">
      {/* Page Header */}
      <section>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
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
              AEPS Services
            </h1>
          </div>
        </div>
      </section>


      <section className="hp-card overflow-hidden rounded-2xl p-5 sm:p-7">
        {step > 0 && step <= 5 && (
          <div className="mx-auto mt-4 w-full rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-6">
            <ProgressHeader step={step as Step} />
          </div>
        )}

        <main className="mt-5">
          <div className="mx-auto w-full space-y-5">
            {modalType === "" ? (
              <>
                {step === 0 && renderRetailerAuth()}
                {step === 1 && renderCustomerMobile()}
                {step === 2 && renderCustomerAadhaar()}
                {step === 3 && renderBankSelection()}
                {step === 4 && renderReview()}
                {step === 5 && renderServices()}
              </>
            ) : (
              <div className="flex w-full items-center justify-center bg-white rounded-2xl">
                {renderAmountModal()}
                {renderOtpModal()}
                {renderBiometricModal()}
              </div>
            )}
          </div>
        </main>
      </section>

      {isFetchingService && renderServiceFetchingOverlay()}
    </div>
  );
};

export default Aeps;
