import { useState, useEffect } from "react";
import { showToast } from "../../../../utils/toast";
import { Phone, Mail } from "lucide-react";
import Modal from "../../../../components/common/Modal";
import { useAuth } from "../../../../context/AuthContext";
import {
  sendMobileUpdateOtp,
  verifyMobileUpdateOtp,
  sendEmailUpdateOtp,
  verifyEmailUpdateOtp,
} from "../../../../services/api/retailer/retailerProfileApi";

interface ContactUpdateModalProps {
  open: boolean;
  onClose: () => void;
  type: "mobile" | "email";
  currentValue: string;
  onSuccess: () => void;
  currentMobile?: string; // Add currentMobile for security validation
}

export default function ContactUpdateModal({
  open,
  onClose,
  type,
  currentValue,
  onSuccess,
  currentMobile,
}: ContactUpdateModalProps) {
  const { user } = useAuth();
  const [newValue, setNewValue] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Get userId from AuthContext user object
  const getUserId = () => {
    return user?.id || user?._id;
  };

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewValue("");
       
      setOtp("");
       
      setOtpSent(false);
    }
  }, [open]);

  const handleClose = () => {
    setNewValue("");
    setOtp("");
    setOtpSent(false);
    onClose();
  };

  const handleSendOtp = async () => {
    const userId = getUserId();
    if (!userId) {
      showToast("error", "User not authenticated. Please login again.");
      return;
    }

    if (type === "mobile") {
      if (!newValue || newValue.length !== 10) {
        showToast("error", "Please enter a valid 10-digit mobile number.");
        return;
      }
      // Check if new mobile is the same as current mobile
      if (newValue === currentValue) {
        showToast("error", "New mobile number cannot be the same as your current mobile number.");
        return;
      }
    } else {
      if (!newValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)) {
        showToast("error", "Please enter a valid email address.");
        return;
      }
      // Check if new email is the same as current email
      if (newValue.toLowerCase() === currentValue.toLowerCase()) {
        showToast("error", "New email address cannot be the same as your current email address.");
        return;
      }
    }

    try {
      setIsSendingOtp(true);
      const response =
        type === "mobile"
          ? await sendMobileUpdateOtp(newValue, userId, currentMobile || "")
          : await sendEmailUpdateOtp(newValue, userId);

      if (response && response.success) {
        setOtpSent(true);
        showToast(
          "success",
          `OTP sent to your new ${type === "mobile" ? "mobile number" : "email address"}.`
        );
      } else {
        throw new Error(response?.message || "Failed to send OTP.");
      }
    } catch (err: unknown) {
      // Extract error message from API response
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const errorMessage = apiMessage || (err as Error)?.message || "Failed to send OTP";
      showToast("error", errorMessage);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const userId = getUserId();
    if (!userId) {
      showToast("error", "User not authenticated. Please login again.");
      return;
    }

    if (!otp || otp.length !== 4) {
      showToast("error", "Please enter a valid 4-digit OTP.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const response =
        type === "mobile"
          ? await verifyMobileUpdateOtp(otp, userId)
          : await verifyEmailUpdateOtp(otp, userId, newValue);

      if (response && response.success) {
        showToast("success", `${type === "mobile" ? "Mobile number" : "Email"} updated successfully!`);
        handleClose();
        onSuccess();
      } else {
        throw new Error(response?.message || "Failed to verify OTP.");
      }
    } catch (err: unknown) {
      // Extract error message from API response
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const errorMessage = apiMessage || (err as Error)?.message || "Failed to verify OTP";
      showToast("error", errorMessage);

      // If the error is about no pending OTP, reset to send OTP state
      if (errorMessage?.includes("No pending")) {
        setOtpSent(false);
        setOtp("");
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const icon = type === "mobile" ? Phone : Mail;
  const title = type === "mobile" ? "Change Mobile Number" : "Change Email Address";
  const description =
    type === "mobile"
      ? "Verify your new mobile number with OTP"
      : "Verify your new email address with OTP";
  const label = type === "mobile" ? "Mobile Number" : "Email Address";
  const placeholder =
    type === "mobile" ? "Enter 10-digit mobile number" : "Enter email address";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      icon={icon}
      size="sm"
      submitLabel={otpSent ? "Verify OTP" : "Send OTP"}
      isSubmitting={isSendingOtp || isVerifyingOtp}
      onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
    >
      <div className="space-y-4">
        {!otpSent ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New {label}
            </label>
            <input
              type={type === "mobile" ? "text" : "email"}
              value={newValue}
              onChange={(e) =>
                setNewValue(
                  type === "mobile"
                    ? e.target.value.replace(/\D/g, "").slice(0, 10)
                    : e.target.value
                )
              }
              maxLength={type === "mobile" ? 10 : undefined}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
              placeholder={placeholder}
            />
            <p className="mt-2 text-xs text-slate-500">
              Current: <span className="font-semibold text-slate-700">{currentValue}</span>
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
              placeholder="Enter 4-digit OTP"
            />
            <p className="mt-2 text-xs text-slate-500">
              OTP sent to <span className="font-semibold text-slate-700">{newValue}</span>
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
