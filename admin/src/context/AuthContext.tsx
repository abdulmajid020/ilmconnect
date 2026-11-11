"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, UserRole } from "@/lib/types";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  activeRole: UserRole;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  activeRole: "ADMIN",
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setIsLoading(false);
      if (pathname !== "/login") router.replace("/login");
      return;
    }

    // Validate token with backend
    api
      .getCurrentUser()
      .then((u) => {
        setUser(u);
        setIsLoading(false);
      })
      .catch(() => {
        // Token invalid or backend unreachable — clear and redirect
        api.setToken(null);
        setUser(null);
        setIsLoading(false);
        if (pathname !== "/login") router.replace("/login");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    api.setToken(null);
    setUser(null);
    router.replace("/login");
  };

  const activeRole: UserRole = (user?.role as UserRole) ?? "ADMIN";

  return (
    <AuthContext.Provider value={{ user, activeRole, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
