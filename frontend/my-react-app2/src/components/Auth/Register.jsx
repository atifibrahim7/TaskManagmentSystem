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
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="bg-gray-800 text-white">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold">Register</h2>
            <p className="mt-2">Create a new account</p>
          </div>

          {error && (
            <div className="bg-red-500 text-white p-3 rounded mb-4">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-500 text-white p-3 rounded mb-4">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="bg-gray-700 text-white border-gray-600"
              required
            />

            <Input
              label="Username"
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="bg-gray-700 text-white border-gray-600"
              required
            />

            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="bg-gray-700 text-white border-gray-600"
              required
            />

            <Input
              label="Confirm Password"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="bg-gray-700 text-white border-gray-600"
              required
            />

            <Button
              type="submit"
              className="w-full bg-gray-600 hover:bg-gray-500"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Register"}
            </Button>

            <div className="mt-6 text-center">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="text-blue-400 hover:text-blue-300">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
