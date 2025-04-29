import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { Card } from "../UI/Card";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
    const { email, password } = formData;
    
    // Validation checks
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const response = await login(email, password);
      if (response && response.token) {
        navigate("/dashboard", { replace: true });
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Left side illustration */}
        <div className="fixed bottom-0 left-0 w-1/3 pointer-events-none hidden lg:block">
          {/* <img
            src="/api/placeholder/400/320"
            alt="Illustration"
            className="w-full"
          /> */}
        </div>

        {/* Right side illustration */}
        <div className="fixed bottom-0 right-0 w-1/3 pointer-events-none hidden lg:block">
          {/* <img
            src="/api/placeholder/400/320"
            alt="Illustration"
            className="w-full"
          /> */}
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
            <span className="ml-2 text-2xl font-bold text-gray-800">Login</span>
          </div>
        </div>

        <Card className="bg-white shadow-lg rounded-lg p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Welcome back
            </h2>
            <p className="mt-2 text-gray-600">Please sign in to your account</p>
          </div>

          {error && (
            <div data-testid="error-message" className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
              {error}
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
                data-testid="login-username"
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
                placeholder="Enter your password"
                data-testid="login-password"
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-700"
              >
                Remember me
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md"
              disabled={isLoading}
              data-testid="login-submit"
            >
              {isLoading ? "Signing in..." : "Log in"}
            </Button>

            <div className="text-center">
              <Link
                to="/register"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                New to this website? Sign up!
              </Link>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex justify-center mb-4">
            {/* <img
              src="/api/placeholder/120/30"
              alt="Atlassian logo"
              className="h-8"
            /> */}
          </div>
          <p className="text-sm text-gray-600">Trademark Atif Taha Ahmad</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
