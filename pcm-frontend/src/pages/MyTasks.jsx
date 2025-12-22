import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/myTasks.css";

function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileTaskId, setFileTaskId] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      if (!token || !user) {
        setError("User not logged in");
        setLoading(false);
        return;
      }

      try {
        // Fetch all tasks
        const tasksRes = await axios.get("http://localhost:5000/api/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Filter tasks assigned to current user
        const myTasks = tasksRes.data.filter(
          (task) =>
            Array.isArray(task.assigned_to) &&
            task.assigned_to.some((u) => u.user_id === user.id)
        );
        console.log("My Tasks:", myTasks);
        setTasks(myTasks);

        // Fetch project names
        const projectIds = [...new Set(myTasks.map((t) => t.project_id))];
        const projectData = {};
        await Promise.all(
          projectIds.map(async (id) => {
            try {
              const res = await axios.get(
                `http://localhost:5000/api/projects/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              projectData[id] = res.data.name || `Project #${id}`;
            } catch {
              projectData[id] = `Project #${id}`;
            }
          })
        );
        setProjects(projectData);
      } catch (err) {
        console.error(err);
        setError("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group tasks by project_id
  const groupedTasks = tasks.reduce((acc, task) => {
    const key = task.project_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  const handleAction = async (task) => {
    if (task.status === "todo" || task.status === "review") {
      await updateTaskStatus(task.id, "in_progress");
    } else if (task.status === "in_progress") {
      setFileTaskId(task.id);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return alert("Please select a file");

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.put(
        `http://localhost:5000/api/tasks/${fileTaskId}/upload`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        }
      );

      await updateTaskStatus(fileTaskId, "done");
      setFileTaskId(null);
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("File upload failed");
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    } catch (err) {
      console.error(err);
      alert("Failed to update task status");
    }
  };

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (tasks.length === 0) return <p>No tasks assigned to you.</p>;

  return (
    <div className="mytasks-wrapper">
      <h2 className="title-myTasks">My Tasks</h2>

      {Object.entries(groupedTasks).map(([projectId, projectTasks]) => (
        <div key={projectId} className="project-block">
          <h2>{projects[projectId]}</h2>

          <div className="task-list">
            {projectTasks.map((task) => (
              <div key={task.id} className={`task-card ${task.status}`}>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <p>Status: {task.status}</p>
                <p>Priority: {task.priority || "medium"}</p>
                <p>
                  Deadline: {task.due_date 
                    ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : "Not set"}
                </p>
                <p>
                  Assigned To:{" "}
                  {task.assigned_to.map((u) => u.full_name).join(", ")}
                </p>
                <button onClick={() => handleAction(task)}>
                  {task.status === "todo" || task.status === "review"
                    ? "Accept"
                    : task.status === "in_progress"
                    ? "Done"
                    : "✔ Done"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {fileTaskId && (
        <div className="file-upload-popup">
          <h3>Upload File</h3>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={handleFileUpload}>Confirm</button>
          <button onClick={() => setFileTaskId(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default MyTasks;
