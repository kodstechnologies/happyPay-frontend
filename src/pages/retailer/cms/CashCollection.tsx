import { useEffect, useMemo, useState } from "react";
import OtpInput from "../../../components/common/OtpInput";
import StepIndicator from "../../../components/common/StepIndicator";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import {
  ArrowRight,
  Bike,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  FileText,
  History,
  Mail,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Star,
  WalletCards,
  X,
} from "lucide-react";

type Screen =
  | "home"
  | "client-selection"
  | "employee-verification"
  | "employee-details"
  | "otp"
  | "receipt";

interface Client {
  id: string;
  name: string;
  code: string;
  description: string;
  commissionRate: number;
  commissionDisplay: string;
  icon: "bike" | "car" | "shield" | "bank" | "building" | "truck";
}

interface Employee {
  code: string;
  name: string;
  branch: string;
  state: string;
  hub: string;
  email: string;
  mobile: string;
}

/* =========================
   CLIENT DATA
========================= */

const clients: Client[] = [
  {
    id: "chola",
    name: "Cholamandalam Finance",
    code: "CHOLA",
    description: "Vehicle & Asset Finance • VF, HL, LAP",
    commissionRate: 0.04,
    commissionDisplay: "0.04 Comm",
    icon: "car",
  },
  {
    id: "muthoot",
    name: "Muthoot Finance",
    code: "MUTHOOT",
    description: "Gold Loan & Asset Finance • GL, PL, HL",
    commissionRate: 0.04,
    commissionDisplay: "0.04 Comm",
    icon: "shield",
  },
  {
    id: "herofin",
    name: "Hero FinCorp",
    code: "HEROFIN",
    description: "Two Wheeler & SME Finance • VF, PL, SME",
    commissionRate: 0.04,
    commissionDisplay: "0.04 Comm",
    icon: "bike",
  },
  {
    id: "bajaj",
    name: "Bajaj Finserv",
    code: "BAJAJ",
    description: "Consumer & Business Loans • PL, HL, LAP",
    commissionRate: 0.04,
    commissionDisplay: "0.04 Comm",
    icon: "bank",
  },
  {
    id: "lnt",
    name: "L&T Finance Holdings",
    code: "LTF",
    description: "Rural & Housing Finance • HL, VF, SME",
    commissionRate: 0.04,
    commissionDisplay: "0.04 Comm",
    icon: "building",
  },
  {
    id: "mahindra",
    name: "Mahindra & Mahindra Financial Services",
    code: "MMFSL",
    description: "Auto & Tractor Loans • VF, SME, HL",
    commissionRate: 0.04,
    commissionDisplay: "0.04 Comm",
    icon: "bike",
  },
  {
    id: "tvs",
    name: "TVS Credit Services",
    code: "TVSCREDIT",
    description: "Two Wheeler & Used Cars • VF, PL",
    commissionRate: 0.04,
    commissionDisplay: "0.04 Comm",
    icon: "truck",
  },
];

/* =========================
   EMPLOYEE DATA
========================= */

const employees: Employee[] = [
  {
    code: "EMP-8842",
    name: "Rajesh Kumar Sharma",
    branch: "South Extension Branch",
    state: "Delhi NCR",
    hub: "Delhi NCR Hub - Zone 4",
    email: "rajesh.k@cholamandalam.com",
    mobile: "9876543210",
  },
  {
    code: "EMP-8669",
    name: "Rajesh Kumar Sharma",
    branch: "South Extension Branch",
    state: "Delhi NCR",
    hub: "Delhi NCR Hub - Zone 4",
    email: "rajesh.k@cholamandalam.com",
    mobile: "9876543210",
  },
];

interface CashCollectionProps {
  selectedCompanyName?: string;
  selectedCompanyShortName?: string;
  displayCompanyName?: string;
  onBack?: () => void;
}

