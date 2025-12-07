import React, { useState } from "react";
import "../styles/login.css";
import logoFullBright from "../assets/brightModeLogo.png";

export default function Login() {
  const [name, setName] = useState(""); // changed from email
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, password }), // send name instead of email
      });

      const data = await response.json();

      if (response.ok) {
        // Save the token in localStorage or sessionStorage
        localStorage.setItem('token', data.token);

        // Redirect to dashboard
        window.location.href = '/';
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Something went wrong');
    }
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
              type="text" // changed from email
              placeholder="Username"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
