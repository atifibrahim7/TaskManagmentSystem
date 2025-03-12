import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { Card } from "../UI/Card";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      await login(email, password);
      navigate("/dashboard");
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
            <h2 className="text-3xl font-bold">Login Form</h2>
            <p className="mt-2">
              Welcome back, <br />
              Please sign in to your account.
            </p>
          </div>

          {error && (
            <div className="bg-red-500 text-white p-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-700 text-white border-gray-600"
              required
            />

            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-700 text-white border-gray-600"
              required
            />

            <div className="flex items-center mb-4">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm">
                Remember me
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gray-600 hover:bg-gray-500"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Submit"}
            </Button>

            <div className="mt-6 flex justify-between">
              <Link
                to="/register"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Register
              </Link>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Forgot Your Password?
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
