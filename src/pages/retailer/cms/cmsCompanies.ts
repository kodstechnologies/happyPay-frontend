export type CmsIconType =
  | "bike"
  | "car"
  | "shield"
  | "bank"
  | "building"
  | "truck";

export interface CmsCompany {
  id: string;
  name: string;
  shortName: string;
  code: string;
  description: string;
  commission: string;
  commissionRate: number;
  commissionDisplay: string;
  iconType: CmsIconType;
  icon: string;
  billerId?: string;
  agencyId?: string;
}

export const CMS_COMPANIES: CmsCompany[] = [
  {
    id: "chola",
    name: "Cholamandalam Finance",
    shortName: "CHOLA",
    code: "CHOLA",
    description: "Vehicle & Asset Finance • VF, HL, LAP",
    commission: "₹5",
    commissionRate: 0.04,
    commissionDisplay: "0.04 Comm",
    iconType: "car",
    icon: "C",
    billerId: "CHOLA001",
    agencyId: "AGY_CHOLA",
  },
  {
    id: "muthoot",
    name: "Muthoot Finance",
    shortName: "MUTHOOT",
    code: "MUTHOOT",
    description: "Gold Loan & Asset Finance • GL, PL, HL",
    commission: "₹5",
    commissionRate: 0.04,
    commissionDisplay: "0.04 Comm",
    iconType: "shield",
    icon: "M",
    billerId: "MUTHOOT001",
    agencyId: "AGY_MUTHOOT",
  },
  {
    id: "herofin",
    name: "Hero FinCorp",
    shortName: "HEROFIN",
    code: "HEROFIN",
    description: "Two Wheeler & SME Finance • VF, PL, SME",
    commission: "₹5",
    commissionRate: 0.04,
    commissionDisplay: "0.04 Comm",
    iconType: "bike",
    icon: "H",
    billerId: "HERO001",
    agencyId: "AGY_HERO",
  },
  {
    id: "bajaj",
    name: "Bajaj Finserv",
    shortName: "BAJAJ",
    code: "BAJAJ",
    description: "Consumer & Business Loans • PL, HL, LAP",
    commission: "₹5",
    commissionRate: 0.04,
    commissionDisplay: "0.04 Comm",
    iconType: "bank",
    icon: "B",
    billerId: "BAJAJ001",
    agencyId: "AGY_BAJAJ",
  },
  {
    id: "lt",
    name: "L&T Finance Holdings",
    shortName: "LTF",
    code: "LTF",
    description: "Rural & Housing Finance • HL, VF, SME",
    commission: "₹5",
    commissionRate: 0.04,
    commissionDisplay: "0.04 Comm",
    iconType: "building",
    icon: "L",
    billerId: "LTF001",
    agencyId: "AGY_LTF",
  },
  {
    id: "mahindra",
    name: "Mahindra & Mahindra Financial Services",
    shortName: "MMFSL",
    code: "MMFSL",
    description: "Auto & Tractor Loans • VF, SME, HL",
    commission: "₹5",
    commissionRate: 0.04,
    commissionDisplay: "0.04 Comm",
    iconType: "bike",
    icon: "M",
    billerId: "MMFSL001",
    agencyId: "AGY_MMFSL",
  },
  {
    id: "tvs",
    name: "TVS Credit Services",
    shortName: "TVSCREDIT",
    code: "TVSCREDIT",
    description: "Two Wheeler & Used Cars • VF, PL",
    commission: "₹5",
    commissionRate: 0.04,
    commissionDisplay: "0.04 Comm",
    iconType: "truck",
    icon: "T",
    billerId: "TVS001",
    agencyId: "AGY_TVS",
  },
];

export default CMS_COMPANIES;
