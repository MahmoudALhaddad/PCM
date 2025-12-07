import React from "react";
import { FaBell, FaUserCircle, FaSearch, FaBars } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

import "../styles/topbar.css";

export default function Topbar({ collapsed, toggleSidebar }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove the JWT token
    navigate("/login"); // Redirect to login page
  };

  return (
    <div className={`topbar ${collapsed ? "collapsed" : ""}`}>
      <FaBars className="burger-icon" onClick={toggleSidebar} />

      <div className="search-container">
        <input type="text" placeholder="Search..." />
        <FaSearch className="search-icon" />
      </div>

      <FaBell className="topbar-icon" />

      <Link to={"/profile"}>
        <FaUserCircle className="topbar-icon" />
      </Link>

      {/* Logout button */}
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}