const CashCollection = ({
  selectedCompanyName,
  selectedCompanyShortName,
  displayCompanyName,
  onBack,
}: CashCollectionProps) => {
  const [screen, setScreen] = useState<Screen>(
    selectedCompanyName ? "employee-verification" : "home"
  );

  const [selectedClient, setSelectedClient] =
    useState<Client | null>(() => {
      if (!selectedCompanyName) {
        return clients[2];
      }

      return (
        clients.find(
          (client) =>
            (selectedCompanyName &&
              client.name.toLowerCase() === selectedCompanyName.toLowerCase()) ||
            (selectedCompanyShortName &&
              client.code.toLowerCase() ===
                selectedCompanyShortName.toLowerCase())
        ) ?? clients[2]
      );
    });

  const selectedDisplayName =
    displayCompanyName || selectedClient?.name || "CMS";

  const [search, setSearch] = useState("");

  const [employeeCode, setEmployeeCode] = useState("");

  const [verifiedEmployee, setVerifiedEmployee] =
    useState<Employee | null>(null);

  const [isVerifyingEmployee, setIsVerifyingEmployee] =
    useState(false);

  const [collectionAmount, setCollectionAmount] =
    useState("");

  const [consent, setConsent] = useState(false);

  const [otp, setOtp] = useState("");

  const [otpTimer, setOtpTimer] = useState(30);

  const [otpSent, setOtpSent] = useState(false);

  const [otpError, setOtpError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [transactionId, setTransactionId] = useState("");

  /* =========================
     FILTER CLIENTS
  ========================= */

  const filteredClients = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return clients;
    }

    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(value) ||
        client.code.toLowerCase().includes(value) ||
        client.description.toLowerCase().includes(value)
    );
  }, [search]);

  /* =========================
     OTP TIMER
  ========================= */

  useEffect(() => {
    if (!otpSent || otpTimer <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setOtpTimer((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [otpSent, otpTimer]);

  /* =========================
     AMOUNT
  ========================= */

  const numericAmount = Number(collectionAmount || 0);

  const commission =
    numericAmount * (selectedClient?.commissionRate || 0);

  /* =========================
     CLIENT SELECTION
  ========================= */

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setSearch("");
    setScreen("home");
  };

  /* =========================
     START COLLECTION
  ========================= */

  const handleStartCollection = () => {
    if (!selectedClient) {
      return;
    }

    setEmployeeCode("");
    setVerifiedEmployee(null);
    setCollectionAmount("");
    setConsent(false);
    setOtp("");
    setOtpSent(false);
    setOtpTimer(30);
    setOtpError("");
    setTransactionId("");

    setScreen("employee-verification");
  };

  /* =========================
     EMPLOYEE CODE
  ========================= */

  const handleEmployeeCodeChange = (value: string) => {
    setEmployeeCode(
      value.toUpperCase().replace(/\s/g, "")
    );
  };

  /* =========================
     VERIFY EMPLOYEE
  ========================= */

  const handleVerifyEmployee = () => {
    if (!employeeCode.trim()) {
      return;
    }

    setIsVerifyingEmployee(true);

    setTimeout(() => {
      const employee = employees.find(
        (item) =>
          item.code.toUpperCase() ===
          employeeCode.toUpperCase()
      );

      setIsVerifyingEmployee(false);

      if (!employee) {
        return;
      }

      setVerifiedEmployee(employee);
      setScreen("employee-details");
    }, 900);
  };

  /* =========================
     AMOUNT
  ========================= */

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setCollectionAmount(cleaned);
  };

  /* =========================
     PROCEED TO OTP
  ========================= */

  const handleProceedToOtp = () => {
    if (!verifiedEmployee) {
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      return;
    }

    if (!consent) {
      return;
    }

    setOtp("");
    setOtpError("");
    setOtpTimer(30);
    setOtpSent(true);

    setScreen("otp");
  };

  /* =========================
     OTP INPUT
  ========================= */

  const handleOtpInput = (value: string) => {
    setOtp(
      value.replace(/\D/g, "").slice(0, 6)
    );

    setOtpError("");
  };

  /* =========================
     VERIFY OTP
  ========================= */

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      setOtpError("Please enter the 6-digit OTP.");
      return;
    }

    setOtpError("");
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      if (otp !== "123456") {
        setOtpError("Invalid OTP.");
        return;
      }

      setTransactionId(
        `CMS-COL-${Math.floor(
          1000000 + Math.random() * 9000000
        )}`
      );

      setScreen("receipt");
    }, 1200);
  };

  /* =========================
     RESEND OTP
  ========================= */

  const handleResendOtp = () => {
    if (otpTimer > 0) {
      return;
    }

    setOtp("");
    setOtpError("");
    setOtpTimer(30);
    setOtpSent(true);
  };

  /* =========================
     BACK
  ========================= */

  const handleBack = () => {
    if (screen === "home") {
      onBack?.();
      return;
    }

    if (screen === "client-selection") {
      setSearch("");
      setScreen("home");
      return;
    }

    if (screen === "employee-verification") {
      setScreen("home");
      return;
    }

    if (screen === "employee-details") {
      setScreen("employee-verification");
      return;
    }

    if (screen === "otp") {
      setScreen("employee-details");
      return;
    }

    if (screen === "receipt") {
      return;
    }
  };

  /* =========================
     NEW COLLECTION
  ========================= */

  const handleNewCollection = () => {
    const defaultClient = selectedCompanyName
      ? clients.find(
          (client) =>
            client.name.toLowerCase() ===
            selectedCompanyName.toLowerCase()
        ) ?? clients[2]
      : clients[2];

    setSelectedClient(defaultClient);
    setEmployeeCode("");
    setVerifiedEmployee(null);
    setCollectionAmount("");
    setConsent(false);
    setOtp("");
    setOtpSent(false);
    setOtpTimer(30);
    setOtpError("");
    setTransactionId("");
    setSearch("");
    setScreen("home");
  };

  /* =========================
     CLIENT ICON
  ========================= */

  const ClientIcon = ({
    type,
  }: {
    type: Client["icon"];
  }) => {
    if (type === "bike") {
      return <Bike className="h-5 w-5" />;
    }

    if (type === "car") {
      return <WalletCards className="h-5 w-5" />;
    }

    if (type === "shield") {
      return <ShieldCheck className="h-5 w-5" />;
    }

    if (type === "bank") {
      return <WalletCards className="h-5 w-5" />;
    }

    if (type === "building") {
      return <FileText className="h-5 w-5" />;
    }

    return <Send className="h-5 w-5" />;
  };


  /* =========================
     CLIENT CARD
  ========================= */

  const ClientCard = ({
    client,
    selected = false,
    onClick,
  }: {
    client: Client;
    selected?: boolean;
    onClick: () => void;
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-2xl border-2 bg-white p-5 text-left transition ${
          selected
            ? "border-[#172033]"
            : "border-slate-200 hover:border-[#172033]"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#edf1fc] text-[#172033]">
            <ClientIcon type={client.icon} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[#172033]">
              {client.name}
            </h3>

            <p className="mt-1 text-sm text-[#555b67]">
              {client.description}
            </p>
          </div>

          <span className="shrink-0 rounded-lg bg-[#e5f8ef] px-3 py-2 text-xs font-bold text-[#16a36d]">
            {client.commissionDisplay}
          </span>

          {selected && (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#172033]" />
          )}
        </div>
      </button>
    );
  };

  /* =========================
     HOME
     
     IMPORTANT:
     No CMS header or CMS tabs here.
     Cms.tsx owns those.
  ========================= */

  const renderHome = () => {
    if (!selectedClient) {
      return null;
    }

    return (
      <div className="">
        <main className="mx-auto max-w-5xl px-2 py-4 sm:px-4">
          {/* Search */}

          <button
            type="button"
            onClick={() => setScreen("client-selection")}
            className="flex h-[64px] w-full items-center gap-4 rounded-2xl border-2 border-[#172033] bg-white px-5 text-left"
          >
            <Search className="h-5 w-5 text-[#65748b]" />

            <span className="flex-1 truncate text-lg text-[#8b95a6]">
              Search Client / Company (e.g. Chola...)
            </span>

            <ChevronDown className="h-5 w-5 text-[#65748b]" />
          </button>

          {/* Selected Client */}

          <div className="mt-5 rounded-2xl border-2 border-[#f0d6d6] bg-[#fff5f5] p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fde5e5] text-[#df3c3c]">
                <ClientIcon type={selectedClient.icon} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-base font-bold text-[#172033]">
                    {selectedDisplayName}
                  </h2>

                  <span className="rounded-lg bg-[#e5f8ef] px-3 py-1 text-xs font-bold text-[#16a36d]">
                    {selectedClient.commissionDisplay}
                  </span>
                </div>

                <p className="mt-1 text-sm text-[#555b67]">
                  {selectedClient.description} • Code:{" "}
                  {selectedClient.code}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setScreen("client-selection")
                }
                className="font-bold text-[#172033]"
              >
                Change
              </button>
            </div>
          </div>

          {/* Commission */}

          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-[#f0d5a8] bg-[#fff8ed] p-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-white">
              <Star className="h-5 w-5 fill-current" />
            </div>

            <p className="text-base font-semibold leading-6 text-[#252b36]">
              For this client, the commission you will
              receive is, 35.0 of the transaction amount.
            </p>
          </div>

          {/* Features */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-5">
            <h2 className="text-xl font-bold text-[#172033]">
              Cash Collection Features
            </h2>

            <div className="mt-6 space-y-5">
              <Feature
                title="Employee Code Verification"
                text="Instant database lookup of field staff and hub location"
              />

              <Feature
                title="Auto-populated Details"
                text="Branch name, State, Hub zone, Email and Mobile verification"
              />

              <Feature
                title="Instant Retailer Commission"
                text="Earn 4% (0.04) direct credit on confirmed collections"
              />

              <Feature
                title="Consent & OTP Security"
                text="Two-factor verified cash handover with WhatsApp and PDF receipts"
              />
            </div>
          </section>

          {/* Start */}

          <button
            type="button"
            onClick={handleStartCollection}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-[#172033] text-base font-bold text-white shadow-md hover:bg-[#0f172a]"
          >
            <WalletCards className="h-5 w-5" />

            Start {selectedClient.code} Cash Collection
          </button>
        </main>
      </div>
    );
  };

  /* =========================
     CLIENT SELECTION
  ========================= */

  const renderClientSelection = () => {
    return (
      <div className="">
        <main className="mx-auto max-w-5xl px-2 py-4 sm:px-4">
          {/* Search */}

          <div className="flex h-[64px] items-center gap-4 rounded-2xl border-2 border-[#172033] bg-white px-5">
            <Search className="h-5 w-5 text-[#65748b]" />

            <input
              autoFocus
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search Client / Company (e.g. Chola...)"
              className="w-full bg-transparent text-lg outline-none placeholder:text-[#8b95a6]"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
              >
                <X className="h-5 w-5 text-[#65748b]" />
              </button>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#172033]">
              Select Client / Company Profile
            </h2>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setScreen("home");
              }}
              className="font-bold text-[#172033]"
            >
              Cancel
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                selected={
                  selectedClient?.id === client.id
                }
                onClick={() =>
                  handleSelectClient(client)
                }
              />
            ))}

            {filteredClients.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                No client/company found.
              </div>
            )}
          </div>
        </main>
      </div>
    );
  };

  /* =========================
     EMPLOYEE VERIFICATION
  ========================= */

  const renderEmployeeVerification = () => {
    if (!selectedClient) {
      return null;
    }

    return (
      <div className="">
        <main className="mx-auto max-w-3xl px-2 py-4 sm:px-4">
          {/* Commission */}

          <div className="flex items-start gap-4 border-b border-[#efd39f] bg-[#fff8ed] p-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-white">
              <Star className="h-5 w-5 fill-current" />
            </div>

            <p className="font-semibold text-[#252b36]">
              For this client, the commission you will receive
              is, 35.0 of the transaction amount.
            </p>
          </div>

          <Progress active={1} />


          {/* Employee Code */}

          <div className="mt-5">
            <Input
              label="Enter Employee Code"
              value={employeeCode}
              onChange={(event) =>
                handleEmployeeCodeChange(
                  event.target.value
                )
              }
              placeholder="EMP-8842"
              icon={<WalletCards className="h-5 w-5" />}
            />
          </div>

          {/* Button */}

          <Button
            type="button"
            onClick={handleVerifyEmployee}
            disabled={
              !employeeCode.trim() ||
              isVerifyingEmployee
            }
            loading={isVerifyingEmployee}
            fullWidth
            size="lg"
            className="mt-5 min-h-[52px] rounded-2xl text-lg"
          >
            Proceed & Next
            {!isVerifyingEmployee && (
              <ArrowRight className="h-5 w-5" />
            )}
          </Button>
        </main>
      </div>
    );
  };

  /* =========================
     EMPLOYEE DETAILS
  ========================= */

  const renderEmployeeDetails = () => {
    if (!verifiedEmployee || !selectedClient) {
      return null;
    }

    return (
      <div className="">
        <main className="mx-auto max-w-3xl px-2 py-4 sm:px-4">
          {/* Commission */}

          <div className="flex items-start gap-4 border-b border-[#efd39f] bg-[#fff8ed] p-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-white">
              <Star className="h-5 w-5 fill-current" />
            </div>

            <p className="font-semibold text-[#252b36]">
              For this client, the commission you will receive
              is, 35.0 of the transaction amount.
            </p>
          </div>

          <Progress active={2} />

          {/* Employee Details */}

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-3 text-xl font-bold text-[#20a970]">
                <ShieldCheck className="h-5 w-5" />
                Verified Employee Details
              </h2>

              <span className="w-fit rounded-lg bg-[#edf1fc] px-3 py-2 font-bold text-[#172033]">
                {verifiedEmployee.code}
              </span>
            </div>

            <div className="mt-5 space-y-5">
              <DetailRow
                label="Employee Name"
                value={verifiedEmployee.name}
              />

              <DetailRow
                label="Branch Name"
                value={verifiedEmployee.branch}
              />

              <DetailRow
                label="State"
                value={verifiedEmployee.state}
              />

              <DetailRow
                label="Hub Location"
                value={verifiedEmployee.hub}
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <span className="text-lg text-[#555b67]">
                  Email ID & Mobile
                </span>

                <div className="text-left font-semibold text-[#172033] sm:text-right">
                  <p>{verifiedEmployee.email}</p>

                  <p className="mt-1">
                    +91 {verifiedEmployee.mobile}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Amount */}

          <div className="mt-5">
            <Input
              label="Collection Amount"
              value={collectionAmount}
              onChange={(event) =>
                handleAmountChange(
                  event.target.value
                )
              }
              placeholder="25000"
              inputMode="numeric"
              icon={
                <span className="text-xl font-bold">
                  ₹
                </span>
              }
            />

            {numericAmount > 0 && (
              <div className="mt-3 flex flex-col gap-1 rounded-xl bg-[#e7f8f1] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold text-[#20a970]">
                  Your Commission (0.04 Rate):
                </span>

                <span className="font-bold text-[#20a970]">
                  +₹{commission.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Consent */}

          <label className="mt-5 flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) =>
                setConsent(event.target.checked)
              }
              className="mt-1 h-5 w-5 shrink-0 accent-[#172033]"
            />

            <span className="text-base leading-6 text-[#172033] sm:text-lg">
              I confirm that I have collected the exact
              physical cash amount from the authorized employee
              and agree to the terms & conditions of this
              transaction.
            </span>
          </label>

          {/* Actions */}

          <div className="mt-5 grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
            <button
              type="button"
              onClick={handleBack}
              className="min-h-[52px] rounded-2xl border-2 border-[#b9c7e8] bg-transparent text-base font-bold text-[#172033]"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleProceedToOtp}
              disabled={
                numericAmount <= 0 || !consent
              }
              className="flex min-h-[52px] items-center justify-center gap-3 rounded-2xl bg-[#172033] text-base font-bold text-white disabled:bg-[#aab9e7]"
            >
              Proceed to OTP
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </main>
      </div>
    );
  };

  /* =========================
     OTP
  ========================= */

  const renderOtp = () => {
    if (!verifiedEmployee || !selectedClient) {
      return null;
    }

    return (
      <div className="">


        <main className="mx-auto max-w-3xl px-2 py-4 sm:px-4">
          {/* Commission */}

          <div className="flex items-start gap-4 border-b border-[#efd39f] bg-[#fff8ed] p-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-white">
              <Star className="h-5 w-5 fill-current" />
            </div>

            <p className="font-semibold text-[#252b36]">
              For this client, the commission you will receive
              is, 35.0 of the transaction amount.
            </p>
          </div>

          <Progress active={3} />

          {/* Summary */}

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#172033]">
                  {selectedDisplayName}
                </h2>

                <p className="mt-1 text-[#555b67]">
                  {verifiedEmployee.name} (
                  {verifiedEmployee.code})
                </p>
              </div>

              <p className="text-xl font-bold text-[#20a970]">
                ₹{numericAmount.toFixed(2)}
              </p>
            </div>
          </section>

          {/* OTP Message */}

          <div className="mt-5 flex items-start gap-4 rounded-2xl border border-[#c7d4f5] bg-[#e9efff] p-5">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#172033]" />

            <p className="font-semibold leading-6 text-[#172033]">
              OTP sent to authorized mobile number +91{" "}
              {verifiedEmployee.mobile}
            </p>
          </div>

          {/* OTP */}

          <div className="mt-5">
            <label className="mb-3 block text-base font-bold text-[#172033]">
              Enter OTP to Finalize Request
            </label>

            <OtpInput
              value={otp}
              onChange={(value) => {
                handleOtpInput(value);
              }}
              length={6}
              disabled={isSubmitting}
              error={otpError}
            />
          </div>

          {/* Resend */}

          <div className="mt-5 flex items-center justify-between">
            <span className="text-base text-[#555b67]">
              {otpTimer > 0
                ? `Resend in ${otpTimer}s`
                : "You can resend OTP"}
            </span>

            <button
              type="button"
              disabled={otpTimer > 0}
              onClick={handleResendOtp}
              className="font-bold text-[#172033] disabled:text-slate-400"
            >
              Resend OTP
            </button>
          </div>

          {/* Actions */}

          <div className="mt-6 grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
            <Button
              type="button"
              onClick={handleBack}
              variant="outline"
              size="lg"
              className="min-h-[52px] rounded-2xl border-2 text-lg"
            >
              Back
            </Button>

            <Button
              type="button"
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || isSubmitting}
              loading={isSubmitting}
              variant="primary"
              size="lg"
              className="min-h-[52px] rounded-2xl text-lg"
            >
              Confirm & Submit Payment
            </Button>
          </div>

          {/* Demo OTP */}

          <div className="mt-5 rounded-xl bg-[#fff8e6] px-4 py-3 text-center text-sm text-[#8a6500]">
            Demo OTP: <strong>123456</strong>
          </div>
        </main>
      </div>
    );
  };

  /* =========================
     RECEIPT
  ========================= */

  const renderReceipt = () => {
    if (!verifiedEmployee || !selectedClient) {
      return null;
    }

    return (
      <div className="">
        <div className="border-b border-slate-200 bg-white/95">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-3 py-4 sm:px-5">
            <h1 className="text-xl font-bold text-slate-900 sm:text-3xl">
              Payment Receipt
            </h1>

            <button
              type="button"
              onClick={handleNewCollection}
              className="flex h-10 w-10 items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <main className="mx-auto max-w-3xl px-2 py-4 sm:px-4">
          {/* Success */}

          <div className="flex items-start gap-4 rounded-2xl border border-[#b3e5d2] bg-[#e5f8f0] p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#19b978] text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#16a96e]">
                Payment Successful
              </h2>

              <p className="mt-1 text-base font-semibold text-[#34543f]">
                Cash Collection of ₹
                {numericAmount.toFixed(2)} for{" "}
                {selectedDisplayName} confirmed
                successfully.
              </p>
            </div>
          </div>

          {/* Receipt Card */}

          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf1fc] text-[#172033]">
                  <WalletCards className="h-5 w-5" />
                </div>

                <h2 className="text-xl font-bold text-[#172033]">
                  {selectedDisplayName}
                </h2>
              </div>

              <p className="mt-6 text-4xl font-bold text-[#172033]">
                ₹{numericAmount.toFixed(2)}
              </p>

              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#e4f8ef] px-5 py-2 font-bold text-[#16a36d]">
                <CheckCircle2 className="h-5 w-5" />
                Transaction Successful
              </span>
            </div>

            <div className="border-t border-dashed border-slate-200" />

            <div className="space-y-5 p-5">
              <ReceiptRow
                label="Transaction ID"
                value={transactionId}
                copy
              />

              <ReceiptRow
                label="Service Mode"
                value="Cash Collection"
              />

              <ReceiptRow
                label="Employee Code"
                value={verifiedEmployee.code}
              />

              <ReceiptRow
                label="Employee Name"
                value={verifiedEmployee.name}
              />

              <ReceiptRow
                label="Branch"
                value={verifiedEmployee.branch}
              />

              <ReceiptRow
                label="Hub Location"
                value={verifiedEmployee.hub}
              />

              <ReceiptRow
                label="Depositor Mobile"
                value={`+91 ${verifiedEmployee.mobile}`}
              />

              <ReceiptRow
                label="Date & Time"
                value={new Date().toLocaleString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }
                )}
              />

              <div className="border-t border-slate-200 pt-5">
                <ReceiptRow
                  label="Retailer Commission"
                  value={`+ ₹${commission.toFixed(2)}`}
                  green
                />
              </div>
            </div>
          </section>

          {/* New Collection */}

          <button
            type="button"
            onClick={handleNewCollection}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-[#172033] text-base font-bold text-white"
          >
            <RotateCcw className="h-5 w-5" />
            New Cash Collection
          </button>

          {/* Receipt Actions */}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              className="flex min-h-[60px] items-center justify-center gap-3 rounded-2xl border-2 border-[#b9c7e8] bg-transparent text-base font-bold text-[#172033]"
            >
              <Mail className="h-5 w-5" />
              Send Email Receipt
            </button>

            <button
              type="button"
              className="flex min-h-[60px] items-center justify-center gap-3 rounded-2xl border-2 border-[#b9c7e8] bg-transparent text-base font-bold text-[#172033]"
            >
              <Send className="h-5 w-5 text-[#20b77a]" />
              Share WhatsApp
            </button>
          </div>

          {/* Bottom Actions */}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center justify-center gap-3 font-bold text-[#172033]"
            >
              <Download className="h-5 w-5" />
              Printable PDF
            </button>

            <button
              type="button"
              className="flex items-center justify-center gap-3 font-bold text-[#172033]"
            >
              <History className="h-5 w-5" />
              View History
            </button>
          </div>
        </main>
      </div>
    );
  };

  /* =========================
     SCREEN ROUTING
  ========================= */

  if (screen === "client-selection") {
    return renderClientSelection();
  }

  if (screen === "employee-verification") {
    return renderEmployeeVerification();
  }

  if (screen === "employee-details") {
    return renderEmployeeDetails();
  }

  if (screen === "otp") {
    return renderOtp();
  }

  if (screen === "receipt") {
    return renderReceipt();
  }

  return renderHome();
};

