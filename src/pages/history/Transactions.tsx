import { useState } from "react";
import { Activity, Search, Eye, X, CheckCircle2, Printer } from "lucide-react";

type ServiceType = "ALL" | "AEPS" | "DMT" | "CMS";

type Transaction = {
  id: string;
  service: "AEPS" | "DMT" | "CMS";
  title: string;
  customerName: string;
  date: string;
  time: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  status: "Success" | "Pending" | "Failed";
};

const transactions: Transaction[] = [
  {
    id: "TXN001",
    service: "AEPS",
    title: "AEPS Cash Withdrawal",
    customerName: "Rahul Sharma",
    date: "2026-09-24",
    time: "10:42 AM",
    amount: 5000,
    type: "CREDIT",
    status: "Success",
  },
  {
    id: "TXN002",
    service: "DMT",
    title: "DMT Money Transfer",
    customerName: "Priya Patel",
    date: "2026-09-24",
    time: "09:18 AM",
    amount: 2500,
    type: "DEBIT",
    status: "Success",
  },
  {
    id: "TXN003",
    service: "CMS",
    title: "CMS Collection",
    customerName: "Neha Gupta",
    date: "2026-09-23",
    time: "05:32 PM",
    amount: 8200,
    type: "CREDIT",
    status: "Success",
  },
  {
    id: "TXN004",
    service: "AEPS",
    title: "AEPS Balance Enquiry",
    customerName: "Amit Singh",
    date: "2026-09-23",
    time: "02:15 PM",
    amount: 0,
    type: "DEBIT",
    status: "Success",
  },
];

export default function Transactions() {
  const [filter, setFilter] = useState<ServiceType>('ALL');
  const [dateStr, setDateStr] = useState<string>("2026-09-24");
  const [search, setSearch] = useState("");
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter(tx => 
    (filter === 'ALL' || tx.service === filter) && 
    (tx.date === dateStr || dateStr === "") &&
    (tx.id.toLowerCase().includes(search.toLowerCase()) || tx.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
          History
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View your complete transaction history.
        </p>
      </section>

      <section className="hp-card overflow-hidden rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div className="flex items-center gap-2 shrink-0">
            <Activity className="h-5 w-5 text-[#7c3aed]" />
            <h2 className="text-base font-bold text-slate-900">
              Transaction Records
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full sm:w-[220px] rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-[#7c3aed] focus:bg-white"
              />
            </div>
            
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-[#7c3aed] focus:bg-white"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ServiceType)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs outline-none"
            >
              <option value="ALL">All Services</option>
              <option value="AEPS">AEPS</option>
              <option value="DMT">DMT</option>
              <option value="CMS">CMS</option>
            </select>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No transactions found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Transaction ID</th>
                  <th className="px-5 py-3 font-semibold">Customer Name</th>
                  <th className="px-5 py-3 font-semibold">Service</th>
                  <th className="px-5 py-3 font-semibold">Flow</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Date & Time</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="text-slate-600 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-[#7c3aed]">{tx.id}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{tx.customerName}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{tx.title}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${tx.type === 'DEBIT' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-5 py-4 font-bold ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${tx.status === 'Success' ? 'bg-[#e5f7ee] text-[#087f5b]' : tx.status === 'Pending' ? 'bg-[#fff2df] text-[#c56b08]' : 'bg-[#ffe6ea] text-[#c21d3d]'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold">{tx.date} <span className="text-slate-400">{tx.time}</span></td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedTxn(tx)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-[#7c3aed] hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* RECEIPT MODAL */}
      {selectedTxn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedTxn(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex flex-col items-center border-b border-slate-100 pb-5 pt-2">
               <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 mb-3">
                 <CheckCircle2 className="h-7 w-7 text-emerald-500" />
               </div>
               <h2 className="text-xl font-bold text-slate-900">{selectedTxn.title}</h2>
               <p className="mt-1 text-sm font-semibold text-slate-500">{selectedTxn.date} at {selectedTxn.time}</p>
               <h3 className={`mt-3 text-3xl font-black ${selectedTxn.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                 ₹{selectedTxn.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
               </h3>
            </div>
            
            <div className="mt-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-bold text-slate-900">{selectedTxn.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Customer Name</span>
                <span className="font-bold text-slate-900">{selectedTxn.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Service</span>
                <span className="font-bold text-slate-900">{selectedTxn.service}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Flow</span>
                <span className={`font-bold ${selectedTxn.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>{selectedTxn.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className={`font-bold ${selectedTxn.status === 'Success' ? 'text-emerald-600' : selectedTxn.status === 'Pending' ? 'text-amber-600' : 'text-rose-600'}`}>{selectedTxn.status}</span>
              </div>
            </div>
            
            <button
              onClick={() => window.print()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}