import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken } from "../api/client";
import { User, Household } from "../types";

interface AuthResponse {
  token: string;
  user: User;
  household: Household;
}

interface AuthContextValue {
  user: User | null;
  household: Household | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    name: string;
    inviteCode?: string;
    householdName?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: User; household: Household }>("/auth/me")
      .then(({ user, household }) => {
        setUser(user);
        setHousehold(household);
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse>("/auth/login", { email, password });
    setToken(res.token);
    setUser(res.user);
    setHousehold(res.household);
  }, []);

  const signup = useCallback(
    async (data: { email: string; password: string; name: string; inviteCode?: string; householdName?: string }) => {
      const res = await api.post<AuthResponse>("/auth/signup", data);
      setToken(res.token);
      setUser(res.user);
      setHousehold(res.household);
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setHousehold(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, household, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
