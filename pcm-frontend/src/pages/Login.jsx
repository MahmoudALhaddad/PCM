import React, { useState } from "react";
import "../styles/login.css";
import logoFullBright from "../assets/brightModeLogo.png";

export default function Login() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect to dashboard or projects page
        window.location.href = "/";
      } else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-form-wrapper">
          <div className="login-logo-container">
            <img src={logoFullBright} alt="PCM Logo" className="login-logo" />
          </div>

          <h1 className="login-title">Welcome to PCM</h1>
          <p className="login-subtitle">
            Manage your projects, collaborate with your team, and track progress seamlessly.
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder=" username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

         </div>
      </div>

      <div className="login-right">
        <div className="vision-content">
          <h2 className="vision-title">Empower Your Business</h2>
          
          <div className="vision-highlights">
            <div className="vision-item">
              <div className="vision-icon">🚀</div>
              <h3>Enhance Digital Presence</h3>
              <p>Help businesses establish and strengthen their online presence in today's digital marketplace.</p>
            </div>

            <div className="vision-item">
              <div className="vision-icon">⚙️</div>
              <h3>Optimize IT Infrastructure</h3>
              <p>Streamline your technology infrastructure for improved efficiency, scalability, and reliability.</p>
            </div>

            <div className="vision-item">
              <div className="vision-icon">📈</div>
              <h3>Drive Growth & Success</h3>
              <p>Leverage technology consulting and digital marketing strategies to accelerate your business growth.</p>
            </div>
          </div>

          <div className="vision-quote">
            <p>"Transform your business with intelligent technology solutions and strategic digital marketing expertise."</p>
          </div>
        </div>
      </div>
    </div>
  );
}
