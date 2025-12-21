import React, { useEffect, useState } from "react";
import axios from "axios";

export default function FileManagementPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [files, setFiles] = useState({ project_files: [], task_submissions: [] });
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const isManagerOrAdmin = user?.role === "manager" || user?.role === "admin";

  const fetchProjects = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
      if (res.data.length > 0) setSelectedProject(res.data[0]);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to fetch projects");
    }
  };

  const fetchFiles = async (projectId) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/projects/${projectId}/files`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFiles({
        project_files: res.data.project_files || [],
        task_submissions: res.data.task_submissions || [],
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to fetch files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) fetchFiles(selectedProject.id);
  }, [selectedProject]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedProject) return;

    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      setLoading(true);
      await axios.post(
        `http://localhost:5000/api/projects/${selectedProject.id}/project_files/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUploadFile(null);
      fetchFiles(selectedProject.id);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (folder, fileName) => {
    if (!selectedProject) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/api/projects/${selectedProject.id}/files/${folder}/${fileName}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed:", err.response?.data || err.message);
    }
  };

  const handleDelete = async (folder, fileName) => {
    if (!selectedProject) return;
    if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/projects/${selectedProject.id}/files/${folder}/${fileName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchFiles(selectedProject.id);
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err.message);
    }
  };

  const containerStyle = {
    maxWidth: "900px",
    margin: "40px auto",
    padding: "0 20px",
    color: "var(--color-text-primary)",
  };
  const cardStyle = {
    background: "var(--color-bg-secondary)",
    borderRadius: "var(--radius-xl)",
    padding: "15px 20px",
    marginBottom: "20px",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
  };
  const buttonStyle = {
    padding: "6px 12px",
    marginLeft: "10px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-primary)",
    cursor: "pointer",
    background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
    color: "#fff",
    transition: "background var(--transition-base), transform var(--transition-base)",
    boxShadow: "var(--shadow-primary)",
  };
  const deleteButtonStyle = {
    ...buttonStyle,
    background: "var(--color-danger)",
    border: "1px solid var(--color-danger)",
    boxShadow: "var(--shadow-sm)",
  };
  const fileItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "5px 0",
    borderBottom: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
  };

  const projectFiles = files.project_files || [];
  const taskSubmissions = files.task_submissions || [];

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: "center", marginBottom: "30px", color: "var(--color-text-primary)" }}>📁 File Management</h1>
      {error && <p style={{ color: "var(--color-danger)", textAlign: "center" }}>{error}</p>}

      <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "10px" }}>
        <label style={{ color: "var(--color-text-primary)" }}>Select Project:</label>
        <select
          value={selectedProject?.id || ""}
          onChange={(e) => {
            const project = projects.find((p) => p.id === parseInt(e.target.value));
            setSelectedProject(project);
          }}
          style={{
            flex: 1,
            padding: "6px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-tertiary)",
            color: "var(--color-text-primary)",
          }}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {isManagerOrAdmin && (
        <form
          onSubmit={handleUpload}
          style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "10px" }}
        >
          <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} style={{ flex: 1 }} />
          <button type="submit" style={buttonStyle} disabled={loading || !uploadFile}>
            Upload Project File
          </button>
        </form>
      )}

      {loading && <p style={{ textAlign: "center" }}>Loading files...</p>}

      <div style={cardStyle}>
        <h2>Project Files</h2>
        {projectFiles.length === 0 ? (
          <p>No files found.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {projectFiles.map((f) => (
              <li key={f.name} style={fileItemStyle}>
                <span>{f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                <div>
                  <button style={buttonStyle} onClick={() => handleDownload("project_files", f.name)}>
                    Download
                  </button>
                  {isManagerOrAdmin && (
                    <button style={deleteButtonStyle} onClick={() => handleDelete("project_files", f.name)}>
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {taskSubmissions.length > 0 && (
        <div style={cardStyle}>
          <h2>Task Submissions</h2>
          {taskSubmissions.map((file) => (
            <div key={file.name} style={fileItemStyle}>
              <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              <div>
                <button style={buttonStyle} onClick={() => handleDownload("task_submissions", file.name)}>
                  Download
                </button>
                {isManagerOrAdmin && (
                  <button style={deleteButtonStyle} onClick={() => handleDelete("task_submissions", file.name)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
