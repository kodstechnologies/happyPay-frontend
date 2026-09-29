import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  LoaderCircle,
  Save,
  ShieldCheck,
  Upload,
  User,
  WalletCards,
} from "lucide-react";

const banks = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Bank of Baroda",
  "Punjab National Bank",
  "Canara Bank",
  "Union Bank of India",
  "Other Bank",
];

const accountTypes = [
  "Current Account",
  "Savings Account",
  "Overdraft Account",
];

type BankInfo = {
  ifsc: string;
  branch: string;
  location: string;
};

const bankInfoMap: Record<string, BankInfo> = {
  "State Bank of India": {
    ifsc: "SBIN0001234",
    branch: "South Extension Branch",
    location: "New Delhi - 110049",
  },

  "HDFC Bank": {
    ifsc: "HDFC0001234",
    branch: "South Extension Branch",
    location: "New Delhi - 110049",
  },

  "ICICI Bank": {
    ifsc: "ICIC0001234",
    branch: "South Extension Branch",
    location: "New Delhi - 110049",
  },

  "Axis Bank": {
    ifsc: "UTIB0001234",
    branch: "South Extension Branch",
    location: "New Delhi - 110049",
  },

  "Kotak Mahindra Bank": {
    ifsc: "KKBK0001234",
    branch: "South Extension Branch",
    location: "New Delhi - 110049",
  },

  "Bank of Baroda": {
    ifsc: "BARB0001234",
    branch: "South Extension Branch",
    location: "New Delhi - 110049",
  },

  "Punjab National Bank": {
    ifsc: "PUNB0001234",
    branch: "South Extension Branch",
    location: "New Delhi - 110049",
  },

  "Canara Bank": {
    ifsc: "CNRB0001234",
    branch: "South Extension Branch",
    location: "New Delhi - 110049",
  },

  "Union Bank of India": {
    ifsc: "UBIN0001234",
    branch: "South Extension Branch",
    location: "New Delhi - 110049",
  },

  "Other Bank": {
    ifsc: "",
    branch: "Branch details",
    location: "Location details",
  },
};

