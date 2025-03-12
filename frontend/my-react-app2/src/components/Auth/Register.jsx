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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, username, password, confirmPassword } = formData;

    // Basic validation
    if (!email || !username || !password) {
      setError("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const result = await register(email, password, username);
      setSuccessMessage(result.message);
      // Clear form after successful registration
      setFormData({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
      });
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.toString());
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
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
            />

            <Input
              label="Username"
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Choose a username"
              required
            />

            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Create a password"
              required
            />

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

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md"
              disabled={isLoading}
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
