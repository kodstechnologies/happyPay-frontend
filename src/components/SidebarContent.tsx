import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  BarChart3,
  UserCircle,
  FileCheck2,
  Headphones,
  LogOut,
  Fingerprint,
  Send,
  Banknote,
  IdCard,
  QrCode,
  ReceiptIndianRupee,
  ChevronRight,
  SmartphoneNfc,
  Users,
} from "lucide-react";

interface SidebarContentProps {
  onLogout: () => void;
  onNavigate?: () => void;
}

const SidebarContent = ({
  onLogout,
  onNavigate,
}: SidebarContentProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const goTo = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const isActive = (path: string) => {
    if (path === "/retailer") {
      return (
        location.pathname === "/retailer" ||
        location.pathname === "/retailer/"
      );
    }

    return location.pathname === path;
  };

  return (
    <div className="flex h-full w-full flex-col bg-white text-[#1f2937]">
      {/* BRAND */}
      <div className="hp-retailer-brand flex h-[100px] shrink-0 items-center border-b border-[#f1d9dd] px-4">
        <div className="flex items-center gap-3">
          <img src="/happy-favicon.jpeg" alt="Happy Pay Logo" className="h-20 w-20 object-contain mix-blend-multiply" />
          <div>
            <p className="font-extrabold text-[#1f2937] text-[18px]">HappyPay</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">Retailer</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="sidebar-scroll flex-1 overflow-y-auto px-3 py-5">
        {/* OVERVIEW */}
        <SidebarSection title="Overview">
          <SidebarItem
            label="Dashboard"
            icon={<LayoutDashboard />}
            active={isActive("/retailer")}
            onClick={() => goTo("/retailer")}
          />

          <SidebarItem
            label="Transactions"
            icon={<ReceiptText />}
            active={isActive("/retailer/transactions")}
            onClick={() => goTo("/retailer/transactions")}
          />

          <SidebarItem
            label="Wallet"
            icon={<Wallet />}
            active={isActive("/retailer/wallet")}
            onClick={() => goTo("/retailer/wallet")}
          />

          <SidebarItem
            label="Distributor"
            icon={<Users />}
            active={location.pathname.startsWith("/retailer/distributor")}
            onClick={() => goTo("/retailer/distributor")}
          />
        </SidebarSection>

        {/* SERVICES */}
        <SidebarSection title="Services">
          <SidebarItem
            label="AEPS"
            icon={<Fingerprint />}
            active={isActive("/retailer/aeps")}
            onClick={() => goTo("/retailer/aeps")}
          />

          <SidebarItem
            label="DMT"
            icon={<Send />}
            active={isActive("/retailer/dmt")}
            onClick={() => goTo("/retailer/dmt")}
          />

          <SidebarItem
            label="CMS"
            icon={<Banknote />}
            active={isActive("/retailer/cms")}
            onClick={() => goTo("/retailer/cms")}
          />

          <SidebarItem
            label="Aadhaar Pay"
            icon={<IdCard />}
            active={isActive("/retailer/aadhaar-pay")}
            onClick={() => goTo("/retailer/aadhaar-pay")}
          />

          <SidebarItem
            label="UPI Cash Point"
            icon={<QrCode />}
            active={isActive("/retailer/upi-cash-point")}
            onClick={() => goTo("/retailer/upi-cash-point")}
          />

          <SidebarItem
            label="BBPS"
            icon={<ReceiptIndianRupee />}
            active={isActive("/retailer/bbps")}
            onClick={() => goTo("/retailer/bbps")}
          />

          <SidebarItem
            label="Micro ATM"
            icon={<SmartphoneNfc />}
            active={isActive("/retailer/micro-atm")}
            onClick={() => goTo("/retailer/micro-atm")}
          />
        </SidebarSection>

        {/* MANAGEMENT */}
        <SidebarSection title="Management">
          <SidebarItem
            label="Reports"
            icon={<BarChart3 />}
            onClick={onNavigate}
          />

          <SidebarItem
            label="KYC Status"
            icon={<FileCheck2 />}
            onClick={onNavigate}
          />

          <SidebarItem
            label="Profile"
            icon={<UserCircle />}
            active={location.pathname.startsWith(
              "/retailer/profile",
            )}
            onClick={() => goTo("/retailer/profile")}
          />
        </SidebarSection>

        {/* SUPPORT */}
        <SidebarSection title="Support">
          <SidebarItem
            label="Help & Support"
            icon={<Headphones />}
            active={isActive("/retailer/profile/support")}
            onClick={() => goTo("/retailer/profile/support")}
          />
        </SidebarSection>
      </div>

      {/* LOGOUT */}
      <div className="shrink-0 border-t border-[#e5e7eb] p-3">
        <button
          type="button"
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold text-[#6b7280] transition hover:bg-[#f5f5f5] hover:text-[#1f2937]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f4f6]">
            <LogOut className="h-[15px] w-[15px]" />
          </div>

          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

/* =============================================================
   SIDEBAR SECTION
============================================================= */

const SidebarSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="mb-6">
      <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8992a3]">
        {title}
      </p>

      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
};

/* =============================================================
   SIDEBAR ITEM
============================================================= */

const SidebarItem = ({
  label,
  icon,
  active = false,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-[46px] w-full items-center justify-between rounded-lg px-3 transition-all duration-200 ${
        active
          ? "bg-[#7c3aed] text-white shadow-[0_6px_16px_rgba(124,58,237,0.2)]"
          : "text-[#6b7280] hover:bg-[#f8f5ff] hover:text-[#1f2937]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            active
              ? "bg-white/15 text-white"
              : "text-[#9ca3af] group-hover:text-[#7c3aed]"
          }`}
        >
          <span className="[&>svg]:h-[16px] [&>svg]:w-[16px]">
            {icon}
          </span>
        </div>

        <span className="truncate text-[12px] font-semibold">
          {label}
        </span>
      </div>

      <ChevronRight
        className={`h-3.5 w-3.5 shrink-0 ${
          active
            ? "text-white/70"
            : "text-[#d1d5db] group-hover:text-[#9ca3af]"
        }`}
      />
    </button>
  );
};

export default SidebarContent;
