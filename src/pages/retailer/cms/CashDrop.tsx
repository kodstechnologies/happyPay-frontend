import { useMemo, useState } from "react";
import OtpInput from "../../../components/common/OtpInput";
import StepIndicator from "../../../components/common/StepIndicator";
import Input from "../../../components/common/Input";
import Select from "../../../components/common/Select";
import Button from "../../../components/common/Button";
import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  History,
  Info,
  Landmark,
  Mail,
  Phone,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  User,
  WalletCards,
} from "lucide-react";

type Screen =
  | "home"
  | "drop-details"
  | "denominations"
  | "otp"
  | "receipt";

type Company = {
  id: string;
  name: string;
  shortName: string;
  commission: string;
  commissionRate: string;
  icon: string;
};

const companies: Company[] = [
  {
    id: "hero",
    name: "Hero FinCorp",
    shortName: "HEROFIN",
    commission: "₹5",
    commissionRate: "₹5 per transaction",
    icon: "H",
  },
  {
    id: "chola",
    name: "Cholamandalam",
    shortName: "CHOLA",
    commission: "₹5",
    commissionRate: "₹5 per transaction",
    icon: "C",
  },
  {
    id: "muthoot",
    name: "Muthoot Finance",
    shortName: "MUTHOOT",
    commission: "₹5",
    commissionRate: "₹5 per transaction",
    icon: "M",
  },
  {
    id: "bajaj",
    name: "Bajaj Finance",
    shortName: "BAJAJ",
    commission: "₹5",
    commissionRate: "₹5 per transaction",
    icon: "B",
  },
  {
    id: "lt",
    name: "L&T Finance",
    shortName: "LTF",
    commission: "₹5",
    commissionRate: "₹5 per transaction",
    icon: "L",
  },
  {
    id: "mahindra",
    name: "Mahindra Finance",
    shortName: "MAHINDRA",
    commission: "₹5",
    commissionRate: "₹5 per transaction",
    icon: "M",
  },
  {
    id: "tvs",
    name: "TVS Credit",
    shortName: "TVS",
    commission: "₹5",
    commissionRate: "₹5 per transaction",
    icon: "T",
  },
];

const generateTransactionId = () =>
  `CMS${Date.now().toString().slice(-10)}`;

const formatAmount = (value: number) =>
  value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

interface CashDropProps {
  selectedCompanyName?: string;
  selectedCompanyShortName?: string;
  displayCompanyName?: string;
  onBack?: () => void;
}

