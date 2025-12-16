import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/dashboard.css";

const getTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now - time) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return time.toLocaleDateString();
};

export default function Dashboard() {
  const [kpis, setKpis] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    planningTasks: 0,
    teamMembers: 0,
  });
  const [kanbanData, setKanbanData] = useState({
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  });
  const [expandedColumns, setExpandedColumns] = useState({
    todo: false,
    in_progress: false,
    review: false,
    done: false,
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const toggleColumn = (column) => {
    setExpandedColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const userData = JSON.parse(localStorage.getItem("user"));
      setUser(userData);

      if (!token) throw new Error("No token found");

      const [projectRes, taskRes, userRes] = await Promise.all([
        axios.get("http://localhost:5000/api/projects", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/tasks", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/users", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const projects = projectRes.data || [];
      const tasks = taskRes.data || [];
      const users = userRes.data || [];

      // KPIs
      setKpis({
        totalProjects: projects.length,
        activeProjects: projects.filter((p) => p.status === "in_progress").length,
        completedProjects: projects.filter((p) => p.status === "completed").length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.status === "done").length,
        inProgressTasks: tasks.filter((t) => t.status === "in_progress").length,
        planningTasks: tasks.filter((t) => t.status === "todo").length,
        teamMembers: users.length,
      });

      // Kanban Data
      setKanbanData({
        todo: tasks.filter((t) => t.status === "todo"),
        in_progress: tasks.filter((t) => t.status === "in_progress"),
        review: tasks.filter((t) => t.status === "review"),
        done: tasks.filter((t) => t.status === "done"),
      });

      // Upcoming Deadlines
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setUpcomingDeadlines(
        tasks
          .filter((t) => t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= nextWeek && t.status !== "done")
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
          .slice(0, 3)
      );

      // Recent Activity
      const activity = [];
      tasks
        .filter((t) => t.status === "done" && t.completed_at)
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        .slice(0, 3)
        .forEach((t) =>
          activity.push({
            type: "task_completed",
            text: `Task "${t.title}" completed`,
            user: t.assigned_to || "Someone",
            time: t.completed_at,
            icon: "✓",
            color: "success",
          })
        );

      projects
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 2)
        .forEach((p) =>
          activity.push({
            type: "project_created",
            text: `Project "${p.name}" created`,
            user: p.created_by_name || "Manager",
            time: p.created_at,
            icon: "📁",
            color: "primary",
          })
        );

      activity.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivity(activity.slice(0, 3));

      // Team Performance
      const performance = users
        .map((u) => {
          const userTasks = tasks.filter(
            (t) => Array.isArray(t.assigned_to) && t.assigned_to.some((m) => m.full_name === u.name)
          );
          const completed = userTasks.filter((t) => t.status === "done").length;
          const total = userTasks.length;
          return { name: u.name, role: u.role, completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
        })
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 3);
      setTeamPerformance(performance);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard"><p>Loading dashboard...</p></div>;
  if (error) return <div className="dashboard"><p className="error">{error}</p></div>;

  const renderKanbanColumn = (columnKey, title, colorClass) => {
    const tasks = kanbanData[columnKey] || [];
    const showAll = expandedColumns[columnKey];
    const visibleTasks = showAll ? tasks : tasks.slice(0, 3);

    return (
      <div className="kanban-column">
        <div className="column-header">
          <h3>{title}</h3>
          <span className="count">{tasks.length}</span>
        </div>
        <div className="column-cards">
          {visibleTasks.length === 0 ? (
            <p className="empty">No tasks</p>
          ) : (
            visibleTasks.map((task) => (
              <div key={task.id} className={`kanban-card ${colorClass}`}>
                <div className="card-title">{columnKey === "done" ? `✓ ${task.title}` : task.title}</div>
                <div className="card-meta">
                  <small>{task.project_name || "Unassigned"}</small>
                  {Array.isArray(task.assigned_to) && task.assigned_to.length > 0 && (
                    <small className="assignee">👤 {task.assigned_to.map((m) => m.full_name).join(", ")}</small>
                  )}
                </div>
                {task.due_date && <div className="card-deadline">📅 {new Date(task.due_date).toLocaleDateString()}</div>}
              </div>
            ))
          )}
          {tasks.length > 3 && (
            <button className="action-btn show-more-btn" onClick={() => toggleColumn(columnKey)}>
              {showAll ? "Show Less" : `Show More (${tasks.length - 3})`}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1>Welcome back, {user?.name || "User"}!</h1>
        <p>Here's what's happening with your projects today.</p>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-number">{kpis.totalProjects}</div>
          <p className="kpi-label">Total Projects</p>
          <small className="kpi-detail">{kpis.activeProjects} active, {kpis.completedProjects} done</small>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📋</div>
          <div className="kpi-number">{kpis.totalTasks}</div>
          <p className="kpi-label">Total Tasks</p>
          <small className="kpi-detail">{kpis.inProgressTasks} in progress, {kpis.completedTasks} done</small>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">✅</div>
          <div className="kpi-number">{kpis.completedTasks}</div>
          <p className="kpi-label">Completed This Period</p>
          <small className="kpi-detail">{Math.round((kpis.completedTasks / Math.max(kpis.totalTasks, 1)) * 100)}% completion</small>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-number">{kpis.teamMembers}</div>
          <p className="kpi-label">Team Members</p>
          <small className="kpi-detail">All active</small>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        {(user?.role === "admin" || user?.role === "manager") && (
          <>
            <button className="action-btn primary" onClick={() => (window.location.href = "/projects")}>➕ New Project</button>
            <button className="action-btn secondary" onClick={() => (window.location.href = "/tasks")}>📝 New Task</button>
          </>
        )}
        <button className="action-btn tertiary" onClick={() => (window.location.href = "/chat")}>💬 Messages</button>
        <button className="action-btn quaternary" onClick={() => (window.location.href = "/files")}>📁 Files</button>
      </div>

      {/* Kanban Board */}
      <div className="kanban-section">
        <h2>📌 Project Progress Board</h2>
        <div className="kanban-board">
          {renderKanbanColumn("todo", "To Do", "")}
          {renderKanbanColumn("in_progress", "In Progress", "in-progress")}
          {renderKanbanColumn("review", "Review", "review")}
          {renderKanbanColumn("done", "Done", "completed")}
        </div>
      </div>
    </div>
  );
}