export default function BankDetails() {
  const navigate = useNavigate();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  // ============================================================
  // FORM STATE
  // ============================================================

  const [bankName, setBankName] = useState(
    "State Bank of India"
  );

  const [accountHolder, setAccountHolder] =
    useState("Rajesh Kumar");

  const [accountType, setAccountType] =
    useState("Current Account");

  const [ifsc, setIfsc] =
    useState("SBIN0001234");

  const [accountNumber, setAccountNumber] =
    useState("384920194821");

  const [confirmAccountNumber, setConfirmAccountNumber] =
    useState("384920194821");

  // ============================================================
  // DROPDOWN
  // ============================================================

  const [openDropdown, setOpenDropdown] =
    useState<"bank" | "accountType" | null>(null);

  // ============================================================
  // FILE
  // ============================================================

  const [proofFile, setProofFile] = useState(
    "cancelled_cheque_sbi_4821.jpg"
  );

  // ============================================================
  // SAVE
  // ============================================================

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // ============================================================
  // CURRENT BANK INFORMATION
  // ============================================================

  const currentBankInfo =
    bankInfoMap[bankName] || {
      ifsc: "",
      branch: "",
      location: "",
    };

  // ============================================================
  // BANK SELECT
  // ============================================================

  const handleBankSelect = (bank: string) => {
    setBankName(bank);

    const bankInfo = bankInfoMap[bank];

    if (bankInfo) {
      setIfsc(bankInfo.ifsc);
    } else {
      setIfsc("");
    }

    setOpenDropdown(null);
    setError("");
  };

  // ============================================================
  // ACCOUNT TYPE SELECT
  // ============================================================

  const handleAccountTypeSelect = (
    type: string
  ) => {
    setAccountType(type);

    setOpenDropdown(null);
    setError("");
  };

  // ============================================================
  // ACCOUNT HOLDER
  // ============================================================

  const handleAccountHolderChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAccountHolder(event.target.value);
    setError("");
  };

  // ============================================================
  // IFSC
  // ============================================================

  const handleIfscChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value
      .replace(/\s/g, "")
      .toUpperCase();

    setIfsc(value);
    setError("");
  };

  // ============================================================
  // ACCOUNT NUMBER
  // ============================================================

  const handleAccountNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      event.target.value.replace(/\D/g, "");

    setAccountNumber(value);
    setError("");
  };

  // ============================================================
  // CONFIRM ACCOUNT NUMBER
  // ============================================================

  const handleConfirmAccountNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      event.target.value.replace(/\D/g, "");

    setConfirmAccountNumber(value);
    setError("");
  };

  // ============================================================
  // UPLOAD
  // ============================================================

  const handleUpload = () => {
    if (isSaving) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setProofFile(file.name);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = () => {
    if (!accountHolder.trim()) {
      setError(
        "Please enter account holder name."
      );

      return false;
    }

    if (!bankName) {
      setError(
        "Please select a bank."
      );

      return false;
    }

    if (!accountType) {
      setError(
        "Please select account type."
      );

      return false;
    }

    if (ifsc.length !== 11) {
      setError(
        "IFSC Code must contain 11 characters."
      );

      return false;
    }

    if (accountNumber.length < 8) {
      setError(
        "Please enter a valid account number."
      );

      return false;
    }

    if (
      accountNumber !==
      confirmAccountNumber
    ) {
      setError(
        "Account numbers do not match."
      );

      return false;
    }

    if (!proofFile) {
      setError(
        "Please upload bank account proof."
      );

      return false;
    }

    return true;
  };

  // ============================================================
  // SAVE
  // ============================================================

  const handleSave = () => {
    if (isSaving) {
      return;
    }

    setError("");
    setOpenDropdown(null);

    const valid = validateForm();

    if (!valid) {
      return;
    }

    setIsSaving(true);

    // Frontend-only save simulation.
    // Backend can be connected later.

    window.setTimeout(() => {
      sessionStorage.setItem(
        "happypay_bank_details_updated",
        "true"
      );

      setIsSaving(false);

      navigate("/retailer/profile", {
        replace: true,
      });
    }, 1500);
  };

  // ============================================================
  // BACK
  // ============================================================

  const handleBack = () => {
    if (isSaving) {
      return;
    }

    navigate("/retailer/profile");
  };

  // ============================================================
  // MASK ACCOUNT NUMBER
  // ============================================================

  const maskedAccountNumber =
    accountNumber.length >= 4
      ? `•••• •••• •••• ${accountNumber.slice(-4)}`
      : "•••• •••• ••••";

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="px-4 pb-6 sm:px-6">

      {/* ======================================================
          HIDDEN FILE INPUT
      ====================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mx-auto w-full max-w-5xl">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="mb-4 flex min-h-14 items-center justify-between rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.4)] backdrop-blur-md">

          <button
            type="button"
            onClick={handleBack}
            disabled={isSaving}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#172033] transition hover:bg-slate-100 disabled:opacity-50"
            aria-label="Go back"
          >
            <ArrowLeft size={28} />
          </button>

          <h1 className="text-base font-bold text-[#172033]">Bank Details
          </h1>

          <div className="w-10" />

        </header>

        <main className="space-y-6">

          {/* ==================================================
              RED ACCOUNT CARD
          ================================================== */}

          <section className="rounded-2xl bg-[#7c3aed] p-4 text-white shadow-md sm:p-5">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Building2 size={30} />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-xs font-medium uppercase tracking-wider text-white/60">
                  Primary Bank
                </p>

                <h2 className="mt-1 truncate text-base font-bold">
                  {bankName}
                </h2>

              </div>

              <div className="hidden items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold sm:flex">
                <Check size={18} />
                Primary Payout
              </div>

            </div>

            <div className="mt-4">

              <p className="text-sm text-white/65">
                Account Number
              </p>

              <p className="mt-1.5 text-lg font-bold tracking-widest">
                {maskedAccountNumber}
              </p>

            </div>

            <div className="mt-4 grid grid-cols-2 gap-5">

              <div className="min-w-0">

                <p className="text-sm text-white/65">
                  Account Holder
                </p>

                <p className="mt-1 truncate font-bold sm:text-lg">
                  {accountHolder || "—"}
                </p>

              </div>

              <div className="min-w-0 text-right">

                <p className="text-sm text-white/65">
                  IFSC Code
                </p>

                <p className="mt-1 truncate font-bold sm:text-lg">
                  {ifsc || "—"}
                </p>

              </div>

            </div>

          </section>

          {/* ==================================================
              PENNY DROP
          ================================================== */}

          <section className="flex items-start gap-4 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 sm:p-6">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
              <ShieldCheck size={28} />
            </div>

            <div>

              <h3 className="font-bold text-emerald-600 sm:text-lg">
                Penny Drop Verification Verified
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-600 sm:text-base">
                ₹1 test credit confirmed. Account is active
                for automatic daily wallet settlement.
              </p>

            </div>

          </section>

          {/* ==================================================
              SETTLEMENT ACCOUNT DETAILS
          ================================================== */}

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            {/* HEADER */}

            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-sm font-semibold text-[#172033]">
                  Settlement Account Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage your primary payout account
                </p>

              </div>

              <span className="w-fit rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-500">
                Active Account
              </span>

            </div>

            {/* ==================================================
                BANK NAME
            ================================================== */}

            <div className="mt-4">

              <label className="text-base font-bold text-[#172033]">
                Bank Name
              </label>

              <div className="relative mt-3">

                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "bank"
                        ? null
                        : "bank"
                    )
                  }
                  disabled={isSaving}
                  className={`flex min-h-11 w-full items-center gap-4 rounded-2xl border bg-slate-50/80 px-5 text-left transition ${
                    openDropdown === "bank"
                      ? "border-[#7c3aed] ring-1 ring-[#7c3aed]"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >

                  <Building2
                    size={27}
                    className="shrink-0 text-slate-400"
                  />

                  <span className="flex-1 font-semibold text-[#172033]">
                    {bankName}
                  </span>

                  <ChevronDown
                    size={24}
                    className={`shrink-0 text-slate-500 transition-transform ${
                      openDropdown === "bank"
                        ? "rotate-180"
                        : ""
                    }`}
                  />

                </button>

                {openDropdown === "bank" && (
                  <div className="absolute left-0 right-0 top-[72px] z-40 max-h-[380px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">

                    {banks.map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() =>
                          handleBankSelect(bank)
                        }
                        className={`flex w-full items-center px-5 py-4 text-left text-base font-semibold transition ${
                          bankName === bank
                            ? "bg-slate-200 text-[#7c3aed]"
                            : "text-[#172033] hover:bg-slate-50"
                        }`}
                      >

                        {bankName === bank ? (
                          <Check
                            size={18}
                            className="mr-3 shrink-0 text-[#7c3aed]"
                          />
                        ) : (
                          <span className="mr-3 w-[18px]" />
                        )}

                        {bank}

                      </button>
                    ))}

                  </div>
                )}

              </div>

            </div>

            {/* ==================================================
                ACCOUNT HOLDER
            ================================================== */}

            <div className="mt-4">

              <label
                htmlFor="account-holder"
                className="text-base font-bold text-[#172033]"
              >
                Account Holder Name
              </label>

              <div className="mt-3 flex min-h-11 items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">

                <User
                  size={27}
                  className="shrink-0 text-slate-400"
                />

                <input
                  id="account-holder"
                  type="text"
                  value={accountHolder}
                  onChange={handleAccountHolderChange}
                  className="w-full bg-transparent font-semibold text-[#172033] outline-none"
                  placeholder="Enter account holder name"
                />

              </div>

            </div>

            {/* ==================================================
                ACCOUNT TYPE
            ================================================== */}

            <div className="mt-4">

              <label className="text-base font-bold text-[#172033]">
                Account Type
              </label>

              <div className="relative mt-3">

                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown ===
                        "accountType"
                        ? null
                        : "accountType"
                    )
                  }
                  disabled={isSaving}
                  className={`flex min-h-11 w-full items-center gap-4 rounded-2xl border bg-slate-50/80 px-5 text-left transition ${
                    openDropdown ===
                    "accountType"
                      ? "border-[#7c3aed] ring-1 ring-[#7c3aed]"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >

                  <WalletCards
                    size={27}
                    className="shrink-0 text-slate-400"
                  />

                  <span className="flex-1 font-semibold text-[#172033]">
                    {accountType}
                  </span>

                  <ChevronDown
                    size={24}
                    className={`shrink-0 text-slate-500 transition-transform ${
                      openDropdown ===
                      "accountType"
                        ? "rotate-180"
                        : ""
                    }`}
                  />

                </button>

                {openDropdown ===
                  "accountType" && (
                  <div className="absolute left-0 right-0 top-[72px] z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

                    {accountTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          handleAccountTypeSelect(
                            type
                          )
                        }
                        className={`flex w-full items-center px-5 py-4 text-left text-base font-semibold transition ${
                          accountType === type
                            ? "bg-slate-200 text-[#7c3aed]"
                            : "text-[#172033] hover:bg-slate-50"
                        }`}
                      >

                        {accountType === type ? (
                          <Check
                            size={18}
                            className="mr-3 shrink-0 text-[#7c3aed]"
                          />
                        ) : (
                          <span className="mr-3 w-[18px]" />
                        )}

                        {type}

                      </button>
                    ))}

                  </div>
                )}

              </div>

            </div>

            {/* ==================================================
                IFSC CODE
            ================================================== */}

            <div className="mt-4">

              <label
                htmlFor="ifsc"
                className="text-base font-bold text-[#172033]"
              >
                IFSC Code
              </label>

              <div className="mt-3 flex min-h-11 items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-5 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">

                <input
                  id="ifsc"
                  type="text"
                  value={ifsc}
                  maxLength={11}
                  onChange={handleIfscChange}
                  className="w-full bg-transparent font-semibold uppercase text-[#172033] outline-none"
                  placeholder="Enter IFSC code"
                />

              </div>

              {/* DYNAMIC BRANCH */}

              {ifsc && (
                <div className="mt-2 rounded-xl bg-[#f8f5ff] px-4 py-3 text-sm font-semibold text-[#7c3aed]">

                  🏢 {currentBankInfo.branch}
                  {" • "}
                  {currentBankInfo.location}

                </div>
              )}

            </div>

            {/* ==================================================
                ACCOUNT NUMBER
            ================================================== */}

            <div className="mt-4">

              <label
                htmlFor="account-number"
                className="text-base font-bold text-[#172033]"
              >
                Account Number
              </label>

              <div className="mt-3 flex min-h-11 items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">

                <WalletCards
                  size={27}
                  className="shrink-0 text-slate-400"
                />

                <input
                  id="account-number"
                  type="text"
                  inputMode="numeric"
                  value={accountNumber}
                  maxLength={20}
                  onChange={
                    handleAccountNumberChange
                  }
                  className="w-full bg-transparent font-semibold text-[#172033] outline-none"
                  placeholder="Enter account number"
                />

              </div>

            </div>

            {/* ==================================================
                CONFIRM ACCOUNT NUMBER
            ================================================== */}

            <div className="mt-4">

              <label
                htmlFor="confirm-account-number"
                className="text-base font-bold text-[#172033]"
              >
                Confirm Account Number
              </label>

              <div
                className={`mt-3 flex min-h-11 items-center gap-4 rounded-2xl border px-5 transition ${
                  confirmAccountNumber.length ===
                  0
                    ? "border-slate-200 bg-slate-50/80"
                    : confirmAccountNumber ===
                        accountNumber
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-purple-400 bg-purple-50"
                }`}
              >

                <CheckCircle2
                  size={27}
                  className={
                    confirmAccountNumber.length ===
                    0
                      ? "shrink-0 text-slate-400"
                      : confirmAccountNumber ===
                          accountNumber
                        ? "shrink-0 text-emerald-500"
                        : "shrink-0 text-purple-400"
                  }
                />

                <input
                  id="confirm-account-number"
                  type="text"
                  inputMode="numeric"
                  value={confirmAccountNumber}
                  maxLength={20}
                  onChange={
                    handleConfirmAccountNumberChange
                  }
                  className="w-full bg-transparent font-semibold text-[#172033] outline-none"
                  placeholder="Re-enter account number"
                />

              </div>

              {confirmAccountNumber.length >
                0 &&
                confirmAccountNumber ===
                  accountNumber && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-500">
                    <Check size={16} />
                    Account numbers match
                  </p>
                )}

              {confirmAccountNumber.length >
                0 &&
                confirmAccountNumber !==
                  accountNumber && (
                  <p className="mt-2 text-sm font-semibold text-purple-500">
                    Account numbers do not match
                  </p>
                )}

            </div>

          </section>

          {/* ==================================================
              BANK ACCOUNT PROOF
          ================================================== */}

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <h2 className="text-sm font-semibold text-[#172033]">
              Bank Account Proof
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Uploaded cancelled cheque or passbook for
              payout clearance
            </p>

            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                <FileText size={30} />
              </div>

              <div className="min-w-0 flex-1">

                <h3 className="font-bold text-[#172033]">
                  Cancelled Cheque / Passbook
                </h3>

                <p className="mt-1 truncate text-sm font-semibold text-emerald-500">
                  {proofFile}
                </p>

              </div>

              <button
                type="button"
                onClick={handleUpload}
                disabled={isSaving}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7c3aed] text-white transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Upload bank proof"
              >
                <Upload size={22} />
              </button>

            </div>

          </section>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4 text-sm font-semibold text-purple-600">
              {error}
            </div>
          )}

          {/* ==================================================
              SAVE BUTTON
          ================================================== */}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`flex min-h-11 w-full items-center justify-center gap-3 rounded-2xl px-5 text-base font-bold text-white shadow-md transition-all ${
              isSaving
                ? "cursor-wait bg-[#6d28d9]"
                : "bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-[0.99]"
            }`}
          >

            {isSaving ? (
              <>
                <LoaderCircle
                  size={24}
                  className="animate-spin"
                />

                <span>
                  Saving Bank Details...
                </span>
              </>
            ) : (
              <>
                <Save size={22} />

                <span>
                  Save & Update Bank Details
                </span>
              </>
            )}

          </button>

        </main>
      </div>
    </div>
  );
}

