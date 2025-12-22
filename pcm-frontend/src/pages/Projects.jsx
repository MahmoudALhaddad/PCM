import { useEffect, useState } from "react";
import axios from "axios";
import ProjectCard from "../components/ProjectCard.jsx";
import AddProjectModal from "../components/AddProjectModal.jsx";
import ManageProjectModal from "../components/ManageProjectModal.jsx";
import "../styles/projects.css";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [manageProject, setManageProject] = useState(null); // for manage modal

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`https://www.piece.media/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProjects(); // Refresh project list
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Failed to delete project");
    }
  };
  
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const userData = JSON.parse(localStorage.getItem("user"));
      setUser(userData);

      if (!token) throw new Error("No token found, please login");

      const res = await axios.get("https://www.piece.media/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch (err) {
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h2>Projects</h2>
        {(user?.role === "admin" || user?.role === "manager") && (
          <button className="add-project-btn" onClick={() => setShowAddModal(true)}>
            + Add Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading projects…</div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              userRole={user?.role}
              onManageClick={(proj) => setManageProject(proj)}
              onDeleteClick={handleDeleteProject}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddProjectModal
          onClose={() => setShowAddModal(false)}
          onProjectAdded={() => {
            setShowAddModal(false);
            fetchProjects();
          }}
        />
      )}

      {manageProject && (
        <ManageProjectModal
          project={manageProject}
          onClose={() => setManageProject(null)}
          onProjectUpdated={() => {
            setManageProject(null);
            fetchProjects(); // refresh list
          }}
        />
      )}
    </div>
  );
}
