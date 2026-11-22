"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, SignInOptions } from "@/lib/auth/types";
import { showToast } from "@/components/watchlist/Toast";

export type SessionStatus = "authenticated" | "unauthenticated" | "loading";

interface SessionContextType {
  user: User | null;
  status: SessionStatus;
  isAuthenticated: boolean;
  signIn: (options: SignInOptions) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setStatus("authenticated");
          return;
        }
      }
      setUser(null);
      setStatus("unauthenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signIn = async (options: SignInOptions): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setStatus("authenticated");
        showToast({ message: `Welcome back, ${data.user.name}!` });
        return true;
      }
      showToast({ message: "Sign in failed. Please try again." });
      return false;
    } catch {
      showToast({ message: "Network error during sign in." });
      return false;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      setUser(null);
      setStatus("unauthenticated");
      showToast({ message: "You have been signed out." });
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        status,
        isAuthenticated: status === "authenticated" && user !== null,
        signIn,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
