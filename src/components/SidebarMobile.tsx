import { X } from "lucide-react";
import SidebarContent from "./SidebarContent";

interface SidebarMobileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout?: () => void;
}

const SidebarMobile = ({
  open,
  onOpenChange,
  onLogout,
}: SidebarMobileProps) => {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
        onClick={() => onOpenChange(false)}
      />

      <aside className="fixed left-0 top-0 z-50 h-screen w-[min(86vw,300px)] overflow-hidden border-r border-[#f1d9dd] bg-white shadow-[16px_0_40px_rgba(128,20,42,0.2)] lg:hidden">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close sidebar"
          className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f8f5ff] text-slate-500 transition hover:bg-[#f8f5ff] hover:text-[#7c3aed]"
        >
          <X className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>

        <SidebarContent
          onLogout={() => {
            onOpenChange(false);
            onLogout?.();
          }}
          onNavigate={() => {
            onOpenChange(false);
          }}
        />
      </aside>
    </>
  );
};

export default SidebarMobile;
