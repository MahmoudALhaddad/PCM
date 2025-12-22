import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/fileManager.css";

export default function FileManagementPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [files, setFiles] = useState({ project_files: [], task_submissions: [] });
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const isManagerOrAdmin = ["admin", "manager"].includes(user?.role);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        setProjects(res.data);
        setSelectedProject(res.data[0]);
      });
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    setLoading(true);
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/projects/${selectedProject.id}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setFiles(res.data))
      .finally(() => setLoading(false));
  }, [selectedProject]);

  const handleUpload = async () => {
    if (!uploadFile) return;
    const form = new FormData();
    form.append("file", uploadFile);

    await axios.post(
      `${process.env.REACT_APP_API_URL}/api/projects/${selectedProject.id}/project_files/upload`,
      form,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setUploadFile(null);
    const res = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/projects/${selectedProject.id}/files`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setFiles(res.data);
  };

const download = async (folder, name) => {
  try {
    const res = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/projects/${selectedProject.id}/files/${folder}/${name}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob", // important for file download
      }
    );

    // create a link and click it to download
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", name);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error(err);
  }
};

  return (
    <div className="fm-layout">
      {/* LEFT SIDEBAR */}
      <aside className="fm-sidebar">
        <h3>Projects</h3>
        {projects.map(p => (
          <div
            key={p.id}
            className={`fm-project ${selectedProject?.id === p.id ? "active" : ""}`}
            onClick={() => setSelectedProject(p)}
          >
            {p.name}
          </div>
        ))}
      </aside>

      {/* MAIN CONTENT */}
      <main className="fm-main">
        <div className="fm-header">
          <h2>{selectedProject?.name || "Files"}</h2>

          {isManagerOrAdmin && (
            <div className="fm-upload">
              <input type="file" onChange={e => setUploadFile(e.target.files[0])} />
              <button onClick={handleUpload}>Upload</button>
            </div>
          )}
        </div>

        {loading && <p className="fm-loading">Loading...</p>}

        {/* PROJECT FILES */}
        <section>
          <h4>Project Files</h4>
          <div className="fm-grid">
            {files.project_files?.map(file => (
              <div key={file.name} className="fm-file-card">
                <div className="fm-file-icon">📄</div>
                <div className="fm-file-name">{file.name}</div>
                <button onClick={() => download("project_files", file.name)}>
                  Download
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* TASK SUBMISSIONS */}
        {files.task_submissions?.length > 0 && (
          <section>
            <h4>Task Submissions</h4>
            <div className="fm-grid">
              {files.task_submissions.map(file => (
                <div key={file.name} className="fm-file-card">
                  <div className="fm-file-icon">📎</div>
                  <div className="fm-file-name">{file.name}</div>
                  <button onClick={() => download("task_submissions", file.name)}>
                    Download
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
