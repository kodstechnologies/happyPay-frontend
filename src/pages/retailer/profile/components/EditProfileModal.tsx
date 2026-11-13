import { showToast } from "../../../../utils/toast";
import { useState, useEffect } from "react";
import { User, Store, ChevronDown, Loader2 } from "lucide-react";
import Modal from "../../../../components/common/Modal";
import type { ModalSize } from "../../../../components/common/ModalWrapper";
import { updateRetailerProfile } from "../../../../services/api/retailer/retailerProfileApi";
import {
  getCategories,
  getPropertyTypes,
  getProofTypes,
  type MasterDataItem,
} from "../../../../services/api/masterData/masterDataApi";
import {
  validatePincodeApi,
  fetchUpiStateListApi,
  fetchUpiDistrictApi,
  type UpiState,
  type UpiDistrict,
} from "../../../../services/api/retailer/retailerAuthApi";
import type { RetailerFullProfile } from "../../../../types/retailer/profile";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: RetailerFullProfile;
  onSuccess: (updatedProfile?: RetailerFullProfile) => void;
  size?: ModalSize;
}

export default function EditProfileModal({
  open,
  onClose,
  profile,
  onSuccess,
  size
}: EditProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"personal" | "shop">("personal");

  // Form states
  const [firstName, setFirstName] = useState(profile.firstName || "");
  const [lastName, setLastName] = useState(profile.lastName || "");
  const [fullName, setFullName] = useState(profile.fullName || "");
  const [fatherName, setFatherName] = useState(profile.fatherName || "");
  const [motherName, setMotherName] = useState(profile.motherName || "");
  const [mobile, setMobile] = useState(profile.mobile || "");
  const [email, setEmail] = useState(profile.email || "");
  const [gender, setGender] = useState(profile.gender || "Male");
  const [maritalStatus, setMaritalStatus] = useState(profile.maritalStatus || "Single");
  const [educationalQualification, setEducationalQualification] = useState(
    profile.educationalQualification || ""
  );
  const [dateOfBirth, setDateOfBirth] = useState(
    profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : ""
  );

  // Shop states
  const [shopName, setShopName] = useState(profile.shop?.name || "");
  const [shopCategory, setShopCategory] = useState(
    typeof profile.shop?.category === "object"
      ? profile.shop?.category?._id || ""
      : profile.shop?.category || ""
  );
  const [propertyType, setPropertyType] = useState(
    typeof profile.shop?.propertyType === "object"
      ? profile.shop?.propertyType?._id || ""
      : profile.shop?.propertyType || ""
  );
  const [businessProofType, setBusinessProofType] = useState(
    typeof profile.businessProofType === "object"
      ? profile.businessProofType?._id || ""
      : profile.businessProofType || ""
  );
  const [addressLine, setAddressLine] = useState(profile.shop?.address?.addressLine || "");
  const [city, setCity] = useState(profile.shop?.address?.city || "");
  const [state, setState] = useState(profile.shop?.address?.state || "");
  const [stateCode, setStateCode] = useState(profile.shop?.address?.stateCode || "");
  const [districtName, setDistrictName] = useState(profile.shop?.address?.districtName || "");
  const [districtCode, setDistrictCode] = useState(profile.shop?.address?.districtCode || "");
  const [pincode, setPincode] = useState(profile.shop?.address?.pincode || "");
  const [completeAddress, setCompleteAddress] = useState(
    profile.shop?.completeAddress || ""
  );

  // State/District dropdown data
  const [stateList, setStateList] = useState<UpiState[]>([]);
  const [districtList, setDistrictList] = useState<UpiDistrict[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Master data
  const [categories, setCategories] = useState<MasterDataItem[]>([]);
  const [properties, setProperties] = useState<MasterDataItem[]>([]);
  const [proofTypes, setProofTypes] = useState<MasterDataItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    Promise.allSettled([
      getCategories(),
      getPropertyTypes(),
      getProofTypes(),
    ]).then(([catRes, propRes, proofRes]) => {
      if (!isMounted) return;
      if (catRes.status === "fulfilled" && catRes.value) {
        setCategories(catRes.value);
      }
      if (propRes.status === "fulfilled" && propRes.value) {
        setProperties(propRes.value);
      }
      if (proofRes.status === "fulfilled" && proofRes.value) {
        setProofTypes(proofRes.value);
      }
    });

    // Load state list
    fetchUpiStateListApi()
      .then((res) => {
        console.log("State list API response:", res);
        let raw: unknown = res.data;

        // Extract the states array from the nested structure
        if (raw && typeof raw === "object" && "data" in raw) {
          const dataObj = (raw as Record<string, unknown>).data;
          if (dataObj && typeof dataObj === "object" && "data" in dataObj) {
            raw = (dataObj as Record<string, unknown>).data;
          } else {
            raw = dataObj;
          }
        }

        // Map API response fields (description, code) to expected interface (stateName, stateCode)
        if (Array.isArray(raw)) {
          const mappedStates = (raw as Array<{ description: string; code: string }>).map((item) => ({
            stateCode: item.code,
            stateName: item.description,
          }));
          console.log("Setting state list with mapped array:", mappedStates);
          setStateList(mappedStates);
        } else if (raw && typeof raw === "object") {
          const nested = (raw as Record<string, unknown>).states ||
            (raw as Record<string, unknown>).data ||
            (raw as Record<string, unknown>).stateList;
          if (Array.isArray(nested)) {
            const mappedStates = (nested as Array<{ description: string; code: string }>).map((item) => ({
              stateCode: item.code,
              stateName: item.description,
            }));
            console.log("Setting state list with mapped nested array:", mappedStates);
            setStateList(mappedStates);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching state list:", err);
      })
      .finally(() => setStatesLoading(false));

    return () => {
      isMounted = false;
    };
  }, [open]);

  if (!open) return null;

  // Pincode change handler - auto-fetch city
  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(value);

    if (value.length === 6) {
      setPincodeLoading(true);
      try {
        const res = await validatePincodeApi(value);
        if (res.data?.isValid && res.data?.city) {
          setCity(res.data.city);
        }
      } catch {
        // Silently ignore - user can still type
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // State change handler - load districts
  const handleStateChange = async (selectedCode: string) => {
    setStateCode(selectedCode);
    const found = stateList.find((s) => s.stateCode === selectedCode);
    setState(found?.stateName || selectedCode);
    setDistrictName("");
    setDistrictCode("");
    setDistrictList([]);

    if (!selectedCode) return;
    setDistrictsLoading(true);
    try {
      const res = await fetchUpiDistrictApi(selectedCode);
      console.log("District API response:", res);

      let raw: unknown = res.data;

      // Extract the districts array from the nested structure
      if (raw && typeof raw === "object" && "data" in raw) {
        const dataObj = (raw as Record<string, unknown>).data;
        if (dataObj && typeof dataObj === "object" && "data" in dataObj) {
          raw = (dataObj as Record<string, unknown>).data;
        } else {
          raw = dataObj;
        }
      }

      // Map API response fields (description, code) to expected interface (districtName, districtCode)
      if (Array.isArray(raw)) {
        const mappedDistricts = (raw as Array<{ description: string; code: string }>).map((item) => ({
          districtCode: item.code,
          districtName: item.description,
        }));
        console.log("Setting district list with mapped array:", mappedDistricts);
        setDistrictList(mappedDistricts);
      } else if (raw && typeof raw === "object") {
        const nested = (raw as Record<string, unknown>).districts ||
          (raw as Record<string, unknown>).data ||
          (raw as Record<string, unknown>).districtList;
        if (Array.isArray(nested)) {
          const mappedDistricts = (nested as Array<{ description: string; code: string }>).map((item) => ({
            districtCode: item.code,
            districtName: item.description,
          }));
          console.log("Setting district list with mapped nested array:", mappedDistricts);
          setDistrictList(mappedDistricts);
        }
      }
    } catch (err) {
      console.error("Error fetching district list:", err);
    } finally {
      setDistrictsLoading(false);
    }
  };

  // District change handler
  const handleDistrictChange = (selectedCode: string) => {
    setDistrictCode(selectedCode);
    const found = districtList.find((d) => d.districtCode === selectedCode);
    setDistrictName(found?.districtName || selectedCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    if (!firstName.trim()) {
      showToast("error", "First name is required.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: fullName.trim() || `${firstName.trim()} ${lastName.trim()}`.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        gender,
        maritalStatus,
        educationalQualification: educationalQualification.trim(),
        dateOfBirth: dateOfBirth || undefined,
        shopName: shopName.trim(),
        shopCategory: shopCategory || undefined,
        propertyType: propertyType || undefined,
        businessProofType: businessProofType || undefined,
        addressLine: addressLine.trim(),
        city: city.trim(),
        state: state.trim(),
        districtName: districtName.trim(),
        districtCode: districtCode.trim(),
        pincode: pincode.trim(),
        completeAddress: completeAddress.trim() || undefined,
      };

      const response = await updateRetailerProfile(payload);
      if (response && (response.success || response.data)) {
        onSuccess(response.data);
        onClose();
      } else {
        throw new Error("Failed to update profile.");
      }
    } catch (err: unknown) {
      showToast("error", err, "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Profile"
      description="Update personal or business store details"
      icon={User}
      size={size || "lg"}
      formId="edit-profile-form"
      submitLabel="Save Changes"
      isSubmitting={isSubmitting}
      headerTabs={
        <div className="flex px-6">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${activeTab === "personal"
              ? "border-[#7c3aed] text-[#7c3aed]"
              : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            <User className="h-4 w-4" />
            <span>Personal Information</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shop")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${activeTab === "shop"
              ? "border-[#7c3aed] text-[#7c3aed]"
              : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            <Store className="h-4 w-4" />
            <span>Shop & Address</span>
          </button>
        </div>
      }
    >
      <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-4">
        {activeTab === "personal" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                placeholder="Enter full name"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  maxLength={10}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  placeholder="Enter 10-digit mobile number"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Father's Name
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  placeholder="Enter father's name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mother's Name
                </label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  placeholder="Enter mother's name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Marital Status
                </label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Educational Qualification
              </label>
              <input
                type="text"
                value={educationalQualification}
                onChange={(e) => setEducationalQualification(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                placeholder="e.g. Graduate, 12th Pass"
              />
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
              <span className="font-semibold text-slate-700">Note: </span>
              PAN number and Aadhaar number are verified identifiers and cannot be altered directly.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                placeholder="Enter business / shop name"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop Category
                </label>
                <select
                  value={shopCategory}
                  onChange={(e) => setShopCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                >
                  <option value="">Select Property Type</option>
                  {properties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Proof Type
                </label>
                <select
                  value={businessProofType}
                  onChange={(e) => setBusinessProofType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                >
                  <option value="">Select Proof Type</option>
                  {proofTypes.map((pt) => (
                    <option key={pt._id} value={pt._id}>
                      {pt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pincode
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={pincode}
                    maxLength={6}
                    onChange={handlePincodeChange}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 pr-10 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                    placeholder="6-digit pincode"
                  />
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    {pincodeLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#7c3aed]" />
                    ) : null}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State
                </label>
                <div className="relative">
                  <select
                    value={stateCode}
                    onChange={(e) => handleStateChange(e.target.value)}
                    disabled={statesLoading}
                    className="w-full appearance-none rounded-xl border border-slate-200 px-3.5 py-2 pr-10 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  >
                    <option value="">Select state</option>
                    {stateList.map((s) => (
                      <option key={s.stateCode} value={s.stateCode}>
                        {s.stateName}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    {statesLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#7c3aed]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District
                </label>
                <div className="relative">
                  <select
                    value={districtCode}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    disabled={districtsLoading || !stateCode}
                    className="w-full appearance-none rounded-xl border border-slate-200 px-3.5 py-2 pr-10 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  >
                    <option value="">
                      {stateCode ? "Select district" : "Select state first"}
                    </option>
                    {districtList.map((d) => (
                      <option key={d.districtCode} value={d.districtCode}>
                        {d.districtName}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    {districtsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#7c3aed]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address Line
              </label>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                placeholder="Shop number, street, building, floor, etc."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Complete Address
              </label>
              <textarea
                rows={2}
                value={completeAddress}
                onChange={(e) => setCompleteAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                placeholder="Enter shop complete street address"
              />
            </div>
          </div>
        )}

      </form>
    </Modal>
  );
}
