import React, { useState, useEffect } from "react";
import "../styles/profile.css";
import profilePic from "../assets/profilePic.png";

export default function Profile() {
  const [user, setUser] = useState({
    name: "",
    role: "",
    department: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok) {
          setUser({
            name: data.name,
            role: data.role,
            department: data.department,
          });
        } else {
          console.error(data.error);
        }
      } catch (error) {
        console.error("Fetch profile error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: user.name,
          department: user.department,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Profile updated successfully!");
      } else {
        alert(data.error || "Update failed");
      }
    } catch (error) {
      console.error("Update profile error:", error);
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="profile-page">
      <h2>My Profile</h2>
      <div className="profile-card">
        <div className="profile-avatar">
          <img src={profilePic} alt="Profile" />
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={user.name}
            onChange={handleChange}
            readOnly={!(user.role === "admin" || user.role === "manager")}
          />
        </div>

        <div className="form-group">
          <label>Role</label>
          <input type="text" name="role" value={user.role} readOnly />
        </div>

        <div className="form-group">
          <label>Department</label>
          <input
            type="text"
            name="department"
            value={user.department}
            onChange={handleChange}
            readOnly={!(user.role === "admin" || user.role === "manager")}
          />
        </div>

        {(user.role === "admin" || user.role === "manager") && (
          <button type="submit" className="save-btn">
            Save Changes
          </button>
        )}

        </form>
      </div>
    </div>
  );
}
