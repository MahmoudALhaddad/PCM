import React, { useState, useEffect } from "react";

export default function FileManagementPage({ token, userRole }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [files, setFiles] = useState({}); // { folderName: [file1, file2, ...] }
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch files when project changes
  useEffect(() => {
    if (!selectedProject) return;
    fetchFiles(selectedProject.id);
  }, [selectedProject]);

  const fetchFiles = async (projectId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFiles(data.files || {});
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  };

  // Download file
  const handleDownload = (folder, file) => {
    window.open(
      `/api/projects/${selectedProject.id}/files/${folder}/${file}/download`,
      "_blank"
    );
  };

  // Delete file (Admin only)
  const handleDelete = async (folder, file) => {
    if (!window.confirm(`Delete ${file}?`)) return;
    try {
      await fetch(
        `/api/projects/${selectedProject.id}/files/${folder}/${file}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchFiles(selectedProject.id);
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  // Upload file (Admin only)
  const handleUpload = async (folder, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      await fetch(`/api/projects/${selectedProject.id}/${folder}/upload`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      fetchFiles(selectedProject.id);
    } catch (err) {
      console.error("Failed to upload file:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", padding: "20px", gap: "20px" }}>
      {/* Sidebar: Projects */}
      <div style={{ width: "250px", borderRight: "1px solid #ccc" }}>
        <h3>Projects</h3>
        {loading ? (
          <p>Loading projects...</p>
        ) : (
          <ul>
            {projects.map((p) => (
              <li
                key={p.id}
                style={{
                  cursor: "pointer",
                  marginBottom: "8px",
                  fontWeight: selectedProject?.id === p.id ? "bold" : "normal",
                }}
                onClick={() => setSelectedProject(p)}
              >
                {p.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Main Area: File Tree */}
      <div style={{ flex: 1 }}>
        <h2>
          {selectedProject
            ? `Files for ${selectedProject.name}`
            : "Select a project"}
        </h2>

        {selectedProject && (
          <>
            {loading ? (
              <p>Loading files...</p>
            ) : (
              Object.keys(files).map((folder) => (
                <div
                  key={folder}
                  style={{
                    marginBottom: "20px",
                    border: "1px solid #ddd",
                    padding: "10px",
                    borderRadius: "6px",
                  }}
                >
                  <h4>{folder}</h4>
                  {files[folder].length === 0 && <p>No files in this folder.</p>}
                  <ul>
                    {files[folder].map((file) => (
                      <li
                        key={file}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "5px",
                        }}
                      >
                        <span>{file}</span>
                        <button onClick={() => handleDownload(folder, file)}>
                          Download
                        </button>
                        {userRole === "admin" && (
                          <button onClick={() => handleDelete(folder, file)}>
                            Delete
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Upload input for project_files folder (Admin only) */}
                  {userRole === "admin" && folder === "project_files" && (
                    <div style={{ marginTop: "10px" }}>
                      <input
                        type="file"
                        onChange={(e) => handleUpload(folder, e)}
                        disabled={uploading}
                      />
                      {uploading && <span> Uploading...</span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
