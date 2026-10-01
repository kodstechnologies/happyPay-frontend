import { useRef, useState } from "react";
import {
  Camera,
  ChevronDown,
  FileBadge,
  FileText,
  Upload,
  CheckCircle2,
} from "lucide-react";

const BusinessProofStep = () => {
  const insideShopInputRef = useRef<HTMLInputElement | null>(null);
  const outsideShopInputRef = useRef<HTMLInputElement | null>(null);
  const shopLocationInputRef = useRef<HTMLInputElement | null>(null);
  const businessProofInputRef = useRef<HTMLInputElement | null>(null);

  const [businessProof, setBusinessProof] = useState("");
  const [businessProofFile, setBusinessProofFile] = useState<File | null>(null);

  const [insideShopFile, setInsideShopFile] = useState<File | null>(null);
  const [outsideShopFile, setOutsideShopFile] = useState<File | null>(null);
  const [shopLocationFile, setShopLocationFile] = useState<File | null>(null);

  const proofOptions = [
    "GST Certificate",
    "UDYAM Certificate",
    "MSME Certificate",
    "Electricity Bill",
    "Rental Agreement",
    "Business Agreement",
    "Shop Lease Agreement",
    "Premises Agreement",
    "Gumasta License",
    "Other Valid Business Proof",
  ];

  const handleBusinessProofUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setBusinessProofFile(file);
    }
  };

  const handleInsideShopUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setInsideShopFile(file);
  };

  const handleOutsideShopUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setOutsideShopFile(file);
  };

  const handleShopLocationUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setShopLocationFile(file);
  };

  return (
    <div className="space-y-6">
      {/* INSIDE SHOP */}
      <button
        type="button"
        onClick={() => insideShopInputRef.current?.click()}
        className={`group flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition ${
          insideShopFile
            ? "border-[#b9e8da] bg-[#f4fcf9]"
            : "border-[#dfe1e6] bg-[#fafbfd] hover:border-[#7c3aed] hover:bg-[#f7f9ff]"
        }`}
      >
        <div className={`flex h-12 w-14 shrink-0 items-center justify-center rounded-xl ${insideShopFile ? "bg-[#e7f8f3]" : "bg-[#e7f8f3]"}`}>
          {insideShopFile ? (
            <CheckCircle2 className="h-5 w-5 text-[#08ae82]" strokeWidth={2.3} />
          ) : (
            <Camera className="h-5 w-5 text-[#08ae82]" strokeWidth={2.2} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-[#172033]">
            Inside Shop
          </h3>

          <p className={`mt-1 text-sm leading-5 truncate ${insideShopFile ? "font-medium text-[#08ae82]" : "text-[#8992a3]"}`}>
            {insideShopFile ? insideShopFile.name : "Take a photo of yourself inside the shop."}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e7f8f3] transition group-hover:bg-[#dcf5ed]">
          <Upload className="h-4.5 w-4.5 text-[#08ae82]" strokeWidth={2.4} />
        </div>
      </button>
      <input
        ref={insideShopInputRef}
        type="file"
        accept="image/*" name="shopInsidePhoto"
        onChange={handleInsideShopUpload}
        className="hidden"
      />

      {/* OUTSIDE SHOP */}
      <button
        type="button"
        onClick={() => outsideShopInputRef.current?.click()}
        className={`group flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition ${
          outsideShopFile
            ? "border-[#b9e8da] bg-[#f4fcf9]"
            : "border-[#dfe1e6] bg-[#fafbfd] hover:border-[#7c3aed] hover:bg-[#f7f9ff]"
        }`}
      >
        <div className={`flex h-12 w-14 shrink-0 items-center justify-center rounded-xl ${outsideShopFile ? "bg-[#e7f8f3]" : "bg-[#e7f8f3]"}`}>
          {outsideShopFile ? (
            <CheckCircle2 className="h-5 w-5 text-[#08ae82]" strokeWidth={2.3} />
          ) : (
            <Camera className="h-5 w-5 text-[#08ae82]" strokeWidth={2.2} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-[#172033]">
            Outside Shop
          </h3>

          <p className={`mt-1 text-sm leading-5 truncate ${outsideShopFile ? "font-medium text-[#08ae82]" : "text-[#8992a3]"}`}>
            {outsideShopFile ? outsideShopFile.name : "Take a clear photo of the shop exterior."}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e7f8f3] transition group-hover:bg-[#dcf5ed]">
          <Upload className="h-4.5 w-4.5 text-[#08ae82]" strokeWidth={2.4} />
        </div>
      </button>
      <input
        ref={outsideShopInputRef}
        type="file"
        accept="image/*" name="shopOutsidePhoto"
        onChange={handleOutsideShopUpload}
        className="hidden"
      />

      {/* SHOP LOCATION */}
      <button
        type="button"
        onClick={() => shopLocationInputRef.current?.click()}
        className={`group flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition ${
          shopLocationFile
            ? "border-[#b9e8da] bg-[#f4fcf9]"
            : "border-[#dfe1e6] bg-[#fafbfd] hover:border-[#7c3aed] hover:bg-[#f7f9ff]"
        }`}
      >
        <div className={`flex h-12 w-14 shrink-0 items-center justify-center rounded-xl ${shopLocationFile ? "bg-[#e7f8f3]" : "bg-[#e7f8f3]"}`}>
          {shopLocationFile ? (
            <CheckCircle2 className="h-5 w-5 text-[#08ae82]" strokeWidth={2.3} />
          ) : (
            <Camera className="h-5 w-5 text-[#08ae82]" strokeWidth={2.2} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-[#172033]">
            Shop Location
          </h3>

          <p className={`mt-1 text-sm leading-5 truncate ${shopLocationFile ? "font-medium text-[#08ae82]" : "text-[#8992a3]"}`}>
            {shopLocationFile ? shopLocationFile.name : "Capture a photo showing the shop location."}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e7f8f3] transition group-hover:bg-[#dcf5ed]">
          <Upload className="h-4.5 w-4.5 text-[#08ae82]" strokeWidth={2.4} />
        </div>
      </button>
      <input
        ref={shopLocationInputRef}
        type="file"
        accept="image/*" name="shopLocationPhoto"
        onChange={handleShopLocationUpload}
        className="hidden"
      />

      {/* ADDRESS / BUSINESS PROOF */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#172033]">
          Address / Business Proof
        </label>

        <div className="relative">
          <FileBadge
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />

          <select
            name="businessProof" value={businessProof}
            onChange={(event) =>
              setBusinessProof(event.target.value)
            }
            className={`h-[52px] w-full appearance-none rounded-xl border bg-[#fafbfd] pl-11 pr-12 text-sm font-medium outline-none transition focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10 ${
              businessProof
                ? "border-[#7c3aed] text-[#172033]"
                : "border-[#dfe1e6] text-[#a1a8b5]"
            }`}
          >
            <option value="" disabled>
              Select proof type
            </option>

            {proofOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <ChevronDown
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#697386]"
            strokeWidth={2.2}
          />
        </div>
      </div>

      {/* BUSINESS PROOF UPLOAD */}
      <button
        type="button"
        onClick={() => businessProofInputRef.current?.click()}
        className={`group flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition ${
          businessProofFile
            ? "border-[#b9e8da] bg-[#f4fcf9]"
            : "border-[#dfe1e6] bg-[#fafbfd] hover:border-[#7c3aed] hover:bg-[#f7f9ff]"
        }`}
      >
        <div
          className={`flex h-12 w-14 shrink-0 items-center justify-center rounded-xl ${
            businessProofFile
              ? "bg-[#e7f8f3]"
              : "bg-[#f3e8ff]"
          }`}
        >
          {businessProofFile ? (
            <CheckCircle2
              className="h-5 w-5 text-[#08ae82]"
              strokeWidth={2.3}
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
            Business Proof
          </h3>

          <p
            className={`mt-1 truncate text-sm leading-5 ${
              businessProofFile
                ? "font-medium text-[#08ae82]"
                : "text-[#8992a3]"
            }`}
          >
            {businessProofFile
              ? businessProofFile.name
              : "Upload the selected business/address proof."}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3e8ff] transition group-hover:bg-[#e4e9ff]">
          <Upload
            className="h-4.5 w-4.5 text-[#7c3aed]"
            strokeWidth={2.4}
          />
        </div>
      </button>

      <input
        ref={businessProofInputRef}
        type="file"
        accept="image/*,.pdf" name="businessProofDocument"
        onChange={handleBusinessProofUpload}
        className="hidden"
      />
    </div>
  );
};

export default BusinessProofStep;