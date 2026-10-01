import { useRef, useState } from "react";
import {
  UserRound,
  Camera,
  UsersRound,
  Heart,
  GraduationCap,
  Check,
  ChevronDown,
} from "lucide-react";

const AboutRetailerStep = () => {
  const selfieInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState("");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [education, setEducation] = useState("");

  const handleSelfieUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      setSelfie(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* =====================================================
          FULL NAME
      ===================================================== */}

      <div>
        <label
          htmlFor="retailer-full-name"
          className="mb-2.5 block text-[14px] font-semibold text-[#172033]"
        >
          Full Name
        </label>

        <div className="relative">
          <UserRound
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />

          <input
            id="retailer-full-name" name="name"
            type="text"
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
            placeholder="Enter your full name"
            className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-5 text-[14px] font-medium text-[#172033] outline-none transition-all placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${
              fullName
                ? "border-[#7c3aed]"
                : "border-[#dfe3e9]"
            }`}
          />
        </div>
      </div>

      {/* =====================================================
          SELFIE
      ===================================================== */}

      <div>
        <label className="mb-2.5 block text-[14px] font-semibold text-[#172033]">
          Selfie
        </label>

        <input
          ref={selfieInputRef}
          type="file"
          accept="image/*" name="selfie"
          onChange={handleSelfieUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() =>
            selfieInputRef.current?.click()
          }
          className={`flex min-h-[150px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 text-center transition-all ${
            selfie
              ? "border-[#b9e8d4] bg-[#f3fcf8]"
              : "border-[#dfe3e9] bg-[#fafbfd] hover:border-[#7c3aed] hover:bg-[#f3f6ff]"
          }`}
        >
          {selfie ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e2f7ef]">
                <Check
                  className="h-6 w-6 text-[#08a77e]"
                  strokeWidth={2.5}
                />
              </div>

              <span className="mt-3 max-w-full truncate px-4 text-[14px] font-semibold text-[#087b5d]">
                {selfie.name}
              </span>

              <span className="mt-1 text-[12px] text-[#6d8078]">
                Selfie uploaded successfully
              </span>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf1fc]">
                <Camera
                  className="h-6 w-6 text-[#7c3aed]"
                  strokeWidth={2}
                />
              </div>

              <span className="mt-3 text-[14px] font-semibold text-[#172033]">
                Upload Selfie
              </span>

              <span className="mt-1 text-[12px] text-[#8992a3]">
                Click to select an image
              </span>
            </>
          )}
        </button>
      </div>

      {/* =====================================================
          GENDER
      ===================================================== */}

      <SelectField
        label="Gender"
        name="gender"
        value={gender}
        onChange={setGender}
        icon={<UsersRound />}
        options={[
          "Male",
          "Female",
          "Other",
        ]}
      />

      {/* =====================================================
          MARITAL STATUS
      ===================================================== */}

      <SelectField
        label="Marital Status"
        name="maritalStatus"
        value={maritalStatus}
        onChange={setMaritalStatus}
        icon={<Heart />}
        options={[
          "Single",
          "Married",
          "Divorced",
          "Widowed",
          "Other",
        ]}
      />

      {/* =====================================================
          EDUCATIONAL QUALIFICATION
      ===================================================== */}

      <SelectField
        label="Educational Qualification"
        name="educationalQualification"
        value={education}
        onChange={setEducation}
        icon={<GraduationCap />}
        options={[
          "10th",
          "12th",
          "Diploma",
          "Graduate",
          "Post Graduate",
          "Other",
        ]}
      />
    </div>
  );
};

/* ============================================================
   SELECT FIELD
============================================================ */

interface SelectFieldProps {
  label: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  options: string[];
}

const SelectField = ({
  label,
  name,
  value,
  onChange,
  icon,
  options,
}: SelectFieldProps) => {
  return (
    <div>
      <label className="mb-2.5 block text-[14px] font-semibold text-[#172033]">
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8992a3] [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>

        <select
          name={name}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className={`h-[54px] w-full appearance-none rounded-xl border bg-[#fafbfd] pl-12 pr-11 text-[14px] font-medium text-[#172033] outline-none transition-all focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${
            value
              ? "border-[#7c3aed]"
              : "border-[#dfe3e9]"
          }`}
        >
          <option value="">
            Select {label}
          </option>

          {options.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>

        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#697386]"
          strokeWidth={2}
        />
      </div>
    </div>
  );
};

export default AboutRetailerStep;