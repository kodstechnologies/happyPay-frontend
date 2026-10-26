import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AdminUser } from "../types/admin/auth";
import { getAuthenticatedAdmin, logoutAdmin } from "../apis/adminAuth.apis";
import { getAdminToken, clearAdminSession } from "../utils/adminAuth";

export interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (admin: AdminUser) => void;
  refreshAdmin: () => Promise<AdminUser | null>;
  logout: () => Promise<void>;
  setAdmin: React.Dispatch<React.SetStateAction<AdminUser | null>>;
}

// In-memory module-level accessor for non-React utilities
let inMemoryAdminUser: AdminUser | null = null;
// eslint-disable-next-line react-refresh/only-export-components
export const getAuthAdmin = (): AdminUser | null => inMemoryAdminUser;

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pure in-memory React state (zero admin user data in localStorage)
  const [admin, setAdminState] = useState<AdminUser | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !!getAdminToken();
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!getAdminToken();
  });

  const setAdmin: React.Dispatch<React.SetStateAction<AdminUser | null>> = useCallback(
    (action) => {
      setAdminState((prev) => {
        const nextAdmin = typeof action === "function" ? action(prev) : action;
        inMemoryAdminUser = nextAdmin;
        setIsAuthenticated(!!nextAdmin);
        setIsLoading(false);
        return nextAdmin;
      });
    },
    []
  );

  const login = useCallback(
    (adminData: AdminUser) => {
      inMemoryAdminUser = adminData;
      setAdminState(adminData);
      setIsAuthenticated(true);
      setIsLoading(false);
    },
    []
  );

  const refreshAdmin = useCallback(async (): Promise<AdminUser | null> => {
    const token = getAdminToken();
    if (!token) {
      setAdmin(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return null;
    }

    try {
      setIsLoading(true);
      const res = await getAuthenticatedAdmin();
      if (res) {
        setAdmin(res);
        setIsAuthenticated(true);
        return res;
      } else {
        throw new Error("Invalid response from admin auth verification endpoint");
      }
    } catch (err) {
      console.warn("Admin session verification failed, clearing session:", err);
      clearAdminSession();
      setAdmin(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setAdmin]);

  const handleLogout = useCallback(async () => {
    try {
      await logoutAdmin();
    } finally {
      inMemoryAdminUser = null;
      setAdminState(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  // Listen for admin logout custom event
  useEffect(() => {
    const handleLogoutEvent = () => {
      inMemoryAdminUser = null;
      setAdminState(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    window.addEventListener("hp:admin:logout", handleLogoutEvent);
    return () => {
      window.removeEventListener("hp:admin:logout", handleLogoutEvent);
    };
  }, []);

  // Bootstrap session from /api/admin/auth/me on mount
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      return;
    }

    let isMounted = true;
    getAuthenticatedAdmin()
      .then((res) => {
        if (!isMounted) return;
        if (res) {
          inMemoryAdminUser = res;
          setAdminState(res);
          setIsAuthenticated(true);
        } else {
          throw new Error("Invalid response from admin auth verification endpoint");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Admin session verification failed on mount:", err);
        clearAdminSession();
        inMemoryAdminUser = null;
        setAdminState(null);
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
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated,
        login,
        refreshAdmin,
        logout: handleLogout,
        setAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
