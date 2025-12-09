import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/projects.css";

export default function AddProjectModal({ onClose, onProjectAdded }) {
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planning");
  const [deadline, setDeadline] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Fetch all users for selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeamMembers(res.data);
      } catch (err) {
        console.error("Error loading users:", err);
      }
    };
    fetchUsers();
  }, []);

  const handleCheckboxChange = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/projects",
        {
          name,
          clientName: client,
          description,
          status,
          deadline,
          memberIds: selectedMembers,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onProjectAdded();
      onClose();
    } catch (err) {
      console.error("Error adding project:", err);
      alert("Failed to add project");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Project</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Client Name"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} required>
            <option value="planning">Planning</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <label>Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />

          <label>Team Members</label>
          <div className="team-members-checkboxes">
            {teamMembers.map((user) => (
              <label key={user.id} className="checkbox-label">
                {user.name} ({user.role})
                <input
                  type="checkbox"
                  value={user.id}
                  checked={selectedMembers.includes(user.id)}
                  onChange={() => handleCheckboxChange(user.id)}
                />
                
              </label>
            ))}
          </div>

          <div className="modal-buttons">
            <button type="submit">Add Project</button>
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