export default function CashDrop({
  selectedCompanyName,
  selectedCompanyShortName,
  displayCompanyName,
  onBack,
}: CashDropProps) {
  const initialCompany =
    selectedCompanyName || selectedCompanyShortName
      ? companies.find((company) =>
          (selectedCompanyName &&
            company.name.toLowerCase() === selectedCompanyName.toLowerCase()) ||
          (selectedCompanyShortName &&
            company.shortName.toLowerCase() ===
              selectedCompanyShortName.toLowerCase())
        ) ?? companies[0]
      : companies[0];

  const selectedDisplayName = displayCompanyName || initialCompany.name;

  const [screen, setScreen] = useState<Screen>(
    selectedCompanyName ? "drop-details" : "home"
  );

  const [selectedCompany, setSelectedCompany] =
    useState<Company>(initialCompany);

  const [search, setSearch] = useState("");

  const [depositorType, setDepositorType] = useState("Employee");
  const [productLine, setProductLine] = useState("Loan Repayment");
  const [userId, setUserId] = useState("");
  const [mobile, setMobile] = useState("");

  const [denominations, setDenominations] = useState({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    coins: 0,
  });

  const [otp, setOtp] = useState("");
  const [copied, setCopied] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = useMemo(() => {
    return (
      denominations[500] * 500 +
      denominations[200] * 200 +
      denominations[100] * 100 +
      denominations[50] * 50 +
      denominations.coins
    );
  }, [denominations]);

  const commission = totalAmount > 0 ? 5 : 0;
  const netDeposit = Math.max(totalAmount - commission, 0);

  const updateDenomination = (
    key: keyof typeof denominations,
    value: number
  ) => {
    setDenominations((prev) => ({
      ...prev,
      [key]: Math.max(0, value),
    }));
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setSearch("");
  };

  const proceedToDenominations = () => {
    if (!userId.trim()) return;
    if (mobile.length !== 10) return;

    setScreen("denominations");
  };

  const proceedToOtp = () => {
    if (totalAmount <= 0) return;
    if (mobile.length !== 10) return;

    setScreen("otp");
  };

  const confirmDrop = () => {
    if (otp !== "123456") return;

    setTransactionId(generateTransactionId());
    setScreen("receipt");
  };

  const resetFlow = () => {
    setScreen(selectedCompanyName ? "drop-details" : "home");
    setSearch("");
    setSelectedCompany(
      selectedCompanyName || selectedCompanyShortName
        ? companies.find((company) =>
            (selectedCompanyName &&
              company.name.toLowerCase() === selectedCompanyName.toLowerCase()) ||
            (selectedCompanyShortName &&
              company.shortName.toLowerCase() ===
                selectedCompanyShortName.toLowerCase())
          ) ?? companies[0]
        : companies[0]
    );
    setDepositorType("Employee");
    setProductLine("Loan Repayment");
    setUserId("");
    setMobile("");
    setDenominations({
      500: 0,
      200: 0,
      100: 0,
      50: 0,
      coins: 0,
    });
    setOtp("");
    setTransactionId("");
    setCopied(false);
  };

  const copyTransactionId = async () => {
    if (!transactionId) return;

    try {
      await navigator.clipboard.writeText(transactionId);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="p-1">
      <div className="mx-auto max-w-5xl">

        {/* ================= HOME ================= */}
        {screen === "home" && (
          <>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (onBack) {
                      onBack();
                    } else {
                      window.history.back();
                    }
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
                >
                  <ArrowLeft size={19} />
                </button>

                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    Cash Drop
                  </h1>

                  <p className="text-sm text-slate-500">
                    Deposit collected cash securely
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <History size={17} />
                History
              </button>
            </div>

            {/* Available Balance */}
            <div className="mb-6 rounded-2xl bg-[#172033] p-4 text-white shadow-sm">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-300">
                    Available Balance
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    ₹25,000
                  </h2>

                  <p className="mt-1 text-xs text-slate-300">
                    Retailer wallet balance
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <Banknote size={20} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-300">
                      Cash Drop
                    </p>

                    <p className="text-sm font-semibold">
                      Secure Deposit
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Selection */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2f7] text-[#172033]">
                    <WalletCards size={22} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Select Company
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Select the company for which you want to deposit
                      collected cash.
                    </p>
                  </div>
                </div>

                <div className="relative mt-5">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search company..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-[#172033] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCompanies.map((company) => {
                  const selected =
                    selectedCompany.id === company.id;

                  return (
                    <button
                      type="button"
                      key={company.id}
                      onClick={() => handleCompanySelect(company)}
                      className={`rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-[#172033] bg-[#eef2f7] shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#172033] text-sm font-bold text-white">
                            {company.icon}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {company.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {company.shortName}
                            </p>
                          </div>
                        </div>

                        {selected && (
                          <CheckCircle2
                            size={19}
                            className="text-[#172033]"
                          />
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Commission {company.commission}
                        </span>

                        <span className="text-xs text-slate-500">
                          Per drop
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Company */}
              <div className="border-t border-slate-100 p-5">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#172033] font-bold text-white">
                        {selectedCompany.icon}
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Selected Company
                        </p>

                        <h3 className="font-semibold text-slate-900">
                          {selectedDisplayName}
                        </h3>

                        <p className="text-xs text-slate-500">
                          {selectedCompany.shortName}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                      <p className="text-xs text-emerald-600">
                        Retailer Commission
                      </p>

                      <p className="mt-0.5 font-bold text-emerald-700">
                        {selectedCompany.commission}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-6">
                  <h3 className="font-semibold text-slate-900">
                    Cash Drop Features
                  </h3>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {[
                      {
                        icon: ShieldCheck,
                        title: "Secure Cash Verification",
                        description:
                          "Verify depositor details before submitting the cash drop.",
                      },
                      {
                        icon: Banknote,
                        title: "Denomination Tracking",
                        description:
                          "Record each cash denomination and calculate the total automatically.",
                      },
                      {
                        icon: Smartphone,
                        title: "OTP Security",
                        description:
                          "Confirm the cash drop using OTP verification.",
                      },
                      {
                        icon: CheckCircle2,
                        title: "Instant Confirmation",
                        description:
                          "Receive a transaction receipt after successful submission.",
                      },
                    ].map((feature) => {
                      const Icon = feature.icon;

                      return (
                        <div
                          key={feature.title}
                          className="flex gap-3 rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef2f7] text-[#172033]">
                            <Icon size={19} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {feature.title}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-[#eef2f7] p-4">
                  <Info
                    size={18}
                    className="mt-0.5 shrink-0 text-[#172033]"
                  />

                  <p className="text-sm leading-6 text-[#172033]">
                    Make sure the cash amount and denomination details
                    are correct before submitting the Cash Drop.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => setScreen("drop-details")}
                  fullWidth
                  className="mt-6 h-12 rounded-xl text-sm"
                >
                  Start {selectedCompany.shortName} Cash Drop
                  <Send size={17} />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ================= DROP DETAILS ================= */}
        {screen === "drop-details" && (
          <>

            <Progress
              active={1}
              labels={[
                "Drop Details",
                "Cash Details",
                "OTP",
                "Receipt",
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <div className="border-b border-slate-100 p-5">
                    <h2 className="font-semibold text-slate-900">
                      Depositor Details
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Enter the details of the person depositing the
                      collected cash.
                    </p>
                  </div>

                  <div className="space-y-5 p-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Select Company
                      </label>

                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#172033] text-sm font-bold text-white">
                          {selectedCompany.icon}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {selectedDisplayName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {selectedCompany.shortName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <SelectField
                        label="Depositor Type"
                        value={depositorType}
                        options={[
                          "Employee",
                          "Agent",
                          "Customer",
                          "Other",
                        ]}
                        onChange={setDepositorType}
                      />

                      <SelectField
                        label="Product Line"
                        value={productLine}
                        options={[
                          "Loan Repayment",
                          "Insurance Premium",
                          "EMI Collection",
                          "Other",
                        ]}
                        onChange={setProductLine}
                      />
                    </div>

                    <InputField
                      label="User / Agent ID"
                      value={userId}
                      onChange={setUserId}
                      placeholder="Enter user or agent ID"
                      icon={<User size={17} />}
                    />

                    <InputField
                      label="Depositor Mobile Number"
                      value={mobile}
                      onChange={(value) =>
                        setMobile(
                          value.replace(/\D/g, "").slice(0, 10)
                        )
                      }
                      placeholder="Enter 10 digit mobile number"
                      icon={<Phone size={17} />}
                      type="tel"
                    />

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                      <div className="flex gap-3">
                        <ShieldCheck
                          size={19}
                          className="mt-0.5 shrink-0 text-emerald-600"
                        />

                        <div>
                          <p className="text-sm font-semibold text-emerald-800">
                            Secure Cash Drop
                          </p>

                          <p className="mt-1 text-xs leading-5 text-emerald-700">
                            The depositor mobile number will be used for
                            OTP verification before the cash drop is
                            completed.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                      <button
                        type="button"
                        onClick={() => setScreen("home")}
                        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Back
                      </button>

                      <Button
                        type="button"
                        onClick={proceedToDenominations}
                        disabled={
                          !userId.trim() || mobile.length !== 10
                        }
                        className="rounded-xl px-6 py-3 text-sm"
                      >
                        Proceed to Cash Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <SummaryCard company={selectedCompany} />
            </div>
          </>
        )}

        {/* ================= DENOMINATIONS ================= */}
        {screen === "denominations" && (
          <>

            <Progress
              active={2}
              labels={[
                "Drop Details",
                "Cash Details",
                "OTP",
                "Receipt",
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <div className="border-b border-slate-100 p-5">
                    <h2 className="font-semibold text-slate-900">
                      Cash Denominations
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Enter the number of notes for each denomination.
                    </p>
                  </div>

                  <div className="p-5">
                    <div className="space-y-3">
                      {[
                        {
                          key: 500 as const,
                          label: "₹500",
                          value: denominations[500],
                        },
                        {
                          key: 200 as const,
                          label: "₹200",
                          value: denominations[200],
                        },
                        {
                          key: 100 as const,
                          label: "₹100",
                          value: denominations[100],
                        },
                        {
                          key: 50 as const,
                          label: "₹50",
                          value: denominations[50],
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#172033] text-sm font-bold text-white">
                              ₹
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.label}
                              </p>

                              <p className="text-xs text-slate-500">
                                Note denomination
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                updateDenomination(
                                  item.key,
                                  item.value - 1
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-600 hover:bg-slate-50"
                            >
                              −
                            </button>

                            <input
                              type="number"
                              min="0"
                              value={item.value}
                              onChange={(e) =>
                                updateDenomination(
                                  item.key,
                                  Number(e.target.value) || 0
                                )
                              }
                              className="h-9 w-20 rounded-lg border border-slate-200 text-center text-sm font-semibold outline-none focus:border-[#172033]"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                updateDenomination(
                                  item.key,
                                  item.value + 1
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-600 hover:bg-slate-50"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Coins / Other */}
                      <div className="rounded-xl border border-slate-200 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                              <Banknote size={19} />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                Coins / Other
                              </p>

                              <p className="text-xs text-slate-500">
                                Enter total coin or odd amount
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-500">
                              ₹
                            </span>

                            <input
                              type="number"
                              min="0"
                              value={denominations.coins}
                              onChange={(e) =>
                                updateDenomination(
                                  "coins",
                                  Number(e.target.value) || 0
                                )
                              }
                              className="h-10 w-32 rounded-lg border border-slate-200 px-3 text-right text-sm font-semibold outline-none focus:border-[#172033]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* UPDATED TOTAL CASH AMOUNT */}
                    <div className="mt-5 rounded-2xl bg-[#172033] p-5 text-white">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-slate-300">
                            Total Cash Amount
                          </p>

                          <p className="mt-1 text-2xl font-bold">
                            ₹{formatAmount(totalAmount)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/10 px-4 py-3">
                          <p className="text-xs text-slate-300">
                            Retailer Commission
                          </p>

                          <p className="mt-1 font-semibold text-emerald-300">
                            + ₹{commission}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
                      <Info
                        size={18}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />

                      <p className="text-xs leading-5 text-amber-800">
                        Please verify the denomination count and total
                        amount before proceeding. This information will
                        be recorded against the cash drop transaction.
                      </p>
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                      <button
                        type="button"
                        onClick={() => setScreen("drop-details")}
                        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Back
                      </button>

                      <Button
                        type="button"
                        onClick={proceedToOtp}
                        disabled={
                          totalAmount <= 0 || mobile.length !== 10
                        }
                        className="rounded-xl px-6 py-3 text-sm"
                      >
                        Proceed to OTP
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <CashSummary
                company={selectedCompany}
                amount={totalAmount}
                commission={commission}
                netDeposit={netDeposit}
              />
            </div>
          </>
        )}

        {/* ================= OTP ================= */}
        {screen === "otp" && (
          <>

            <Progress
              active={3}
              labels={[
                "Drop Details",
                "Cash Details",
                "OTP",
                "Receipt",
              ]}
            />

            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2f7] text-[#172033]">
                  <ShieldCheck size={30} />
                </div>

                <div className="mt-5 text-center">
                  <h2 className="text-xl font-bold text-slate-900">
                    OTP Verification
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    A 6-digit verification code has been sent to
                    <span className="font-semibold text-slate-700">
                      {" "}
                      {mobile}
                    </span>
                    .
                  </p>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">
                        Cash Drop Amount
                      </p>

                      <p className="mt-1 text-xl font-bold text-slate-900">
                        ₹{formatAmount(totalAmount)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        Company
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {selectedCompany.shortName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Enter 6-digit OTP
                  </label>

                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    length={6}
                  />

                  <p className="mt-3 text-center text-xs text-slate-500">
                    Demo OTP:{" "}
                    <span className="font-bold text-slate-700">
                      123456
                    </span>
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Clock3 size={16} />
                  Resend OTP in 00:30
                </div>

                <button
                  type="button"
                  className="mx-auto mt-3 block text-sm font-semibold text-[#172033] hover:text-[#172033]"
                >
                  Resend OTP
                </button>

                <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <ShieldCheck
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <p className="text-xs leading-5 text-emerald-800">
                    Your cash drop is protected with OTP verification.
                    Do not share the OTP with anyone.
                  </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setScreen("denominations")}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={confirmDrop}
                    disabled={otp.length !== 6}
                    className="rounded-xl bg-[#172033] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Confirm & Submit Cash Drop
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ================= RECEIPT ================= */}
        {screen === "receipt" && (
          <>

            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <div className="border-b border-slate-100 p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={35} />
                  </div>

                  <h2 className="mt-4 text-xl font-bold text-slate-900">
                    Cash Drop Successful
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    The cash drop has been successfully submitted.
                  </p>

                  <div className="mx-auto mt-5 max-w-sm rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Total Cash Dropped
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      ₹{formatAmount(totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-slate-500">
                        Transaction ID
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {transactionId}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={copyTransactionId}
                      className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {copied ? (
                        <>
                          <Check size={15} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={15} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-6">
                    <h3 className="font-semibold text-slate-900">
                      Transaction Details
                    </h3>

                    <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
                      <ReceiptRow
                        label="Company"
                        value={selectedDisplayName}
                      />

                      <ReceiptRow
                        label="Service Mode"
                        value="Cash Drop"
                      />

                      <ReceiptRow
                        label="Depositor Type"
                        value={depositorType}
                      />

                      <ReceiptRow
                        label="Product Line"
                        value={productLine}
                      />

                      <ReceiptRow
                        label="User / Agent ID"
                        value={userId}
                      />

                      <ReceiptRow
                        label="Depositor Mobile"
                        value={mobile}
                      />

                      <ReceiptRow
                        label="Cash Amount"
                        value={`₹${formatAmount(totalAmount)}`}
                      />

                      <ReceiptRow
                        label="Retailer Commission"
                        value={`+ ₹${commission}`}
                        valueClass="text-emerald-600"
                      />

                      <ReceiptRow
                        label="Net Deposit"
                        value={`₹${formatAmount(netDeposit)}`}
                      />

                      <ReceiptRow
                        label="Date & Time"
                        value={new Date().toLocaleString("en-IN")}
                      />

                      <ReceiptRow
                        label="Status"
                        value="Successful"
                        valueClass="text-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Denomination Summary */}
                  <div className="mt-6">
                    <h3 className="font-semibold text-slate-900">
                      Denomination Summary
                    </h3>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          label: "₹500 Notes",
                          value: denominations[500],
                          amount: denominations[500] * 500,
                        },
                        {
                          label: "₹200 Notes",
                          value: denominations[200],
                          amount: denominations[200] * 200,
                        },
                        {
                          label: "₹100 Notes",
                          value: denominations[100],
                          amount: denominations[100] * 100,
                        },
                        {
                          label: "₹50 Notes",
                          value: denominations[50],
                          amount: denominations[50] * 50,
                        },
                        {
                          label: "Coins / Other",
                          value: "-",
                          amount: denominations.coins,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {item.label}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              Count: {item.value}
                            </p>
                          </div>

                          <p className="font-semibold text-slate-900">
                            ₹{formatAmount(item.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={resetFlow}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#172033] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0f172a]"
                    >
                      <RotateCcw size={17} />
                      New Cash Drop
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Download size={17} />
                      Printable Receipt
                    </button>

                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Mail size={17} />
                      Email Receipt
                    </button>

                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Smartphone size={17} />
                      Send via WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}



function Progress({
  active,
  labels,
}: {
  active: number;
  labels: string[];
}) {
  return (
    <StepIndicator
      steps={labels.map((label) => ({ label }))}
      currentStep={active}
    />
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: React.ReactNode;
  type?: string;
}) {
  return (
    <Input
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      icon={icon}
      type={type}
    />
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      label={label}
      value={value}
      options={options.map((option) => ({
        label: option,
        value: option,
      }))}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function SummaryCard({
  company,
}: {
  company: Company;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#172033] font-bold text-white">
            {company.icon}
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Selected Company
            </p>

            <p className="font-semibold text-slate-900">
              {company.name}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-emerald-50 p-4">
          <p className="text-xs text-emerald-600">
            Retailer Commission
          </p>

          <p className="mt-1 text-xl font-bold text-emerald-700">
            {company.commission}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Landmark size={18} className="text-[#172033]" />

          <h3 className="font-semibold text-slate-900">
            Cash Drop Information
          </h3>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <InfoRow
            icon={<ShieldCheck size={16} />}
            text="OTP protected"
          />

          <InfoRow
            icon={<Banknote size={16} />}
            text="Denomination based"
          />

          <InfoRow
            icon={<CheckCircle2 size={16} />}
            text="Instant receipt"
          />
        </div>
      </div>
    </div>
  );
}

function CashSummary({
  company,
  amount,
  commission,
  netDeposit,
}: {
  company: Company;
  amount: number;
  commission: number;
  netDeposit: number;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#172033] font-bold text-white">
            {company.icon}
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Company
            </p>

            <p className="font-semibold text-slate-900">
              {company.name}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <AmountRow
            label="Cash Amount"
            value={`₹${formatAmount(amount)}`}
          />

          <AmountRow
            label="Commission"
            value={`+ ₹${commission}`}
            valueClass="text-emerald-600"
          />

          <div className="border-t border-slate-100 pt-3">
            <AmountRow
              label="Net Deposit"
              value={`₹${formatAmount(netDeposit)}`}
              bold
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-[#eef2f7] p-5">
        <div className="flex gap-3">
          <Info
            size={18}
            className="mt-0.5 shrink-0 text-[#172033]"
          />

          <div>
            <p className="text-sm font-semibold text-[#172033]">
              Verify Before Submission
            </p>

            <p className="mt-1 text-xs leading-5 text-[#172033]">
              Check the cash amount and depositor information before
              requesting OTP verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-slate-600">
      <span className="text-[#172033]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function AmountRow({
  label,
  value,
  valueClass = "text-slate-900",
  bold = false,
}: {
  label: string;
  value: string;
  valueClass?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={`text-sm ${
          bold
            ? "font-semibold text-[#172033]"
            : "text-slate-500"
        }`}
      >
        {label}
      </span>

      <span
        className={`text-sm ${
          bold ? "font-bold" : "font-semibold"
        } ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`text-sm font-semibold sm:text-right ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}
