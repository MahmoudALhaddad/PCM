import { useEffect, useState } from "react";

// ProjectCard.jsx
export default function ProjectCard({
  project,
  userRole,
  onManageClick,
  onDeleteClick,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleCardClick = () => {
    if (isMobile) {
      setOpen((prev) => !prev);
    }
  };

  return (
    <div
      className={`project-card ${isMobile && open ? "open" : ""}`}
      onClick={handleCardClick}
    >
      <div className="project-title">{project.name}</div>

      <div className="project-description">{project.description}</div>

      <div className="project-info">
        <span className={`project-status status-${project.status}`}>
          {project.status.replace("_", " ")}
        </span>
        <span>
          {new Date(project.created_at).toLocaleDateString()} →{" "}
          {new Date(project.deadline).toLocaleDateString()}
        </span>
      </div>

      {/* MEMBERS */}
      <div className="project-members">
        {project.project_members.map((member) => (
          <div className="member" key={member.user_id}>
            {member.name}
          </div>
        ))}

        {(userRole === "admin" || userRole === "manager") && (
          <div style={{ display: "flex", gap: "8px", marginTop: "0.5rem" }}>
            <button
              className="manage-btn"
              onClick={(e) => {
                e.stopPropagation(); // prevent card toggle
                onManageClick(project);
              }}
            >
              Manage
            </button>

            {userRole === "admin" && (
              <button
                className="manage-btn"
                style={{ backgroundColor: "#ef4444" }}
                onClick={(e) => {
                  e.stopPropagation(); // prevent card toggle
                  onDeleteClick(project.id);
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
