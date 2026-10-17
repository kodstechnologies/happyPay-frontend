import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Smartphone,
  Store,
  UserRound,
  Fingerprint,
  Building2,
  ShieldCheck,
  
} from "lucide-react";

import StepIndicator from "../../../components/common/StepIndicator";
import AccountStep from "./registerSteps/AccountSteps";
import ShopDetailsStep from "./registerSteps/ShopDetailsStep";
import AboutRetailerStep, { type AboutRetailerStepHandle } from "./registerSteps/AboutRetailerStep";
// import PanVerificationStep from "./registerSteps/PanVerificationStep";
import AadhaarStep, { type AadhaarStepHandle } from "./registerSteps/AadhaarStep";
// import DobStep from "./registerSteps/DobStep"; // Removed - DOB field moved to AboutRetailerStep
import BankDetailsStep, { type BankDetailsStepHandle } from "./registerSteps/BankDetailsStep";
import { getCurrentRegistrationStep } from "../../../services/api/retailer/retailerAuthApi";

const steps = [
  {
    title: "Account",
    description: "Mobile & account verification",
    icon: Smartphone,
  },
  {
    title: "Shop Details",
    description: "Business information & proof",
    icon: Store,
  },
  {
    title: "Retailer",
    description: "Personal information",
    icon: UserRound,
  },
  /* {
    title: "PAN Verification",
    description: "PAN verification",
    icon: CreditCard,
  }, */
  {
    title: "Aadhaar",
    description: "Aadhaar verification",
    icon: Fingerprint,
  },
  /* {
    title: "DOB",
    description: "Date of birth",
    icon: Cake,
  }, */ // Removed - DOB field moved to AboutRetailerStep
  /* {
    title: "Business Proof",
    description: "Business verification",
    icon: FileText,
  }, */ // Removed - fields moved to ShopDetailsStep
  {
    title: "Bank Details",
    description: "Bank account details",
    icon: Building2,
  },
];

const stepHeadings = [
  "Let's get started",
  "Your Business",
  "About You",
  // "Verify your PAN",
  "Verify Aadhaar",
  // "Date of Birth", // Removed - DOB field moved to AboutRetailerStep
  // "Business Proof", // Removed - fields moved to ShopDetailsStep
  "Bank Details",
];

const stepDescriptions = [
  "Create your HappyPay retailer account.",
  "Tell us about your shop, business, and upload required proofs.",
  "Tell us about yourself including your date of birth.",
  // "Enter your PAN details for verification.",
  "Verify your Aadhaar information securely.",
  // "Enter your date of birth.", // Removed - DOB field moved to AboutRetailerStep
  // "Upload your shop and business proof.", // Removed - fields moved to ShopDetailsStep
  "Add your bank account for payouts.",
];

type RetailerRegisterProps = {
  onExit?: () => void;
};

