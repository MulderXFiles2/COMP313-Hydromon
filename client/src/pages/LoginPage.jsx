/**
 * LoginPage.jsx
 *
 * Authentication page allowing users to log into the system.
 */

import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { isAuthenticated, loginUser } from "../api/auth.api";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(form);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login is unavailable right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <p className="login-eyebrow">Hydroponic Monitoring</p>
        <h1>Login</h1>
        <p className="login-copy">
          Sign in with any valid registered user stored in the API database, or
          create an account from the registration page.
        </p>

        {error && <div className="login-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="login-footer">
          Need an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;