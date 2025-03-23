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
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        try {
          // First verify if the token is valid
          await getProtectedData(storedToken);
          // Then get the user data
          const userData = await verifyUser(storedToken);
          setToken(storedToken);
          setUser(userData);
        } catch (err) {
          console.error("Token verification failed:", err);
          localStorage.removeItem("authToken");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiLogin(email, password);
      if (data && data.token) {
        localStorage.setItem("authToken", data.token);
        setToken(data.token);
        // Get user data after successful login
        const userData = await verifyUser(data.token);
        setUser(userData);
      } else {
        throw new Error("No token received from server");
      }
      return data;
    } catch (err) {
      setError(err.message || "Login failed");
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
      setError(err.message || "Registration failed");
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
