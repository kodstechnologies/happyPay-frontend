import { useState } from "react";
import {
  ArrowLeft,
  Banknote,
  ChevronDown,
  Landmark,
  WalletCards,
  ShieldCheck,
  Bike,
  FileText,
  Send,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import CashCollection from "./CashCollection";
import CashDrop from "./CashDrop";

export type CmsCompany = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  commission: string;
  commissionRate: number;
  iconType: "bike" | "car" | "shield" | "bank" | "building" | "truck";
};

const cmsCompanies: CmsCompany[] = [
  {
    id: "chola",
    name: "Cholamandalam Finance",
    shortName: "CHOLA",
    description: "Vehicle & Asset Finance • VF, HL, LAP",
    commission: "₹5",
    commissionRate: 0.04,
    iconType: "car",
  },
  {
    id: "muthoot",
    name: "Muthoot Finance",
    shortName: "MUTHOOT",
    description: "Gold Loan & Asset Finance • GL, PL, HL",
    commission: "₹5",
    commissionRate: 0.04,
    iconType: "shield",
  },
  {
    id: "herofin",
    name: "Hero FinCorp",
    shortName: "HEROFIN",
    description: "Two Wheeler & SME Finance • VF, PL, SME",
    commission: "₹5",
    commissionRate: 0.04,
    iconType: "bike",
  },
  {
    id: "bajaj",
    name: "Bajaj Finserv",
    shortName: "BAJAJ",
    description: "Consumer & Business Loans • PL, HL, LAP",
    commission: "₹5",
    commissionRate: 0.04,
    iconType: "bank",
  },
  {
    id: "lt",
    name: "L&T Finance Holdings",
    shortName: "LTF",
    description: "Rural & Housing Finance • HL, VF, SME",
    commission: "₹5",
    commissionRate: 0.04,
    iconType: "building",
  },
  {
    id: "mahindra",
    name: "Mahindra & Mahindra Financial Services",
    shortName: "MMFSL",
    description: "Auto & Tractor Loans • VF, SME, HL",
    commission: "₹5",
    commissionRate: 0.04,
    iconType: "bike",
  },
  {
    id: "tvs",
    name: "TVS Credit Services",
    shortName: "TVSCREDIT",
    description: "Two Wheeler & Used Cars • VF, PL",
    commission: "₹5",
    commissionRate: 0.04,
    iconType: "truck",
  },
];

const CompanyIcon = ({
  type,
}: {
  type: CmsCompany["iconType"];
}) => {
  if (type === "bike") return <Bike className="h-5 w-5" />;
  if (type === "car") return <WalletCards className="h-5 w-5" />;
  if (type === "shield") return <ShieldCheck className="h-5 w-5" />;
  if (type === "bank") return <WalletCards className="h-5 w-5" />;
  if (type === "building") return <FileText className="h-5 w-5" />;
  return <Send className="h-5 w-5" />;
};

type CmsTab = "collection" | "drop";

export default function Cms() {
  const navigate = useNavigate();

  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [activeTab, setActiveTab] = useState<CmsTab>("collection");

  const selectedCompany =
    cmsCompanies.find((company) => company.id === selectedCompanyId) ?? null;

  const handleBack = () => {
    if (selectedCompany) {
      setSelectedCompanyId("");
      setActiveTab("collection");
      return;
    }

    navigate("/retailer");
  };

  const handleCompanyChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const companyId = event.target.value;

    setSelectedCompanyId(companyId);
    setActiveTab("collection");
  };

  return (
    <div className="w-full">
      <main className="mt-4">
        <div className="flex items-center gap-3 mx-auto w-full max-w-5xl">
          <button
            type="button"
            onClick={handleBack}
            className="hp-back"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Cash Management
            </p>

            <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              {selectedCompany ? selectedCompany.name : "CMS"}
            </h1>
          </div>
        </div>

        <div className="mx-auto mt-6 w-full max-w-2xl space-y-4">
          {!selectedCompany ? (
            <>
              {/* CMS INTRO */}
              <section className="rounded-[16px] border border-[#eadcff] bg-white p-4 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.16)] sm:p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f4ebff]">
                    <WalletCards className="h-6 w-6 text-[#7c3aed]" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[#172033]">
                      Cash Management Services
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-[#687286] sm:text-sm">
                      Select a company to continue with Cash Collection or Cash
                      Drop.
                    </p>
                  </div>
                </div>
              </section>

              {/* COMPANY DROPDOWN */}
              <section className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.12)] sm:p-5">
                <label
                  htmlFor="cms-company"
                  className="mb-2 block text-sm font-bold text-[#172033]"
                >
                  Select Company
                </label>

                <div className="relative">
                  <select
                    id="cms-company"
                    value={selectedCompanyId}
                    onChange={handleCompanyChange}
                    className="h-14 w-full appearance-none rounded-xl border-2 border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-[#172033] outline-none transition focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
                  >
                    <option value="">Choose a company</option>

                    {cmsCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} ({company.shortName})
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c3aed]" />
                </div>

                <p className="mt-2 text-[11px] text-slate-500">
                  Company names are currently hardcoded and can be connected
                  to the CMS API later.
                </p>
              </section>
            </>
          ) : (
            <>
              {/* SELECTED COMPANY */}
              <section className="rounded-[16px] border border-[#eadcff] bg-white p-4 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.14)] sm:p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f4ebff] text-[#7c3aed]">
                    <CompanyIcon type={selectedCompany.iconType} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-[#172033] sm:text-lg">
                        {selectedCompany.name}
                      </h2>

                      <span className="rounded-lg bg-[#f1e8ff] px-2 py-1 text-[10px] font-bold text-[#7c3aed]">
                        {selectedCompany.shortName}
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-[#687286]">
                      {selectedCompany.description}
                    </p>
                  </div>

                  <CheckCircle2 className="hidden h-5 w-5 shrink-0 text-emerald-500 sm:block" />
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCompanyId("")}
                  className="mt-3 text-xs font-bold text-[#7c3aed] hover:underline"
                >
                  Change Company
                </button>
              </section>

              {/* CMS SERVICES */}
              <section className="rounded-[16px] border border-slate-200 bg-white p-1.5 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("collection")}
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-sm font-bold transition ${
                      activeTab === "collection"
                        ? "bg-[#7c3aed] text-white shadow-md"
                        : "text-[#687286] hover:bg-[#f5f0ff] hover:text-[#7c3aed]"
                    }`}
                  >
                    <Banknote className="h-4 w-4" strokeWidth={2} />
                    <span>Cash Collection</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("drop")}
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-sm font-bold transition ${
                      activeTab === "drop"
                        ? "bg-[#7c3aed] text-white shadow-md"
                        : "text-[#687286] hover:bg-[#f5f0ff] hover:text-[#7c3aed]"
                    }`}
                  >
                    <Landmark className="h-4 w-4" strokeWidth={2} />
                    <span>Cash Drop</span>
                  </button>
                </div>
              </section>

              {/* SELECTED CMS FLOW */}
              <div className="mt-4">
                {activeTab === "collection" && (
                  <CashCollection
                    selectedCompanyName={selectedCompany.name}
                    selectedCompanyShortName={selectedCompany.shortName}
                    displayCompanyName={selectedCompany.name}
                    onBack={handleBack}
                  />
                )}

                {activeTab === "drop" && (
                  <CashDrop
                    selectedCompanyName={selectedCompany.name}
                    selectedCompanyShortName={selectedCompany.shortName}
                    displayCompanyName={selectedCompany.name}
                    onBack={handleBack}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

