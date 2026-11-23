import { useEffect, useRef, useState } from "react";
import { Award, Download, Loader2, Printer, RefreshCw } from "lucide-react";
import { toPng } from "html-to-image";
import { getRetailerProfile } from "../../../services/api/retailer/retailerProfileApi";
import { showToast } from "../../../utils/toast";
import type { RetailerFullProfile } from "../../../types/retailer/profile";

export default function RetailerCertificate() {
  const [profile, setProfile] = useState<RetailerFullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getRetailerProfile();
      setProfile(res.data ?? null);
    } catch (err: unknown) {
      console.error("Failed to load profile for certificate:", err);
      showToast("error", err, "Failed to load certificate details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => void loadProfile(), 0);
    return () => clearTimeout(timer);
  }, []);

  const retailerName = profile?.fullName || "";
  const retailerId = profile?.retailerId || profile?.id || "—";
  const shopName = profile?.shop?.name || "—";
  const issueDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const handleDownload = async () => {
    if (!certificateRef.current || downloading) return;

    try {
      setDownloading(true);
      const dataUrl = await toPng(certificateRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      const safeId = String(profile?.retailerId || profile?.id || "retailer").replace(
        /[^a-zA-Z0-9-]/g,
        ""
      );
      link.download = `HappyPay-Certificate-${safeId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: unknown) {
      console.error("Failed to download certificate:", err);
      showToast("error", "Failed to download certificate");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
            Management
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#171717]">
            Retailer Certificate
          </h1>
          <p className="mt-1 text-sm text-[#8992a3]">
            Your HappyPay retailer certificate
          </p>
        </div>
        <div className="flex items-center gap-2 receipt-no-print">
          <button
            type="button"
            onClick={() => void loadProfile()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-[#7c3aed] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#7c3aed]" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={loading || !profile}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-[#7c3aed] disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={loading || !profile || downloading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6d28d9] disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>

      {loading && !profile ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-[#7c3aed]" />
        </div>
      ) : (
        <div className="flex justify-center">
          {/* Certificate */}
          <div className="receipt-print-area w-full max-w-4xl">
            <div
              ref={certificateRef}
              className="relative overflow-hidden rounded-3xl border-[10px] border-double border-[#7c3aed]/60 bg-gradient-to-br from-[#faf8ff] via-white to-[#f3efff] px-8 py-12 shadow-2xl sm:px-14 sm:py-16"
            >
              {/* Corner decorations */}
              <Award className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rotate-12 text-[#7c3aed]/10" />
              <Award className="pointer-events-none absolute -bottom-10 -right-8 h-44 w-44 -rotate-12 text-[#7c3aed]/10" />

              <div className="relative text-center">
                {/* Logo */}
                <img
                  src="/happy-favicon.jpeg"
                  alt="HappyPay Logo"
                  className="mx-auto h-20 w-20 object-contain"
                />
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#1f2937]">
                  HappyPay
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#7c3aed]">
                  Retailer Portal
                </p>

                <div className="mx-auto mt-8 h-px w-40 bg-gradient-to-r from-transparent via-[#7c3aed] to-transparent" />

                <h2 className="mt-8 text-sm font-bold uppercase tracking-[0.35em] text-[#7c3aed]">
                  Certificate of Authorization
                </h2>

                <p className="mt-6 text-sm text-[#6b7280]">
                  This is to certify that
                </p>

                <p className="mt-4 font-serif text-4xl font-bold italic text-[#171717] sm:text-5xl">
                  {retailerName}
                </p>

                <p className="mt-4 text-sm text-[#6b7280]">
                  is an authorized retailer of HappyPay and is approved to
                  avail all retailer banking services.
                </p>

                {/* Details */}
                <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#e5e0f7] bg-white/80 px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8992a3]">
                      Retailer Name
                    </p>
                    <p className="mt-1.5 text-sm font-bold text-[#171717] break-words">
                      {retailerName || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#e5e0f7] bg-white/80 px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8992a3]">
                      Retailer ID
                    </p>
                    <p className="mt-1.5 font-mono text-sm font-bold text-[#171717]">
                      {retailerId}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#e5e0f7] bg-white/80 px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8992a3]">
                      Shop Name
                    </p>
                    <p className="mt-1.5 text-sm font-bold text-[#171717] break-words">
                      {shopName}
                    </p>
                  </div>
                </div>

                <div className="mx-auto mt-10 flex items-end justify-between max-w-md">
                  <div className="text-left">
                    <p className="text-xs text-[#8992a3]">Date of Issue</p>
                    <p className="mt-1 text-sm font-bold text-[#171717]">{issueDate}</p>
                  </div>
                  <div className="text-right">
                    <div className="border-t-2 border-[#7c3aed]/50 pt-2">
                      <p className="text-sm font-bold text-[#171717]">HappyPay Admin</p>
                      <p className="text-[10px] uppercase tracking-widest text-[#8992a3]">
                        Authorized Signatory
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-10 text-[10px] uppercase tracking-[0.25em] text-[#b6bcc8]">
                  This is a computer-generated certificate issued by HappyPay
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
