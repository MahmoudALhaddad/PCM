import React, { useEffect, useState } from "react";
import TaskCard from "../components/TaskCard.jsx";
import AddTaskModal from "../components/AddTaskModal.jsx";
import EditTaskModal from "../components/EditTaskModal.jsx";
import axios from "axios";
import "../styles/tasks.css";

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add/Edit modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);

  // Fetch tasks from backend
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("out data in tasks :",res.data)
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while fetching tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert("Failed to delete task");
    }
  };

  // Group tasks by project
  const projects = tasks.reduce((acc, task) => {
    if (!acc[task.project_id]) {
      acc[task.project_id] = {
        id: task.project_id,
        name: task.project_name,
        client: task.project_client,
        tasks: [],
      };
    }
    acc[task.project_id].tasks.push(task);
    return acc;
  }, {});

  const projectList = Object.values(projects);

  if (loading) return <p className="loading">Loading tasks...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="tasks-page">
      <h1 className="tasks-title">TASKS</h1>

      {projectList.length === 0 && (
        <p className="empty-text">No tasks available.</p>
      )}

      {projectList.map((project) => (
        <div key={project.id} className="project-block">
          <div className="project-header">
            <h2>{project.name}</h2>
            <button
              className="add-task-btn"
              onClick={() => {
                setCurrentProjectId(project.id);
                setShowAddModal(true);
              }}
            >
              + Add Task
            </button>
          </div>

          <div className="divider"></div>

          {project.tasks.length === 0 ? (
            <p className="empty-text">No tasks yet — click Add Task to create one.</p>
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

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          projectId={currentProjectId}
          refreshTasks={fetchTasks}
        />
      )}

      {/* Edit Task Modal */}
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
