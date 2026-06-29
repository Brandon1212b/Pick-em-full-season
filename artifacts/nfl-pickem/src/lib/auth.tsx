import React, { createContext, useContext, useState } from "react";
import { useLocation } from "wouter";

export type UserRole = "member" | "admin";

export interface User {
  id: number;
  name: string;
  avatar?: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(user: User): User {
  return { ...user, role: user.role ?? "member" };
}

export function getAuthHeaders(): HeadersInit {
  const saved = localStorage.getItem("auth_user");
  if (!saved) return {};

  try {
    const user = JSON.parse(saved) as Pick<User, "id">;
    return Number.isInteger(user.id) ? { "x-user-id": String(user.id) } : {};
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    const saved = localStorage.getItem("auth_user");
    return saved ? normalizeUser(JSON.parse(saved)) : null;
  });
  const [, setLocation] = useLocation();

  const setUser = (user: User | null) => {
    const normalized = user ? normalizeUser(user) : null;
    setUserState(normalized);
    if (normalized) {
      localStorage.setItem("auth_user", JSON.stringify(normalized));
    } else {
      localStorage.removeItem("auth_user");
      setLocation("/");
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
