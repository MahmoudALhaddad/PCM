import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaProjectDiagram,
  FaTasks,
  FaCalendarAlt,
  FaComments,
  FaSignOutAlt,
  FaFolder,
  FaHistory,
} from "react-icons/fa";
import "../styles/sidebar.css";

import logoFullBright from "../assets/brightModeLogo.png";
import logoIconBright from "../assets/collabsedLOGO.png";

export default function Sidebar({ collapsed, currentUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", icon: <FaHome />, path: "/" },

    ...(currentUser?.role === "admin" || currentUser?.role === "manager"
      ? [{ name: "Users", icon: <FaUser />, path: "/users" }]
      : []),

    { name: "Projects", icon: <FaProjectDiagram />, path: "/projects" },

    ...(currentUser?.role === "admin" || currentUser?.role === "manager"
      ? [{ name: "Tasks", icon: <FaTasks />, path: "/tasks" }]
      : []),

    ...(currentUser?.role === "employee"
      ? [{ name: "My Tasks", icon: <FaTasks />, path: "/my-tasks" }]
      : []),

    { name: "Calendar", icon: <FaCalendarAlt />, path: "/calendar" },
    { name: "Chat", icon: <FaComments />, path: "/chat" },
    { name: "File Manager", icon: <FaFolder />, path: "/files" },

    ...(currentUser?.role === "admin" || currentUser?.role === "manager"
      ? [{ name: "Activity Logs", icon: <FaHistory />, path: "/activity" }]
      : []),
  ];

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <img
          src={collapsed ? logoIconBright : logoFullBright}
          alt="PCM Logo"
        />
      </div>

      {/* Menu */}
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li
            key={item.name}
            className={location.pathname === item.path ? "active" : ""}
          >
            <Link to={item.path}>
              {item.icon}
              {!collapsed && <span>{item.name}</span>}
            </Link>
          </li>
        ))}
      </ul>

      {/* Logout */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
