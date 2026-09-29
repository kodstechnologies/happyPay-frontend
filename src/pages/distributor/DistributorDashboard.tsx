import React, { useState } from "react";
import { Plus, Search, Store, Phone, Clock, Activity, Eye, X } from "lucide-react";
// import { useNavigate } from "react-router-dom";

interface Retailer {
  id: string;
  name: string;
  mobile: string;
  registeredAt: string;
  status: "Pending" | "Approved" | "Active" | "Blocked";
}

interface RetailerTransaction {
  id: string;
  date: string;
  service: string;
  amount: number;
  status: string;
}

const DUMMY_RETAILERS: Retailer[] = [
  {
    id: "RET-10045",
    name: "Ramesh Kumar",
    mobile: "9876543210",
    registeredAt: "28 Sep 2026, 10:30 AM",
    status: "Active",
  },
  {
    id: "RET-10046",
    name: "Suresh Electronics",
    mobile: "9988776655",
    registeredAt: "27 Sep 2026, 02:15 PM",
    status: "Approved",
  },
  {
    id: "RET-10047",
    name: "Neha Telecom",
    mobile: "9123456789",
    registeredAt: "25 Sep 2026, 11:45 AM",
    status: "Pending",
  },
  {
    id: "RET-10048",
    name: "Vinod Traders",
    mobile: "9898989898",
    registeredAt: "22 Sep 2026, 04:20 PM",
    status: "Blocked",
  },
];

const DUMMY_TRANSACTIONS: RetailerTransaction[] = [
  { id: "TXN-8091", date: "29 Sep 2026, 11:30 AM", service: "AEPS", amount: 500, status: "Success" },
  { id: "TXN-8092", date: "29 Sep 2026, 10:15 AM", service: "DMT", amount: 2000, status: "Success" },
  { id: "TXN-8093", date: "28 Sep 2026, 04:45 PM", service: "CMS", amount: 1500, status: "Failed" },
  { id: "TXN-8094", date: "28 Sep 2026, 02:20 PM", service: "Aadhaar Pay", amount: 300, status: "Pending" },
];

export default function DistributorDashboard() {
  // const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [retailers, setRetailers] = useState<Retailer[]>(DUMMY_RETAILERS);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  
  // Add Retailer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRetailer, setNewRetailer] = useState({ name: "", id: "", mobile: "", email: "" });

  const filteredRetailers = retailers.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.mobile.includes(searchTerm) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "Approved":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "Pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Blocked":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRetailer.name || !newRetailer.id || !newRetailer.mobile) return;
    
    const retailer: Retailer = {
      id: newRetailer.id,
      name: newRetailer.name,
      mobile: newRetailer.mobile,
      registeredAt: new Date().toLocaleString("en-IN", { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
      }),
      status: "Pending", // Default status for new additions
    };
    
    setRetailers([retailer, ...retailers]);
    setIsAddModalOpen(false);
    setNewRetailer({ name: "", id: "", mobile: "", email: "" });
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Distributor Retailers</h1>
          <p className="mt-1 text-sm text-slate-500">Manage retailers added by you.</p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#7c3aed] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#6d28d9]"
        >
          <Plus className="h-5 w-5" />
          Add New Retailer
        </button>
      </header>

      {/* SEARCH */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search retailers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 shadow-sm"
        />
      </div>

      {/* CARDS SECTION */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredRetailers.length > 0 ? (
          filteredRetailers.map((retailer) => (
            <div key={retailer.id} className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-[#7c3aed]/30">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8f5ff] text-[#7c3aed]">
                  <Store className="h-6 w-6" />
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${getStatusBadge(retailer.status)}`}>
                  {retailer.status}
                </span>
              </div>
              
              <div className="mt-4 flex-1">
                <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{retailer.name}</h3>
                <p className="text-sm font-medium text-slate-500">{retailer.id}</p>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>+91 {retailer.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{retailer.registeredAt}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setSelectedRetailer(retailer)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-bold text-[#7c3aed] transition hover:bg-[#7c3aed] hover:text-white"
                >
                  <Eye className="h-4 w-4" />
                  View Transactions
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-500 shadow-sm">
            No retailers found matching your search.
          </div>
        )}
      </div>

      {/* TRANSACTIONS MODAL */}
      {selectedRetailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Retailer Transactions</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {selectedRetailer.name} ({selectedRetailer.id})
                </p>
              </div>
              <button 
                onClick={() => setSelectedRetailer(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {selectedRetailer.status === "Pending" ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
                  <Activity className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-4 text-sm font-bold text-slate-900">Transactions not yet started</p>
                  <p className="mt-1 text-xs text-slate-500">This retailer hasn't processed any transactions yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Txn ID</th>
                        <th className="px-4 py-3 font-semibold">Service</th>
                        <th className="px-4 py-3 font-semibold">Amount</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {DUMMY_TRANSACTIONS.map((txn) => (
                        <tr key={txn.id} className="transition hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-bold text-slate-900">{txn.id}</td>
                          <td className="px-4 py-3 font-semibold">{txn.service}</td>
                          <td className="px-4 py-3 font-black text-slate-800">
                            ₹{txn.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold ${
                              txn.status === 'Success' 
                                ? 'bg-[#e5f7ee] text-[#087f5b]' 
                                : txn.status === 'Pending' 
                                  ? 'bg-[#fff2df] text-[#c56b08]' 
                                  : 'bg-[#ffe6ea] text-[#c21d3d]'
                            }`}>
                              {txn.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">{txn.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD RETAILER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">Add New Retailer</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Retailer ID</label>
                <input 
                  type="text" 
                  required
                  value={newRetailer.id}
                  onChange={e => setNewRetailer({...newRetailer, id: e.target.value})}
                  placeholder="e.g. RET-10050"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#7c3aed] focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Retailer Name</label>
                <input 
                  type="text" 
                  required
                  value={newRetailer.name}
                  onChange={e => setNewRetailer({...newRetailer, name: e.target.value})}
                  placeholder="e.g. John Doe"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#7c3aed] focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Mobile Number</label>
                <input 
                  type="text" 
                  required
                  pattern="[0-9]{10}"
                  value={newRetailer.mobile}
                  onChange={e => setNewRetailer({...newRetailer, mobile: e.target.value})}
                  placeholder="10-digit mobile number"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#7c3aed] focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Email Address</label>
                <input 
                  type="email"
                  value={newRetailer.email}
                  onChange={e => setNewRetailer({...newRetailer, email: e.target.value})}
                  placeholder="retailer@example.com"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#7c3aed] focus:bg-white"
                />
              </div>

              <div className="mt-6 pt-2">
                <button 
                  type="submit"
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-[#7c3aed] font-bold text-white transition hover:bg-[#6d28d9] shadow-md shadow-[#7c3aed]/20"
                >
                  Add Retailer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
