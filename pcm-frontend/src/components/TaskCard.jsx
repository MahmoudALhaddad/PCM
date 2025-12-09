import React from "react";
import "../styles/tasks.css";

function TaskCard({ task, onEdit, onDelete }) {
  // Format due date nicely
  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "No deadline";

  // Display assigned user names
  const assignedNames =
    task.assigned_to && task.assigned_to.length > 0
      ? task.assigned_to.map(u => u.full_name).join(", ")
      : "Unassigned";

  return (
    <div className="task-card">
      <div className="task-header">
        <h3 className="task-title">{task.title}</h3>
        <span className={`priority-tag ${task.priority}`}>
          {task.priority?.toUpperCase()}
        </span>
      </div>

      <p className="task-description">
        {task.description || "No description"}
      </p>

      <div className="task-info">
        <p><strong>Status:</strong> {task.status}</p>
        <p><strong>Assigned:</strong> {assignedNames}</p>
        <p><strong>Created by:</strong> {task.created_by_name}</p>
        <p><strong>Due:</strong> {formattedDueDate}</p>
      </div>

      <div className="task-actions">
        <button className="edit-btn" onClick={onEdit}>Edit</button>
        <button className="delete-btn" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

export default TaskCard;
