import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Login failed";
  }
};

export const register = async (email, password, username) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
      username,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Registration failed";
  }
};

export const verifyUser = async (token) => {
  try {
    if (!token) {
      throw new Error("No token provided");
    }
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Verification failed";
  }
};

// This is a test endpoint to verify if the token is valid
export const getProtectedData = async (token) => {
  try {
    if (!token) {
      throw new Error("No token provided");
    }
    const response = await axios.get(`${API_URL}/auth/protected`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || "Access denied";
  }
};
