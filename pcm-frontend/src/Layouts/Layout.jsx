import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { io } from "socket.io-client";
import "../styles/layout.css";

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
      <Sidebar collapsed={sidebarCollapsed} currentUser={currentUser} />
      <Topbar
        collapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        currentUser={currentUser}
        socket={socket} // <-- pass socket to Topbar
      />
      <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="page-content">
          <Outlet context={{ currentUser, socket }} /> {/* optional: pass socket to pages */}
        </div>
      </div>
    </div>
  );
}
