import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Smartphone,
  Store,
  UserRound,
  Fingerprint,
  Cake,
  FileText,
  Building2,
  ShieldCheck,
} from "lucide-react";

import StepIndicator from "../../../components/common/StepIndicator";
import AccountStep from "./registerSteps/AccountSteps";
import ShopDetailsStep from "./registerSteps/ShopDetailsStep";
import AboutRetailerStep from "./registerSteps/AboutRetailerStep";
// import PanVerificationStep from "./registerSteps/PanVerificationStep";
import AadhaarStep from "./registerSteps/AadhaarStep";
import DobStep from "./registerSteps/DobStep";
import BusinessProofStep from "./registerSteps/BusinessProofStep";
import BankDetailsStep from "./registerSteps/BankDetailsStep";

const steps = [
  {
    title: "Account",
    description: "Mobile & account verification",
    icon: Smartphone,
  },
  {
    title: "Shop Details",
    description: "Business information",
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
  {
    title: "DOB",
    description: "Date of birth",
    icon: Cake,
  },
  {
    title: "Business Proof",
    description: "Business verification",
    icon: FileText,
  },
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
  "Date of Birth",
  "Business Proof",
  "Bank Details",
];

const stepDescriptions = [
  "Create your HappyPay retailer account.",
  "Tell us about your shop and business.",
  "Tell us a little about yourself.",
  // "Enter your PAN details for verification.",
  "Verify your Aadhaar information securely.",
  "Enter your date of birth.",
  "Upload your shop and business proof.",
  "Add your bank account for payouts.",
];

const RetailerRegister = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);

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


  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);

      scrollToTop();

      return;
    }
    // Submitting is handled by the form onSubmit!
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Ensure mobile is present even if input was readOnly or stored in localStorage
    if (!formData.get("mobile")) {
      const storedMobile =
        localStorage.getItem("pendingRetailerMobile") ||
        localStorage.getItem("retailerMobile");
      if (storedMobile) {
        formData.set("mobile", storedMobile);
      }
    }

    // Ensure gender & maritalStatus have defaults if omitted
    if (!formData.get("gender")) {
      formData.set("gender", "Male");
    }
    if (!formData.get("maritalStatus")) {
      formData.set("maritalStatus", "Single");
    }

    // Mock ObjectIds for master data
    formData.set("shopCategory", "64d5ec49f1b2c8b1f8e4e1a1");
    formData.set("propertyType", "64d5ec49f1b2c8b1f8e4e1a2");
    formData.set("educationalQualification", "64d5ec49f1b2c8b1f8e4e1a3");
    formData.set("businessProof", "64d5ec49f1b2c8b1f8e4e1a4");

    // Clean up formats
    const aadhaar = formData.get("aadhaar") as string;
    if (aadhaar) {
      formData.set("aadhaar", aadhaar.replace(/\s/g, ""));
    }

    const dob = formData.get("dob") as string;
    if (dob && dob.includes("/")) {
      const [dd, mm, yyyy] = dob.split("/");
      formData.set("dob", `${yyyy}-${mm}-${dd}`);
    }

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:7000";

    try {
      const res = await fetch(`${apiUrl}/api/v1/auth/retailer/register`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.errors ? data.errors.join(", ") : (data.message || "Registration failed");
        throw new Error(errorMsg);
      }

      const pendingMobile = localStorage.getItem("pendingRetailerMobile") || (formData.get("mobile") as string);
      if (pendingMobile) {
        localStorage.setItem("registeredRetailerMobile", pendingMobile);
        localStorage.removeItem("pendingRetailerMobile");
        localStorage.removeItem("retailerMobile");
      }

      navigate("/retailer/kyc-pending", { replace: true });
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert("Error: " + error.message);
      } else {
        alert("Error: " + String(error));
      }
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);

      scrollToTop();

      return;
    }

    navigate("/retailer/login");
  };

  const CurrentStepIcon =
    steps[currentStep].icon;

  const progress =
    ((currentStep + 1) / steps.length) * 100;

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

                <div className="flex items-center gap-1.5 rounded-full bg-[#f2f5ff] px-2.5 py-1.5">

                  <ShieldCheck className="h-3.5 w-3.5 text-[#7c3aed]" />

                  <span className="text-[9px] font-bold text-[#7c3aed]">
                    Secure
                  </span>

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
                      {steps[currentStep].title}
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
                        {steps[currentStep].title}
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

                {/* =================================================
                    ALL STEP COMPONENTS STAY MOUNTED
                    =================================================

                    THIS IS THE IMPORTANT FIX.

                    We do NOT conditionally render the components.

                    Previously:
                      Step 1 rendered
                      -> Next
                      -> Step 1 unmounted
                      -> Step 2 rendered

                    Now:
                      ALL steps stay mounted.
                      Only the active one is visible.

                    Therefore every existing useState inside the
                    original step files keeps its value.
                */}

                <form id="retailer-register-form" className="flex-1" onSubmit={handleSubmit}>

                  <div
                    className={
                      currentStep === 0
                        ? "block"
                        : "hidden"
                    }
                  >
                    <AccountStep />
                  </div>

                  <div
                    className={
                      currentStep === 1
                        ? "block"
                        : "hidden"
                    }
                  >
                    <ShopDetailsStep />
                  </div>

                  <div
                    className={
                      currentStep === 2
                        ? "block"
                        : "hidden"
                    }
                  >
                    <AboutRetailerStep />
                  </div>

                  <div
                    className={
                      currentStep === 3
                        ? "block"
                        : "hidden"
                    }
                  >
                    <AadhaarStep />
                  </div>

                  <div
                    className={
                      currentStep === 4
                        ? "block"
                        : "hidden"
                    }
                  >
                    <DobStep />
                  </div>

                  <div
                    className={
                      currentStep === 5
                        ? "block"
                        : "hidden"
                    }
                  >
                    <BusinessProofStep />
                  </div>

                  <div
                    className={
                      currentStep === 6
                        ? "block"
                        : "hidden"
                    }
                  >
                    <BankDetailsStep />
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
                          ? "Back to Login"
                          : "Previous"}
                      </span>
                    </button>

                    {/* NEXT */}
                    <button
                      type={currentStep === steps.length - 1 ? "submit" : "button"}
                      form={currentStep === steps.length - 1 ? "retailer-register-form" : undefined}
                      onClick={currentStep === steps.length - 1 ? undefined : nextStep}
                      className={`flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-[12px] font-bold text-white shadow-md transition ${
                        currentStep ===
                        steps.length - 1
                          ? "bg-[#10a88a] hover:bg-[#0d8a70]"
                          : "bg-gradient-to-r from-[#7c3aed] to-[#7c3aed] hover:opacity-90"
                      }`}
                    >

                      <span>
                        {currentStep ===
                        steps.length - 1
                          ? "Submit Registration"
                          : "Continue"}
                      </span>

                      {currentStep ===
                      steps.length - 1 ? (
                        <Check
                          className="h-4 w-4"
                          strokeWidth={2.5}
                        />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}

                    </button>

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