import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/tasks.css";

export default function AddTaskModal({ show, onClose, projectId, refreshTasks }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [dueDate, setDueDate] = useState("");
  const [users, setUsers] = useState([]);
  const [assignedTo, setAssignedTo] = useState([]);

  // Fetch project members instead of all users
  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/projects/${projectId}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsers(res.data);
      } catch (err) {
        console.error("Error loading project members:", err);
      }
    };

    if (projectId) fetchProjectMembers();
  }, [projectId]);

  const handleCheckboxChange = (user) => {
    setAssignedTo((prev) => {
      if (prev.find((u) => u.userId === user.userId)) {
        return prev.filter((u) => u.userId !== user.userId);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const assignedIds = assignedTo.map((u) => u.userId);

    const payload = {
      projectId,
      title,
      description,
      priority,
      status,
      dueDate,
      assignedTo: assignedIds,
    };

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/tasks", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      refreshTasks();
      onClose();
    } catch (err) {
      console.error("Error creating task:", err.response?.data || err.message);
      alert("Failed to create task: " + (err.response?.data?.error || err.message));
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Task</h2>
        <form onSubmit={handleSubmit}>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />

          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

          <label>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>

          <label>Due Date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

          <label>Assign To</label>
          <div className="team-members-checkboxes">
            {users.map((user) => (
              <label key={user.id} className="checkbox-label">
                {user.name} ({user.role})
                <input
                  type="checkbox"
                  checked={!!assignedTo.find((u) => u.userId === user.id)}
                  onChange={() => handleCheckboxChange({ userId: user.id, fullName: user.name })}
                />
              </label>
            ))}
          </div>

          <div className="modal-buttons">
            <button type="submit">Create Task</button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
