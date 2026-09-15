import React, { createContext, useContext, useEffect, useState } from "react";
import { checkAdminAuth, loginAdmin, logoutAdmin } from "@/lib/api";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAuth = async () => {
    setIsLoading(true);
    try {
      const valid = await checkAdminAuth();
      setIsAuthenticated(valid);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (password: string) => {
    const res = await loginAdmin(password);
    if (res.success) {
      setIsAuthenticated(true);
    }
    return res;
  };

  const logout = () => {
    logoutAdmin();
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth deve ser usado dentro de um AdminAuthProvider");
  }
  return ctx;
}
