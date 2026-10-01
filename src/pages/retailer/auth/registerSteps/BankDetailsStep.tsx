import { useState } from "react";
import {
  Building2,
  CreditCard,
  Hash,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

const BankDetailsStep = () => {
  const [bankName, setBankName] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] =
    useState("");

  const banks = [
    "State Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Bank of Baroda",
    "Punjab National Bank",
    "Other",
  ];

  const handleIfscChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 11);

    setIfscCode(value);
  };

  const handleAccountNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 18);

    setAccountNumber(value);
  };

  const handleConfirmAccountNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 18);

    setConfirmAccountNumber(value);
  };

  const accountsMatch =
    accountNumber.length > 0 &&
    confirmAccountNumber.length > 0 &&
    accountNumber === confirmAccountNumber;

  return (
    <div className="space-y-6">
      {/* BANK NAME */}
      <div>
        <label className="mb-2.5 block text-sm font-semibold text-[#172033]">
          Bank Name
        </label>

        <div className="relative">
          <Building2
            className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />

          <select
            name="bankName" value={bankName}
            onChange={(event) =>
              setBankName(event.target.value)
            }
            className={`h-[54px] w-full appearance-none rounded-xl border bg-[#fafbfd] pl-12 pr-12 text-sm outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10 ${
              bankName
                ? "border-[#7c3aed] font-medium text-[#172033]"
                : "border-[#dfe1e6] text-[#a1a8b5]"
            }`}
          >
            <option value="" disabled>
              Select bank
            </option>

            {banks.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>

          <ChevronDown
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#697386]"
            strokeWidth={2.2}
          />
        </div>
      </div>

      {/* IFSC CODE */}
      <div>
        <label className="mb-2.5 block text-sm font-semibold text-[#172033]">
          IFSC Code
        </label>

        <div className="relative">
          <Hash
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />

          <input
            type="text"
            name="ifscCode" value={ifscCode}
            onChange={handleIfscChange}
            placeholder="Enter IFSC code"
            maxLength={11}
            autoComplete="off"
            className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-5 text-sm uppercase tracking-[0.04em] text-[#172033] outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10 ${
              ifscCode
                ? "border-[#7c3aed]"
                : "border-[#dfe1e6]"
            }`}
          />
        </div>

        <p className="mt-2 text-xs text-[#9299a7]">
          Enter the 11-character IFSC code of your bank
          branch.
        </p>
      </div>

      {/* ACCOUNT NUMBER */}
      <div>
        <label className="mb-2.5 block text-sm font-semibold text-[#172033]">
          Account Number
        </label>

        <div className="relative">
          <CreditCard
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />

          <input
            type="password"
            name="accountNumber" value={accountNumber}
            onChange={handleAccountNumberChange}
            placeholder="Enter account number"
            maxLength={18}
            inputMode="numeric"
            autoComplete="off"
            className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-5 text-sm tracking-[0.08em] text-[#172033] outline-none transition placeholder:tracking-normal placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10 ${
              accountNumber
                ? "border-[#7c3aed]"
                : "border-[#dfe1e6]"
            }`}
          />
        </div>
      </div>

      {/* CONFIRM ACCOUNT NUMBER */}
      <div>
        <label className="mb-2.5 block text-sm font-semibold text-[#172033]">
          Confirm Account Number
        </label>

        <div className="relative">
          <CreditCard
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />

          <input
            type="password"
            value={confirmAccountNumber}
            onChange={handleConfirmAccountNumberChange}
            placeholder="Re-enter account number"
            maxLength={18}
            inputMode="numeric"
            autoComplete="off"
            className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-12 text-sm tracking-[0.08em] text-[#172033] outline-none transition placeholder:tracking-normal placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10 ${
              accountsMatch
                ? "border-[#08ae82]"
                : confirmAccountNumber
                  ? "border-[#d85b5b]"
                  : "border-[#dfe1e6]"
            }`}
          />

          {accountsMatch && (
            <CheckCircle2
              className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#08ae82]"
              strokeWidth={2.2}
            />
          )}
        </div>

        {confirmAccountNumber.length > 0 &&
          accountNumber !== confirmAccountNumber && (
            <p className="mt-2 text-xs font-medium text-[#d85b5b]">
              Account numbers do not match.
            </p>
          )}
      </div>

      {/* SECURITY INFORMATION */}
      <div className="flex items-start gap-3 rounded-xl border border-[#d9e0f5] bg-[#f1f4ff] px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e4e9ff]">
          <ShieldCheck
            className="h-5 w-5 text-[#7c3aed]"
            strokeWidth={2}
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-[#172033]">
            Your bank details are secure
          </p>

          <p className="mt-1 text-xs leading-5 text-[#697386]">
            Your bank account information will be used for
            retailer payouts and transaction settlements.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BankDetailsStep;