import React, { useEffect, useState } from "react";
import TaskCard from "../components/TaskCard.jsx";
import AddTaskModal from "../components/AddTaskModal.jsx";
import EditTaskModal from "../components/EditTaskModal.jsx";
import axios from "axios";
import "../styles/tasks.css";

function TasksPage() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
   const [user, setUser] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);

 
  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
       const userData = JSON.parse(localStorage.getItem("user"));
       setUser(userData);
      const res = await axios.get("http://localhost:5000/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load projects.");
    }
  };

  // ============================
  // Fetch ALL tasks
  // ============================
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load tasks.");
    }
  };

  // ============================
  // Delete task
  // ============================
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchTasks(); // Refresh after deletion
    } catch (err) {
      console.error(err);
      alert("Failed to delete task.");
    }
  };

  // ============================
  // Load both tasks + projects
  // ============================
  useEffect(() => {
    const loadData = async () => {
      await fetchProjects();
      await fetchTasks();
      setLoading(false);
    };
    loadData();
  }, []);

  // ============================
  // Attach tasks to projects
  // ============================
  const projectList = projects.map((project) => ({
    ...project,
    tasks: tasks.filter((task) => task.project_id === project.id),
  }));

  if (loading) return <p className="loading">Loading tasks...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="tasks-page">
      <h2 className="tasks-title">Tasks</h2>

      {projectList.length === 0 && (
        <p className="empty-text">No projects found.</p>
      )}

      {projectList.map((project) => (
        <div key={project.id} className="project-block">
          <div className="project-header">
            <h2>{project.name}</h2>
             {(user?.role === "admin" || user?.role === "manager") && (
            <button
              className="add-task-btn"
              onClick={() => {
                setCurrentProjectId(project.id);
                setShowAddModal(true);
              }}
            >
              + Add Task
            </button>
             )}
          </div>

          <div className="divider"></div>

          {project.tasks.length === 0 ? (
            <p className="empty-text">
               No tasks yet.
            </p>
          ) : (
            <div className="tasks-grid">
              {project.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => {
                    setCurrentTask(task);
                    setShowEditModal(true);
                  }}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {showAddModal && (
        <AddTaskModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          projectId={currentProjectId}
          refreshTasks={fetchTasks}
        />
      )}
      {showEditModal && currentTask && (
        <EditTaskModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          task={currentTask}
          refreshTasks={fetchTasks}
        />
      )}
    </div>
  );
}

export default TasksPage;