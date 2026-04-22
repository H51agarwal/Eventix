import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("eb_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    setUser(data.user);
    localStorage.setItem("eb_user", JSON.stringify(data.user));
    localStorage.setItem("eb_token", data.token);
    return data.user;
  };

  const register = async (name, email, password, role) => {
    const data = await authAPI.register(name, email, password, role);
    setUser(data.user);
    localStorage.setItem("eb_user", JSON.stringify(data.user));
    localStorage.setItem("eb_token", data.token);
    return data.user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("eb_user");
    localStorage.removeItem("eb_token");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);