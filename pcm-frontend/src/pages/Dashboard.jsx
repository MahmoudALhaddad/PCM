import React from "react";
import "../styles/dashboard.css";
import { statsData, projects, deadlines, activity } from "./dummyData";

export default function Dashboard() {
  return (
    <div className="dashboard">

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="card"><h2>{statsData.totalProjects}</h2><p>Total Projects</p></div>
        <div className="card"><h2>{statsData.activeTasks}</h2><p>Active Tasks</p></div>
        <div className="card"><h2>{statsData.completedToday}</h2><p>Completed Today</p></div>
        <div className="card"><h2>{statsData.teamMembers}</h2><p>Team Members</p></div>
      </div>

      {/* Projects Section */}
      <div className="projects-section card">
        <h3>Project Progress</h3>
        {projects.map((p, i) => (
          <div key={i} className="project-row">
            <span>{p.name}</span>
            <div className="progress-bar">
              <div style={{ width: `${p.progress}%` }}></div>
            </div>
            <small>{p.due}</small>
          </div>
        ))}
      </div>

      {/* Deadlines */}
      <div className="deadlines card">
        <h3>Upcoming Deadlines</h3>
        {deadlines.map((d, i) => (
          <div key={i} className="deadline-item">
            <span>{d.title}</span>
            <span className="due">{d.due}</span>
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="activity card">
        <h3>Recent Activity</h3>
        {activity.map((a, i) => (
          <div key={i} className="activity-item">
            <p>{a.text}</p>
            <small>{a.time}</small>
          </div>
        ))}
      </div>

    </div>
  );
}
