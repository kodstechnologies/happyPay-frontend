import { useState } from "react";
import { Plus, WalletCards, X, ArrowRightLeft } from "lucide-react";
import { getWalletBalance, setWalletBalance } from "../../../utils/wallet";
import SettlementModal from "./SettlementModal";

const formatAmount = (amount: number) => amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Wallet() {
  const [balance, setBalance] = useState(getWalletBalance);
  const [amount, setAmount] = useState("500");
  const [open, setOpen] = useState(false);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [message, setMessage] = useState("");

  const addMoney = () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;
    const nextBalance = balance + numericAmount;
    setBalance(nextBalance);
    setWalletBalance(nextBalance);
    setAmount("500");
    setOpen(false);
    setMessage(`₹${formatAmount(numericAmount)} added to your wallet.`);
    window.setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
          Overview
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#171717]">Wallet</h1>
        <p className="mt-1 text-sm text-[#8992a3]">Manage your available retailer wallet balance.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#64748b]">Available Balance</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#171717]">
                ₹{formatAmount(balance)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8f5ff] text-[#7c3aed]">
              <WalletCards className="h-5 w-5" />
            </div>
          </div>
          
          <div className="mt-5 flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => setOpen(true)} 
              className="inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#6d28d9]"
            >
              <Plus className="h-4 w-4" />
              Add Money
            </button>
            <button 
              type="button" 
              onClick={() => setSettlementModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Settlement
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-[#f8f5ff] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64748b]">
            Account Snapshot
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs text-[#64748b]">Today's Earnings</p>
              <p className="mt-1 text-base font-bold text-[#171717]">₹1,250.00</p>
            </div>
            <div>
              <p className="text-xs text-[#64748b]">Retailer ID</p>
              <p className="mt-1 text-base font-bold text-[#171717]">HP100245</p>
            </div>
          </div>
        </div>
      </section>

      {message && (
        <div role="status" className="rounded-xl bg-[#e5f7ee] px-4 py-3 text-sm font-semibold text-[#087f5b]">
          {message}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#171717]">Add Money to Wallet</h2>
                <p className="mt-1 text-xs text-[#8992a3]">Current balance: ₹{formatAmount(balance)}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setOpen(false)} 
                className="rounded-lg p-2 text-slate-400 hover:bg-[#f8f5ff] hover:text-[#7c3aed]" 
                aria-label="Close add money modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mt-5 block text-xs font-semibold text-slate-600">
              Enter amount
              <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-[#7c3aed] focus-within:bg-white">
                <span className="text-lg font-semibold text-slate-400">₹</span>
                <input 
                  autoFocus 
                  value={amount} 
                  onChange={(event) => setAmount(event.target.value.replace(/\D/g, "").slice(0, 6))} 
                  inputMode="numeric" 
                  className="h-12 min-w-0 flex-1 bg-transparent px-2 text-xl font-bold text-[#171717] outline-none" 
                />
              </div>
            </label>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {["500", "1000", "2000", "5000"].map((value) => (
                <button 
                  key={value} 
                  type="button" 
                  onClick={() => setAmount(value)} 
                  className={`rounded-lg border py-2 text-xs font-semibold ${amount === value ? "border-[#7c3aed] bg-[#7c3aed] text-white" : "border-slate-200 text-slate-600 hover:border-[#7c3aed]/40"}`}
                >
                  ₹{value}
                </button>
              ))}
            </div>
            <button 
              type="button" 
              onClick={addMoney} 
              disabled={!amount || Number(amount) <= 0} 
              className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-[#7c3aed] text-sm font-bold text-white hover:bg-[#6d28d9] disabled:opacity-50"
            >
              Proceed
            </button>
          </div>
        </div>
      )}

      <SettlementModal
        open={settlementModalOpen}
        onClose={() => setSettlementModalOpen(false)}
        onSuccess={(amount, type) => {
          const nextBalance = balance - amount;
          setBalance(nextBalance);
          setWalletBalance(nextBalance);
          const typeName = type === "bank" ? "primary bank account" : type === "retailer" ? "retailer wallet" : "distributor account";
          setMessage(`Successfully transferred ₹${formatAmount(amount)} to ${typeName}.`);
          window.setTimeout(() => setMessage(""), 3000);
        }}
      />
    </div>
  );
}
