/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Fingerprint,
  Send,
  WalletCards,
  Eye,
  EyeOff,
  Plus,
  CheckCircle2,
  X,
  IdCard,
  Smartphone,
  Tv,
  CreditCard,
  QrCode,
  ReceiptIndianRupee,
  Clock3,
  XCircle,
  SmartphoneNfc,
} from "lucide-react";
import { getWalletBalance, setWalletBalance } from "../../utils/wallet";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../services/api/client";

type ServicePath =
  | "/retailer/aeps"
  | "/retailer/dmt"
  | "/retailer/cms"
  | "/retailer/aadhaar-pay"
  | "/retailer/upi-cash-point"
  | "/retailer/bbps"
  | "/retailer/micro-atm";


type ComingSoonService =
  | "Mobile Recharge"
  | "DTH"
  | "PAN Services";

type QuickService = {
  title: string;
  description: string;
  icon: typeof Fingerprint;
  iconClass: string;
  bgClass: string;
  hoverClass: string;
  cardClass: string;
  path?: ServicePath;
  comingSoon?: boolean;
};




type Transaction = {
  id: string;
  service: "AEPS" | "DMT" | "CMS";
  title: string;
  date: string;
  time: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  status: "Success" | "Pending" | "Failed";
};

const recentTransactions: Transaction[] = [
  {
    id: "TXN001",
    service: "AEPS",
    title: "AEPS Cash Withdrawal",
    date: "04 Sep 2026",
    time: "10:42 AM",
    amount: 5000,
    type: "CREDIT",
    status: "Success",
  },
  {
    id: "TXN002",
    service: "DMT",
    title: "DMT Money Transfer",
    date: "04 Sep 2026",
    time: "09:18 AM",
    amount: 2500,
    type: "DEBIT",
    status: "Success",
  },
  {
    id: "TXN003",
    service: "CMS",
    title: "CMS Collection",
    date: "03 Sep 2026",
    time: "05:32 PM",
    amount: 8200,
    type: "CREDIT",
    status: "Success",
  },
  {
    id: "TXN004",
    service: "AEPS",
    title: "AEPS Balance Enquiry",
    date: "03 Sep 2026",
    time: "02:15 PM",
    amount: 0,
    type: "DEBIT",
    status: "Success",
  },
];

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getServiceIcon = (service: Transaction["service"]) => {
  if (service === "AEPS") return Fingerprint;
  if (service === "DMT") return Send;
  return WalletCards;
};

const getServiceIconClasses = (service: Transaction["service"]) => {
  if (service === "AEPS") return "bg-[#ffe6ea] text-[#e4002b]";
  if (service === "DMT") return "bg-[#fff2df] text-[#c56b08]";
  return "bg-[#e5f7ee] text-[#087f5b]";
};

const getStatusIcon = (status: Transaction["status"]) => {
  if (status === "Success") return CheckCircle2;
  if (status === "Pending") return Clock3;
  return XCircle;
};

const getStatusClasses = (status: Transaction["status"]) => {
  if (status === "Success") return "bg-[#e5f7ee] text-[#087f5b]";
  if (status === "Pending") return "bg-[#fff2df] text-[#c56b08]";
  return "bg-[#ffe6ea] text-[#c21d3d]";
};

const getAmountClasses = (type: Transaction["type"]) => {
  if (type === "CREDIT") return "text-[#08a873]";
  return "text-[#df4b43]";
};

