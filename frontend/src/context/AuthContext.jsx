import { createContext, useContext, useState, useCallback } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialise from localStorage so page refreshes don't log the user out
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const isAuthenticated = Boolean(token);

  /** Persist token to state + localStorage */
  const saveToken = useCallback((newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }, []);

  /** Call /auth/signup on the backend */
  const signup = useCallback(
    async (email, password) => {
      const { data } = await api.post("/auth/signup", { email, password });
      saveToken(data.access_token);
    },
    [saveToken]
  );

  /** Call /auth/login on the backend */
  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post("/auth/login", { email, password });
      saveToken(data.access_token);
    },
    [saveToken]
  );

  /** Call /auth/logout and wipe local state */
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if the server call fails, clear local state
    }
    localStorage.removeItem("token");
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Convenience hook */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
