import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("ethara_token");
    setUser(null);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("ethara_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.me();
        setUser(response.data.user);
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [logout]);

  useEffect(() => {
    window.addEventListener("ethara:logout", logout);
    return () => window.removeEventListener("ethara:logout", logout);
  }, [logout]);

  const login = async (payload) => {
    const response = await authApi.login(payload);
    localStorage.setItem("ethara_token", response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const register = async (payload) => {
    const response = await authApi.register(payload);
    localStorage.setItem("ethara_token", response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === "Admin",
      login,
      register,
      logout
    }),
    [loading, user, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
