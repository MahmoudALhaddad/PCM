import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/projects.css";

export default function ManageProjectModal({ project, onClose, onProjectUpdated }) {
  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.client_name);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState(project.status);
  const [deadline, setDeadline] = useState(project.deadline.split("T")[0]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const tokenUser = JSON.parse(localStorage.getItem("user")); // currently logged-in user

  // Fetch all users for checkboxes
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Filter admin if they created the project
        const filteredMembers = res.data.filter((user) => {
          if (tokenUser.role === "admin" && user.id === project.created_by) return false;
          return true;
        });

        setTeamMembers(filteredMembers);

        // Pre-select existing members, excluding admin if needed
        const preSelected = project.project_members
          .filter((m) => !(tokenUser.role === "admin" && m.user_id === project.created_by))
          .map((m) => m.user_id);

        setSelectedMembers(preSelected);
      } catch (err) {
        console.error("Error loading users:", err);
      }
    };
    fetchUsers();
  }, [project, tokenUser.role, project.created_by]);

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
      await axios.put(
        `http://localhost:5000/api/projects/${project.id}`,
        {
          name,
          client_name: client,
          description,
          status,
          deadline,
          memberIds: selectedMembers,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onProjectUpdated();
      onClose();
    } catch (err) {
      console.error("Error updating project:", err);
      alert("Failed to update project");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Manage Project</h2>
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
            <button type="submit">Save Changes</button>
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
