import { useRef, useState } from "react";
import {
  Fingerprint,
  FileText,
  ShieldCheck,
  Upload,
  Circle,
  CheckCircle2,
} from "lucide-react";

const AadhaarStep = () => {
  const aadhaarInputRef = useRef<HTMLInputElement | null>(null);

  const [consent, setConsent] = useState(false);
  const [linkedMobile, setLinkedMobile] = useState<"yes" | "no">("no");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);

  const handleAadhaarUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      setAadhaarFile(file);
    }
  };

  const handleAadhaarChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 12);

    setAadhaarNumber(value);
  };

  const formatAadhaar = (value: string) => {
    return value.replace(/(.{4})/g, "$1 ").trim();
  };

  return (
    <div className="space-y-6">
      {/* HEADER INFORMATION */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f3e8ff]">
          <Fingerprint
            className="h-7 w-7 text-[#7c3aed]"
            strokeWidth={2}
          />
        </div>

        <div className="pt-0.5">
          <h3 className="text-base font-bold text-[#172033]">
            Aadhaar Verification
          </h3>

          <p className="mt-1.5 text-sm leading-6 text-[#8992a3]">
            Verify your Aadhaar information
            <br />
            securely.
          </p>
        </div>
      </div>

      {/* CONSENT */}
      <button
        type="button"
        onClick={() => setConsent((previous) => !previous)}
        className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
          consent
            ? "border-[#7c3aed] bg-[#f3f5ff]"
            : "border-[#dfe1e6] bg-[#fafbfd] hover:border-[#bfc8e8]"
        }`}
      >
        {consent ? (
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-[#7c3aed]"
            strokeWidth={2}
          />
        ) : (
          <Circle
            className="mt-0.5 h-5 w-5 shrink-0 text-[#8992a3]"
            strokeWidth={1.8}
          />
        )}

        <span className="text-sm font-semibold leading-6 text-[#172033]">
          I provide my consent for Aadhaar-based
          <br />
          identity verification.
        </span>
      </button>

      {/* MOBILE LINK QUESTION */}
      <div>
        <p className="mb-3 text-sm font-semibold leading-6 text-[#172033]">
          Is your Aadhaar linked with a mobile number?
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* YES */}
          <button
            type="button"
            onClick={() => setLinkedMobile("yes")}
            className={`flex h-[52px] items-center justify-center gap-2.5 rounded-xl border transition ${
              linkedMobile === "yes"
                ? "border-[#7c3aed] bg-[#f3f5ff] text-[#172033]"
                : "border-[#dfe1e6] bg-[#fafbfd] text-[#172033] hover:border-[#bfc8e8]"
            }`}
          >
            {linkedMobile === "yes" ? (
              <CheckCircle2
                className="h-4 w-4 text-[#7c3aed]"
                strokeWidth={2}
              />
            ) : (
              <Circle
                className="h-4 w-4 text-[#8992a3]"
                strokeWidth={1.8}
              />
            )}

            <span className="text-sm font-semibold">Yes</span>
          </button>

          {/* NO */}
          <button
            type="button"
            onClick={() => setLinkedMobile("no")}
            className={`flex h-[52px] items-center justify-center gap-2.5 rounded-xl border transition ${
              linkedMobile === "no"
                ? "border-[#7c3aed] bg-[#f3f5ff] text-[#172033]"
                : "border-[#dfe1e6] bg-[#fafbfd] text-[#172033] hover:border-[#bfc8e8]"
            }`}
          >
            {linkedMobile === "no" ? (
              <CheckCircle2
                className="h-4 w-4 text-[#7c3aed]"
                strokeWidth={2}
              />
            ) : (
              <Circle
                className="h-4 w-4 text-[#8992a3]"
                strokeWidth={1.8}
              />
            )}

            <span className="text-sm font-semibold">No</span>
          </button>
        </div>
      </div>

      {/* AADHAAR NUMBER */}
      <div>
        <label className="mb-2.5 block text-sm font-semibold text-[#172033]">
          Aadhaar Number
        </label>

        <div className="relative">
          <Fingerprint
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />

          <input
            type="text"
            inputMode="numeric"
            value={formatAadhaar(aadhaarNumber)}
            onChange={handleAadhaarChange}
            placeholder="Enter Aadhaar number"
            maxLength={14}
            className="h-[52px] w-full rounded-xl border border-[#dfe1e6] bg-[#fafbfd] pl-11 pr-5 text-sm font-medium tracking-wide text-[#172033] outline-none transition placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10"
          />
        </div>
      </div>

      {/* AADHAAR DOCUMENT */}
      <button
        type="button"
        onClick={() => aadhaarInputRef.current?.click()}
        className="group flex w-full items-center gap-4 rounded-xl border border-[#dfe1e6] bg-[#fafbfd] px-4 py-3.5 text-left transition hover:border-[#7c3aed] hover:bg-[#f7f9ff]"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f3e8ff]">
          {aadhaarFile ? (
            <CheckCircle2
              className="h-5 w-5 text-[#08ae82]"
              strokeWidth={2}
            />
          ) : (
            <FileText
              className="h-5 w-5 text-[#7c3aed]"
              strokeWidth={2}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-[#172033]">
            Aadhaar Document
          </h3>

          <p className="mt-1 truncate text-sm text-[#8992a3]">
            {aadhaarFile
              ? aadhaarFile.name
              : "Upload Aadhaar front and back images."}
          </p>
        </div>

        <Upload
          className="h-5 w-5 shrink-0 text-[#7c3aed] transition group-hover:scale-105"
          strokeWidth={2.3}
        />
      </button>

      <input
        ref={aadhaarInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        onChange={handleAadhaarUpload}
        className="hidden"
      />

      {/* SECURITY INFORMATION */}
      <div className="flex items-start gap-3 rounded-xl border border-[#d9e0f5] bg-[#f1f4ff] px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e4e9ff]">
          <ShieldCheck
            className="h-5 w-5 text-[#7c3aed]"
            strokeWidth={2}
          />
        </div>

        <p className="text-sm leading-6 text-[#596275]">
          Sensitive Aadhaar information is securely
          <br />
          handled and masked where appropriate.
        </p>
      </div>
    </div>
  );
};

export default AadhaarStep;