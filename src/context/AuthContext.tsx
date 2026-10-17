import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getAuthenticatedRetailer, type RetailerUser } from "../services/api/retailer/retailerAuthApi";
import { logout as authLogout, getToken } from "../utils/auth";

export interface AuthContextType {
  user: RetailerUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: RetailerUser) => void;
  refreshUser: () => Promise<RetailerUser | null>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<RetailerUser | null>>;
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

  const login = useCallback(
    (userData: RetailerUser) => {
      inMemoryAuthUser = userData;
      setUserState(userData);
      setIsAuthenticated(true);
      setIsLoading(false);
    },
    []
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
      const res = await getAuthenticatedRetailer(token);
      if (res && res.data) {
        setUser(res.data);
        setIsAuthenticated(true);
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
  }, [setUser]);

  const handleLogout = useCallback(() => {
    authLogout();
    inMemoryAuthUser = null;
    setUserState(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleLogoutEvent = () => {
      inMemoryAuthUser = null;
      setUserState(null);
      setIsAuthenticated(false);
      setIsLoading(false);
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
    getAuthenticatedRetailer(token)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data) {
          inMemoryAuthUser = res.data;
          setUserState(res.data);
          setIsAuthenticated(true);
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
  }, []);

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
