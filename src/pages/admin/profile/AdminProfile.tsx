import { Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../../context/AdminAuthContext";

export default function AdminProfile() {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const initials = admin?.name?.slice(0, 2).toUpperCase() ?? "SA";

  const details = [
    { label: "Full name", value: admin?.name ?? "Super Admin", icon: UserRound },
    { label: "Email address", value: admin?.email ?? "Not available", icon: Mail },
    { label: "Mobile number", value: admin?.mobile ?? "Not available", icon: Phone },
    { label: "Role", value: admin?.role ?? "Administrator", icon: ShieldCheck },
    { label: "Account status", value: admin?.status ?? "Active", icon: ShieldCheck },
  ];

  return <div className="mx-auto w-full max-w-4xl space-y-4">
    <section><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#315bd1]">System</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Admin Profile</h1><p className="mt-1 text-sm text-slate-500">View your administrator account details.</p></section>
    <section className="hp-card rounded-2xl p-4 sm:p-5"><div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dbe4ff] text-lg font-bold text-[#315bd1]">{initials}</div><div><h2 className="text-lg font-bold text-slate-900">{admin?.name ?? "Super Admin"}</h2><p className="mt-1 text-sm text-slate-500">{admin?.role ?? "Administrator"}</p><span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{admin?.status ?? "Active"}</span></div></div><div className="grid gap-3 pt-5 sm:grid-cols-2">{details.map((detail) => { const Icon = detail.icon; return <div key={detail.label} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"><div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Icon className="h-4 w-4 text-[#315bd1]" />{detail.label}</div><p className="mt-1.5 break-words text-sm font-bold text-slate-900">{detail.value}</p></div>; })}</div><div className="mt-5 flex justify-end border-t border-slate-100 pt-4"><button type="button" onClick={() => navigate("/admin/dashboard")} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button></div></section>
  </div>;
}
