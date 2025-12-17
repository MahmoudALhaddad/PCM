import React, { useEffect, useState } from "react";
import "../styles/users.css";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ name: "", password: "", role: "employee", department: "" });
  const [editingUser, setEditingUser] = useState(null);

  const token = localStorage.getItem("token");

  // Fetch current user profile
  const fetchProfile = async () => {
    const res = await fetch("http://localhost:5000/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setCurrentUser(data);
  };

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
    fetchUsers();
  }, []);

  // Add new user (admins only)
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        fetchUsers();
        setNewUser({ name: "", password: "", role: "employee", department: "" });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add user");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Delete user (admins only)
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchUsers();
      else {
        const err = await res.json();
        alert(err.error || "Failed to delete user");
      }
    } catch (error) {
      console.error(error);
    }
  };

    const handleUpdateUser = async (user) => {
    try {
        const res = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(user),
        });
        if (res.ok) {
        fetchUsers();
        setEditingUser(null);
        } else {
        const err = await res.json();
        alert(err.error || "Failed to update user");
        }
    } catch (error) {
        console.error(error);
    }
    };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="users-page">
      <h2>Users</h2>

      {/* Add user form (admins only) */}
      {(currentUser?.role === "admin" || currentUser?.role === "manager") && (
        <form className="add-user-form" onSubmit={handleAddUser}>
          <input
            type="text"
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />
          <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
          <input
            type="text"
            placeholder="Department"
            value={newUser.department}
            onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
          />
          <button type="submit">Add User</button>
        </form>
      )}

      {/* Users table */}
      <div className="users-table-container">
      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th> {/* New ID column */}
            <th>Name</th>
            <th>Role</th>
            <th>Department</th>
            {(currentUser?.role === "admin" || currentUser?.role === "manager") && (
              <th>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td> {/* Display user ID */}
              <td>
                {editingUser?.id === user.id ? (
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                ) : (
                  user.name
                )}
              </td>
              <td>
                {editingUser?.id === user.id ? (
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                  </select>
                ) : (
                  user.role
                )}
              </td>
              <td>
                {editingUser?.id === user.id ? (
                  <input
                    type="text"
                    value={editingUser.department}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  />
                ) : (
                  user.department
                )}
              </td>
              {(currentUser?.role === "admin" || currentUser?.role === "manager") && (
                <td>
                  {editingUser?.id === user.id ? (
                    <>
                      <button className="save-btn" onClick={() => handleUpdateUser(editingUser)}>Save</button>
                      <button className="cancel-btn" onClick={() => setEditingUser(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="edit-btn" onClick={() => setEditingUser({ ...user })}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                    </>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

    </div>
  );
}
