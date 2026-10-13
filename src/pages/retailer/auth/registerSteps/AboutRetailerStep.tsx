import {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  UserRound,
  Camera,
  UsersRound,
  Heart,
  GraduationCap,
  Check,
  ChevronDown,
  CalendarDays,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { updateRetailerAboutDetails } from "../../../../services/api/retailer/retailerAuthApi";

export type AboutRetailerStepHandle = {
  submit: () => Promise<boolean>;
};

type AboutRetailerStepProps = {
  userId?: string;
};

const GENDER_TO_CODE: Record<string, "M" | "F" | "T"> = {
  Male: "M",
  Female: "F",
  Other: "T",
};

const AboutRetailerStep = forwardRef<
  AboutRetailerStepHandle,
  AboutRetailerStepProps
>(({ userId: userIdProp }, ref) => {
  const userId =
    userIdProp || localStorage.getItem("retailerUserId") || undefined;

  const selfieInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState("");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [education, setEducation] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ==========================================================
  // FILE
  // ==========================================================
  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelfie(file);
  };

  // ==========================================================
  // DOB input → auto-insert slashes
  // ==========================================================
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 8);
    if (v.length >= 5) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    else if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    setDateOfBirth(v);
  };

  const toIsoDob = (dob: string): string => {
    const [dd, mm, yyyy] = dob.split("/");
    if (!dd || !mm || !yyyy || yyyy.length !== 4) return "";
    return `${yyyy}-${mm}-${dd}`;
  };

  // ==========================================================
  // SUBMIT (called by parent's Continue button)
  // ==========================================================
  const handleSubmit = async (): Promise<boolean> => {
    setError("");

    if (!userId) {
      setError("User not registered. Please complete step 1.");
      return false;
    }
    if (!fullName.trim()) {
      setError("Full name is required.");
      return false;
    }
    if (!dateOfBirth) {
      setError("Date of birth is required.");
      return false;
    }
    const isoDob = toIsoDob(dateOfBirth);
    if (!isoDob) {
      setError("Please enter a valid date of birth (DD/MM/YYYY).");
      return false;
    }
    if (!gender) {
      setError("Gender is required.");
      return false;
    }
    if (!maritalStatus) {
      setError("Marital status is required.");
      return false;
    }
    if (!education.trim()) {
      setError("Educational qualification is required.");
      return false;
    }
    if (!selfie) {
      setError("Selfie is required.");
      return false;
    }

    const genderCode = GENDER_TO_CODE[gender] ?? "M";

    setSubmitting(true);
    try {
      await updateRetailerAboutDetails({
        userId,
        fullName: fullName.trim(),
        dateOfBirth: isoDob,
        gender: genderCode,
        maritalStatus,
        educationalQualification: education.trim(),
        selfie,
      });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save details");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
  }));

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="space-y-6">
      {/* FULL NAME */}
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
            id="retailer-full-name"
            name="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-5 text-[14px] font-medium text-[#172033] outline-none transition-all placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${
              fullName ? "border-[#7c3aed]" : "border-[#dfe3e9]"
            }`}
          />
        </div>
      </div>

      {/* SELFIE */}
      <div>
        <label className="mb-2.5 block text-[14px] font-semibold text-[#172033]">
          Selfie
        </label>
        <input
          ref={selfieInputRef}
          type="file"
          accept="image/*"
          name="selfie"
          onChange={handleSelfieUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => selfieInputRef.current?.click()}
          className={`flex min-h-[150px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 text-center transition-all ${
            selfie
              ? "border-[#b9e8d4] bg-[#f3fcf8]"
              : "border-[#dfe3e9] bg-[#fafbfd] hover:border-[#7c3aed] hover:bg-[#f3f6ff]"
          }`}
        >
          {selfie ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e2f7ef]">
                <Check className="h-6 w-6 text-[#08a77e]" strokeWidth={2.5} />
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
                <Camera className="h-6 w-6 text-[#7c3aed]" strokeWidth={2} />
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

      {/* DOB */}
      <div>
        <label
          htmlFor="retailer-dob"
          className="mb-2.5 block text-[14px] font-semibold text-[#172033]"
        >
          Date of Birth
        </label>
        <div className="relative">
          <CalendarDays
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />
          <input
            id="retailer-dob"
            name="dateOfBirth"
            type="text"
            value={dateOfBirth}
            onChange={handleDobChange}
            placeholder="DD/MM/YYYY"
            inputMode="numeric"
            maxLength={10}
            className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-5 text-[14px] font-medium text-[#172033] outline-none transition-all placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${
              dateOfBirth ? "border-[#7c3aed]" : "border-[#dfe3e9]"
            }`}
          />
        </div>
      </div>

      {/* GENDER */}
      <SelectField
        label="Gender"
        name="gender"
        value={gender}
        onChange={setGender}
        icon={<UsersRound />}
        options={["Male", "Female", "Other"]}
      />

      {/* MARITAL STATUS */}
      <SelectField
        label="Marital Status"
        name="maritalStatus"
        value={maritalStatus}
        onChange={setMaritalStatus}
        icon={<Heart />}
        options={["Single", "Married", "Divorced", "Widowed", "Other"]}
      />

      {/* EDUCATIONAL QUALIFICATION */}
      <div>
        <label
          htmlFor="retailer-education"
          className="mb-2.5 block text-[14px] font-semibold text-[#172033]"
        >
          Educational Qualification
        </label>
        <div className="relative">
          <GraduationCap
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />
          <input
            id="retailer-education"
            name="educationalQualification"
            type="text"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="e.g. Graduate, 12th, B.Com"
            className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-5 text-[14px] font-medium text-[#172033] outline-none transition-all placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${
              education ? "border-[#7c3aed]" : "border-[#dfe3e9]"
            }`}
          />
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-[#f0cccc] bg-[#fff5f5] px-4 py-3">
          <p className="text-[13px] font-medium text-[#c84f4f]">{error}</p>
        </div>
      )}

      {/* Submitting indicator — parent button stays clickable */}
      {submitting && (
        <div className="flex items-center justify-center gap-2 text-[12px] text-[#7c3aed]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving your details...
        </div>
      )}

      <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-[#9aa1ae]">
        <ShieldCheck className="h-3.5 w-3.5 text-[#7c3aed]" strokeWidth={2} />
        <span>Your personal details are securely stored.</span>
      </div>
    </div>
  );
});

AboutRetailerStep.displayName = "AboutRetailerStep";

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
}: SelectFieldProps) => (
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
        onChange={(e) => onChange(e.target.value)}
        className={`h-[54px] w-full appearance-none rounded-xl border bg-[#fafbfd] pl-12 pr-11 text-[14px] font-medium text-[#172033] outline-none transition-all focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${
          value ? "border-[#7c3aed]" : "border-[#dfe3e9]"
        }`}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
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

export default AboutRetailerStep;