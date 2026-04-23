import { createContext, useContext, useMemo, useState } from "react";
import { clearToken, getToken, setToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken() || "");
  const [user, setUser] = useState(null);

  const saveAuth = (t, u) => {
    setToken(t);
    setTokenState(t);
    setUser(u);
  };

  const logout = () => {
    clearToken();
    setTokenState("");
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, setUser, saveAuth, logout, isAuthenticated: Boolean(token) }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthStore() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthStore harus dipakai di dalam AuthProvider");
  return ctx;
}
