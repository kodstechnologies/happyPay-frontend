import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getAuthenticatedRetailer, type RetailerUser } from "../services/api/retailer/retailerAuthApi";
import { logout as authLogout, getToken } from "../utils/auth";
import {
  getWalletLockState,
  updateWalletLockState,
  resetWalletLockState,
  type WalletLockState,
} from "../utils/wallet";

const EMPTY_WALLET_LOCK: WalletLockState = {
  isWalletLocked: false,
  reason: null,
  lockedAt: null,
};

export interface AuthContextType {
  user: RetailerUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: RetailerUser) => void;
  refreshUser: () => Promise<RetailerUser | null>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<RetailerUser | null>>;
  isWalletLocked: boolean;
  walletLockReason: string | null;
  walletLockedAt: string | null;
  refreshWalletLock: () => Promise<void>;
}

// In-memory module-level accessor for utility functions and non-React consumers
let inMemoryAuthUser: RetailerUser | null = null;
// eslint-disable-next-line react-refresh/only-export-components
export const getAuthUser = (): RetailerUser | null => inMemoryAuthUser;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pure in-memory React state (zero user data in localStorage)
  const [user, setUserState] = useState<RetailerUser | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !!getToken();
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!getToken();
  });

  const [walletLock, setWalletLock] = useState<WalletLockState>(() => getWalletLockState());

  const setUser: React.Dispatch<React.SetStateAction<RetailerUser | null>> = useCallback(
    (action) => {
      setUserState((prev) => {
        const nextUser = typeof action === "function" ? action(prev) : action;
        inMemoryAuthUser = nextUser;
        setIsAuthenticated(!!nextUser);
        setIsLoading(false);
        return nextUser;
      });
    },
    []
  );

  const applyWalletLock = useCallback((userData: RetailerUser | null) => {
    const lock = userData?.walletLock;
    const next: WalletLockState = lock
      ? {
          isWalletLocked: Boolean(lock.isWalletLocked),
          reason: lock.reason ?? null,
          lockedAt: lock.lockedAt ?? null,
        }
      : { ...EMPTY_WALLET_LOCK };
    updateWalletLockState(next);
    setWalletLock(next);
  }, []);

  const refreshWalletLock = useCallback(async () => {
    try {
      const res = await getAuthenticatedRetailer();
      if (res?.data) {
        applyWalletLock(res.data);
      }
    } catch {
      // Non-fatal: keep the last known lock state
    }
  }, [applyWalletLock]);

  const login = useCallback(
    (userData: RetailerUser) => {
      inMemoryAuthUser = userData;
      setUserState(userData);
      setIsAuthenticated(true);
      setIsLoading(false);
      applyWalletLock(userData);
    },
    [applyWalletLock]
  );

  const refreshUser = useCallback(async (): Promise<RetailerUser | null> => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return null;
    }

    try {
      setIsLoading(true);
      const res = await getAuthenticatedRetailer();
      if (res?.data) {
        setUser(res.data);
        if (res.data?.role?.name) {
          localStorage.setItem("userRole", res.data.role.name);
        }
        setIsAuthenticated(true);
        applyWalletLock(res.data);
        return res.data;
      } else {
        throw new Error("Invalid response from auth verification endpoint");
      }
    } catch (err) {
      console.warn("Session verification failed, logging out:", err);
      authLogout();
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, applyWalletLock]);

  const clearWalletLock = useCallback(() => {
    resetWalletLockState();
    setWalletLock({ ...EMPTY_WALLET_LOCK });
  }, []);

  const handleLogout = useCallback(() => {
    authLogout();
    inMemoryAuthUser = null;
    setUserState(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    localStorage.removeItem("userRole");
    clearWalletLock();
  }, [clearWalletLock]);

  useEffect(() => {
    const handleLogoutEvent = () => {
      inMemoryAuthUser = null;
      setUserState(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      localStorage.removeItem("userRole");
      resetWalletLockState();
      setWalletLock({ ...EMPTY_WALLET_LOCK });
    };

    window.addEventListener("hp:auth:logout", handleLogoutEvent);
    return () => {
      window.removeEventListener("hp:auth:logout", handleLogoutEvent);
    };
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }

    let isMounted = true;
    getAuthenticatedRetailer()
      .then((res) => {
        if (!isMounted) return;
        if (res?.data) {
          inMemoryAuthUser = res.data;
          setUserState(res.data);
          if (res.data?.role?.name) {
            localStorage.setItem("userRole", res.data.role.name);
          }
          setIsAuthenticated(true);
          applyWalletLock(res.data);
        } else {
          throw new Error("Invalid response from auth verification endpoint");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Session verification failed, logging out:", err);
        authLogout();
        inMemoryAuthUser = null;
        setUserState(null);
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [applyWalletLock]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        refreshUser,
        logout: handleLogout,
        setUser,
        isWalletLocked: walletLock.isWalletLocked,
        walletLockReason: walletLock.reason,
        walletLockedAt: walletLock.lockedAt,
        refreshWalletLock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