const RetailerRegister = ({ onExit }: RetailerRegisterProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentStep, setCurrentStep] = useState(() => {
    const stepParam = searchParams.get("step");
    if (stepParam) {
      const stepIndex = parseInt(stepParam, 10);
      if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < steps.length) {
        return stepIndex;
      }
    }
    return 0;
  });
  const [retailerUserId, setRetailerUserId] = useState<string>(
    () => localStorage.getItem("retailerUserId") ?? ""
  );
  const [isLoading, setIsLoading] = useState(true);

  // Refs for step components that use imperative handles
  const aboutStepRef = useRef<AboutRetailerStepHandle>(null);
  const aadhaarStepRef = useRef<AadhaarStepHandle>(null);
  const bankStepRef = useRef<BankDetailsStepHandle>(null);

  // Fetch current registration step on component mount
  useEffect(() => {
    const fetchCurrentStep = async () => {
      const userId = localStorage.getItem("retailerUserId");
      const mobile = localStorage.getItem("pendingRetailerMobile") || localStorage.getItem("registeredRetailerMobile");

      if (!userId && !mobile) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getCurrentRegistrationStep({
          userId: userId || undefined,
          mobile: mobile || undefined,
        });
        const { currentRegistrationStep, userId: returnedUserId, registrationStatus, adminApproved } = response.data;

        // If registration is already completed, redirect to appropriate status page
        const isCompleted =
          String(registrationStatus || "").toUpperCase() === "COMPLETED" ||
          String(currentRegistrationStep || "").toUpperCase() === "SUBMITTED";

        if (isCompleted) {
          const isApproved = String(adminApproved || "").toLowerCase() === "approved";
          if (isApproved) {
            navigate("/retailer", { replace: true });
          } else {
            navigate("/retailer/kyc-pending", { replace: true });
          }
          return;
        }

        // Map backend completed step to next pending step index
        const stepParam = searchParams.get("step");
        const queryStepIndex = stepParam ? parseInt(stepParam, 10) : NaN;

        const nextPendingStepMap: Record<string, number> = {
          ACCOUNT: 1,
          SHOP_DETAILS: 2,
          ABOUT: 3,
          AADHAAR_DETAILS: 4,
          BANK_DETAILS: 4,
          SUBMITTED: 4,
        };

        const stepIndex =
          !isNaN(queryStepIndex) && queryStepIndex >= 0 && queryStepIndex < steps.length
            ? queryStepIndex
            : typeof currentRegistrationStep === "number"
              ? Math.min(4, Math.max(0, currentRegistrationStep))
              : (nextPendingStepMap[String(currentRegistrationStep || "").toUpperCase()] ?? 0);

        setCurrentStep(stepIndex);
        if (returnedUserId) {
          setRetailerUserId(returnedUserId);
          localStorage.setItem("retailerUserId", returnedUserId);
        }
      } catch (error) {
        console.error("Error fetching current registration step:", error);
        // If there's an error, start from the beginning
        setCurrentStep(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentStep();
  }, [navigate, searchParams]);

  /*
   * ==========================================================
   * NAVIGATION
   * ==========================================================
   */

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  const nextStep = async () => {
    // Handle step-specific submission before moving forward
    if (currentStep === 2 && aboutStepRef.current) {
      const success = await aboutStepRef.current.submit();
      if (!success) return;
    }
    if (currentStep === 3 && aadhaarStepRef.current) {
      const success = await aadhaarStepRef.current.submit();
      if (!success) return;
    }
    if (currentStep === 4 && bankStepRef.current) {
      const success = await bankStepRef.current.submit();
      if (!success) return
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);

      scrollToTop();

      return;
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);

      scrollToTop();

      return;
    }

    if (onExit) {
      onExit();
      return;
    }

    navigate("/retailer/login");
  };



  const CurrentStepIcon =
    steps[currentStep]?.icon || UserRound;

  const progress =
    ((currentStep + 1) / steps.length) * 100;

  // Show loading spinner while fetching initial step
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-3 py-3 text-slate-900 sm:px-5 sm:py-5">
        <div className="mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-3xl items-center justify-center sm:min-h-[calc(100vh-40px)]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7c3aed] border-t-transparent"></div>
            <p className="text-sm text-[#737c8c]">Loading registration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-3 text-slate-900 sm:px-5 sm:py-5">

      {/* ======================================================
          MAIN CARD
      ======================================================= */}

      <div className="mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-3xl items-center sm:min-h-[calc(100vh-40px)]">

        <div className="w-full overflow-hidden rounded-[24px] border border-white bg-white shadow-[0_25px_70px_rgba(23,32,51,0.12)]">

          <div className="flex min-h-[580px] flex-col">

            <section className="flex min-w-0 flex-col bg-white">

              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-[#edf0f4] px-5 py-4">

                <div className="flex items-center gap-2.5">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7c3aed] shadow-[0_7px_16px_rgba(49,91,209,0.2)]">
                    <span className="text-sm font-bold text-white">
                      H
                    </span>
                  </div>

                  <div>
                    <p className="text-[15px] font-bold text-[#172033]">
                      HappyPay
                    </p>

                    <p className="text-[8px] uppercase tracking-[0.12em] text-[#8992a3]">
                      Retailer Portal
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-[#f2f5ff] px-2.5 py-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#7c3aed]" />
                    <span className="text-[9px] font-bold text-[#7c3aed]">
                      Secure
                    </span>
                  </div>
                
                </div>

              </div>

              {/* HORIZONTAL STEPPER (DESKTOP) */}
              <div className="hidden border-b border-[#edf0f4] px-5 pb-0 pt-6 md:block lg:px-9 xl:px-10">
                <StepIndicator
                  steps={steps.map(s => ({ label: s.title }))}
                  currentStep={currentStep + 1}
                />
              </div>

              {/* MOBILE PROGRESS */}
              <div className="border-b border-[#edf0f4] px-5 py-4 md:hidden">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#7c3aed]">
                      Step {currentStep + 1} of {steps.length}
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#172033]">
                      {steps[currentStep]?.title}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f8f5ff] text-[#7c3aed]">
                    <CurrentStepIcon className="h-4 w-4" />
                  </div>

                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e9edf4]">

                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#08ae82] transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                    }}
                  />

                </div>

              </div>

              {/* FORM CONTENT */}
              <div className="mx-auto w-full max-w-3xl flex-1 flex-col px-5 py-6 sm:px-7 lg:px-9 xl:px-10">

                {/* FORM HEADER */}
                <div className="flex items-start justify-between gap-4">

                  <div className="flex min-w-0 items-start gap-3">

                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f8f5ff] text-[#7c3aed] sm:flex">

                      <CurrentStepIcon className="h-5 w-5" />

                    </div>

                    <div className="min-w-0">

                      <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#7c3aed]">
                        {steps[currentStep]?.title}
                      </p>

                      <h2 className="mt-1.5 text-[25px] font-bold leading-tight tracking-[-0.03em] text-[#172033] sm:text-[28px]">
                        {stepHeadings[currentStep]}
                      </h2>

                      <p className="mt-2 max-w-[600px] text-[12px] leading-5 text-[#737c8c]">
                        {stepDescriptions[currentStep]}
                      </p>

                    </div>

                  </div>

                  <div className="hidden shrink-0 rounded-xl border border-[#e8ebf1] bg-[#fafbfd] px-3 py-2 sm:block">

                    <p className="text-center text-[8px] font-bold uppercase tracking-[0.1em] text-[#9ba2ae]">
                      Step
                    </p>

                    <p className="mt-0.5 text-center text-sm font-bold text-[#7c3aed]">
                      {currentStep + 1}
                      <span className="mx-0.5 text-[#b4bac5]">
                        /
                      </span>
                      {steps.length}
                    </p>

                  </div>

                </div>

                <div className="my-6 h-px bg-[#edf0f4]" />



                <form id="retailer-register-form" className="flex-1">

                  <div
                    className={
                      currentStep === 0
                        ? "block"
                        : "hidden"
                    }
                  >
                    <AccountStep
                      onAccountCreated={(id) => {
                        setRetailerUserId(id);
                        localStorage.setItem("retailerUserId", id);
                        nextStep();
                      }}
                    />
                  </div>

                  <div
                    className={
                      currentStep === 1
                        ? "block"
                        : "hidden"
                    }
                  >
                    <ShopDetailsStep
                      userId={retailerUserId || localStorage.getItem("retailerUserId") || undefined}
                      onShopDetailsSaved={nextStep}
                    />
                  </div>

                  <div
                    className={
                      currentStep === 2
                        ? "block"
                        : "hidden"
                    }
                  >
                    <AboutRetailerStep
                      ref={aboutStepRef}
                      userId={retailerUserId || localStorage.getItem("retailerUserId") || undefined}
                    />
                  </div>

                  <div
                    className={
                      currentStep === 3
                        ? "block"
                        : "hidden"
                    }
                  >
                    <AadhaarStep
                      ref={aadhaarStepRef}
                      userId={retailerUserId || localStorage.getItem("retailerUserId") || undefined}
                    />
                  </div>

                  <div
                    className={
                      currentStep === 4
                        ? "block"
                        : "hidden"
                    }
                  >
                    <BankDetailsStep
                      ref={bankStepRef}
                      userId={retailerUserId || localStorage.getItem("retailerUserId") || undefined}
                      onRegistrationComplete={() => {
                        if (onExit) {
                          onExit();
                          return;
                        }
                        navigate("/retailer/kyc-pending", { replace: true });
                      }}
                    />
                  </div>

                </form>

                {/* ACTIONS */}
                <div className="mt-7 border-t border-[#edf0f4] pt-5">

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

                    {/* PREVIOUS */}
                    <button
                      type="button"
                      onClick={previousStep}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dfe3e9] bg-white px-5 text-[12px] font-semibold text-[#596376] transition hover:bg-[#fafbfd] hover:border-[#cfd5df]"
                    >
                      <ArrowLeft className="h-4 w-4" />

                      <span>
                        {currentStep === 0
                          ? onExit
                            ? "Back"
                            : "Back to Login"
                          : "Previous"}
                      </span>
                    </button>

                    {/* NEXT — hidden on step 0 & 1 (those steps self-advance) */}
                    {currentStep !== 0 && currentStep !== 1 && currentStep !== 4 && (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-[12px] font-bold text-white shadow-md transition bg-gradient-to-r from-[#7c3aed] to-[#7c3aed] hover:opacity-90"
                      >
                        <span>Continue</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}

                    {/* SUBMIT — only on final step */}
                    {currentStep === 4 && (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-[12px] font-bold text-white shadow-md transition bg-[#10a88a] hover:bg-[#0d8a70]"
                      >
                        <span>Submit Registration</span>
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    )}

                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">

                    <ShieldCheck className="h-3.5 w-3.5 text-[#7c3aed]" />

                    <p className="text-[9px] text-[#9aa2b0]">
                      Secure retailer registration
                    </p>

                  </div>

                </div>

              </div>
            </section>

          </div>
        </div>

      </div>

      <p className="mt-3 text-center text-[9px] text-[#9aa2b0]">
        © {new Date().getFullYear()} HappyPay · Retailer Portal
      </p>

    </div>
  );
};

export default RetailerRegister;