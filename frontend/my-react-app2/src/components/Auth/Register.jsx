import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { Card } from "../UI/Card";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    return passwordRegex.test(password);
  };

  const validateUsername = (username) => {
    // First check length
    if (username.length < 3 || username.length > 20) {
      return false;
    }
    // Then check for alphanumeric characters
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    return usernameRegex.test(username);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, username, password, confirmPassword } = formData;

    // Clear any previous errors
    setError("");

    // Validation checks
    if (!email || !username || !password || !confirmPassword) {
      setError("Please fill in all required fields");
      return;
    }

    // Email validation check
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError("Username must be 3-20 characters");
      return;
    }

    if (!validateUsername(username)) {
      setError("Username must contain only letters and numbers");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be 8-20 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      await register(email, password, username);
      setSuccessMessage("Registration successful! Redirecting to login...");
      // Clear form after successful registration
      setFormData({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
      });
      // Redirect to login immediately
      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Left side illustration */}
        <div className="fixed bottom-0 left-0 w-1/3 pointer-events-none hidden lg:block">
          <img
            src="/api/placeholder/400/320"
            alt="Illustration"
            className="w-full"
          />
        </div>

        {/* Right side illustration */}
        <div className="fixed bottom-0 right-0 w-1/3 pointer-events-none hidden lg:block">
          <img
            src="/api/placeholder/400/320"
            alt="Illustration"
            className="w-full"
          />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center">
            <div className="bg-blue-600 text-white p-2 rounded">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <rect x="7" y="7" width="3" height="9"></rect>
                <rect x="14" y="7" width="3" height="5"></rect>
              </svg>
            </div>
            <span className="ml-2 text-2xl font-bold text-gray-800">
              Trello
            </span>
          </div>
        </div>

        <Card className="bg-white shadow-lg rounded-lg p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Create your account
            </h2>
            <p className="mt-2 text-gray-600">Join our community today</p>
          </div>

          {error && (
            <div data-testid="error-message" className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Email"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
                required
                data-testid="signup-email"
              />
            </div>

            <div>
              <Input
                label="Username"
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Choose a username (3-20 characters)"
                required
                data-testid="signup-username"
              />
            </div>

            <div>
              <Input
                label="Password"
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Create a password (8-20 characters)"
                required
                data-testid="signup-password"
              />
            </div>

            <div>
              <Input
                label="Confirm Password"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md"
              disabled={isLoading}
              data-testid="signup-submit"
            >
              {isLoading ? "Creating account..." : "Register"}
            </Button>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600 hover:text-blue-800">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/api/placeholder/120/30"
              alt="Atlassian logo"
              className="h-8"
            />
          </div>
          <p className="text-sm text-gray-600">
            One account for Trello, Jira, Confluence and more.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
