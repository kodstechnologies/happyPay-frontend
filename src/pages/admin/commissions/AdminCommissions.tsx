import { RefreshCw, Search, CircleDollarSign } from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import { useCallback, useEffect, useState } from "react";

const allCommissions = [
  { id: "1", txName: "AePS Cash Withdraw", amountRange: "100 - 3000", commission: "0.43%", distributorCommission: "5%" },
  { id: "2", txName: "AePS Cash Withdraw", amountRange: "3001 - 10000", commission: "₹14.10/-", distributorCommission: "5%" },
  { id: "3", txName: "AePS Cash Deposit", amountRange: "100 - 3000", commission: "0.40%", distributorCommission: "5%" },
  { id: "4", txName: "AePS Cash Deposit", amountRange: "3001 - 7500", commission: "₹13.50/-", distributorCommission: "5%" },
  { id: "5", txName: "UPI Cash Point", amountRange: "100 - 3000", commission: "0.40%", distributorCommission: "5%" },
  { id: "6", txName: "UPI Cash Point", amountRange: "3001 - 5000", commission: "₹14.10/-", distributorCommission: "5%" },
  { id: "7", txName: "Mini Statement", amountRange: "Any", commission: "₹1.30/-", distributorCommission: "5%" },

  { id: "11", txName: "Bank Account Opening (NSDL)", amountRange: "Any", commission: "₹100/-", distributorCommission: "5%" },
  { id: "12", txName: "Mobile Recharge (Jio)", amountRange: "Any", commission: "1.80%", distributorCommission: "5%" },
  { id: "13", txName: "Mobile Recharge (Airtel)", amountRange: "Any", commission: "2.10%", distributorCommission: "5%" },
  { id: "14", txName: "DTH Recharge", amountRange: "Any", commission: "5%", distributorCommission: "5%" },
  { id: "15", txName: "BBPS Electricity", amountRange: "Any", commission: "0.30%", distributorCommission: "5%" },
  { id: "16", txName: "DMT", amountRange: "100 - 1000", commission: "₹2.50/- (charge)", distributorCommission: "5%" },
  { id: "17", txName: "DMT", amountRange: "1001 - 2000", commission: "₹2.50/- (charge)", distributorCommission: "5%" },
  { id: "18", txName: "DMT", amountRange: "2001 - 3000", commission: "₹3.00/- (charge)", distributorCommission: "5%" },
  { id: "19", txName: "DMT", amountRange: "3001 - 4000", commission: "₹3.00/- (charge)", distributorCommission: "5%" },
  { id: "20", txName: "DMT", amountRange: "4001 - 5000", commission: "₹4.00/- (charge)", distributorCommission: "5%" },
  { id: "21", txName: "Payout (IMPS)", amountRange: "₹100 - ₹1000", commission: "₹3 + GST", distributorCommission: "5%" },
  { id: "22", txName: "Payout (IMPS)", amountRange: "₹1001 - ₹25000", commission: "₹5 + GST", distributorCommission: "5%" },
  { id: "23", txName: "Payout (IMPS)", amountRange: "₹25001 - ₹50000", commission: "₹7 + GST", distributorCommission: "5%" },
  { id: "24", txName: "Payout (NEFT)", amountRange: "Any", commission: "₹2 Per Tx", distributorCommission: "5%" },
  { id: "25", txName: "CMS", amountRange: "Any", commission: "0.10% - 0.32%", distributorCommission: "5%" },
];

export default function AdminCommissions() {

  const [items, setItems] = useState(allCommissions);
  const [search, setSearch] = useState("");
  const [txFilter, setTxFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 10;

  const load = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      let filteredItems = [...allCommissions];
      if (search) {
        const query = search.toLowerCase();
        filteredItems = filteredItems.filter(item => 
          item.txName.toLowerCase().includes(query) ||
          item.amountRange.toLowerCase().includes(query) ||
          item.commission.toLowerCase().includes(query)
        );
      }
      if (txFilter) {
        filteredItems = filteredItems.filter(item => item.txName.toLowerCase().includes(txFilter.toLowerCase()));
      }

      setItems(filteredItems);
      setTotal(filteredItems.length);
      setTotalPages(Math.ceil(filteredItems.length / 10) || 1);
      setLoading(false);
    }, 400); // Simulate network latency
  }, [search, txFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, page]);

  const handleSearch = () => {
    setPage(1);
    load();
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#315bd1]">
          Configuration
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Commissions
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View all platform commission rates and transactional charges.
        </p>
      </section>

      <section className="hp-card overflow-hidden rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div className="flex items-center gap-2 shrink-0">
            <CircleDollarSign className="h-5 w-5 text-[#315bd1]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Commission Records
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {total.toLocaleString("en-IN")} records found
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Search commissions..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-[#315bd1] focus:bg-white"
              />
            </div>

            <select
              value={txFilter}
              onChange={(event) => {
                setTxFilter(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs outline-none"
            >
              <option value="">All Services</option>
              <option value="AePS">AePS</option>
              <option value="UPI">UPI</option>
              <option value="DMT">DMT</option>
              <option value="BBPS">BBPS</option>
            </select>

            <button
              type="button"
              onClick={() => load()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="hp-table">
              <thead>
                <tr>
                  <th>Transaction Name</th>
                  <th>Amount Range</th>
                  <th>Retailer Commission</th>
                  <th>Distributor Commission</th>
                </tr>
              </thead>
              <tbody>
                {items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((record) => (
                  <tr key={record.id}>
                    <td className="font-bold text-[#315bd1]">{record.txName}</td>
                    <td className="font-medium text-slate-700">{record.amountRange}</td>
                    <td className="font-bold text-emerald-600">{record.commission}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 ring-1 ring-violet-200/60">
                        {record.distributorCommission}
                        <span className="font-medium text-violet-500">of Retailer</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={total}
            pageSize={PAGE_SIZE}
          />
        </div>
      </section>
    </div>
  );
}
