import { useRef, useState } from "react";
import {
  Mail,
  Store,
  Shapes,
  Building2,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Navigation,
} from "lucide-react";

const ShopDetailsStep = () => {
  const locationInputRef = useRef<HTMLInputElement | null>(null);

  const [email, setEmail] = useState("");
  const [shopName, setShopName] = useState("");
  const [category, setCategory] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [address, setAddress] = useState("");
  const [locationAdded, setLocationAdded] = useState(false);

  const [emailOtpSent, setEmailOtpSent] = useState(false);

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

  const propertyTypes = [
    "Owned",
    "Rented",
    "Leased",
    "Co-owned",
    "Other",
  ];

  const handleSendEmailOtp = () => {
    if (!email.trim()) {
      return;
    }

    setEmailOtpSent(true);
  };

  const handleLocation = () => {
    setLocationAdded(true);
  };

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
            id="shop-email" name="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailOtpSent(false);
            }}
            placeholder="Enter email address"
            className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-5 text-[14px] font-medium text-[#172033] outline-none transition-all placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${
              email
                ? "border-[#7c3aed]"
                : "border-[#dfe3e9]"
            }`}
          />
        </div>
      </div>

      {/* =====================================================
          VERIFY EMAIL OTP
      ===================================================== */}

      <button
        type="button"
        onClick={handleSendEmailOtp}
        className={`flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border text-[14px] font-semibold transition-all ${
          emailOtpSent
            ? "border-[#b9e8d4] bg-[#f3fcf8] text-[#08a77e]"
            : "border-[#c7d2ee] bg-white text-[#7c3aed] shadow-sm hover:border-[#7c3aed] hover:bg-[#f3f6ff]"
        }`}
      >
        {emailOtpSent ? (
          <>
            <CheckCircle2
              className="h-5 w-5"
              strokeWidth={2.2}
            />
            EMAIL OTP SENT
          </>
        ) : (
          <>
            <Mail
              className="h-5 w-5"
              strokeWidth={2}
            />
            VERIFY EMAIL OTP
          </>
        )}
      </button>

      {/* =====================================================
          SHOP NAME
      ===================================================== */}

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
            id="shop-name" name="shopName"
            type="text"
            value={shopName}
            onChange={(event) =>
              setShopName(event.target.value)
            }
            placeholder="Enter shop name"
            className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-5 text-[14px] font-medium text-[#172033] outline-none transition-all placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${
              shopName
                ? "border-[#7c3aed]"
                : "border-[#dfe3e9]"
            }`}
          />
        </div>
      </div>

      {/* =====================================================
          SHOP CATEGORY
      ===================================================== */}

      <SelectField
        label="Shop Category"
        value={category}
        onChange={setCategory}
        icon={<Shapes />}
        options={categories}
      />

      {/* =====================================================
          PROPERTY TYPE
      ===================================================== */}

      <SelectField
        label="Property Type"
        value={propertyType}
        onChange={setPropertyType}
        icon={<Building2 />}
        options={propertyTypes}
      />

      {/* =====================================================
          COMPLETE SHOP ADDRESS
      ===================================================== */}

      <div>
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
            id="shop-address" name="shopAddress"
            value={address}
            onChange={(event) =>
              setAddress(event.target.value)
            }
            rows={4}
            placeholder="Enter complete shop address"
            className={`min-h-[108px] w-full resize-none rounded-xl border bg-[#fafbfd] px-5 py-3 pl-12 text-[14px] leading-6 text-[#172033] outline-none transition-all placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${
              address
                ? "border-[#7c3aed]"
                : "border-[#dfe3e9]"
            }`}
          />
        </div>
      </div>

      {/* =====================================================
          SHOP LOCATION
      ===================================================== */}

      <div>
        <label className="mb-2.5 block text-[14px] font-semibold text-[#172033]">
          Shop Location
        </label>

        <button
          type="button"
          onClick={handleLocation}
          className={`flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
            locationAdded
              ? "border-[#b9e8d4] bg-[#f3fcf8]"
              : "border-[#dfe3e9] bg-[#fafbfd] hover:border-[#7c3aed] hover:bg-white"
          }`}
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              locationAdded
                ? "bg-[#e4f7f1]"
                : "bg-[#edf1fc]"
            }`}
          >
            {locationAdded ? (
              <CheckCircle2
                className="h-6 w-6 text-[#08a77e]"
                strokeWidth={2.2}
              />
            ) : (
              <MapPin
                className="h-6 w-6 text-[#7c3aed]"
                strokeWidth={2}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-[#172033]">
              {locationAdded
                ? "Shop Location Added"
                : "Pin your shop location"}
            </p>

            <p className="mt-1 text-[12px] leading-5 text-[#8992a3]">
              {locationAdded
                ? "Your shop location has been selected."
                : "Pin your shop location on the map"}
            </p>
          </div>

          <ChevronRight
            className={`h-5 w-5 shrink-0 ${
              locationAdded
                ? "text-[#08a77e]"
                : "text-[#7c3aed]"
            }`}
            strokeWidth={2.3}
          />
        </button>

        {/* HIDDEN LOCATION INPUT */}

        <input
          ref={locationInputRef}
          type="text"
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* =====================================================
          LOCATION INFO
      ===================================================== */}

      <div className="flex items-start gap-3 rounded-2xl border border-[#d9e0f5] bg-[#f3f6ff] px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
          <Navigation
            className="h-4.5 w-4.5 text-[#7c3aed]"
            strokeWidth={2}
          />
        </div>

        <p className="text-[12px] leading-5 text-[#596274]">
          Make sure the shop location matches your
          registered business address.
        </p>
      </div>
    </div>
  );
};

/* ============================================================
   SELECT FIELD
============================================================ */

const SelectField = ({
  label,
  value,
  onChange,
  icon,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  options: string[];
}) => {
  return (
    <div>
      <label className="mb-2.5 block text-[14px] font-semibold text-[#172033]">
        {label}
      </label>

      <div className="relative">
        {/* ICON */}

        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8992a3] [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </span>

        {/* SELECT */}

        <select
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
          <option value="" disabled>
            Select {label.toLowerCase()}
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

        {/* ARROW */}

        <svg
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#697386]"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

export default ShopDetailsStep;