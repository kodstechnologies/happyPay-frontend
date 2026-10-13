import { useRef, useState } from "react";
import {
  Mail,
  Store,
  Shapes,
  Building2,
  MapPin,
  CheckCircle2,
  Navigation,
  Camera,
  ChevronDown,
  FileBadge,
  Upload,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import {
  sendRetailerEmailOtp,
  verifyRetailerEmailOtp,
  updateRetailerShopDetails,
} from "../../../../services/api/retailer/retailerAuthApi";

type ShopDetailsStepProps = {
  userId?: string;
  onShopDetailsSaved?: () => void;
};

const ShopDetailsStep = ({
  userId: userIdProp,
  onShopDetailsSaved,
}: ShopDetailsStepProps) => {
  // Fall back to localStorage so the step works even if the prop wasn't passed
  const userId = userIdProp || localStorage.getItem("retailerUserId") || undefined;
  const locationInputRef = useRef<HTMLInputElement | null>(null);
  const insideShopInputRef = useRef<HTMLInputElement | null>(null);
  const outsideShopInputRef = useRef<HTMLInputElement | null>(null);
  const shopLocationInputRef = useRef<HTMLInputElement | null>(null);
  const businessProofInputRef = useRef<HTMLInputElement | null>(null);

  // -------- Email OTP phase --------
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);

  // -------- Shop details phase --------
  const [shopName, setShopName] = useState("");
  const [category, setCategory] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [businessProof, setBusinessProof] = useState("");
  const [businessProofFile, setBusinessProofFile] = useState<File | null>(null);
  const [insideShopFile, setInsideShopFile] = useState<File | null>(null);
  const [outsideShopFile, setOutsideShopFile] = useState<File | null>(null);
  const [shopLocationFile, setShopLocationFile] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    "Grocery",
    "Electronics",
    "Medical",
    "Clothing",
    "Restaurant",
    "Mobile Shop",
    "General Store",
    "Other",
  ];

  const propertyTypes = ["Owned", "Rented", "Leased", "Co-owned", "Other"];

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

  // ==========================================================
  // EMAIL OTP — send
  // ==========================================================
  const handleSendEmailOtp = async () => {
    setError("");
    if (!userId) return setError("User not registered. Please complete step 1.");
    if (!email.trim()) return setError("Please enter your email.");

    setSendingEmailOtp(true);
    try {
      await sendRetailerEmailOtp({ userId, email: email.trim() });
      setEmailOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email OTP");
    } finally {
      setSendingEmailOtp(false);
    }
  };

  // ==========================================================
  // EMAIL OTP — verify
  // ==========================================================
  const handleVerifyEmailOtp = async () => {
    setError("");
    if (!userId) return setError("User not registered.");
    if (emailOtp.length !== 4 && emailOtp.length !== 6)
      return setError("Please enter a valid OTP.");

    setVerifyingEmailOtp(true);
    try {
      await verifyRetailerEmailOtp({
        userId,
        email: email.trim(),
        otp: emailOtp.trim(),
      });
      setEmailVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email verification failed");
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  // ==========================================================
  // SHOP LOCATION
  // ==========================================================
  const handleLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
      },
      (err) => setError("Location error: " + err.message),
    );
  };

  // ==========================================================
  // FILE HANDLERS
  // ==========================================================
  const handleBusinessProofUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const f = e.target.files?.[0];
    if (f) setBusinessProofFile(f);
  };
  const handleInsideShopUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setInsideShopFile(f);
  };
  const handleOutsideShopUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setOutsideShopFile(f);
  };
  const handleShopLocationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setShopLocationFile(f);
  };

  // ==========================================================
  // SUBMIT FULL SHOP DETAILS
  // ==========================================================
  const handleSubmit = async () => {
    setError("");
    if (!userId) return setError("User not registered.");
    if (!emailVerified) return setError("Please verify your email first.");
    if (!shopName.trim()) return setError("Shop name is required.");
    if (!category) return setError("Shop category is required.");
    if (!propertyType) return setError("Property type is required.");
    if (!address.trim()) return setError("Shop address is required.");
    if (!city.trim()) return setError("City is required.");
    if (!pincode.trim()) return setError("Pincode is required.");
    if (!businessProof) return setError("Business proof type is required.");

    setSubmitting(true);
    try {
      await updateRetailerShopDetails({
        userId,
        shopName,
        shopCategory: category,
        propertyType,
        address,
        city,
        pincode,
        latitude,
        longitude,
        businessProofType: businessProof,
        shopInsidePhoto: insideShopFile,
        shopOutsidePhoto: outsideShopFile,
        shopLocationPhoto: shopLocationFile,
        businessProofDocument: businessProofFile,
      });

      onShopDetailsSaved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save shop details",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="space-y-6">
      {/* =====================================================
          EMAIL ID
      ===================================================== */}
      <div>
        <label
          htmlFor="shop-email"
          className="mb-2.5 block text-[14px] font-semibold text-[#172033]"
        >
          Email ID
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
            strokeWidth={2}
          />
          <input
            id="shop-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailOtpSent(false);
              setEmailVerified(false);
              setEmailOtp("");
            }}
            disabled={emailVerified}
            placeholder="Enter email address"
            className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-5 text-[14px] font-medium text-[#172033] outline-none transition-all placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${emailVerified
              ? "cursor-not-allowed border-[#b9e8d4] bg-[#f4fcf8]"
              : email
                ? "border-[#7c3aed]"
                : "border-[#dfe3e9]"
              }`}
          />
        </div>
      </div>

      {/* =====================================================
          SEND EMAIL OTP
      ===================================================== */}
      {!emailVerified && (
        <button
          type="button"
          onClick={handleSendEmailOtp}
          disabled={sendingEmailOtp || !email.trim() || !userId}
          className={`flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border text-[14px] font-semibold transition-all disabled:opacity-50 ${emailOtpSent
            ? "border-[#b9e8d4] bg-[#f3fcf8] text-[#08a77e]"
            : "border-[#c7d2ee] bg-white text-[#7c3aed] shadow-sm hover:border-[#7c3aed] hover:bg-[#f3f6ff]"
            }`}
        >
          {sendingEmailOtp ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : emailOtpSent ? (
            <CheckCircle2 className="h-5 w-5" strokeWidth={2.2} />
          ) : (
            <Mail className="h-5 w-5" strokeWidth={2} />
          )}
          {sendingEmailOtp
            ? "SENDING..."
            : emailOtpSent
              ? "RESEND EMAIL OTP"
              : "SEND EMAIL OTP"}
        </button>
      )}

      {/* =====================================================
          VERIFY EMAIL OTP
      ===================================================== */}
      {emailOtpSent && !emailVerified && (
        <div className="rounded-2xl border border-[#e1e5ec] bg-[#fafbfd] p-5">
          <p className="text-[14px] font-semibold text-[#172033]">
            Enter email OTP
          </p>
          <p className="mt-1 text-[12px] text-[#8992a3]">
            Enter the OTP sent to {email}
          </p>
          <input
            type="text"
            value={emailOtp}
            onChange={(e) =>
              setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="Enter OTP"
            maxLength={6}
            inputMode="numeric"
            className="mt-3 h-[54px] w-full rounded-xl border border-[#dfe3e9] bg-white px-4 text-center text-[18px] font-bold tracking-[0.4em] text-[#172033] outline-none focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
          />
          <button
            type="button"
            onClick={handleVerifyEmailOtp}
            disabled={verifyingEmailOtp || !emailOtp}
            className="mt-3 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#10a88a] text-[13px] font-bold text-white transition hover:bg-[#0d8a70] disabled:opacity-50"
          >
            {verifyingEmailOtp ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" strokeWidth={2.2} />
            )}
            {verifyingEmailOtp ? "VERIFYING..." : "VERIFY EMAIL OTP"}
          </button>
        </div>
      )}

      {emailVerified && (
        <div className="flex items-center gap-2 rounded-xl border border-[#cce9dc] bg-[#f2fbf7] px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-[#08a77e]" strokeWidth={2.2} />
          <p className="text-[13px] font-semibold text-[#087b5d]">
            Email verified successfully
          </p>
        </div>
      )}

      {/* =====================================================
          SHOP FIELDS — only enabled once email is verified
      ===================================================== */}
      <fieldset
        disabled={!emailVerified}
        className={emailVerified ? "" : "pointer-events-none opacity-50"}
      >
        {/* Shop Name */}
        <div>
          <label
            htmlFor="shop-name"
            className="mb-2.5 block text-[14px] font-semibold text-[#172033]"
          >
            Shop Name
          </label>
          <div className="relative">
            <Store
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
              strokeWidth={2}
            />
            <input
              id="shop-name"
              name="shopName"
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Enter shop name"
              className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-5 text-[14px] font-medium text-[#172033] outline-none transition-all focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${shopName ? "border-[#7c3aed]" : "border-[#dfe3e9]"
                }`}
            />
          </div>
        </div>

        {/* Category + Property Type */}
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SelectField
            label="Shop Category"
            name="shopCategory"
            value={category}
            onChange={setCategory}
            icon={<Shapes />}
            options={categories}
          />
          <SelectField
            label="Property Type"
            name="propertyType"
            value={propertyType}
            onChange={setPropertyType}
            icon={<Building2 />}
            options={propertyTypes}
          />
        </div>

        {/* Address */}
        <div className="mt-5">
          <label
            htmlFor="shop-address"
            className="mb-2.5 block text-[14px] font-semibold text-[#172033]"
          >
            Complete Shop Address
          </label>
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-[#8992a3]"
              strokeWidth={2}
            />
            <textarea
              id="shop-address"
              name="shopAddress"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Enter complete shop address"
              className={`min-h-[100px] w-full resize-none rounded-xl border bg-[#fafbfd] px-5 py-3 pl-12 text-[14px] leading-6 text-[#172033] outline-none transition-all focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${address ? "border-[#7c3aed]" : "border-[#dfe3e9]"
                }`}
            />
          </div>
        </div>

        {/* City + Pincode */}
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2.5 block text-[14px] font-semibold text-[#172033]">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city"
              className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] px-5 text-[14px] font-medium outline-none focus:border-[#7c3aed] focus:bg-white ${city ? "border-[#7c3aed]" : "border-[#dfe3e9]"
                }`}
            />
          </div>
          <div>
            <label className="mb-2.5 block text-[14px] font-semibold text-[#172033]">
              Pincode
            </label>
            <input
              type="text"
              value={pincode}
              onChange={(e) =>
                setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter pincode"
              maxLength={6}
              inputMode="numeric"
              className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] px-5 text-[14px] font-medium outline-none focus:border-[#7c3aed] focus:bg-white ${pincode ? "border-[#7c3aed]" : "border-[#dfe3e9]"
                }`}
            />
          </div>
        </div>

        {/* Shop Location (lat/lng) */}
        <div className="mt-5">
          <label className="mb-2.5 block text-[14px] font-semibold text-[#172033]">
            Shop Location
          </label>
          <button
            type="button"
            onClick={handleLocation}
            className={`flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all ${latitude != null && longitude != null
              ? "border-[#b9e8d4] bg-[#f3fcf8]"
              : "border-[#dfe3e9] bg-[#fafbfd] hover:border-[#7c3aed] hover:bg-white"
              }`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${latitude != null ? "bg-[#e4f7f1]" : "bg-[#edf1fc]"
                }`}
            >
              {latitude != null ? (
                <CheckCircle2
                  className="h-6 w-6 text-[#08a77e]"
                  strokeWidth={2.2}
                />
              ) : (
                <MapPin className="h-6 w-6 text-[#7c3aed]" strokeWidth={2} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-[#172033]">
                {latitude != null && longitude != null
                  ? "Shop Location Captured"
                  : "Pin your shop location"}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[#8992a3]">
                {latitude != null && longitude != null
                  ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                  : "Tap to capture your current location"}
              </p>
            </div>
            <Navigation className="h-5 w-5 text-[#7c3aed]" strokeWidth={2} />
          </button>
          <input ref={locationInputRef} type="text" className="hidden" />
        </div>

        {/* Photos */}
        <PhotoUpload
          label="Inside Shop Photo"
          description="Take a photo of yourself inside the shop."
          file={insideShopFile}
          inputRef={insideShopInputRef}
          onChange={handleInsideShopUpload}
        />
        <PhotoUpload
          label="Outside Shop Photo"
          description="Take a clear photo of the shop exterior."
          file={outsideShopFile}
          inputRef={outsideShopInputRef}
          onChange={handleOutsideShopUpload}
        />
        <PhotoUpload
          label="Shop Location Photo"
          description="Capture a photo showing the shop location."
          file={shopLocationFile}
          inputRef={shopLocationInputRef}
          onChange={handleShopLocationUpload}
        />

        {/* Business Proof Type */}
        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-[#172033]">
            Address / Business Proof
          </label>
          <div className="relative">
            <FileBadge
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8992a3]"
              strokeWidth={2}
            />
            <select
              name="businessProof"
              value={businessProof}
              onChange={(e) => setBusinessProof(e.target.value)}
              className={`h-[52px] w-full appearance-none rounded-xl border bg-[#fafbfd] pl-11 pr-12 text-sm font-medium outline-none focus:border-[#7c3aed] focus:bg-white ${businessProof
                ? "border-[#7c3aed] text-[#172033]"
                : "border-[#dfe1e6] text-[#a1a8b5]"
                }`}
            >
              <option value="" disabled>
                Select proof type
              </option>
              {proofOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#697386]"
              strokeWidth={2.2}
            />
          </div>
        </div>

        {/* Business Proof Upload */}
        <PhotoUpload
          label="Business Proof Document"
          description="Upload the selected business/address proof."
          file={businessProofFile}
          inputRef={businessProofInputRef}
          onChange={handleBusinessProofUpload}
          accept="image/*,.pdf"
        />

        {/* Save button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-6 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#7c3aed] text-[14px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-5 w-5" strokeWidth={2.2} />
          )}
          {submitting ? "SAVING..." : "SAVE SHOP DETAILS"}
        </button>
      </fieldset>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-[#f0cccc] bg-[#fff5f5] px-4 py-3">
          <p className="text-[13px] font-medium text-[#c84f4f]">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-[#9aa1ae]">
        <ShieldCheck className="h-3.5 w-3.5 text-[#7c3aed]" strokeWidth={2} />
        <span>Your details are securely processed.</span>
      </div>
    </div>
  );
};

/* ============================================================
   SelectField
============================================================ */
const SelectField = ({
  label,
  name,
  value,
  onChange,
  icon,
  options,
}: {
  label: string;
  name?: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  options: string[];
}) => (
  <div>
    <label className="mb-2.5 block text-[14px] font-semibold text-[#172033]">
      {label}
    </label>
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8992a3] [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-[54px] w-full appearance-none rounded-xl border bg-[#fafbfd] pl-12 pr-11 text-[14px] font-medium text-[#172033] outline-none transition-all focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${value ? "border-[#7c3aed]" : "border-[#dfe3e9]"
          }`}
      >
        <option value="" disabled>
          Select {label.toLowerCase()}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
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

/* ============================================================
   PhotoUpload
============================================================ */
const PhotoUpload = ({
  label,
  description,
  file,
  inputRef,
  onChange,
  accept = "image/*",
}: {
  label: string;
  description: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
}) => (
  <>
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={`group mt-5 flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition ${file
        ? "border-[#b9e8da] bg-[#f4fcf9]"
        : "border-[#dfe1e6] bg-[#fafbfd] hover:border-[#7c3aed] hover:bg-[#f7f9ff]"
        }`}
    >
      <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl bg-[#e7f8f3]">
        {file ? (
          <CheckCircle2 className="h-5 w-5 text-[#08ae82]" strokeWidth={2.3} />
        ) : (
          <Camera className="h-5 w-5 text-[#08ae82]" strokeWidth={2.2} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-[#172033]">{label}</h3>
        <p
          className={`mt-1 truncate text-sm ${file ? "font-medium text-[#08ae82]" : "text-[#8992a3]"
            }`}
        >
          {file ? file.name : description}
        </p>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e7f8f3]">
        <Upload className="h-4.5 w-4.5 text-[#08ae82]" strokeWidth={2.4} />
      </div>
    </button>
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      onChange={onChange}
      className="hidden"
    />
  </>
);

export default ShopDetailsStep;