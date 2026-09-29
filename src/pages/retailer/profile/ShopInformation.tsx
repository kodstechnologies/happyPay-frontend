import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  FileText,
  MapPin,
  MapPinned,
  Save,
  Upload,
  Store,
  Shapes,
  Building2,
  Mail,
  Phone,
  LoaderCircle,
} from "lucide-react";

const proofTypes = [
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

const shopCategories = [
  "General Store",
  "Kirana Store",
  "Medical Store",
  "Mobile Store",
  "Electronics Store",
  "Clothing Store",
  "Stationery Store",
  "Other",
];

const propertyTypes = [
  "Owned",
  "Rented",
  "Leased",
];

type FileItem = {
  name: string;
  size: string;
};

export default function ShopInformation() {
  const navigate = useNavigate();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  // ============================================================
  // SHOP DETAILS
  // ============================================================

  const [shopName, setShopName] = useState(
    "Shree Ganesh Kirana & General Store"
  );

  const [shopCategory, setShopCategory] =
    useState("General Store");

  const [propertyType, setPropertyType] =
    useState("Owned");

  const [showCategoryDropdown, setShowCategoryDropdown] =
    useState(false);

  const [showPropertyDropdown, setShowPropertyDropdown] =
    useState(false);

  // ============================================================
  // CONTACT DETAILS
  // ============================================================

  const [email, setEmail] =
    useState("ganesh.store@gmail.com");

  const [mobile, setMobile] =
    useState("9876543210");

  // ============================================================
  // ADDRESS DETAILS
  // ============================================================

  const [shopAddress, setShopAddress] = useState(
    "Shop No. 12, Ground Floor, Central Market, South Extension Part 1"
  );

  const [pincode, setPincode] =
    useState("110049");

  const [city, setCity] =
    useState("New Delhi");

  const [state, setState] =
    useState("Delhi");

  // ============================================================
  // BUSINESS PROOF
  // ============================================================

  const [proofType, setProofType] =
    useState("GST Certificate");

  const [showProofDropdown, setShowProofDropdown] =
    useState(false);

  const [gstNumber, setGstNumber] =
    useState("07AAAAA0000A1Z5");

  // ============================================================
  // SAVE STATE
  // ============================================================

  const [isSaving, setIsSaving] =
    useState(false);

  // ============================================================
  // FILES
  // ============================================================

  const [files, setFiles] =
    useState<Record<string, FileItem>>({
      "Inside Shop": {
        name: "inside_counter_view.jpg",
        size: "1.4 MB",
      },

      "Outside Shop": {
        name: "shop_front_signboard.jpg",
        size: "2.1 MB",
      },

      "Shop Location": {
        name: "street_landmark_view.jpg",
        size: "1.8 MB",
      },

      "GST Certificate": {
        name: "gst_registration_certificate.pdf",
        size: "840 KB",
      },
    });

  const [uploadTarget, setUploadTarget] =
    useState<string | null>(null);

  // ============================================================
  // REPLACE FILE
  // ============================================================

  const handleReplace = (target: string) => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file || !uploadTarget) {
      return;
    }

    setFiles((previous) => ({
      ...previous,
      [uploadTarget]: {
        name: file.name,
        size:
          file.size >= 1024 * 1024
            ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`,
      },
    }));

    setUploadTarget(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ============================================================
  // SAVE & UPDATE
  // ============================================================

  const handleSave = () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    /*
     * UI-only save simulation.
     *
     * Later, when backend integration is added,
     * this setTimeout can be replaced with the API call.
     */

    window.setTimeout(() => {
      sessionStorage.setItem(
        "happypay_shop_information_updated",
        "true"
      );

      navigate("/retailer/profile", {
        replace: true,
      });
    }, 1200);
  };

  // ============================================================
  // CLOSE DROPDOWNS
  // ============================================================

  const closeDropdowns = () => {
    setShowCategoryDropdown(false);
    setShowPropertyDropdown(false);
    setShowProofDropdown(false);
  };

  return (
    <div className="px-4 pb-6 sm:px-6">
      {/* ========================================================
          HIDDEN FILE INPUT
      ======================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={handleFileChange}
      />

      <div className="mx-auto w-full max-w-5xl">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <header className="mb-4 flex min-h-14 items-center justify-between rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.4)] backdrop-blur-md">
          <button
            type="button"
            onClick={() =>
              navigate("/retailer/profile")
            }
            className="flex items-center justify-center text-[#172033]"
            aria-label="Go back"
            disabled={isSaving}
          >
            <ArrowLeft size={28} />
          </button>

          <h1 className="text-base font-bold text-[#172033]">Shop Information
          </h1>

          <div className="w-7" />
        </header>

        <main
          className="space-y-6"
          onClick={closeDropdowns}
        >
          {/* ====================================================
              SHOP HEADER CARD
          ==================================================== */}

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e8f1f5] text-[#7c3aed]">
                <Store size={30} />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-[#172033] sm:text-xl">
                  {shopName}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-500">
                    <CheckCircle2
                      size={14}
                      fill="currentColor"
                    />

                    Verified Merchant
                  </span>

                  <span className="text-sm font-semibold text-slate-600">
                    {shopCategory}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ====================================================
              SHOP DETAILS
          ==================================================== */}

          <section>
            <h2 className="text-sm font-semibold text-[#172033]">
              Shop Details
            </h2>

            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Registered shop identity and business type
            </p>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {/* SHOP NAME */}

            <label className="text-base font-bold text-[#172033]">
              Shop Name
            </label>

            <div className="mt-3 flex min-h-12 items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">
              <Store
                size={27}
                className="shrink-0 text-slate-400"
              />

              <input
                type="text"
                value={shopName}
                onChange={(event) =>
                  setShopName(event.target.value)
                }
                className="w-full bg-transparent text-base font-semibold text-[#172033] outline-none"
                placeholder="Enter shop name"
                disabled={isSaving}
              />
            </div>

            {/* SHOP CATEGORY */}

            <label className="mt-5 block text-base font-bold text-[#172033]">
              Shop Category
            </label>

            <div className="relative mt-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={(event) => {
                  event.stopPropagation();

                  setShowCategoryDropdown(
                    (previous) => !previous
                  );

                  setShowPropertyDropdown(false);
                  setShowProofDropdown(false);
                }}
                className={`flex min-h-12 w-full items-center gap-4 rounded-2xl border bg-slate-50/80 px-5 text-left ${
                  showCategoryDropdown
                    ? "border-[#7c3aed] ring-1 ring-[#7c3aed]"
                    : "border-slate-200"
                }`}
              >
                <Shapes
                  size={27}
                  className="shrink-0 text-slate-400"
                />

                <span className="flex-1 font-semibold text-[#172033]">
                  {shopCategory}
                </span>

                <ChevronDown
                  size={24}
                  className={`text-slate-500 transition ${
                    showCategoryDropdown
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {showCategoryDropdown && (
                <div
                  className="absolute left-0 right-0 top-18 z-50 max-h-[350px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  {shopCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setShopCategory(category);
                        setShowCategoryDropdown(false);
                      }}
                      className={`block w-full px-5 py-4 text-left text-base font-semibold ${
                        shopCategory === category
                          ? "bg-slate-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PROPERTY TYPE */}

            <label className="mt-5 block text-base font-bold text-[#172033]">
              Property Type
            </label>

            <div className="relative mt-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={(event) => {
                  event.stopPropagation();

                  setShowPropertyDropdown(
                    (previous) => !previous
                  );

                  setShowCategoryDropdown(false);
                  setShowProofDropdown(false);
                }}
                className={`flex min-h-12 w-full items-center gap-4 rounded-2xl border bg-slate-50/80 px-5 text-left ${
                  showPropertyDropdown
                    ? "border-[#7c3aed] ring-1 ring-[#7c3aed]"
                    : "border-slate-200"
                }`}
              >
                <Building2
                  size={27}
                  className="shrink-0 text-slate-400"
                />

                <span className="flex-1 font-semibold text-[#172033]">
                  {propertyType}
                </span>

                <ChevronDown
                  size={24}
                  className={`text-slate-500 transition ${
                    showPropertyDropdown
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {showPropertyDropdown && (
                <div
                  className="absolute left-0 right-0 top-18 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  {propertyTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setPropertyType(type);
                        setShowPropertyDropdown(false);
                      }}
                      className={`block w-full px-5 py-4 text-left text-base font-semibold ${
                        propertyType === type
                          ? "bg-slate-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ====================================================
              CONTACT
          ==================================================== */}

          <section>
            <h2 className="text-sm font-semibold text-[#172033]">
              Shop Contact & Email
            </h2>

            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Official communication channels for notifications
            </p>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {/* EMAIL */}

            <div className="flex items-center justify-between gap-3">
              <label className="text-base font-bold text-[#172033]">
                Shop Email ID
              </label>

              <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-emerald-500">
                <CheckCircle2
                  size={18}
                  fill="currentColor"
                />

                Verified
              </span>
            </div>

            <div className="mt-3 flex min-h-12 items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">
              <Mail
                size={27}
                className="shrink-0 text-slate-400"
              />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="w-full bg-transparent text-base font-semibold text-[#172033] outline-none"
                placeholder="Enter email address"
                disabled={isSaving}
              />
            </div>

            {/* MOBILE */}

            <div className="mt-5 flex items-center justify-between gap-3">
              <label className="text-base font-bold text-[#172033]">
                Contact Mobile Number
              </label>

              <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-emerald-500">
                <CheckCircle2
                  size={18}
                  fill="currentColor"
                />

                Primary OTP Number
              </span>
            </div>

            <div className="mt-3 flex min-h-12 items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">
              <Phone
                size={27}
                className="shrink-0 text-slate-400"
              />

              <input
                type="tel"
                value={mobile}
                maxLength={10}
                onChange={(event) =>
                  setMobile(
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                className="w-full bg-transparent text-base font-semibold text-[#172033] outline-none"
                placeholder="Enter mobile number"
                disabled={isSaving}
              />
            </div>
          </section>

          {/* ====================================================
              ADDRESS
          ==================================================== */}

          <section>
            <h2 className="text-sm font-semibold text-[#172033]">
              Shop Address & Geo-Location
            </h2>

            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Physical store address pinned on map for customer
              discovery
            </p>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {/* ADDRESS */}

            <label className="text-base font-bold text-[#172033]">
              Complete Shop Address
            </label>

            <div className="mt-3 flex min-h-14 items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">
              <MapPin
                size={28}
                className="mt-1 shrink-0 text-slate-400"
              />

              <textarea
                value={shopAddress}
                onChange={(event) =>
                  setShopAddress(event.target.value)
                }
                rows={2}
                className="w-full resize-none bg-transparent text-base font-semibold leading-7 text-[#172033] outline-none"
                placeholder="Enter complete shop address"
                disabled={isSaving}
              />
            </div>

            {/* PINCODE / CITY / STATE */}

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* PINCODE */}

              <div>
                <label className="text-base font-bold text-[#172033]">
                  Pincode
                </label>

                <div className="mt-3 flex min-h-12 items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-5 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">
                  <input
                    type="text"
                    value={pincode}
                    maxLength={6}
                    onChange={(event) =>
                      setPincode(
                        event.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    className="w-full bg-transparent text-base font-semibold text-[#172033] outline-none"
                    placeholder="Pincode"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* CITY */}

              <div>
                <label className="text-base font-bold text-[#172033]">
                  City
                </label>

                <div className="mt-3 flex min-h-12 items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-5 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">
                  <input
                    type="text"
                    value={city}
                    onChange={(event) =>
                      setCity(event.target.value)
                    }
                    className="w-full bg-transparent text-base font-semibold text-[#172033] outline-none"
                    placeholder="City"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* STATE */}

              <div>
                <label className="text-base font-bold text-[#172033]">
                  State
                </label>

                <div className="mt-3 flex min-h-12 items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-5 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">
                  <input
                    type="text"
                    value={state}
                    onChange={(event) =>
                      setState(event.target.value)
                    }
                    className="w-full bg-transparent text-base font-semibold text-[#172033] outline-none"
                    placeholder="State"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            {/* GEO LOCATION */}

            <button
              type="button"
              disabled={isSaving}
              className="mt-5 flex min-h-14 w-full items-center gap-4 rounded-2xl border border-[#c8d2eb] bg-[#f8f5ff] px-5 text-left transition hover:bg-[#e7ecff] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#d8e2ff] text-[#7c3aed]">
                <MapPinned size={27} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-[#172033]">
                  Shop Geo-Location on Map
                </h3>

                <p className="mt-1 truncate text-sm font-medium text-slate-500">
                  28.5684° N, 77.2217° E • South Extension...
                </p>
              </div>

              <span className="text-3xl font-light text-[#7c3aed]">
                ›
              </span>
            </button>
          </section>

          {/* ====================================================
              SHOP PHOTOS
          ==================================================== */}

          <section>
            <h2 className="text-sm font-semibold text-[#172033]">
              Shop Photos
            </h2>

            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Visual verification photos for merchant compliance
            </p>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="space-y-5">
              {[
                "Inside Shop",
                "Outside Shop",
                "Shop Location",
              ].map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                    <CheckCircle2
                      size={30}
                      fill="currentColor"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[#172033]">
                      {label}
                    </h3>

                    <p className="mt-1 truncate text-sm font-medium text-emerald-500">
                      {files[label]?.name} (
                      {files[label]?.size})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleReplace(label)
                    }
                    disabled={isSaving}
                    className="shrink-0 text-sm font-bold text-[#7c3aed] disabled:opacity-50 sm:text-base"
                  >
                    Replace
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ====================================================
              BUSINESS & ADDRESS PROOF
          ==================================================== */}

          <section>
            <h2 className="text-sm font-semibold text-[#172033]">
              Business & Address Proof
            </h2>

            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Statutory license and business registration
            </p>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {/* PROOF TYPE */}

            <label className="text-base font-bold text-[#172033]">
              Address / Business Proof Type
            </label>

            <div className="relative mt-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={(event) => {
                  event.stopPropagation();

                  setShowProofDropdown(
                    (previous) => !previous
                  );

                  setShowCategoryDropdown(false);
                  setShowPropertyDropdown(false);
                }}
                className={`flex min-h-12 w-full items-center gap-4 rounded-2xl border bg-slate-50/80 px-5 text-left ${
                  showProofDropdown
                    ? "border-[#7c3aed] ring-1 ring-[#7c3aed]"
                    : "border-slate-200"
                }`}
              >
                <FileCheck2
                  size={27}
                  className="shrink-0 text-slate-400"
                />

                <span className="flex-1 font-semibold text-[#172033]">
                  {proofType}
                </span>

                <ChevronDown
                  size={24}
                  className={`text-slate-500 transition ${
                    showProofDropdown
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {showProofDropdown && (
                <div
                  className="absolute left-0 right-0 top-18 z-50 max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  {proofTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setProofType(type);
                        setShowProofDropdown(false);
                      }}
                      className={`block w-full px-5 py-4 text-left text-base font-semibold ${
                        proofType === type
                          ? "bg-slate-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* GST NUMBER */}

            <label className="mt-5 block text-base font-bold text-[#172033]">
              GSTIN / Business Registration Number
            </label>

            <div className="mt-3 flex min-h-12 items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-5 transition focus-within:border-[#7c3aed] focus-within:ring-1 focus-within:ring-[#7c3aed]">
              <input
                value={gstNumber}
                onChange={(event) =>
                  setGstNumber(
                    event.target.value.toUpperCase()
                  )
                }
                className="w-full bg-transparent text-base font-semibold text-[#172033] outline-none"
                placeholder="Enter registration number"
                disabled={isSaving}
              />
            </div>

            {/* BUSINESS PROOF FILE */}

            <div className="mt-5 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                <FileText size={30} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-[#172033]">
                  {proofType}
                </h3>

                <p className="mt-1 truncate text-sm font-medium text-emerald-500">
                  {files["GST Certificate"]?.name} (
                  {files["GST Certificate"]?.size})
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleReplace("GST Certificate")
                }
                disabled={isSaving}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7c3aed] text-white transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Replace business proof"
              >
                <Upload size={22} />
              </button>
            </div>
          </section>

          {/* ====================================================
              SAVE BUTTON
          ==================================================== */}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`
              flex
              min-h-12
              w-full
              items-center
              justify-center
              gap-3
              rounded-2xl
              px-5
              text-base
              font-bold
              text-white
              shadow-sm
              transition-all
              duration-200
              ${
                isSaving
                  ? "cursor-wait bg-[#6d28d9]"
                  : "bg-[#7c3aed] hover:bg-[#6d28d9]"
              }
            `}
          >
            {isSaving ? (
              <>
                <LoaderCircle
                  size={23}
                  className="animate-spin"
                />

                Saving...
              </>
            ) : (
              <>
                <Save size={22} />

                Save & Update Shop Details
              </>
            )}
          </button>
        </main>
      </div>
    </div>
  );
}


