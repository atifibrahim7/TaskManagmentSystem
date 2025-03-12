import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProtectedData } from "../services/api";
import { Button } from "./UI/Button";
import { Card } from "./UI/Card";

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getProtectedData(token);
        setUserData(data);
      } catch (err) {
        setError("Failed to fetch user data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUserData();
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gray-800 text-white">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Logout
            </Button>
          </div>

          {error && (
            <div className="bg-red-500 text-white p-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-gray-700 p-4 rounded">
            <h2 className="text-xl font-semibold mb-4">Protected Content</h2>

            {userData ? (
              <div>
                <p>Welcome to the protected area!</p>
                <pre className="mt-4 bg-gray-800 p-3 rounded overflow-auto">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </div>
            ) : (
              <p>No user data available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
