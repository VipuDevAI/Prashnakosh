import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import type { AuthUser, UserRole } from "@shared/schema";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (user: AuthUser, token: string, expiresAt?: number) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const performLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("safal_user");
    localStorage.removeItem("safal_token");
    localStorage.removeItem("safal_expires_at");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const checkSessionExpiry = useCallback(() => {
    const expiresAt = localStorage.getItem("safal_expires_at");
    if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
      performLogout();
      window.location.href = "/?expired=1";
    }
  }, [performLogout]);

  const startExpiryTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(checkSessionExpiry, SESSION_CHECK_INTERVAL);
  }, [checkSessionExpiry]);

  useEffect(() => {
    const storedUser = localStorage.getItem("safal_user");
    const storedToken = localStorage.getItem("safal_token");
    const storedExpiry = localStorage.getItem("safal_expires_at");

    if (storedUser && storedToken) {
      // Check if session already expired
      if (storedExpiry && Date.now() > parseInt(storedExpiry, 10)) {
        performLogout();
      } else {
        try {
          setUser(JSON.parse(storedUser));
          startExpiryTimer();
        } catch {
          performLogout();
        }
      }
    }
    setIsLoading(false);
  }, [performLogout, startExpiryTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const login = (user: AuthUser, token: string, expiresAt?: number) => {
    setUser(user);
    localStorage.setItem("safal_user", JSON.stringify(user));
    localStorage.setItem("safal_token", token);
    if (expiresAt) {
      localStorage.setItem("safal_expires_at", String(expiresAt));
    }
    startExpiryTimer();
  };

  const logout = () => {
    performLogout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function getToken(): string | null {
  return localStorage.getItem("safal_token");
}

export function hasRole(user: AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
