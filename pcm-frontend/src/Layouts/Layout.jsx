import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/layout.css";

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div>
      <Sidebar collapsed={sidebarCollapsed} />
      <Topbar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
