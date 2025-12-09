// src/pages/MyTasks.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/myTasks.css";

function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileTaskId, setFileTaskId] = useState(null);
  const [file, setFile] = useState(null);

  // Load currentUser from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch tasks assigned to this user
  useEffect(() => {
    if (!currentUser) return;

    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("http://localhost:5000/api/tasks", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Tasks API Response:", res.data);

        // Filter tasks assigned to this user
        const userTasks = res.data.filter(
          (task) => task.assignedTo === currentUser.id
        );

        setTasks(userTasks);
      } catch (err) {
        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [currentUser]);

  // Group tasks by project name
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.projectName]) acc[task.projectName] = [];
    acc[task.projectName].push(task);
    return acc;
  }, {});

  // Accept / Done button
  const handleAction = async (task) => {
    if (task.status === "Pending") {
      await updateTaskStatus(task.id, "In Progress");
    } else if (task.status === "In Progress") {
      setFileTaskId(task.id);
    }
  };

  // Upload file + finish task
  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(
        `http://localhost:5000/api/tasks/${fileTaskId}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      await updateTaskStatus(fileTaskId, "Done");

      setFileTaskId(null);
      setFile(null);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  // PATCH status using axios
  const updateTaskStatus = async (taskId, status) => {
    const token = localStorage.getItem("token");

    await axios.patch(
      `http://localhost:5000/api/tasks/${taskId}`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
  };

  // UI states
  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p>{error}</p>;
  if (!currentUser) return <p>No user logged in.</p>;

  return (
    <div className="tasks-page">
      <h1>My Tasks</h1>

      {Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
        <div key={projectName} className="project-container">
          <h2>{projectName}</h2>

          <div className="task-cards">
            {projectTasks.map((task) => (
              <div
                key={task.id}
                className={`task-card ${task.status.toLowerCase()}`}
              >
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <p>Status: {task.status}</p>
                <p>Priority: {task.priority}</p>
                <p>Deadline: {task.deadline}</p>

                <button onClick={() => handleAction(task)}>
                  {task.status === "Pending"
                    ? "Accept"
                    : task.status === "In Progress"
                    ? "Done"
                    : "✔ Done"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* File Upload Popup */}
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