/* =========================
   FEATURE
========================= */

const Feature = ({
  title,
  text,
}: {
  title: string;
  text: string;
}) => {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#20b77a]" />

      <p className="text-base leading-6 text-[#555b67]">
        <strong className="text-[#172033]">
          {title}:
        </strong>{" "}
        {text}
      </p>
    </div>
  );
};

/* =========================
   PROGRESS
========================= */

const Progress = ({
  active,
}: {
  active: 1 | 2 | 3;
}) => {
  const steps = [
    { label: "Employee" },
    { label: "Details" },
    { label: "OTP Verification" },
  ];

  return (
    <StepIndicator
      steps={steps}
      currentStep={active}
    />
  );
};

/* =========================
   DETAIL ROW
========================= */

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-lg text-[#555b67]">
        {label}
      </span>

      <span className="text-right text-base font-bold text-[#172033]">
        {value}
      </span>
    </div>
  );
};

/* =========================
   RECEIPT ROW
========================= */

const ReceiptRow = ({
  label,
  value,
  green = false,
  copy = false,
}: {
  label: string;
  value: string;
  green?: boolean;
  copy?: boolean;
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard may be unavailable.
    }
  };

  return (
    <div className="flex items-start justify-between gap-5">
      <span className="text-base text-[#555b67] sm:text-lg">
        {label}
      </span>

      <div className="flex items-center gap-2 text-right">
        <span
          className={`text-base font-bold sm:text-lg ${
            green
              ? "text-[#16a36d]"
              : "text-[#172033]"
          }`}
        >
          {value}
        </span>

        {copy && (
          <button
            type="button"
            onClick={handleCopy}
            className="text-[#172033]"
          >
            <Copy className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CashCollection;