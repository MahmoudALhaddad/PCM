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
  const [profileError, setProfileError] = useState(null); // show a friendly error instead of redirect looping
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  // Fetch current user profile
  const fetchProfile = async () => {
    if (!token) return navigate("/login");

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        // Auth is bad: clear and bounce to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("currentUser");
        return navigate("/login");
      }

      if (!res.ok) {
        const message = `Profile request failed (${res.status})`;
        console.error(message);
        setProfileError(message);
        return;
      }

      const data = await res.json();
      setCurrentUser(data);
      setProfileError(null);
      localStorage.setItem("currentUser", JSON.stringify(data)); // for RequireRole
    } catch (err) {
      console.error("Profile request error", err);
      setProfileError("Cannot reach server. Please check your network/API URL.");
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

    const newSocket = io(`${process.env.REACT_APP_API_URL}`, {
      auth: { token },
      path: '/socket.io',
      transports: ['websocket'],
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

  // Wait until user is loaded; show error instead of looping redirects
  if (profileError) {
    return (
      <div style={{ padding: "24px" }}>
        <h2>Unable to load your profile</h2>
        <p>{profileError}</p>
        <p>Check your connection or REACT_APP_API_URL, then refresh.</p>
      </div>
    );
  }

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