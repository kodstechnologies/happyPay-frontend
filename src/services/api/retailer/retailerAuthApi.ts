import { apiClient } from "../client";

interface Envelope<T> {
  data: T;
  message?: string;
}

export interface RetailerLoginResult {
  user: {
    id: string;
    email?: string;
    mobile: string;
    status: string;
    kycStatus?: string;
    adminApproved?: boolean;
    outletId?: string;
    roles: string[];
    permissions: string[];
  };
  accessToken: string;
  refreshToken: string;
}

export function sendRetailerLoginOtp(mobile: string) {
  return apiClient<Envelope<{ mobile: string; expiresInSeconds: number }>>(
    "/api/v1/auth/retailer/login/send-otp",
    {
      method: "POST",
      body: JSON.stringify({ mobile }),
    },
  );
}

export function verifyRetailerLoginOtp(payload: {
  mobile: string;
  otp: string;
  fcmToken?: string | null;
  deviceId?: string;
  platform?: string;
  deviceName?: string;
}) {
  return apiClient<Envelope<RetailerLoginResult>>(
    "/api/v1/auth/retailer/login/verify-otp",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
