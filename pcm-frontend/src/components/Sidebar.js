import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaUser, FaProjectDiagram, FaTasks, FaCalendarAlt, FaComments, FaClipboardList, FaCog, FaSignOutAlt, FaFolder } from "react-icons/fa";
import "../styles/sidebar.css";

import logoFullBright from "../assets/brightModeLogo.png";
import logoIconBright from "../assets/collabsedLOGO.png";

export default function Sidebar({ collapsed, currentUser }) {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", icon: <FaHome />, path: "/" },
    ...(currentUser?.role !== "employee" ? [{ name: "Users", icon: <FaUser />, path: "/users" }] : []),
    { name: "Projects", icon: <FaProjectDiagram />, path: "/projects" },
    { name: "Tasks", icon: <FaTasks />, path: "/tasks" },
    { name: "Calendar", icon: <FaCalendarAlt />, path: "/calendar" },
    { name: "Kanban", icon: <FaClipboardList />, path: "/kanban" },
    { name: "Chat", icon: <FaComments />, path: "/chat" },
    { name: "File Manager", icon: <FaFolder />, path: "/files" },
    { name: "Settings", icon: <FaCog />, path: "/settings" },
  ];

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-logo">
        <img src={collapsed ? logoIconBright : logoFullBright} alt="PCM Logo" />
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.name} className={location.pathname === item.path ? "active" : ""}>
            <Link to={item.path}>
              {item.icon}
              {!collapsed && <span>{item.name}</span>}
            </Link>
          </li>
        ))}
      </ul>

      <ul className="sidebar-menu mt-auto">
        <li>
          <Link to="/logout">
            <FaSignOutAlt />
            {!collapsed && <span>Logout</span>}
          </Link>
        </li>
      </ul>
    </div>
  );
}
