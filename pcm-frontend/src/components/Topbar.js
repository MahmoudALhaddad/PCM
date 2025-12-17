import React, { useState, useEffect } from "react";
import { FaBell, FaUserCircle, FaSearch, FaBars } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import "../styles/topbar.css";

export default function Topbar({ collapsed, toggleSidebar, currentUser, socket }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hideBadge, setHideBadge] = useState(false); // 👈 NEW

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter(n => !n.is_read).length
    : 0;

  // =============================
  // Fetch notifications on mount
  // =============================
  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ======================================
  // Listen to socket notifications
  // ======================================
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...((Array.isArray(prev) ? prev : []))]);
      setHideBadge(false); // 👈 show badge again on new notification
    };

    socket.on("new_notification", handleNewNotification);
    return () => socket.off("new_notification", handleNewNotification);
  }, [socket]);

  // ======================================
  // Mark notification as read
  // ======================================
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

      setNotifications(prev =>
        (Array.isArray(prev) ? prev : []).map(n => (n.id === id ? { ...n, is_read: true } : n))
      );

      setShowDropdown(false);

      if (link) navigate(link);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // =============================
  // Bell click handler
  // =============================
  const handleBellClick = async () => {
    setShowDropdown(prev => !prev);
    setHideBadge(true);

    try {
      await fetch("http://localhost:5000/api/notifications/mark-all-read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state so refresh doesn't bring them back
      setNotifications(prev =>
        (Array.isArray(prev) ? prev : []).map(n => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };


  return (
    <div className={`topbar ${collapsed ? "collapsed" : ""}`}>
      <FaBars className="burger-icon" onClick={toggleSidebar} />

      <div className="search-container">
        <input type="text" placeholder="Search..." />
        <FaSearch className="search-icon" />
      </div>

      <div className="topbar-right">
        <div className="notification-container" style={{ position: "relative" }}>
          <FaBell className="topbar-icon" onClick={handleBellClick} />

          {unreadCount > 0 && !hideBadge && (
            <span className="notification-badge">{unreadCount}</span>
          )}

          {showDropdown && (
            <div className="notification-dropdown">
              {notifications.length === 0 ? (
                <div className="notification-item">No notifications</div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`notification-item ${n.is_read ? "read" : "unread"}`}
                    onClick={() => handleNotificationClick(n.id, n.link)}
                  >
                    {n.title}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <Link to="/profile">
          <FaUserCircle className="topbar-icon" />
        </Link>
      </div>
    </div>
  );
}
