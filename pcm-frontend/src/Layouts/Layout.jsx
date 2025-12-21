import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { io } from "socket.io-client";
import "../styles/layout.css";

export default function Layout() {
  // Sidebar collapsed state; default collapsed on mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentUser, setCurrentUser] = useState(null);
  const [socket, setSocket] = useState(null); // <-- socket state
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

  // Track viewport width for responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        // Keep sidebar collapsed by default on mobile
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize socket after currentUser is loaded
  useEffect(() => {
    if (!currentUser || !token) return;

    const newSocket = io("http://localhost:5000", {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [currentUser, token]);

  // Wait until user is loaded
  if (!currentUser) return <p>Loading...</p>;

  return (
    <div className="layout">
        <Sidebar
          collapsed={sidebarCollapsed}
          currentUser={currentUser}
          toggleSidebar={toggleSidebar}
          isMobile={isMobile}
        />
      <div
        className={`backdrop ${isMobile && !sidebarCollapsed ? "show" : ""}`}
        onClick={() => setSidebarCollapsed(true)}
      />
      <Topbar
        collapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        currentUser={currentUser}
        socket={socket}
      />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="page-content">
          <Outlet context={{ currentUser, socket }} /> 
        </div>
      </div>
    </div>
  );
}