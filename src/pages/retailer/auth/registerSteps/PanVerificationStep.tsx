import { useRef, useState } from "react";
import {
  CreditCard,
  Upload,
  UserRound,
  CalendarDays,
  Sparkles,
  Check,
} from "lucide-react";

const PanVerificationStep = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [panFile, setPanFile] = useState<File | null>(null);
  const [panNumber, setPanNumber] = useState("");
  const [nameAsPerPan, setNameAsPerPan] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [fatherName, setFatherName] = useState("");

  const handlePanUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      setPanFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* PAN CARD UPLOAD */}
      <div>
        <label className="mb-3 block text-sm font-semibold text-[#172033]">
          PAN Card
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handlePanUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group flex min-h-[92px] w-full items-center gap-4 rounded-xl border-2 border-dashed border-[#dfe1e6] bg-[#fafbfd] px-4 py-4 text-left transition hover:border-[#7c3aed] hover:bg-[#f7f9ff]"
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              panFile ? "bg-[#e9f9f4]" : "bg-[#f3e8ff]"
            }`}
          >
            {panFile ? (
              <Check
                className="h-6 w-6 text-[#08ae82]"
                strokeWidth={2.5}
              />
            ) : (
              <CreditCard
                className="h-6 w-6 text-[#7c3aed]"
                strokeWidth={2}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-[#172033]">
              {panFile ? "PAN Card Uploaded" : "Upload PAN Card"}
            </h3>

            <p className="mt-1 truncate text-sm text-[#8992a3]">
              {panFile
                ? panFile.name
                : "Upload a clear image of your PAN card."}
            </p>

            {!panFile && (
              <p className="mt-1 text-xs text-[#a1a8b5]">
                Image or PDF format
              </p>
            )}
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f3e8ff] transition group-hover:bg-[#e4e9ff]">
            <Upload
              className="h-5 w-5 text-[#7c3aed]"
              strokeWidth={2.3}
            />
          </div>
        </button>
      </div>

      {/* PAN NUMBER */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#172033]">
          PAN Number
        </label>

        <div className="relative">
          <CreditCard
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />

          <input
            type="text"
            value={panNumber}
            onChange={(event) =>
              setPanNumber(
                event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 10),
              )
            }
            placeholder="PAN number"
            maxLength={10}
            className="h-[52px] w-full rounded-xl border border-[#dfe1e6] bg-[#fafbfd] pl-11 pr-5 text-sm font-medium tracking-wide text-[#172033] outline-none transition placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10"
          />
        </div>
      </div>

      {/* NAME AS PER PAN */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#172033]">
          Name as per PAN
        </label>

        <div className="relative">
          <UserRound
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />

          <input
            type="text"
            value={nameAsPerPan}
            onChange={(event) =>
              setNameAsPerPan(event.target.value)
            }
            placeholder="Name extracted from PAN"
            className="h-[52px] w-full rounded-xl border border-[#dfe1e6] bg-[#fafbfd] pl-11 pr-5 text-sm font-medium text-[#172033] outline-none transition placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10"
          />
        </div>
      </div>

      {/* DATE OF BIRTH */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#172033]">
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
            placeholder="DD/MM/YYYY"
            className="h-[52px] w-full rounded-xl border border-[#dfe1e6] bg-[#fafbfd] pl-11 pr-5 text-sm font-medium text-[#172033] outline-none transition placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10"
          />
        </div>
      </div>

      {/* FATHER'S NAME */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#172033]">
          Father's Name
        </label>

        <div className="relative">
          <UserRound
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />

          <input
            type="text"
            value={fatherName}
            onChange={(event) =>
              setFatherName(event.target.value)
            }
            placeholder="Father's name"
            className="h-[52px] w-full rounded-xl border border-[#dfe1e6] bg-[#fafbfd] pl-11 pr-5 text-sm font-medium text-[#172033] outline-none transition placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/10"
          />
        </div>
      </div>

      {/* OCR INFORMATION */}
      <div className="flex items-start gap-3 rounded-xl border border-[#d9e0f5] bg-[#f1f4ff] px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e4e9ff]">
          <Sparkles
            className="h-4.5 w-4.5 text-[#7c3aed]"
            strokeWidth={2}
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-[#7c3aed]">
            Automatic PAN verification
          </p>

          <p className="mt-1 text-xs leading-5 text-[#667085]">
            PAN information can be extracted
            <br />
            automatically using OCR.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PanVerificationStep;