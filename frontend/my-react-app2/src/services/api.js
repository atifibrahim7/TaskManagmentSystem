import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Login failed";
  }
};

export const register = async (email, password, username) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      email,
      password,
      username,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Registration failed";
  }
};

export const verifyUser = async (token) => {
  try {
    const response = await axios.post(
      `${API_URL}/verify`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Verification failed";
  }
};

export const getProtectedData = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/protected`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || "Access denied";
  }
};
