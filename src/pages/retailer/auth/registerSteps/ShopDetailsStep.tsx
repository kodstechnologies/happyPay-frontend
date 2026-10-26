import { useRef, useState, useEffect } from "react";
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
  CreditCard,
  FileText,
} from "lucide-react";

import {
  sendRetailerEmailOtp,
  verifyRetailerEmailOtp,
  updateRetailerShopDetails,
  validatePincodeApi,
  type CurrentRegistrationStepResult,
} from "../../../../services/api/retailer/retailerAuthApi";

import {
  getCategories,
  getPropertyTypes,
  getProofTypes,
  type MasterDataItem,
} from "../../../../services/api/masterData/masterDataApi";

type ShopDetailsStepProps = {
  userId?: string;
  distributorId?: string;
  onShopDetailsSaved?: () => void;
  initialData?: CurrentRegistrationStepResult | null;
};

const ShopDetailsStep = ({
  userId: userIdProp,
  distributorId,
  onShopDetailsSaved,
  initialData,
}: ShopDetailsStepProps) => {
  // Fall back to localStorage so the step works even if the prop wasn't passed
  const userId = userIdProp || localStorage.getItem("retailerUserId") || undefined;
  const insideShopInputRef = useRef<HTMLInputElement | null>(null);
  const outsideShopInputRef = useRef<HTMLInputElement | null>(null);
  const shopLocationInputRef = useRef<HTMLInputElement | null>(null);
  const businessProofInputRef = useRef<HTMLInputElement | null>(null);
  const panInputRef = useRef<HTMLInputElement | null>(null);

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
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [pincodeValid, setPincodeValid] = useState(false);
  const [pincodeInfo, setPincodeInfo] = useState<{
    city?: string | null;
    district?: string | null;
    state?: string | null;
  } | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [businessProof, setBusinessProof] = useState("");
  const [businessProofFile, setBusinessProofFile] = useState<File | null>(null);
  const [insideShopFile, setInsideShopFile] = useState<File | null>(null);
  const [outsideShopFile, setOutsideShopFile] = useState<File | null>(null);
  const [shopLocationFile, setShopLocationFile] = useState<File | null>(null);
  const [pan, setPan] = useState("");
  const [panFile, setPanFile] = useState<File | null>(null);

  // -------- Existing uploaded files from previous step/session --------
  const [existingPanDoc, setExistingPanDoc] = useState<string | null>(null);
  const [existingInsideShop, setExistingInsideShop] = useState<string | null>(null);
  const [existingOutsideShop, setExistingOutsideShop] = useState<string | null>(null);
  const [existingShopLocation, setExistingShopLocation] = useState<string | null>(null);
  const [existingBusinessProof, setExistingBusinessProof] = useState<string | null>(null);

  // -------- Master data --------
  const [categories, setCategories] = useState<MasterDataItem[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<MasterDataItem[]>([]);
  const [proofTypes, setProofTypes] = useState<MasterDataItem[]>([]);
  const [masterDataLoading, setMasterDataLoading] = useState(true);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ========================================
  // POPULATE FROM INITIAL DATA
  // ========================================
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    if (initialData) {
      if (initialData.email) {
        setEmail(initialData.email);
      }
      if (initialData.isEmailVerified) {
        setEmailVerified(true);
      }

      const fd = initialData.filledData;
      if (fd) {
        if (fd.panNumber) setPan(fd.panNumber);
        if (fd.panDocument) setExistingPanDoc(fd.panDocument);

        if (fd.shop) {
          if (fd.shop.name) setShopName(fd.shop.name);

          const catVal = fd.shop.category;
          if (catVal) {
            setCategory(typeof catVal === "object" ? catVal._id : catVal);
          }

          const propVal = fd.shop.propertyType;
          if (propVal) {
            setPropertyType(typeof propVal === "object" ? propVal._id : propVal);
          }

          const addr = fd.shop.completeAddress || fd.shop.address?.addressLine;
          if (addr) setAddress(addr);

          if (fd.shop.address?.city) setCity(fd.shop.address.city);
          if (fd.shop.address?.pincode) {
            setPincode(fd.shop.address.pincode);
          }

          if (fd.shop.location?.latitude != null) setLatitude(fd.shop.location.latitude);
          if (fd.shop.location?.longitude != null) setLongitude(fd.shop.location.longitude);
        }

        if (fd.shopInsidePhoto) setExistingInsideShop(fd.shopInsidePhoto);
        if (fd.shopOutsidePhoto) setExistingOutsideShop(fd.shopOutsidePhoto);
        if (fd.shopLocationPhoto) setExistingShopLocation(fd.shopLocationPhoto);

        const proofVal = fd.businessProofType;
        if (proofVal) {
          setBusinessProof(typeof proofVal === "object" ? proofVal._id : proofVal);
        }
        if (fd.businessProofDocument) setExistingBusinessProof(fd.businessProofDocument);
      }
    }
  }

  // Validate initial pincode asynchronously
  useEffect(() => {
    const pin = initialData?.filledData?.shop?.address?.pincode;
    if (pin && pin.length === 6) {
      let isMounted = true;
      validatePincodeApi(pin)
        .then((res) => {
          if (isMounted && res.data?.isValid) {
            setPincodeValid(true);
            setPincodeInfo({
              city: res.data.city || res.data.district || null,
              district: res.data.district || null,
              state: res.data.state || null,
            });
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [initialData?.filledData?.shop?.address?.pincode]);

  // ========================================
  // FETCH MASTER DATA ON COMPONENT MOUNT
  // ========================================
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [categoriesRes, propertyTypesRes, proofTypesRes] = await Promise.all([
          getCategories(),
          getPropertyTypes(),
          getProofTypes(),
        ]);
        console.log("================", categories, propertyType, proofTypes)
        setCategories(categoriesRes.filter(item => item.isActive));
        setPropertyTypes(propertyTypesRes.filter(item => item.isActive));
        setProofTypes(proofTypesRes.filter(item => item.isActive));
      } catch (err) {
        console.error("Error fetching master data:", err);
        setError("Failed to load form options. Please refresh the page.");
      } finally {
        setMasterDataLoading(false);
      }
    };

    fetchMasterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handlePanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPanFile(f);
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);
    setPan(value);
  };

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(value);

    // If less than 6 digits, reset validation state
    if (value.length < 6) {
      setPincodeValid(false);
      setPincodeError("");
      setPincodeInfo(null);
      return;
    }

    // Call API exactly as the 6th digit is entered
    if (value.length === 6) {
      setPincodeLoading(true);
      setPincodeError("");
      try {
        const res = await validatePincodeApi(value);
        if (res.data?.isValid) {
          setPincodeValid(true);
          setPincodeError("");
          const loc = {
            city: res.data.city || res.data.district || null,
            district: res.data.district || null,
            state: res.data.state || null,
          };
          setPincodeInfo(loc);

          // Auto-fill city if empty or matching previous auto-filled city
          if (loc.city && (!city.trim() || city === pincodeInfo?.city)) {
            setCity(loc.city);
          }
        } else {
          setPincodeValid(false);
          setPincodeError(res.message || "Invalid pincode. No records found.");
        }
      } catch (err: unknown) {
        setPincodeValid(false);
        const msg = err instanceof Error ? err.message : "Invalid postal pincode";
        setPincodeError(msg);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // ==========================================================
  // SUBMIT FULL SHOP DETAILS
  // ==========================================================
  const handleSubmit = async () => {
    setError("");
    if (!userId) return setError("User not registered.");
    if (!emailVerified) return setError("Please verify your email first.");
    if (!pan) return setError("PAN number is required.");
    if (!panFile && !existingPanDoc) return setError("PAN document is required.");
    if (!shopName.trim()) return setError("Shop name is required.");
    if (!category) return setError("Shop category is required.");
    if (!propertyType) return setError("Property type is required.");
    if (!address.trim()) return setError("Shop address is required.");
    if (!city.trim()) return setError("City is required.");
    if (!pincode.trim()) return setError("Pincode is required.");
    if (pincode.length !== 6) return setError("Pincode must be exactly 6 digits.");
    if (pincodeError) return setError(pincodeError);
    if (!businessProof) return setError("Business proof type is required.");
    if (!businessProofFile && !existingBusinessProof) return setError("Business proof document is required.");
    if (!insideShopFile && !existingInsideShop) return setError("Inside shop photo is required.");
    if (!outsideShopFile && !existingOutsideShop) return setError("Outside shop photo is required.");
    if (!shopLocationFile && !existingShopLocation) return setError("Shop location photo is required.");
    if (latitude == null || isNaN(latitude)) return setError("Latitude is required.");
    if (longitude == null || isNaN(longitude)) return setError("Longitude is required.");
    if (latitude < -90 || latitude > 90) return setError("Latitude must be between -90 and 90.");
    if (longitude < -180 || longitude > 180) return setError("Longitude must be between -180 and 180.");

    setSubmitting(true);
    try {
      await updateRetailerShopDetails({
        userId,
        panNumber: pan,
        shopName,
        shopCategory: category, // This is now an ID from the API
        propertyType, // This is now an ID from the API
        address,
        city,
        pincode,
        latitude,
        longitude,
        businessProofType: businessProof, // This is now an ID from the API
        shopInsidePhoto: insideShopFile || existingInsideShop,
        shopOutsidePhoto: outsideShopFile || existingOutsideShop,
        shopLocationPhoto: shopLocationFile || existingShopLocation,
        businessProofDocument: businessProofFile || existingBusinessProof,
        panDocument: panFile || existingPanDoc,
        distributorId,
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

  // Show loading while master data is being fetched
  if (masterDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        <p className="mt-3 text-sm text-[#737c8c]">Loading form options...</p>
      </div>
    );
  }

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
        {/* PAN Number + PAN Document */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="shop-pan"
              className="mb-2.5 block text-[14px] font-semibold text-[#172033]"
            >
              PAN Number
            </label>
            <div className="relative">
              <CreditCard
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8992a3]"
                strokeWidth={2}
              />
              <input
                id="shop-pan"
                name="panNumber"
                type="text"
                value={pan}
                onChange={handlePanChange}
                placeholder="Enter PAN number"
                maxLength={10}
                autoComplete="off"
                className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] pl-12 pr-5 text-[14px] font-semibold uppercase tracking-[0.04em] text-[#172033] outline-none transition-all placeholder:normal-case placeholder:tracking-normal placeholder:text-[#a1a8b5] focus:border-[#7c3aed] focus:bg-white focus:ring-4 focus:ring-[#7c3aed]/10 ${pan ? "border-[#7c3aed]" : "border-[#dfe3e9]"
                  }`}
              />
            </div>
            <p className="mt-2 text-[12px] leading-5 text-[#9299a7]">
              Enter your 10-character PAN number.
            </p>
          </div>

          <div>
            <label className="mb-2.5 block text-[14px] font-semibold text-[#172033]">
              PAN Document
            </label>
            <input
              ref={panInputRef}
              type="file"
              accept="image/*,.pdf"
              name="panDocument"
              onChange={handlePanUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => panInputRef.current?.click()}
              className="group flex h-[54px] w-full items-center justify-between gap-3 rounded-xl border border-[#dfe1e6] bg-[#fafbfd] px-4 text-left transition hover:border-[#7c3aed] hover:bg-[#f7f9ff]"
            >
              <div className="flex min-w-0 items-center gap-3">
                {panFile || existingPanDoc ? (
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-[#08ae82]"
                    strokeWidth={2}
                  />
                ) : (
                  <FileText
                    className="h-5 w-5 shrink-0 text-[#7c3aed]"
                    strokeWidth={2}
                  />
                )}
                <p className="truncate text-[14px] font-medium text-[#172033]">
                  {panFile ? panFile.name : existingPanDoc ? "PAN Document uploaded (Click to replace)" : "Upload PAN Document"}
                </p>
              </div>
              <Upload
                className="h-4.5 w-4.5 shrink-0 text-[#7c3aed] transition group-hover:scale-105"
                strokeWidth={2.3}
              />
            </button>
          </div>
        </div>

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
            <div className="mb-2.5 flex items-center justify-between">
              <label
                htmlFor="shop-pincode"
                className="block text-[14px] font-semibold text-[#172033]"
              >
                Pincode
              </label>
              {pincodeInfo?.state && (
                <span className="text-[11px] font-semibold text-[#7c3aed]">
                  {pincodeInfo.city ? `${pincodeInfo.city}, ` : ""}{pincodeInfo.state}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="shop-pincode"
                name="pincode"
                type="text"
                value={pincode}
                onChange={handlePincodeChange}
                placeholder="Enter 6-digit pincode"
                maxLength={6}
                inputMode="numeric"
                className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] px-5 pr-12 text-[14px] font-medium outline-none transition-all focus:bg-white ${pincodeError
                  ? "border-[#d85b5b] focus:border-[#d85b5b] focus:ring-4 focus:ring-[#d85b5b]/10"
                  : pincodeValid
                    ? "border-[#08ae82] focus:border-[#08ae82] focus:ring-4 focus:ring-[#08ae82]/10"
                    : pincode
                      ? "border-[#7c3aed] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
                      : "border-[#dfe3e9] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10"
                  }`}
              />
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                {pincodeLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#7c3aed]" />
                ) : pincodeValid ? (
                  <CheckCircle2 className="h-5 w-5 text-[#08ae82]" strokeWidth={2.2} />
                ) : null}
              </div>
            </div>
            {pincodeError && (
              <p className="mt-1.5 text-[12px] font-medium text-[#d85b5b]">
                {pincodeError}
              </p>
            )}
            {pincodeValid && (
              <p className="mt-1.5 text-[12px] font-medium text-[#08ae82]">
                ✓ Valid pincode
              </p>
            )}
          </div>
        </div>

        {/* Shop Location (lat/lng input fields) */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[14px] font-semibold text-[#172033]">
              Shop Location (Coordinates)
            </label>
            <button
              type="button"
              onClick={handleLocation}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#7c3aed] hover:text-[#6d28d9] transition"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Detect via GPS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="shop-latitude"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Latitude (-90 to 90) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="shop-latitude"
                  type="number"
                  step="any"
                  placeholder="e.g. 28.6139"
                  value={latitude ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLatitude(val === "" ? null : parseFloat(val));
                  }}
                  className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] px-5 pr-10 text-[14px] font-medium outline-none transition focus:bg-white focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 ${latitude != null && (latitude < -90 || latitude > 90)
                    ? "border-[#d85b5b]"
                    : latitude != null
                      ? "border-[#08ae82]"
                      : "border-[#dfe3e9]"
                    }`}
                />
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <MapPin className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="shop-longitude"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Longitude (-180 to 180) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="shop-longitude"
                  type="number"
                  step="any"
                  placeholder="e.g. 77.2090"
                  value={longitude ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLongitude(val === "" ? null : parseFloat(val));
                  }}
                  className={`h-[54px] w-full rounded-xl border bg-[#fafbfd] px-5 pr-10 text-[14px] font-medium outline-none transition focus:bg-white focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 ${longitude != null && (longitude < -180 || longitude > 180)
                    ? "border-[#d85b5b]"
                    : longitude != null
                      ? "border-[#08ae82]"
                      : "border-[#dfe3e9]"
                    }`}
                />
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <MapPin className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {latitude != null && longitude != null && (
            <p className="text-xs font-medium text-[#08ae82] flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
            </p>
          )}
        </div>

        {/* Photos */}
        <PhotoUpload
          label="Inside Shop Photo"
          description="Take a photo of yourself inside the shop."
          file={insideShopFile}
          existingUrl={existingInsideShop}
          inputRef={insideShopInputRef}
          onChange={handleInsideShopUpload}
        />
        <PhotoUpload
          label="Outside Shop Photo"
          description="Take a clear photo of the shop exterior."
          file={outsideShopFile}
          existingUrl={existingOutsideShop}
          inputRef={outsideShopInputRef}
          onChange={handleOutsideShopUpload}
        />
        <PhotoUpload
          label="Shop Location Photo"
          description="Capture a photo showing the shop location."
          file={shopLocationFile}
          existingUrl={existingShopLocation}
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
              {proofTypes.map((opt) => (
                <option key={opt._id} value={opt._id}>
                  {opt.name}
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
          existingUrl={existingBusinessProof}
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
  options: MasterDataItem[];
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
          <option key={o._id} value={o._id}>
            {o.name}
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
  existingUrl,
  inputRef,
  onChange,
  accept = "image/*",
}: {
  label: string;
  description: string;
  file: File | null;
  existingUrl?: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
}) => {
  const isUploaded = !!file || !!existingUrl;
  const displayText = file ? file.name : existingUrl ? "Document uploaded (Click to replace)" : description;

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`group mt-5 flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition ${isUploaded
          ? "border-[#b9e8da] bg-[#f4fcf9]"
          : "border-[#dfe1e6] bg-[#fafbfd] hover:border-[#7c3aed] hover:bg-[#f7f9ff]"
          }`}
      >
        <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl bg-[#e7f8f3]">
          {isUploaded ? (
            <CheckCircle2 className="h-5 w-5 text-[#08ae82]" strokeWidth={2.3} />
          ) : (
            <Camera className="h-5 w-5 text-[#08ae82]" strokeWidth={2.2} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-[#172033]">{label}</h3>
          <p
            className={`mt-1 truncate text-sm ${isUploaded ? "font-medium text-[#08ae82]" : "text-[#8992a3]"
              }`}
          >
            {displayText}
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
};

export default ShopDetailsStep;