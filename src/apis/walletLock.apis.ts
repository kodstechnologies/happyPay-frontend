import api from "../config/axiosInstance";

// Wallet Lock Status Interfaces
export interface WalletLockStatusData {
  isLocked: boolean;
  lockedAt: string | null;
  reason: string | null;
}

export interface WalletLockStatusResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: WalletLockStatusData;
}

// Admin Lock/Unlock Interfaces
export interface LockWalletPayload {
  userId: string;
  reason: string;
  adminNotes?: string;
}

export interface UnlockWalletPayload {
  userId: string;
  adminNotes?: string;
}

export interface LockUnlockResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    userId: string;
    isLocked: boolean;
    reason?: string;
    lockedAt?: string;
  };
}

// Get wallet lock status (retailer)
export const getWalletLockStatusApi = async (): Promise<WalletLockStatusResponse> => {
  const response = await api.get<WalletLockStatusResponse>("/api/v1/wallet-lock-requests/my/status");
  return response.data;
};

// Admin: Lock user wallet
export const lockUserWalletApi = async (
  payload: LockWalletPayload
): Promise<LockUnlockResponse> => {
  const response = await api.post<LockUnlockResponse>(
    "/api/v1/admin/wallet-lock",
    payload
  );
  return response.data;
};

// Admin: Unlock user wallet
export const unlockUserWalletApi = async (
  payload: UnlockWalletPayload
): Promise<LockUnlockResponse> => {
  const response = await api.post<LockUnlockResponse>(
    "/api/v1/admin/wallet-unlock",
    payload
  );
  return response.data;
};