const Dashboard = () => {
  const navigate = useNavigate();



  const [activeBanner, setActiveBanner] = useState(0);
  const [showBalance, setShowBalance] = useState(true);

  const [walletBalance, setWalletBalanceState] =
    useState(getWalletBalance);

  const [showAddMoneyModal, setShowAddMoneyModal] =
    useState(false);

  const [addMoneyAmount, setAddMoneyAmount] =
    useState("500");

  const [showMoneyAddedToast, setShowMoneyAddedToast] =
    useState(false);

  const [lastAddedAmount, setLastAddedAmount] =
    useState(0);

  const [showComingSoonModal, setShowComingSoonModal] =
    useState(false);

  const [comingSoonService, setComingSoonService] =
    useState<ComingSoonService | null>(null);

  /* =========================================================
     BANNERS
  ========================================================= */

  const [banners, setBanners] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await apiClient<any>("/api/v1/banners", { method: "GET" });
        if (response.success && response.data) {
          // Sort by order and map to imageUrl
          const sorted = response.data
            .sort((a: any, b: any) => a.order - b.order)
            .map((b: any) => b.imageUrl);
          
          if (sorted.length > 0) {
            setBanners(sorted);
          } else {
            // Fallback to defaults if no active banners found
            setBanners([
              "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1616077168079-7e09a6a4c2f2?auto=format&fit=crop&q=80",
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch banners", err);
        setBanners([
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1616077168079-7e09a6a4c2f2?auto=format&fit=crop&q=80",
        ]);
      }
    };
    
    fetchBanners();
  }, []);




  /* =========================================================
     BANNER SCROLL
  ========================================================= */

  const handleBannerScroll = (
    event: React.UIEvent<HTMLDivElement>,
  ) => {
    const container = event.currentTarget;

    const children = Array.from(
      container.children,
    ) as HTMLElement[];

    if (!children.length) {
      return;
    }

    let closestIndex = 0;
    let closestDistance = Infinity;

    children.forEach((child, index) => {
      const distance = Math.abs(
        child.offsetLeft - container.scrollLeft,
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveBanner(closestIndex);
  };

  const goToBanner = (index: number) => {
    const container =
      document.getElementById("dashboard-banners");

    const banner = document.getElementById(
      `dashboard-banner-${index}`,
    );

    if (!container || !banner) {
      return;
    }

    container.scrollTo({
      left: banner.offsetLeft,
      behavior: "smooth",
    });

    setActiveBanner(index);
  };

  /* =========================================================
     SERVICE NAVIGATION
  ========================================================= */

  const handleServiceClick = (path: ServicePath) => {
    navigate(path);
  };

  const handleComingSoonClick = (
    service: ComingSoonService,
  ) => {
    setComingSoonService(service);
    setShowComingSoonModal(true);
  };

  /* =========================================================
     ADD MONEY
  ========================================================= */

  const handleAddMoney = () => {
    const numericAmount = Number(addMoneyAmount);

    if (!numericAmount || numericAmount <= 0) {
      return;
    }

    setWalletBalanceState((previous) => {
      const nextBalance =
        previous + numericAmount;

      setWalletBalance(nextBalance);

      return nextBalance;
    });

    setLastAddedAmount(numericAmount);
    setShowAddMoneyModal(false);
    setAddMoneyAmount("500");
    setShowMoneyAddedToast(true);

    window.setTimeout(() => {
      setShowMoneyAddedToast(false);
    }, 3500);
  };

  const handleAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setAddMoneyAmount(value);
  };

  /* =========================================================
     QUICK SERVICES
  ========================================================= */

  const quickServices: QuickService[] = [
    {
      title: "AEPS",
      description: "Aadhaar ATM",
      icon: Fingerprint,
      iconClass: "text-[#2563eb]",
      bgClass: "bg-[#e8f0ff]",
      hoverClass: "hover:bg-[#e8f0ff]",
      cardClass:
        "bg-[#f4f7ff] border-[#dce6ff] hover:bg-[#edf3ff]",
      path: "/retailer/aeps",
    },
    {
      title: "DMT",
      description: "Send Money",
      icon: Send,
      iconClass: "text-[#9333ea]",
      bgClass: "bg-[#f3e8ff]",
      hoverClass: "hover:bg-[#f3e8ff]",
      cardClass:
        "bg-[#faf5ff] border-[#eadcff] hover:bg-[#f7efff]",
      path: "/retailer/dmt",
    },
    {
      title: "CMS",
      description: "Cash Management",
      icon: WalletCards,
      iconClass: "text-[#059669]",
      bgClass: "bg-[#e5f8f0]",
      hoverClass: "hover:bg-[#e5f8f0]",
      cardClass:
        "bg-[#f2fcf8] border-[#d8f3e8] hover:bg-[#eafaf3]",
      path: "/retailer/cms",
    },
    {
      title: "Aadhaar Pay",
      description: "Aadhaar Payment",
      icon: IdCard,
      iconClass: "text-[#dc2626]",
      bgClass: "bg-[#ffe8eb]",
      hoverClass: "hover:bg-[#ffe8eb]",
      cardClass:
        "bg-[#fff5f6] border-[#ffe0e4] hover:bg-[#ffedef]",
      path: "/retailer/aadhaar-pay",
    },
    {
      title: "UPI Cash Point",
      description: "UPI Withdrawal",
      icon: QrCode,
      iconClass: "text-[#0891b2]",
      bgClass: "bg-[#e3f8fc]",
      hoverClass: "hover:bg-[#e3f8fc]",
      cardClass:
        "bg-[#f2fcfe] border-[#d8f3f8] hover:bg-[#e8fafd]",
      path: "/retailer/upi-cash-point",
    },
    {
      title: "BBPS",
      description: "Bill Payments",
      icon: ReceiptIndianRupee,
      iconClass: "text-[#2563eb]",
      bgClass: "bg-[#eef2ff]",
      hoverClass: "hover:bg-[#eef2ff]",
      cardClass:
        "bg-[#f8faff] border-[#dce6ff] hover:bg-[#f0f5ff]",
      path: "/retailer/bbps",
    },
    {
      title: "Micro ATM",
      description: "Withdraw via Debit Card",
      icon: SmartphoneNfc,
      iconClass: "text-[#10b981]",
      bgClass: "bg-[#ecfdf5]",
      hoverClass: "hover:bg-[#ecfdf5]",
      cardClass:
        "bg-[#f0fdf4] border-[#d1fae5] hover:bg-[#e6fcf5]",
      path: "/retailer/micro-atm",
    },
    {
      title: "Mobile Recharge",
      description: "Recharge Mobile",
      icon: Smartphone,
      iconClass: "text-[#ea580c]",
      bgClass: "bg-[#fff0e5]",
      hoverClass: "hover:bg-[#fff0e5]",
      cardClass:
        "bg-[#fff8f2] border-[#ffe8d8] hover:bg-[#fff3e9]",
      comingSoon: true,
    },
    {
      title: "DTH",
      description: "DTH Recharge",
      icon: Tv,
      iconClass: "text-[#db2777]",
      bgClass: "bg-[#fce7f3]",
      hoverClass: "hover:bg-[#fce7f3]",
      cardClass:
        "bg-[#fff5fa] border-[#f9dce9] hover:bg-[#fff0f7]",
      comingSoon: true,
    },
    {
      title: "PAN Services",
      description: "PAN Card Services",
      icon: CreditCard,
      iconClass: "text-[#ca8a04]",
      bgClass: "bg-[#fef9c3]",
      hoverClass: "hover:bg-[#fef9c3]",
      cardClass:
        "bg-[#fffef0] border-[#f7edaa] hover:bg-[#fffce0]",
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-full bg-transparent">



      {/* =====================================================
          MONEY ADDED TOAST
      ====================================================== */}

      {showMoneyAddedToast && (
        <div className="fixed right-4 top-4 z-[100] animate-in slide-in-from-right-5 duration-300 sm:right-6 sm:top-6">
          <div className="flex items-center gap-3 rounded-2xl border border-[#dfe1e6] bg-white px-4 py-3.5 shadow-[0_18px_45px_-25px_rgba(23,32,51,0.35)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef1ff]">
              <WalletCards className="h-5 w-5 text-[#315bd1]" />
            </div>

            <div>
              <p className="text-sm font-bold text-[#172033]">
                Money Added!
              </p>

              <p className="text-xs text-[#8992a3]">
                ₹
                {lastAddedAmount.toLocaleString(
                  "en-IN",
                )}{" "}
                added to your wallet.
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="px-3 pb-8 pt-4 sm:px-5 sm:pt-5">
        <div className="mx-auto w-full max-w-7xl">

          {/* =================================================
              HEADER
          ================================================== */}
          
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">You can monitor your account details</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* =================================================
                TOP ROW
            ================================================== */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
              
              {/* BANNER SECTION */}
              <section>
                <div
                  id="dashboard-banners"
                  onScroll={handleBannerScroll}
                  className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth"
                  style={{ scrollbarWidth: "none" }}
                >
                  {banners.map((banner, index) => (
                    <div
                      id={`dashboard-banner-${index}`}
                      key={`${banner}-${index}`}
                      className="w-full shrink-0 snap-center overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_20px_45px_-28px_rgba(23,32,51,0.35)]"
                    >
                      <img
                        src={banner}
                        alt={`HappyPay banner ${index + 1}`}
                        className="h-[128px] w-full object-cover sm:h-[148px] lg:h-[164px]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80";
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      aria-label={`Go to banner ${index + 1}`}
                      onClick={() => goToBanner(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeBanner === index
                          ? "w-7 bg-[#315bd1]"
                          : "w-1.5 bg-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </section>

            {/* BALANCE CARD RIGHT COLUMN */}
              {/* =================================================
                  LIGHT PURPLE BALANCE CARD
              ================================================== */}
              <section className="relative overflow-hidden rounded-[1.5rem] border border-[#e5d9ff] bg-gradient-to-br from-[#eee7ff] via-[#e8ddff] to-[#f3edff] px-5 py-4 shadow-[0_12px_30px_-20px_rgba(124,58,237,0.25)] sm:px-6 sm:py-5">
                {/* Decorative circles */}
                <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[#d8c5ff]/40 blur-xl" />
                <div className="pointer-events-none absolute -bottom-8 -left-6 h-20 w-20 rounded-full bg-[#d8c5ff]/30 blur-lg" />
                <div className="relative z-10">
                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#6d5a96] sm:text-xs">
                          Available Balance
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowBalance((previous) => !previous)}
                          className="text-[#8066b5] transition hover:text-[#63449b]"
                          aria-label={showBalance ? "Hide balance" : "Show balance"}
                        >
                          {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </div>
                      <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#5b21b6] sm:text-3xl">
                        {showBalance
                          ? `₹${walletBalance.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : "₹••••••"}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddMoneyModal(true)}
                      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#8b5cf6] px-3 py-2 text-[11px] font-bold text-white shadow-[0_8px_18px_-10px_rgba(124,58,237,0.6)] transition hover:scale-105 hover:bg-[#7c3aed] sm:px-4 sm:py-2.5"
                    >
                      <Plus className="h-4 w-4" />
                      ADD MONEY
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* =================================================
                BOTTOM ROW
            ================================================== */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
              {/* QUICK LINKS SECTION */}
              <section className="bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 h-full">
                <div className="flex items-center gap-4 mb-6 border-b border-slate-100">
                  <h2 className="text-[17px] font-bold text-slate-800 border-b-2 border-[#315bd1] pb-3 -mb-[1px]">Quick Links</h2>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {quickServices.map((service) => {
                    const Icon = service.icon;
                    return (
                      <button
                        key={service.title}
                        type="button"
                        onClick={() => {
                          if (service.comingSoon) {
                            handleComingSoonClick(service.title as ComingSoonService);
                          } else if (service.path) {
                            handleServiceClick(service.path);
                          }
                        }}
                        className="flex flex-col items-center justify-center p-3 sm:p-4 bg-white border border-slate-200 rounded-[16px] hover:shadow-lg hover:-translate-y-1 hover:border-[#315bd1]/40 transition-all duration-300 aspect-[4/3] sm:aspect-square group focus:outline-none focus:ring-2 focus:ring-[#315bd1]/20"
                      >
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-slate-50 group-hover:bg-[#eef1ff] transition-colors duration-300 mb-2 sm:mb-3">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500 group-hover:text-[#315bd1] transition-colors duration-300" strokeWidth={1.5} />
                        </div>
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-600 text-center leading-tight group-hover:text-[#315bd1] transition-colors duration-300">
                          {service.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

            {/* =================================================
                RIGHT COLUMN (ACCOUNT + TRANSACTIONS)
            ================================================== */}
            
            <div className="space-y-6">

              {/* ACCOUNT SNAPSHOT (Optional, kept small if needed) */}
              <section className="bg-white rounded-[24px] p-5 sm:p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                <div className="flex items-center gap-4 mb-4 border-b border-slate-100">
                  <h2 className="text-[17px] font-bold text-slate-800 border-b-2 border-[#7c3aed] pb-3 -mb-[1px]">Account Snapshot</h2>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#f8f5ff] p-3 transition hover:bg-[#f3eaff]">
                    <p className="text-xs font-medium text-[#64748b]">Today's Earnings</p>
                    <p className="mt-1 text-[15px] font-bold text-[#0f172a]">₹1,250.00</p>
                  </div>
                  <div className="rounded-xl bg-[#f8f5ff] p-3 transition hover:bg-[#f3eaff]">
                    <p className="text-xs font-medium text-[#64748b]">Retailer ID</p>
                    <p className="mt-1 text-[15px] font-bold text-[#0f172a]">HP100245</p>
                  </div>
                </div>
              </section>

              {/* RECENT TRANSACTIONS */}
              <section className="bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100">
                  <h2 className="text-[17px] font-bold text-slate-800 border-b-2 border-[#315bd1] pb-3 -mb-[1px]">Recent Transactions</h2>
                  <button 
                    onClick={() => navigate("/retailer/transactions")}
                    className="text-[11px] font-semibold text-[#7c3aed] bg-[#7c3aed]/10 px-3 py-1.5 rounded-md transition hover:bg-[#7c3aed]/20 mb-2"
                  >
                    View All
                  </button>
                </div>
                
                <div className="flex flex-col gap-0.5">
                  {recentTransactions.map((transaction, index) => {
                    const Icon = getServiceIcon(transaction.service);
                    const StatusIcon = getStatusIcon(transaction.status);
                    const isLast = index === recentTransactions.length - 1;

                    return (
                      <div
                        key={transaction.id}
                        className={`group flex items-center gap-3 py-3 transition-colors hover:bg-slate-50/60 ${
                          !isLast ? "border-b border-slate-100/60" : ""
                        }`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getServiceIconClasses(transaction.service)}`}>
                          <Icon className="h-[18px] w-[18px]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-[13px] font-bold text-[#172033]">
                            {transaction.title}
                          </h3>
                          <p className="mt-0.5 text-[11px] text-[#9aa0ab]">
                            {transaction.date} • {transaction.time}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className={`text-[13px] font-bold ${getAmountClasses(transaction.type)}`}>
                            {transaction.type === "CREDIT" ? "+" : "-"} ₹{formatAmount(transaction.amount)}
                          </p>
                          <span className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${getStatusClasses(transaction.status)}`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

            </div>
          </div>
          </div>

        </div>
      </main>

      {/* =====================================================
          COMING SOON MODAL
      ====================================================== */}

      {showComingSoonModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#4b0b18]/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setShowComingSoonModal(false);
            }
          }}
        >

          <div className="w-full max-w-xs rounded-2xl border border-[#f1d9dd] bg-white p-5 text-center shadow-[0_22px_55px_-28px_rgba(128,20,42,0.35)]">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef1ff]">
              <WalletCards className="h-8 w-8 text-[#315bd1]" />
            </div>

            <h2 className="mt-4 text-xl font-bold text-[#172033]">
              Service Coming Soon
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#8992a3]">
              {comingSoonService
                ? `${comingSoonService} will be available soon.`
                : "This service will be available soon."}
            </p>

            <button
              type="button"
              onClick={() =>
                setShowComingSoonModal(false)
              }
              className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-[#315bd1] text-sm font-bold text-white transition hover:bg-[#274dbd] hover:shadow-[0_10px_25px_-12px_rgba(49,91,209,0.8)]"
            >
              OK
            </button>

          </div>
        </div>
      )}

      {/* =====================================================
          ADD MONEY MODAL
      ====================================================== */}

      {showAddMoneyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#4b0b18]/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setShowAddMoneyModal(false);
            }
          }}
        >

          <div className="w-full max-w-xs overflow-hidden rounded-2xl border border-[#f1d9dd] bg-white shadow-[0_22px_55px_-28px_rgba(128,20,42,0.35)]">

            <div className="flex items-center justify-between border-b border-[#edf0f4] px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef1ff]">
                  <WalletCards className="h-5 w-5 text-[#315bd1]" />
                </div>

                <div>

                  <h2 className="text-sm font-bold text-[#172033]">
                    Add Money to Wallet
                  </h2>

                  <p className="text-xs text-[#8992a3]">
                    Current: ₹
                    {walletBalance.toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                      },
                    )}
                  </p>

                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddMoneyModal(false)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8992a3] transition hover:bg-[#f5f7fb]"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            <div className="px-5 py-6">

              <div className="flex items-center gap-2 rounded-xl border-2 border-[#dfe1e6] bg-[#fafbfd] px-4 py-3 focus-within:border-[#315bd1] focus-within:bg-white">

                <span className="text-2xl font-semibold text-slate-300">
                  ₹
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  value={addMoneyAmount}
                  onChange={handleAmountChange}
                  autoFocus
                  placeholder="0"
                  className="min-w-0 flex-1 bg-transparent text-2xl font-bold text-[#315bd1] outline-none placeholder:text-[#b2b8c3]"
                />

              </div>

              <div className="mt-3 grid grid-cols-4 gap-2">

                {["500", "1000", "2000", "5000"].map(
                  (amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() =>
                        setAddMoneyAmount(amount)
                      }
                      className={`rounded-lg border py-1.5 text-xs font-semibold transition ${
                        addMoneyAmount === amount
                          ? "border-[#315bd1] bg-[#315bd1] text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#315bd1]/40"
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ),
                )}

              </div>

              <button
                type="button"
                onClick={handleAddMoney}
                disabled={
                  !addMoneyAmount ||
                  Number(addMoneyAmount) <= 0
                }
                className="mt-4 flex h-10 w-full items-center justify-center rounded-xl bg-[#315bd1] text-sm font-bold text-white transition hover:bg-[#274dbd] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add ₹
                {addMoneyAmount
                  ? Number(
                      addMoneyAmount,
                    ).toLocaleString("en-IN")
                  : "0"}{" "}
                to Wallet
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowAddMoneyModal(false)
                }
                className="mt-2.5 flex w-full items-center justify-center py-2 text-xs font-semibold text-slate-500 transition hover:text-[#315bd1]"
              >
                Cancel
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;