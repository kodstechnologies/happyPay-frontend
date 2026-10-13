import { useState, useEffect } from "react";
import AepsDeposit from "./AepsDeposit";
import { rdService } from "../../../utils/rdService";
import { getDeviceInfo } from "../../../apis/bioKyc";
import {
  ArrowLeft,
  ArrowRight,
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
  FileText,
  ReceiptText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import OtpInput from "../../../components/common/OtpInput";
import StepIndicator from "../../../components/common/StepIndicator";
import {
  checkAepsLoginStatus,
  verifyTfa,
  parsePidXml,
  balanceEnquiry,
  type TfaPayload,
} from "../../../services/api/retailer/aepsApi";

type Step = 0 | 1 | 2 | 3 | 4 | 5;

type ServiceId =
  | "cash-withdrawal"
  | "balance-check"
  | "mini-statement"
  | "balance-withdrawal";

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
  | "balance-withdrawal";

interface Bank {
  name: string;
  code: string;
  shortName: string;
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
 * BANK LIST
 * ============================================================
 *
 * Existing banks are preserved.
 */
const banks: Bank[] = [
  {
    name: "State Bank of India",
    code: "SBIN",
    shortName: "SBI",
  },
  {
    name: "HDFC Bank",
    code: "HDFC",
    shortName: "HDFC",
  },
  {
    name: "ICICI Bank",
    code: "ICIC",
    shortName: "ICICI",
  },
  {
    name: "Punjab National Bank",
    code: "PUNB",
    shortName: "PNB",
  },
  {
    name: "Bank of Baroda",
    code: "BARB",
    shortName: "BOB",
  },
  {
    name: "Axis Bank",
    code: "UTIB",
    shortName: "AXIS",
  },
  {
    name: "Canara Bank",
    code: "CNRB",
    shortName: "CNRB",
  },
  {
    name: "Union Bank of India",
    code: "UBIN",
    shortName: "UBI",
  },
  {
    name: "Bank of India",
    code: "BKID",
    shortName: "BOI",
  },
  {
    name: "Kotak Mahindra Bank",
    code: "KKBK",
    shortName: "KOTAK",
  },
  {
    name: "Central Bank of India",
    code: "CBIN",
    shortName: "CBI",
  },
  {
    name: "Indian Bank",
    code: "IDIB",
    shortName: "IB",
  },
  {
    name: "Yes Bank",
    code: "YESB",
    shortName: "YES",
  },
  {
    name: "IndusInd Bank",
    code: "INDB",
    shortName: "INDUS",
  },
  {
    name: "IDBI Bank",
    code: "IBKL",
    shortName: "IDBI",
  },
  {
    name: "UCO Bank",
    code: "UCBA",
    shortName: "UCO",
  },
  {
    name: "Punjab & Sind Bank",
    code: "PSIB",
    shortName: "PSB",
  },
  {
    name: "Federal Bank",
    code: "FDRL",
    shortName: "FED",
  },
  {
    name: "Bank of Maharashtra",
    code: "MAHB",
    shortName: "BOM",
  },
  {
    name: "Indian Overseas Bank",
    code: "IOBA",
    shortName: "IOB",
  },
  {
    name: "Karnataka Bank",
    code: "KARB",
    shortName: "KBL",
  },
  {
    name: "South Indian Bank",
    code: "SIBL",
    shortName: "SIB",
  },
  {
    name: "RBL Bank",
    code: "RATN",
    shortName: "RBL",
  },
  {
    name: "Bandhan Bank",
    code: "BDBL",
    shortName: "BANDHAN",
  },
  {
    name: "IDFC FIRST Bank",
    code: "IDFB",
    shortName: "IDFC",
  },
  {
    name: "AU Small Finance Bank",
    code: "AUBL",
    shortName: "AU",
  },
  {
    name: "Equitas Small Finance Bank",
    code: "ESFB",
    shortName: "EQUITAS",
  },
  {
    name: "Ujjivan Small Finance Bank",
    code: "UJVN",
    shortName: "UJJIVAN",
  },
  {
    name: "Jana Small Finance Bank",
    code: "JSFB",
    shortName: "JANA",
  },
  {
    name: "ESAF Small Finance Bank",
    code: "ESMF",
    shortName: "ESAF",
  },
  {
    name: "Suryoday Small Finance Bank",
    code: "SURY",
    shortName: "SURYODAY",
  },
  {
    name: "DCB Bank",
    code: "DCBL",
    shortName: "DCB",
  },
  {
    name: "City Union Bank",
    code: "CIUB",
    shortName: "CUB",
  },
  {
    name: "Tamilnad Mercantile Bank",
    code: "TMBL",
    shortName: "TMB",
  },
  {
    name: "Karur Vysya Bank",
    code: "KVBL",
    shortName: "KVB",
  },
  {
    name: "Dhanlaxmi Bank",
    code: "DLXB",
    shortName: "DLB",
  },
  {
    name: "Karnataka Gramin Bank",
    code: "PKGB",
    shortName: "KGB",
  },
  {
    name: "Kerala Gramin Bank",
    code: "KLGB",
    shortName: "KGB",
  },
  {
    name: "Rajasthan Marudhara Gramin Bank",
    code: "RMGB",
    shortName: "RMGB",
  },
  {
    name: "Andhra Pradesh Grameena Vikas Bank",
    code: "APGV",
    shortName: "APGVB",
  },
  {
    name: "Telangana Grameena Bank",
    code: "TGBL",
    shortName: "TGB",
  },
  {
    name: "Odisha Gramya Bank",
    code: "IOBA",
    shortName: "OGB",
  },
  {
    name: "Baroda Gujarat Gramin Bank",
    code: "BARB",
    shortName: "BGGB",
  },
];

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
    { label: "Aadhaar Auth" },
    { label: "Bank Selection" },
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

  /*
   * Step 0 = Retailer 2FA
   * Step 1 = Aadhaar & Biometric
   * Step 2 = Bank & Mobile
   * Step 3 = Review
   * Step 4 = AEPS Service
   */

  const [step, setStep] = useState<Step>(0);
  const [flowMode, setFlowMode] = useState<"withdraw" | "deposit" | "">("");

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
  const [storedRetailer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("retailerUser") || "{}");
    } catch {
      return {};
    }
  });

  const [retailerAadhaar, setRetailerAadhaar] = useState(
    () => storedRetailer?.aadhaarNumber || storedRetailer?.aadhaar || ""
  );

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

  const fetchLoginStatus = async (): Promise<void> => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("retailerUser") || "{}"
      );

      const outletId =
        stored.outletId || stored.outletid || "";

      if (!outletId) {
        setRetailerAuthenticated(false);
        setActcode("");
        setTfaStatusMessage("");
        setTfaError(
          "Outlet ID is missing. Please check your retailer account."
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
  };

  const handleRefreshLoginStatus = (): void => {
    setIsCheckingLoginStatus(true);
    setTfaError("");
    void fetchLoginStatus();
  };

  // useEffect(() => {
  //   void fetchLoginStatus();
  // }, []);

  useEffect(() => {
    const checkStatus = async () => {
      await fetchLoginStatus();
    };

    void checkStatus();
  }, []);
  /*
   * Customer Aadhaar
   */
  const [customerAadhaar, setCustomerAadhaar] =
    useState("");

  const [customerVerified, setCustomerVerified] =
    useState(false);

  const [isVerifyingCustomer, setIsVerifyingCustomer] =
    useState(false);

  /*
   * Bank
   */
  const [selectedBank, setSelectedBank] =
    useState<Bank | null>(null);



  const [consent, setConsent] =
    useState(false);

  /*
   * AEPS service
   */
  const [selectedService, setSelectedService] =
    useState<ServiceId | "">("");

  /*
   * Balance Enquiry
   */
  const [balanceEnquiryAadhaar, setBalanceEnquiryAadhaar] = useState("");
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [balanceResult, setBalanceResult] = useState<Record<string, unknown> | null>(null);
  const [balanceError, setBalanceError] = useState("");

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

  /*
   * Withdrawal amount
   */
  const [withdrawalAmount, setWithdrawalAmount] =
    useState(1000);

  /*
   * OTP
   */
  const [otp, setOtp] = useState("");

  /*
   * Receipt
   */
  const [showReceipt, setShowReceipt] =
    useState(false);

  const [receiptData, setReceiptData] =
    useState<ReceiptData | null>(null);

  const retailerMobile =
    storedRetailer?.mobile ||
    localStorage.getItem("retailerMobile") ||
    "+91 1234567890";

  const customerMobile = "+91 98XXXX832";

  /*
   * ============================================================
   * COMMON HELPERS
   * ============================================================
   */

  const formatCurrency = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };

  const handleRetailerAadhaarChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 12);

    setRetailerAadhaar(value);
    setCapturedPidData("");
    setTfaError("");
  };

  const handleCustomerAadhaarChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 12);

    setCustomerAadhaar(value);

    /*
     * If Aadhaar is edited after verification,
     * verification should be reset.
     */
    setCustomerVerified(false);
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
      const stored = JSON.parse(
        localStorage.getItem("retailerUser") || "{}"
      );

      const outletId =
        stored.outletId || stored.outletid || "";

      const referenceKey = stored.referenceKey || "";

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
      const coords = await new Promise<{
        latitude: string;
        longitude: string;
      }>((resolve) => {
        if (!navigator.geolocation) {
          resolve({
            latitude: "0",
            longitude: "0",
          });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: String(position.coords.latitude),
              longitude: String(position.coords.longitude),
            });
          },
          () => {
            resolve({
              latitude: "0",
              longitude: "0",
            });
          },
          { timeout: 5000 }
        );
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
   * CUSTOMER AADHAAR
   * ============================================================
   */

  const handleCustomerVerify = () => {
    if (customerAadhaar.length !== 12) {
      return;
    }

    setIsVerifyingCustomer(true);

    /*
     * Temporary frontend simulation.
     */
    setTimeout(() => {
      setIsVerifyingCustomer(false);
      setCustomerVerified(true);
    }, 2000);
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
      serviceId === "cash-withdrawal"
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

  const startBiometric = async (
    serviceId: ServiceId
  ) => {
    setIsProcessing(true);

    try {
      // 1. Actually capture the fingerprint using our new optimized service!
      const captureResult = await rdService.captureFingerprint(selectedDevicePort);

      if (!captureResult.success) {
        setIsProcessing(false);
        setModalType("");
        alert(captureResult.message);
        return;
      }

      // 2. Here we have the XML payload to send to our Node.js backend
      const pidDataXML = captureResult.data;
      console.log("Captured PidData XML ready for backend:", pidDataXML);

      setIsProcessing(false);

      /*
       * B. BALANCE CHECK
       */
      if (serviceId === "balance-check") {
        completeTransaction("balance");
        return;
      }

      /*
       * C. MINI STATEMENT
       */
      if (serviceId === "mini-statement") {
        completeTransaction("mini-statement");
        return;
      }

      /*
       * A. CASH WITHDRAWAL
       */
      if (serviceId === "cash-withdrawal") {
        completeTransaction("withdrawal");
        return;
      }

      /*
       * D. BALANCE CHECK + WITHDRAWAL
       */
      if (
        serviceId ===
        "balance-withdrawal"
      ) {
        if (!balWithBalanceChecked) {
          setBalWithBalanceChecked(true);
          setFetchedBalance(14250);
          setModalType("amount");
        } else {
          completeTransaction(
            "balance-withdrawal"
          );
        }
        return;
      }
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
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

  const handleConfirmAmount = () => {
    if (withdrawalAmount <= 0) {
      return;
    }

    if (
      selectedService !==
      "cash-withdrawal" &&
      selectedService !==
      "balance-withdrawal"
    ) {
      return;
    }

    /*
     * More than ₹5,000 requires OTP first.
     */
    if (withdrawalAmount > 5000) {
      setOtp("");
      setModalType("otp");
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
   * OTP
   * ============================================================
   */


  /*
   * ============================================================
   * COMPLETE TRANSACTION
   * ============================================================
   */

  const completeTransaction = (
    type: ReceiptType
  ) => {
    const currentBalance = 14250;

    let finalBalance =
      currentBalance;

    /*
     * Withdrawal decreases balance.
     */
    if (
      type === "withdrawal" ||
      type ===
      "balance-withdrawal"
    ) {
      finalBalance =
        currentBalance -
        withdrawalAmount;
    }

    /*
     * Sample recent transactions
     * matching the shared UI.
     */
    const transactions: Transaction[] =
      [
        {
          description:
            "UPI/P2A/Grocery",
          date: "09 Sep",
          amount: "-₹450.00",
          type: "DEBIT",
        },
        {
          description:
            "AEPS Cash Wdl",
          date: "07 Sep",
          amount: "-₹2,000.00",
          type: "DEBIT",
        },
        {
          description:
            "Salary Credit",
          date: "05 Sep",
          amount: "+₹24,500.00",
          type: "CREDIT",
        },
        {
          description:
            "ATM Cash Wdl",
          date: "01 Sep",
          amount: "-₹1,500.00",
          type: "DEBIT",
        },
        {
          description:
            "NEFT Inward",
          date: "28 Aug",
          amount: "+₹5,000.00",
          type: "CREDIT",
        },
      ];

    const data: ReceiptData = {
      receiptType: type,
      bankName:
        getSelectedBankName(),
      amount:
        type === "balance" ||
          type === "mini-statement"
          ? 0
          : withdrawalAmount,
      balance: finalBalance,
      aadhaar:
        getCustomerAadhaarDisplay(),
      mobile: customerMobile,
      transactionId:
        generateTransactionId(),
      rrn: generateRRN(),
      biometricDevice:
        "Mantra MFS100",
      authMode:
        "Biometric / 2FA Verified",
      status: "SUCCESS",
      transactions,
    };

    setReceiptData(data);
    setModalType("");
    setOtp("");
    setShowReceipt(true);
  };

  /*
   * ============================================================
   * RECEIPT HOME
   * ============================================================
   */

  const handleReceiptHome = () => {
    setShowReceipt(false);
    setReceiptData(null);
    setSelectedService("");
    setWithdrawalAmount(1000);
    setOtp("");
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
    setSelectedService("");
    setWithdrawalAmount(1000);
    setOtp("");
    setModalType("");
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

  const renderRetailerAuth = () => {
    return (
      <>
        {/* Balance Enquiry Card */}
        <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm sm:p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#171717] sm:text-base">
                Quick Balance Enquiry
              </h2>
              <p className="mt-0.5 text-xs text-[#8992a3] sm:text-sm">
                Check account balance instantly
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 mb-3">
            <IdCard className="h-5 w-5 shrink-0 text-purple-600" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={12}
              value={balanceEnquiryAadhaar}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 12);
                setBalanceEnquiryAadhaar(value);
                setBalanceError("");
              }}
              disabled={isCheckingBalance}
              placeholder="Enter 12-digit Aadhaar number"
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </div>

          {balanceError && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              {balanceError}
            </div>
          )}

          {balanceResult && (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-700 mb-2">Balance Enquiry Result</p>
              <pre className="text-xs text-emerald-800 overflow-auto max-h-32">
                {JSON.stringify(balanceResult, null, 2)}
              </pre>
            </div>
          )}

          <button
            type="button"
            onClick={handleBalanceEnquiry}
            disabled={balanceEnquiryAadhaar.length !== 12 || isCheckingBalance}
            className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCheckingBalance ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                CHECKING...
              </>
            ) : (
              <>
                <Banknote className="h-4 w-4" />
                CHECK BALANCE
              </>
            )}
          </button>
        </div>

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

        {/* Retailer Mobile + Aadhaar */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section>
            <label className="mb-2 block text-sm font-bold text-slate-900 sm:text-base">
              Retailer Mobile Number{" "}
              <span className="text-xs font-medium text-slate-500">
                (Autofetched)
              </span>
            </label>

            <div className="flex min-h-[48px] w-full max-w-xl items-center gap-3 rounded-xl border border-purple-100 bg-[#f8f5ff] px-3">
              <Phone className="h-4 w-4 shrink-0 text-purple-600" />

              <span className="text-sm font-semibold text-slate-800">
                {retailerMobile}
              </span>
            </div>
          </section>

          <section>
            <label
              htmlFor="retailer-aadhaar"
              className="mb-2 block text-sm font-bold text-slate-900 sm:text-base"
            >
              Retailer Aadhaar Number
            </label>

            <div className="flex min-h-[48px] w-full max-w-xl items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[#7c3aed]">
              <IdCard className="h-5 w-5 shrink-0 text-purple-600" />

              <input
                id="retailer-aadhaar"
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={retailerAadhaar}
                onChange={handleRetailerAadhaarChange}
                disabled={isCapturingRetailer || isVerifyingTfa || retailerAuthenticated}
                placeholder="Enter 12-digit Aadhaar number"
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
              />
            </div>
          </section>
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
                disabled={retailerAadhaar.length !== 12 || isScanningDevices}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-4 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Fingerprint className="h-5 w-5" />
                {isScanningDevices
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
   * STEP 1: FLOW SELECTION
   * ============================================================
   */
  const renderFlowSelection = () => {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Step 1: Select Transaction</h2>
          <p className="mt-2 text-base text-slate-500">Choose whether you want to deposit or withdraw cash.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => {
              setFlowMode("withdraw");
              setStep(2);
            }}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-slate-200 bg-white hover:border-[#7c3aed] hover:shadow-lg transition-all"
          >
            <WalletCards className="h-12 w-12 text-[#7c3aed] mb-4" />
            <span className="text-xl font-bold text-slate-900">Cash Withdraw</span>
          </button>
          <button
            onClick={() => {
              setFlowMode("deposit");
              setStep(2);
            }}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-slate-200 bg-white hover:border-[#7c3aed] hover:shadow-lg transition-all"
          >
            <Banknote className="h-12 w-12 text-[#7c3aed] mb-4" />
            <span className="text-xl font-bold text-slate-900">Cash Deposit</span>
          </button>
        </div>
      </div>
    );
  };

  /*
   * ============================================================
   * STEP 2
   * CUSTOMER AADHAAR
   * ============================================================
   */




  const renderCustomerAadhaar = () => {
    return (
      <>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Step 2: Aadhaar & Biometric
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Verify customer identity using connected
            biometric device.
          </p>
        </div>

        <section className="w-full max-w-2xl">
          <label
            htmlFor="customer-aadhaar"
            className="mb-2 block text-sm font-bold text-slate-900"
          >
            Customer Aadhaar Number
          </label>

          <div
            className={`flex min-h-[52px] items-center gap-3 rounded-xl border-2 bg-white px-4 ${customerVerified
              ? "border-slate-200"
              : "border-slate-200 focus-within:border-[#172033]"
              }`}
          >
            <IdCard className="h-5 w-5 shrink-0 text-slate-400" />

            <input
              id="customer-aadhaar"
              type="text"
              inputMode="numeric"
              maxLength={12}
              value={customerAadhaar}
              onChange={
                handleCustomerAadhaarChange
              }
              disabled={
                customerVerified ||
                isVerifyingCustomer
              }
              placeholder="Enter 12-digit Aadhaar number"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />

            {!customerVerified &&
              customerAadhaar.length ===
              12 && (
                <button
                  type="button"
                  onClick={
                    handleCustomerVerify
                  }
                  disabled={
                    isVerifyingCustomer
                  }
                  className="shrink-0 text-xs font-bold text-[#172033] hover:text-[#101827] disabled:opacity-60"
                >
                  {isVerifyingCustomer
                    ? "VERIFYING..."
                    : "VERIFY"}
                </button>
              )}

            {customerVerified && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600 transition hover:bg-purple-700">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        </section>

        {customerVerified && (
          <div className="w-full max-w-2xl flex items-center justify-between rounded-xl border-2 border-[#cbd3e3] bg-purple-50 p-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-[#172033]" />

              <div>
                <p className="text-xs font-semibold text-slate-600">
                  Registered Mobile with Aadhaar
                </p>

                <p className="mt-0.5 text-sm font-bold text-slate-900">
                  {customerMobile}
                </p>
              </div>
            </div>

            <span className="rounded-full bg-purple-50 px-2 py-1 text-xs font-bold text-[#172033]">
              ✓ Verified
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setStep(4)}
          disabled={!customerVerified}
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
   * STEP 2
   * BANK SELECTION
   * ============================================================
   */

  const renderBankSelection = () => {
    return (
      <>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Step 2: Bank
          </h2>

          <p className="mt-2 text-base text-slate-500">
            select the linked bank account.
          </p>
        </div>

        <section>
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Select Bank
          </h3>

          <div className="relative">
            <Building2 className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#7c3aed]" />
            <select
              value={selectedBank?.code || ""}
              onChange={(e) => {
                const bank = banks.find(b => b.code === e.target.value);
                if (bank) handleBankSelect(bank);
              }}
              className="w-full appearance-none rounded-2xl border-2 border-slate-200 bg-white py-4 pl-14 pr-12 text-lg font-bold text-slate-900 outline-none hover:border-[#7c3aed]/50 focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 transition-all cursor-pointer"
            >
              <option value="" disabled>PLEASE SELECT BANK</option>
              {banks.map(bank => (
                <option key={bank.code} value={bank.code}>{bank.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
          </div>
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
          onClick={() => setStep(3)}
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
   * STEP 3
   * REVIEW
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
            Please confirm the details before
            proceeding to services.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Collected Information
          </h3>

          <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white">
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

              <span className="rounded-full bg-purple-50 px-3 py-2 text-sm font-bold text-[#172033]">
                ✓ Verified
              </span>

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
                <Phone className="h-7 w-7 text-[#172033]" />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-500">
                  Mobile Number
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {customerMobile}
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

              <span className="rounded-xl bg-purple-50 px-3 py-2 font-bold text-[#172033]">
                {selectedBank?.shortName}
              </span>

              <button
                type="button"
                onClick={() => setStep(2)}
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
        title: "A. Cash Withdrawal",
        description: "Withdraw cash from A/C",
        icon: WalletCards,
        iconClass: "text-[#172033]",
        bgClass: "bg-purple-50",
      },
      {
        id: "balance-check",
        title: "B. Balance Enquiry",
        description: "Enquire A/C balance",
        icon: Banknote,
        iconClass: "text-[#172033]",
        bgClass: "bg-purple-50",
      },
      {
        id: "mini-statement",
        title: "C. Mini Statement",
        description: "Last 5 transactions",
        icon: ReceiptText,
        iconClass: "text-[#172033]",
        bgClass: "bg-purple-50",
      },
      {
        id: "balance-withdrawal",
        title: "D. Bal+Withdraw",
        description: "Check & withdraw",
        icon: ArrowRight,
        iconClass: "text-[#172033]",
        bgClass: "bg-purple-50",
      },
    ];

  const handleBalanceEnquiry = async () => {
    if (balanceEnquiryAadhaar.length !== 12) {
      setBalanceError("Please enter a valid 12-digit Aadhaar number");
      return;
    }

    setIsCheckingBalance(true);
    setBalanceError("");
    setBalanceResult(null);

    try {
      const stored = JSON.parse(localStorage.getItem("retailerUser") || "{}");
      const outletId = stored.outletId || stored.outletid || "";
      const referenceKey = stored.referenceKey || "";

      if (!outletId) {
        throw new Error("Outlet ID is missing. Please check your retailer account.");
      }

      if (!referenceKey) {
        throw new Error("Reference key is missing. Please complete eKYC first.");
      }

      // Get geolocation
      const coords = await new Promise<{ latitude: string; longitude: string }>((resolve) => {
        if (!navigator.geolocation) {
          resolve({ latitude: "0", longitude: "0" });
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: String(position.coords.latitude),
              longitude: String(position.coords.longitude),
            });
          },
          () => {
            resolve({ latitude: "0", longitude: "0" });
          },
          { timeout: 5000 }
        );
      });

      const payload = {
        outlet_id: outletId,
        referenceKey,
        latitude: coords.latitude,
        longitude: coords.longitude,
        aadhaar: balanceEnquiryAadhaar,
        ts: new Date().toISOString(),
      };

      const result = await balanceEnquiry(payload);
      setBalanceResult(result.data as Record<string, unknown> | null);
    } catch (error: unknown) {
      setBalanceError(error instanceof Error ? error.message : "Failed to check balance");
    } finally {
      setIsCheckingBalance(false);
    }
  };

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

        <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
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

    if (
      selectedService ===
      "balance-check"
    ) {
      title = "Balance Check";
    }

    if (
      selectedService ===
      "mini-statement"
    ) {
      title = "Mini Statement";
    }

    if (
      selectedService ===
      "balance-withdrawal"
    ) {
      title = "Biometric Authentication";
    }

    if (
      selectedService ===
      "cash-withdrawal"
    ) {
      title =
        withdrawalAmount > 5000
          ? "Biometric Authentication (> ₹5,000)"
          : "Biometric Authentication (≤ ₹5,000)";
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
            Capturing Fingerprint...
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Place finger on Mantra MFS100
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

    const requiresOtp =
      withdrawalAmount > 5000;

    return (
      <div className="flex items-center justify-center py-8 w-full">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-purple-100 bg-white p-5 shadow-md sm:p-6">
          <div className="mx-auto mb-7 h-1.5 w-16 rounded-full bg-slate-200 sm:hidden" />

          <h2 className="text-2xl font-bold text-slate-900">
            Enter Withdrawal Amount
          </h2>

          <p className="mt-2 text-base text-slate-600 sm:text-lg">
            Amounts above ₹5,000 require
            Mobile OTP + Biometric validation
          </p>

          {selectedService === "balance-withdrawal" && fetchedBalance !== null && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-700">Available Balance</p>
              <p className="text-2xl font-bold text-emerald-700">
                ₹{fetchedBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
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
            />
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {amountOptions.map(
              (amount) => {
                const active =
                  withdrawalAmount ===
                  amount;

                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() =>
                      setWithdrawalAmount(
                        amount
                      )
                    }
                    className={`min-h-[48px] rounded-xl border px-2 text-sm font-semibold sm:text-base ${active
                      ? "border-[#7c3aed] bg-purple-50 text-purple-600"
                      : "border-slate-200 bg-white text-slate-800"
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

          {requiresOtp ? (
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

          <button
            type="button"
            onClick={
              handleConfirmAmount
            }
            disabled={
              withdrawalAmount <= 0
            }
            className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-purple-600 text-base font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
          >
            CONFIRM AMOUNT
          </button>
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
            • Sent to +91
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
   * MINI STATEMENT
   * ============================================================
   */

  const renderRecentTransactions = (
    transactions: Transaction[]
  ) => {
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
          {transactions.map(
            (transaction, index) => (
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
                    className={`text-base font-bold sm:text-xl ${transaction.type ===
                      "CREDIT"
                      ? "text-[#172033]"
                      : "text-slate-900"
                      }`}
                  >
                    {transaction.amount}
                  </p>

                  <span
                    className={`mt-1 inline-block rounded-lg px-2.5 py-1 text-xs font-bold ${transaction.type ===
                      "CREDIT"
                      ? "bg-purple-50 text-[#172033]"
                      : "bg-[#e8e8ee] text-slate-700"
                      }`}
                  >
                    {transaction.type}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
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

    const isMiniStatement =
      receiptData.receiptType ===
      "mini-statement";

    const isWithdrawal =
      receiptData.receiptType ===
      "withdrawal" ||
      receiptData.receiptType ===
      "balance-withdrawal";

    return (
      <div className="">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.45)] sm:px-5">
          <button
            type="button"
            onClick={
              handleReceiptHome
            }
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
                {getReceiptTitle(
                  receiptData.receiptType
                )}
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
                      ₹
                      {receiptData.amount.toFixed(
                        2
                      )}
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
                      Amount Withdrawn
                    </p>
                  </div>

                  <div className="my-6 border-t border-slate-100" />
                </>
              )}

              <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
                {renderReceiptRow(
                  "Account Balance",
                  formatCurrency(
                    receiptData.balance
                  ),
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
                  receiptData.transactionId
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
                  "text-[#172033]"
                )}
              </div>
            </div>

            {isMiniStatement &&
              renderRecentTransactions(
                receiptData.transactions
              )}

            <div className="mt-8 space-y-5">
              <button
                type="button"
                onClick={
                  handlePrintReceipt
                }
                className="flex min-h-[68px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#cbd3e3] bg-transparent text-xl font-bold text-[#172033]"
              >
                <Printer className="h-7 w-7" />
                PRINT RECEIPT
              </button>

              {receiptData.receiptType ===
                "withdrawal" ? (
                <button
                  type="button"
                  onClick={
                    handleStartNewTransaction
                  }
                  className="flex min-h-[68px] w-full items-center justify-center gap-3 rounded-2xl bg-purple-600 transition hover:bg-purple-700 text-xl font-bold text-white shadow-md"
                >
                  <RefreshCw className="h-7 w-7" />
                  NEW WITHDRAWAL
                </button>
              ) : (
                <button
                  type="button"
                  onClick={
                    handleReceiptHome
                  }
                  className="flex min-h-[68px] w-full items-center justify-center gap-3 rounded-2xl bg-purple-600 transition hover:bg-purple-700 text-xl font-bold text-white shadow-md"
                >
                  <RefreshCw className="h-7 w-7" />
                  NEW WITHDRAWAL
                </button>
              )}
            </div>
          </div>
        </main>
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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
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
        {step > 1 && flowMode === "withdraw" && (
          <div className="mx-auto mt-4 w-full max-w-3xl rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-6">
            <ProgressHeader step={step as Step} />
          </div>
        )}

        <main className="mt-5">
          <div className="mx-auto w-full max-w-3xl space-y-5">
            {modalType === "" ? (
              <>
                {step === 0 && renderRetailerAuth()}
                {step === 1 && renderFlowSelection()}
                {step === 2 && flowMode === "deposit" && <AepsDeposit />}
                {step === 2 && flowMode === "withdraw" && renderCustomerAadhaar()}
                {step === 3 && flowMode === "withdraw" && renderBankSelection()}
                {step === 4 && flowMode === "withdraw" && renderReview()}
                {step === 5 && flowMode === "withdraw" && renderServices()}
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
    </div>
  );
};

export default Aeps;
