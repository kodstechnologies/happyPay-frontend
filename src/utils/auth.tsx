import { clearTokens, getAccessToken, getRefreshToken } from "../services/auth/token";
import { clearRegistrationData } from "../pages/retailer/auth/registrationStorage";
import { logoutRetailerApi } from "../services/api/retailer/retailerAuthApi";

export const getToken = () => {
  return getAccessToken() || localStorage.getItem("token");
};

export const getRole = () => {
  return localStorage.getItem("role");
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const getPendingStepIndex = (currentRegistrationStep?: string | number | null): number => {
  const nextPendingStepMap: Record<string, number> = {
    ACCOUNT: 1,
    SHOP_DETAILS: 2,
    ABOUT: 3,
    AADHAAR_DETAILS: 4,
    BANK_DETAILS: 4,
    SUBMITTED: 4,
  };

  if (typeof currentRegistrationStep === "number") {
    return Math.min(4, Math.max(0, currentRegistrationStep));
  }
  if (typeof currentRegistrationStep === "string") {
    return nextPendingStepMap[currentRegistrationStep.toUpperCase()] ?? 1;
  }
  return 1;
};

export const logout = () => {
  // 1. Grab session tokens and device ID before wiping
  const refreshToken = getRefreshToken();
  const deviceId = localStorage.getItem("deviceId");

  // 2. Call backend logout API to revoke refreshToken & deactivate device FCM token in database
  if (refreshToken) {
    logoutRetailerApi({ refreshToken, deviceId }).catch((e) => {
      console.warn("Backend logout notification failed:", e);
    });
  }

  // 3. Clear auth tokens
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  clearTokens();

  // 4. Clear FCM push notification token
  localStorage.removeItem("fcmToken");

  // 5. Clear retailer session data
  localStorage.removeItem("retailerUser");
  localStorage.removeItem("retailerMobile");

  // 6. Clear registration cache & pending user state
  localStorage.removeItem("retailerUserId");
  localStorage.removeItem("pendingRetailerMobile");
  localStorage.removeItem("registeredRetailerMobile");
  clearRegistrationData();

  // 7. Clear session storage
  try {
    sessionStorage.clear();
  } catch (e) {
    console.error("Failed to clear sessionStorage on logout:", e);
  }

  // 8. Notify application listeners to reset in-memory user and auth states immediately
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("hp:auth:logout"));
  }
};