/**
 * RegisterPage.jsx
 *
 * Registration page for creating a regular operator account.
 */

import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { isAuthenticated, registerUser } from "../api/auth.api";
import "./RegisterPage.css";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
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
      await registerUser(form);
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration is unavailable right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="register-page">
      <div className="register-card">
        <p className="register-eyebrow">Hydroponic Monitoring</p>
        <h1>Create account</h1>
        <p className="register-copy">
          Register a standard operator account to access the dashboard.
        </p>

        {error && <div className="register-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <label className="register-field">
            <span>Username</span>
            <input
              type="text"
              name="userName"
              placeholder="Enter username"
              value={form.userName}
              onChange={handleChange}
              required
            />
          </label>

          <label className="register-field">
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

          <label className="register-field">
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

          <label className="register-field">
            <span>Confirm password</span>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </label>

          <p className="register-hint">
            Password must be at least 8 characters and include an uppercase letter,
            a lowercase letter, and a number.
          </p>

          <button className="register-submit" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="register-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
};

export default RegisterPage;