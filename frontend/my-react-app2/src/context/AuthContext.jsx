import React, { createContext, useState, useEffect, useContext } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  verifyUser,
  getProtectedData,
} from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          await getProtectedData(token);
          setUser({ token });
        } catch (err) {
          console.error("Invalid token:", err);
          localStorage.removeItem("authToken");
          setToken(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiLogin(email, password);
      localStorage.setItem("authToken", data.token);
      setToken(data.token);
      setUser({ token: data.token });
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, username) => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiRegister(email, password, username);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
