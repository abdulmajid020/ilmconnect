import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getAuthToken, removeAuthToken, setAuthToken } from '../api/client';

export interface User {
  id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  gender: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await getAuthToken();
      if (storedToken) {
        setToken(storedToken);
        const userData = await api.me();
        setUser(userData);
      }
    } catch (err) {
      console.log('Failed to restore session:', err);
      await removeAuthToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(newToken: string, newUser: User) {
    await setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }

  async function logout() {
    await removeAuthToken();
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    try {
      const userData = await api.me();
      setUser(userData);
    } catch (err) {
      console.log('Refresh error:', err);
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

