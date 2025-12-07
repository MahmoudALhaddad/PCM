import React, { useState } from "react";
import "../styles/login.css";
import logoFullBright from "../assets/brightModeLogo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password });
  };

  return (
    <div className="login-page">
      <div className="login-bg"></div>

      <div className="login-container">
        <img src={logoFullBright} alt="PCM Logo" className="login-logo" />
        <h2>Welcome Back</h2>
        <p>Sign in to your dashboard</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn">
            Sign In
          </button>
        </form>

        <div className="login-footer">
          <a href="#">Forgot password?</a>
        </div>
      </div>
    </div>
  );
}
