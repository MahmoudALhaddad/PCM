import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/layout.css";

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  // Fetch current user profile
  const fetchProfile = async () => {
    if (!token) return navigate("/login");

    try {
      const res = await fetch("http://localhost:5000/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        localStorage.setItem("currentUser", JSON.stringify(data)); // for RequireRole
      } else {
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      navigate("/login");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Wait until user is loaded
  if (!currentUser) return <p>Loading...</p>;

  return (
    <div className="layout">
      <Sidebar collapsed={sidebarCollapsed} currentUser={currentUser} />
      <Topbar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} currentUser={currentUser} />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="page-content">
          <Outlet context={{ currentUser }} />
        </div>
      </div>
    </div>
  );
}
