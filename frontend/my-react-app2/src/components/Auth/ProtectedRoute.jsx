import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
