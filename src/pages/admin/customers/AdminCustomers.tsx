import { RefreshCw, Search, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const dummyCustomers = [
  { id: "CUST001", name: "Ramesh Kumar", mobile: "9823145670", aadhar: "XXXX-XXXX-1234", account: "9876543210123", txType: "AEPS Cash Withdraw", amount: "₹5,000", commission: "₹15" },
  { id: "CUST002", name: "Suresh Singh", mobile: "8765091234", aadhar: "XXXX-XXXX-5678", account: "1122334455667", txType: "DMT", amount: "₹15,000", commission: "₹45" },
  { id: "CUST003", name: "Anil Patel", mobile: "9012384756", aadhar: "XXXX-XXXX-9012", account: null, txType: "AEPS Balance Enquiry", amount: "-", commission: "-" },
  { id: "CUST004", name: "Sunita Devi", mobile: "7845129630", aadhar: "XXXX-XXXX-3456", account: "9988776655443", txType: "CMS Cash Drop", amount: "₹8,500", commission: "₹20" },
  { id: "CUST005", name: "Kiran Sharma", mobile: "9356281740", aadhar: "XXXX-XXXX-7890", account: "5544332211009", txType: "AEPS Cash Deposit", amount: "₹2,500", commission: "₹8" },
];

export default function AdminCustomers() {

  const [items, setItems] = useState(dummyCustomers);
  const [search, setSearch] = useState("");
  const [txFilter, setTxFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      let filteredItems = [...dummyCustomers];
      if (search) {
        const query = search.toLowerCase();
        filteredItems = filteredItems.filter(item => 
          item.name.toLowerCase().includes(query) ||
          item.mobile.includes(query) ||
          item.txType.toLowerCase().includes(query)
        );
      }
      if (txFilter) {
        filteredItems = filteredItems.filter(item => item.txType.includes(txFilter));
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
          Management
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Customers
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View details of end-customers transacting across all retailers.
        </p>
      </section>

      <section className="hp-card overflow-hidden rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div className="flex items-center gap-2 shrink-0">
            <Users className="h-5 w-5 text-[#315bd1]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Customer records
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {total.toLocaleString("en-IN")} total customers
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
                placeholder="Name, mobile..."
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
              <option value="">All Types</option>
              <option value="AEPS Cash Withdraw">AEPS Cash Withdraw</option>
              <option value="CMS Cash Drop">CMS Cash Drop</option>
              <option value="DMT">DMT</option>
              <option value="UPI Cashpoint">UPI Cashpoint</option>
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
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="hp-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile Number</th>
                  <th>Aadhar Number</th>
                  <th>Account Number</th>
                  <th>Type of Transaction</th>
                  <th>Transaction Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((customer) => (
                  <tr key={customer.id}>
                    <td className="font-bold text-slate-800">{customer.name}</td>
                    <td>{customer.mobile}</td>
                    <td className="font-medium">{customer.aadhar}</td>
                    <td className="font-medium text-slate-600">{customer.account ? `XXXX${customer.account.slice(-3)}` : "-"}</td>
                    <td><span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-bold">{customer.txType}</span></td>
                    <td className="font-bold text-emerald-600">
                      {customer.amount}
                      {customer.commission && customer.commission !== "-" && (
                        <span className="text-xs text-emerald-500 font-normal ml-1">({customer.commission})</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
