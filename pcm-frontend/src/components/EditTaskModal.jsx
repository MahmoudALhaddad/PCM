import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/tasks.css";

export default function EditTaskModal({ show, onClose, task, refreshTasks }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [dueDate, setDueDate] = useState("");
  const [users, setUsers] = useState([]); // project members only
  const [assignedTo, setAssignedTo] = useState([]); // flat array of objects { userId, fullName }

  // Load project members
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!task) return;
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/projects/${task.project_id}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsers(res.data);
      } catch (err) {
        console.error("Error loading project members:", err);
      }
    };
    fetchProjectMembers();
  }, [task]);

  // Pre-fill task data
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority || "medium");
      setStatus(task.status || "todo");
      setDueDate(task.due_date ? task.due_date.split("T")[0] : "");
      setAssignedTo(task.assigned_to.map(u => ({ userId: u.user_id, fullName: u.name })));
    }
  }, [task]);

  const handleCheckboxChange = (user) => {
    setAssignedTo(prev => {
      if (prev.find(u => u.userId === user.userId)) {
        return prev.filter(u => u.userId !== user.userId);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const assignedIds = assignedTo.map(u => u.userId);

    const payload = {
      title,
      description,
      priority,
      status,
      dueDate,
      assignedTo: assignedIds,
    };

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/tasks/${task.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      refreshTasks();
      onClose();
    } catch (err) {
      console.error("Error updating task:", err.response?.data || err.message);
      alert("Failed to update task: " + (err.response?.data?.error || err.message));
    }
  };

  if (!show || !task) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Task</h2>
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
            <button type="submit">Update Task</button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
