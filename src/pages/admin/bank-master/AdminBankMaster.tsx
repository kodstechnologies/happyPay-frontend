import { useEffect, useState } from "react";
import {
  Landmark,
  Search,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Edit2,
  X,
  Building2,
} from "lucide-react";
import { showToast } from "../../../utils/toast";
import ModalWrapper from "../../../components/common/ModalWrapper";
import {
  getAdminBanks,
  updateAdminBank,
  toggleBankStatus,
  toggleBankAepsStatus,
  toggleBankPayoutStatus,
  syncBankLists,
  type BankMaster,
  type BankListMeta,
} from "../../../apis/adminBankMaster.apis";

const LIMIT = 20;

function Badge({ green, label }: { green: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        green
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {label}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-600"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

type EditForm = {
  bankName: string;
  aepsBankId: string;
  aepsIin: string;
  payoutBankCode: string;
};

export default function AdminBankMaster() {
  const [banks, setBanks] = useState<BankMaster[]>([]);
  const [meta, setMeta] = useState<BankListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [aepsEnabled, setAepsEnabled] = useState("");
  const [payoutEnabled, setPayoutEnabled] = useState("");
  const [isActive, setIsActive] = useState("");
  const [page, setPage] = useState(1);

  // Sync
  const [syncing, setSyncing] = useState(false);

  // Edit modal
  const [editingBank, setEditingBank] = useState<BankMaster | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    bankName: "",
    aepsBankId: "",
    aepsIin: "",
    payoutBankCode: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  // Toggling state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getAdminBanks({
          search: search || undefined,
          isActive: isActive || undefined,
          aepsEnabled: aepsEnabled || undefined,
          payoutEnabled: payoutEnabled || undefined,
          page,
          limit: LIMIT,
        });
        setBanks(res.data.data ?? []);
        setMeta(res.data.meta ?? null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load banks";
        setError(msg);
        showToast("error", err, msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [search, isActive, aepsEnabled, payoutEnabled, page, refreshKey]);

  // Stats derived from current page (top-level counts come from meta if available, else count current page)
  const totalBanks = meta?.total ?? banks.length;
  const aepsEnabledCount = banks.filter((b) => b.aeps.enabled).length;
  const payoutEnabledCount = banks.filter((b) => b.payout.enabled).length;
  const activeBanksCount = banks.filter((b) => b.isActive).length;

  const lastSyncedAt = banks.reduce<string | null>((latest, b) => {
    if (!b.lastSyncedAt) return latest;
    if (!latest) return b.lastSyncedAt;
    return b.lastSyncedAt > latest ? b.lastSyncedAt : latest;
  }, null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncBankLists();
      const stats = res.data.data;
      showToast(
        "success",
        `Synced successfully: ${stats.added} added, ${stats.updated} updated, ${stats.errors.length} errors`
      );
      setPage(1);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      showToast("error", err, "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleStatus = async (bank: BankMaster) => {
    setTogglingId(bank._id + "-status");
    try {
      const res = await toggleBankStatus(bank._id, !bank.isActive);
      setBanks((prev) =>
        prev.map((b) => (b._id === bank._id ? res.data.data : b))
      );
      showToast("success", `Bank ${!bank.isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      showToast("error", err, "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleAeps = async (bank: BankMaster) => {
    setTogglingId(bank._id + "-aeps");
    try {
      const res = await toggleBankAepsStatus(bank._id, !bank.aeps.enabled);
      setBanks((prev) =>
        prev.map((b) => (b._id === bank._id ? res.data.data : b))
      );
      showToast("success", `AEPS ${!bank.aeps.enabled ? "enabled" : "disabled"}`);
    } catch (err) {
      showToast("error", err, "Failed to update AEPS status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleTogglePayout = async (bank: BankMaster) => {
    setTogglingId(bank._id + "-payout");
    try {
      const res = await toggleBankPayoutStatus(bank._id, !bank.payout.enabled);
      setBanks((prev) =>
        prev.map((b) => (b._id === bank._id ? res.data.data : b))
      );
      showToast("success", `Payout ${!bank.payout.enabled ? "enabled" : "disabled"}`);
    } catch (err) {
      showToast("error", err, "Failed to update Payout status");
    } finally {
      setTogglingId(null);
    }
  };

  const openEdit = (bank: BankMaster) => {
    setEditingBank(bank);
    setEditForm({
      bankName: bank.bankName,
      aepsBankId: bank.aeps.bankId ?? "",
      aepsIin: bank.aeps.iin ?? "",
      payoutBankCode: bank.payout.bankCode ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBank) return;
    setIsSaving(true);
    try {
      const res = await updateAdminBank(editingBank._id, {
        bankName: editForm.bankName,
        aepsBankId: editForm.aepsBankId,
        aepsIin: editForm.aepsIin,
        payoutBankCode: editForm.payoutBankCode,
      });
      setBanks((prev) =>
        prev.map((b) => (b._id === editingBank._id ? res.data.data : b))
      );
      showToast("success", "Bank updated successfully");
      setEditingBank(null);
    } catch (err) {
      showToast("error", err, "Failed to update bank");
    } finally {
      setIsSaving(false);
    }
  };

  const totalPages = meta?.totalPages ?? 1;

  const statCards = [
    { label: "Total Banks", value: totalBanks, icon: Building2, color: "text-[#315bd1] bg-[#eef2ff]" },
    { label: "AEPS Enabled", value: aepsEnabledCount, icon: Landmark, color: "text-emerald-600 bg-emerald-50" },
    { label: "Payout Enabled", value: payoutEnabledCount, icon: Landmark, color: "text-violet-600 bg-violet-50" },
    { label: "Active Banks", value: activeBanksCount, icon: Landmark, color: "text-sky-600 bg-sky-50" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ff]">
          <Landmark className="h-5 w-5 text-[#315bd1]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bank Master</h1>
          <p className="text-sm text-slate-500">Manage and sync centralized bank master data</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl shadow-xs p-5 flex items-center gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{loading ? "—" : card.value}</p>
                <p className="text-xs text-slate-500">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters + Sync */}
      <div className="bg-white rounded-2xl shadow-xs p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search bank name..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* AEPS Filter */}
          <select
            value={aepsEnabled}
            onChange={(e) => { setAepsEnabled(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#315bd1]"
          >
            <option value="">AEPS: All</option>
            <option value="true">AEPS: Enabled</option>
            <option value="false">AEPS: Disabled</option>
          </select>

          {/* Payout Filter */}
          <select
            value={payoutEnabled}
            onChange={(e) => { setPayoutEnabled(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#315bd1]"
          >
            <option value="">Payout: All</option>
            <option value="true">Payout: Enabled</option>
            <option value="false">Payout: Disabled</option>
          </select>

          {/* Active Filter */}
          <select
            value={isActive}
            onChange={(e) => { setIsActive(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#315bd1]"
          >
            <option value="">Status: All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* Sync Button */}
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="ml-auto flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ backgroundColor: "#315bd1" }}
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Bank Lists"}
          </button>
        </div>

        {/* Last synced info */}
        <p className="text-xs text-slate-400">
          {lastSyncedAt
            ? `Last synced: ${new Date(lastSyncedAt).toLocaleString()}`
            : "Never synced"}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 animate-pulse">
                <div className="h-4 w-48 rounded bg-slate-100" />
                <div className="h-4 w-20 rounded bg-slate-100" />
                <div className="h-4 w-20 rounded bg-slate-100" />
                <div className="h-4 w-20 rounded bg-slate-100" />
                <div className="h-4 w-20 rounded bg-slate-100" />
                <div className="h-4 w-16 rounded bg-slate-100" />
                <div className="h-4 w-16 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-sm text-red-500">{error}</div>
        ) : banks.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No banks found</p>
            <p className="mt-1 text-xs text-slate-400">Try syncing bank lists or adjusting filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Bank Name", "AEPS", "AEPS ID", "IIN", "Payout", "Code", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {banks.map((bank) => (
                  <tr key={bank._id} className="hover:bg-slate-50/60 transition">
                    {/* Bank Name */}
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[180px] truncate">
                      {bank.bankName}
                    </td>
                    {/* AEPS availability */}
                    <td className="px-4 py-3">
                      <Badge green={bank.aeps.bankId !== null} label={bank.aeps.bankId !== null ? "Available" : "N/A"} />
                    </td>
                    {/* AEPS Bank ID */}
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      {bank.aeps.bankId ?? "—"}
                    </td>
                    {/* IIN */}
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      {bank.aeps.iin ?? "—"}
                    </td>
                    {/* Payout availability */}
                    <td className="px-4 py-3">
                      <Badge green={bank.payout.bankCode !== null} label={bank.payout.bankCode !== null ? "Available" : "N/A"} />
                    </td>
                    {/* Payout Code */}
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      {bank.payout.bankCode ?? "—"}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge active={bank.isActive} />
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Global toggle */}
                        <button
                          type="button"
                          title={bank.isActive ? "Deactivate" : "Activate"}
                          disabled={togglingId === bank._id + "-status"}
                          onClick={() => void handleToggleStatus(bank)}
                          className="rounded-lg p-1.5 transition hover:bg-slate-100 disabled:opacity-50"
                        >
                          {bank.isActive ? (
                            <ToggleRight className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-slate-400" />
                          )}
                        </button>

                        {/* AEPS toggle */}
                        <button
                          type="button"
                          title={bank.aeps.enabled ? "Disable AEPS" : "Enable AEPS"}
                          disabled={togglingId === bank._id + "-aeps"}
                          onClick={() => void handleToggleAeps(bank)}
                          className="rounded-lg p-1.5 transition hover:bg-slate-100 disabled:opacity-50"
                        >
                          {bank.aeps.enabled ? (
                            <ToggleRight className="h-5 w-5 text-[#315bd1]" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-slate-300" />
                          )}
                        </button>

                        {/* Payout toggle */}
                        <button
                          type="button"
                          title={bank.payout.enabled ? "Disable Payout" : "Enable Payout"}
                          disabled={togglingId === bank._id + "-payout"}
                          onClick={() => void handleTogglePayout(bank)}
                          className="rounded-lg p-1.5 transition hover:bg-slate-100 disabled:opacity-50"
                        >
                          {bank.payout.enabled ? (
                            <ToggleRight className="h-5 w-5 text-violet-500" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-slate-300" />
                          )}
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          title="Edit bank"
                          onClick={() => openEdit(bank)}
                          className="rounded-lg p-1.5 transition hover:bg-slate-100"
                        >
                          <Edit2 className="h-4 w-4 text-slate-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && banks.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} &nbsp;·&nbsp; {meta?.total ?? "—"} total banks
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingBank && (
        <ModalWrapper open={true} onClose={() => !isSaving && setEditingBank(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Edit Bank</h2>
              <button
                type="button"
                onClick={() => setEditingBank(null)}
                disabled={isSaving}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: "Bank Name", key: "bankName" as const, placeholder: "e.g. State Bank of India" },
                { label: "AEPS Bank ID", key: "aepsBankId" as const, placeholder: "e.g. 11" },
                { label: "AEPS IIN", key: "aepsIin" as const, placeholder: "e.g. 508505" },
                { label: "Payout Bank Code", key: "payoutBankCode" as const, placeholder: "e.g. 029" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={editForm[field.key]}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#315bd1] focus:bg-white focus:ring-2 focus:ring-[#315bd1]/10"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingBank(null)}
                disabled={isSaving}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveEdit()}
                disabled={isSaving || !editForm.bankName.trim()}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ backgroundColor: "#315bd1" }}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}

