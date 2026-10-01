import { useState } from "react";
import {
  CalendarDays,
  ArrowLeftRight,
  MoreHorizontal,
} from "lucide-react";

const DobStep = () => {
  const [dateOfBirth, setDateOfBirth] = useState("");

  return (
    <div className="space-y-6">
      {/* DATE OF BIRTH */}
      <div>
        <label className="mb-3 block text-sm font-semibold text-[#172033]">
          Date of Birth
        </label>

        <div className="relative">
          <CalendarDays
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />

          <input
            type="text"
            value={dateOfBirth}
            onChange={(event) =>
              setDateOfBirth(event.target.value)
            }
            placeholder="DD/MM/YYYY" name="dob"
            inputMode="numeric"
            className="h-[52px] w-full rounded-xl border border-[#dfe1e6] bg-[#fafbfd] pl-11 pr-5 text-sm font-medium text-[#172033] outline-none transition placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10"
          />
        </div>
      </div>

      {/* DOB VERIFICATION WARNING */}
      <div className="flex items-start gap-3 rounded-xl border border-[#f3d6a5] bg-[#fff8ed] px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff0d8]">
          <MoreHorizontal
            className="h-6 w-6 text-[#e69a22]"
            strokeWidth={2.4}
          />
        </div>

        <p className="text-sm leading-6 text-[#3f3f46]">
          DOB verification will compare PAN, Aadhaar
          <br />
          and retailer-entered information.
        </p>
      </div>

      {/* INFORMATION MESSAGE */}
      <div className="flex items-start gap-3 rounded-xl border border-[#d9e0f5] bg-[#f1f4ff] px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e4e9ff]">
          <ArrowLeftRight
            className="h-5 w-5 text-[#7c3aed]"
            strokeWidth={2}
          />
        </div>

        <p className="text-sm leading-6 text-[#4a5263]">
          Your date of birth will be compared with the
          <br />
          information from PAN and Aadhaar.
        </p>
      </div>
    </div>
  );
};

export default DobStep;