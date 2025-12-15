import React, { useState, useEffect } from "react";
import { FaBell, FaUserCircle, FaSearch, FaBars } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import "../styles/topbar.css";

export default function Topbar({ collapsed, toggleSidebar, currentUser, socket }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Fetch notifications on mount
  const fetchNotifications = async () => {
    const res = await fetch("http://localhost:5000/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen to new notifications from socket
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
    };
    socket.on("new_notification", handleNewNotification);
    return () => socket.off("new_notification", handleNewNotification);
  }, [socket]);

  // Mark notification as read
  const handleNotificationClick = async (id, link) => {
    try {
      await fetch("http://localhost:5000/api/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: [id] }),
      });

      // update local state so it doesn't reappear
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );

      setShowDropdown(false);

      if (link) {
        navigate(link);
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className={`topbar ${collapsed ? "collapsed" : ""}`}>
      <FaBars className="burger-icon" onClick={toggleSidebar} />

      <div className="search-container">
        <input type="text" placeholder="Search..." />
        <FaSearch className="search-icon" />
      </div>

      <div className="notification-container" style={{ position: "relative" }}>
        <FaBell className="topbar-icon" onClick={() => setShowDropdown(!showDropdown)} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}

        {showDropdown && (
          <div className="notification-dropdown">
            {notifications.length === 0 ? (
              <div className="notification-item">No notifications</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notification-item ${n.is_read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(n.id, n.link)}
                >
                  {n.title}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Link to={"/profile"}>
        <FaUserCircle className="topbar-icon" />
      </Link>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}
