import { useState, useEffect } from "react";
import { User, Store, AlertCircle } from "lucide-react";
import Modal from "../../../../components/common/Modal";
import type { ModalSize } from "../../../../components/common/ModalWrapper";
import { updateRetailerProfile } from "../../../../services/api/retailer/retailerProfileApi";
import {
  getCategories,
  getPropertyTypes,
  getProofTypes,
  getEducationalQualifications,
  type MasterDataItem,
} from "../../../../services/api/masterData/masterDataApi";
import type { RetailerFullProfile } from "../../../../types/retailer/profile";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: RetailerFullProfile;
  onSuccess: (updatedProfile: RetailerFullProfile) => void;
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
  const [fullName, setFullName] = useState(profile.fullName || "");
  const [fatherName, setFatherName] = useState(profile.fatherName || "");
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
  const [pincode, setPincode] = useState(profile.shop?.address?.pincode || "");
  const [completeAddress, setCompleteAddress] = useState(
    profile.shop?.completeAddress || ""
  );

  // Master data
  const [categories, setCategories] = useState<MasterDataItem[]>([]);
  const [properties, setProperties] = useState<MasterDataItem[]>([]);
  const [proofTypes, setProofTypes] = useState<MasterDataItem[]>([]);
  const [qualifications, setQualifications] = useState<MasterDataItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    Promise.allSettled([
      getCategories(),
      getPropertyTypes(),
      getProofTypes(),
      getEducationalQualifications(),
    ]).then(([catRes, propRes, proofRes, qualRes]) => {
      if (!isMounted) return;
      if (catRes.status === "fulfilled" && catRes.value?.data) {
        setCategories(catRes.value.data);
      }
      if (propRes.status === "fulfilled" && propRes.value?.data) {
        setProperties(propRes.value.data);
      }
      if (proofRes.status === "fulfilled" && proofRes.value?.data) {
        setProofTypes(proofRes.value.data);
      }
      if (qualRes.status === "fulfilled" && qualRes.value?.data) {
        setQualifications(qualRes.value.data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        fullName: fullName.trim(),
        fatherName: fatherName.trim(),
        gender,
        maritalStatus,
        educationalQualification,
        dateOfBirth: dateOfBirth || undefined,
        shopName: shopName.trim(),
        shopCategory: shopCategory || undefined,
        propertyType: propertyType || undefined,
        businessProofType: businessProofType || undefined,
        addressLine: addressLine.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        completeAddress: completeAddress.trim() || undefined,
      };

      const response = await updateRetailerProfile(payload);
      if (response && response.data) {
        onSuccess(response.data);
        onClose();
      } else {
        throw new Error("Failed to update profile.");
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Failed to update profile. Please try again.";
      setError(errorMsg);
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
      size={size||"lg"}
      formId="edit-profile-form"
      submitLabel="Save Changes"
      isSubmitting={isSubmitting}
      headerTabs={
        <div className="flex px-6">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
              activeTab === "personal"
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
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
              activeTab === "shop"
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
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-100">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}
          {activeTab === "personal" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                    placeholder="Enter full name"
                  />
                </div>

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
                {qualifications.length > 0 ? (
                  <select
                    value={educationalQualification}
                    onChange={(e) => setEducationalQualification(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                  >
                    <option value="">Select Qualification</option>
                    {qualifications.map((q) => (
                      <option key={q._id} value={q.name}>
                        {q.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={educationalQualification}
                    onChange={(e) => setEducationalQualification(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                    placeholder="e.g. Graduate, 12th Pass"
                  />
                )}
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
                <span className="font-semibold text-slate-700">Note: </span>
                Mobile number, Email, PAN number, and Aadhaar number are verified identifiers and cannot be altered directly.
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                    placeholder="Enter state"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    maxLength={6}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                    placeholder="6-digit pincode"
                  />
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
