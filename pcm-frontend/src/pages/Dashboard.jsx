import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/dashboard.css";

const getTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now - time) / 1000); // seconds

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
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const userData = JSON.parse(localStorage.getItem("user"));
      setUser(userData);
      
      if (!token) throw new Error("No token found");

      // Fetch projects and tasks
      const [projectRes, taskRes, userRes] = await Promise.all([
        axios.get("https://www.piece.media/api/projects", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://www.piece.media/api/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://www.piece.media/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const projects = projectRes.data || [];
      const tasks = taskRes.data || [];
      const users = userRes.data || [];

      // Calculate KPIs
      const totalProjects = projects.length;
      const activeProjects = projects.filter((p) => p.status === "in_progress").length;
      const completedProjects = projects.filter((p) => p.status === "completed").length;

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === "done").length;
      const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
      const planningTasks = tasks.filter((t) => t.status === "todo").length;

      setKpis({
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        planningTasks,
        teamMembers: users.length,
      });

      // Organize tasks by status for Kanban
      const kanban = {
        todo: tasks.filter((t) => t.status === "todo"),
        in_progress: tasks.filter((t) => t.status === "in_progress"),
        review: tasks.filter((t) => t.status === "review"),
        done: tasks.filter((t) => t.status === "done"),
      };

      setKanbanData(kanban);

      // Get upcoming deadlines (tasks with deadlines in next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const deadlines = tasks
        .filter((t) => {
          if (!t.due_date) return false;
          const deadline = new Date(t.due_date);
          return deadline >= now && deadline <= nextWeek && t.status !== "done";
        })
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5);

      setUpcomingDeadlines(deadlines);

      // Create recent activity feed
      const activity = [];
      
      // Recent completed tasks
      const recentCompleted = tasks
        .filter((t) => t.status === "done" && t.completed_at)
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        .slice(0, 3);
      
      recentCompleted.forEach((t) => {
        activity.push({
          type: "task_completed",
          text: `Task "${t.title}" completed`,
          user: t.assigned_to || "Someone",
          time: t.completed_at,
          icon: "✓",
          color: "success",
        });
      });

      // Recent projects
      const recentProjects = projects
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 2);
      
      recentProjects.forEach((p) => {
        activity.push({
          type: "project_created",
          text: `Project "${p.name}" created`,
          user: p.created_by_name || "Manager",
          time: p.created_at,
          icon: "📁",
          color: "primary",
        });
      });

      // Sort by time and limit
      activity.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivity(activity.slice(0, 5));

      // Team performance
      const performance = users.map((u) => {
        const userTasks = tasks.filter((t) => Array.isArray(t.assigned_to) && t.assigned_to.some(m => m.full_name === u.name));
        const completed = userTasks.filter((t) => t.status === "done").length;
        const total = userTasks.length;
        return {
          name: u.name,
          role: u.role,
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      }).sort((a, b) => b.percentage - a.percentage).slice(0, 5);

      setTeamPerformance(performance);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard"><p>Loading dashboard...</p></div>;
  }

  if (error) {
    return <div className="dashboard"><p className="error">{error}</p></div>;
  }

  return (
    <div className="dashboard">
      <div className="welcome-section">
        <h2>Dashboard</h2>
      </div>

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

      <div className="quick-actions">
        {(user?.role === "admin" || user?.role === "manager") && (
          <>
            <button className="action-btn primary" onClick={() => window.location.href = "/projects"}>
              ➕ New Project
            </button>
            <button className="action-btn secondary" onClick={() => window.location.href = "/tasks"}>
              📝 New Task
            </button>
          </>
        )}
        <button className="action-btn tertiary" onClick={() => window.location.href = "/chat"}>
          💬 Messages
        </button>
        <button className="action-btn quaternary" onClick={() => window.location.href = "/files"}>
          📁 Files
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="left-column">
          <div className="widget deadlines-widget">
            <div className="widget-header">
              <h3>⏰ Upcoming Deadlines</h3>
              <span className="badge">{(upcomingDeadlines || []).length}</span>
            </div>
            <div className="widget-content">
              {(upcomingDeadlines || []).length === 0 ? (
                <p className="empty-state">No upcoming deadlines</p>
              ) : (
                (upcomingDeadlines || []).map((task) => {
                  const daysUntil = Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysUntil <= 2;
                  return (
                    <div key={task.id} className={`deadline-item ${isUrgent ? "urgent" : ""}`}>
                      <div className="deadline-info">
                        <strong>{task.title}</strong>
                        <small>{task.project_name || "No project"}</small>
                      </div>
                      <div className={`deadline-badge ${isUrgent ? "urgent" : ""}`}>
                        {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="widget performance-widget">
            <div className="widget-header">
              <h3>🏆 Top Performers</h3>
            </div>
            <div className="widget-content">
              {teamPerformance.length === 0 ? (
                <p className="empty-state">No data available</p>
              ) : (
                teamPerformance.map((member, idx) => (
                  <div key={idx} className="performance-item">
                    <div className="member-info">
                      <div className="rank">#{idx + 1}</div>
                      <div>
                        <strong>{member.name}</strong>
                        <small>{member.role}</small>
                      </div>
                    </div>
                    <div className="progress-info">
                      <div className="progress-bar-wrapper">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${member.percentage}%` }}
                        ></div>
                      </div>
                      <span className="percentage">{member.percentage}%</span>
                      <small>{member.completed}/{member.total} tasks</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="widget activity-widget">
            <div className="widget-header">
              <h3>🔔 Recent Activity</h3>
            </div>
            <div className="widget-content">
              {recentActivity.length === 0 ? (
                <p className="empty-state">No recent activity</p>
              ) : (
                recentActivity.map((activity, idx) => {
                  const timeAgo = getTimeAgo(activity.time);
                  return (
                    <div key={idx} className={`activity-item ${activity.color}`}>
                      <div className="activity-icon">{activity.icon}</div>
                      <div className="activity-info">
                        <p>{activity.text}</p>
                        <small>{activity.user} • {timeAgo}</small>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="kanban-section">
        <h2>📌 Project Progress Board</h2>
        <div className="kanban-board">
          <div className="kanban-column">
            <div className="column-header">
              <h3>To Do</h3>
              <span className="count">{(kanbanData.todo || []).length}</span>
            </div>
            <div className="column-cards">
              {(kanbanData.todo || []).length === 0 ? (
                <p className="empty">No tasks</p>
              ) : (
                (kanbanData.todo || []).map((task) => (
                  <div key={task.id} className="kanban-card">
                    <div className="card-title">{task.title}</div>
                    <div className="card-meta">
                      <small>{task.project_name || "Unassigned"}</small>
                      {Array.isArray(task.assigned_to) && task.assigned_to.length > 0 && (
                        <small className="assignee">👤 {task.assigned_to.map(m => m.full_name).join(', ')}</small>
                      )}
                    </div>
                    {task.due_date && (
                      <div className="card-deadline">📅 {new Date(task.due_date).toLocaleDateString()}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="kanban-column">
            <div className="column-header">
              <h3>In Progress</h3>
              <span className="count">{(kanbanData.in_progress || []).length}</span>
            </div>
            <div className="column-cards">
              {(kanbanData.in_progress || []).length === 0 ? (
                <p className="empty">No tasks</p>
              ) : (
                (kanbanData.in_progress || []).map((task) => (
                  <div key={task.id} className="kanban-card in-progress">
                    <div className="card-title">{task.title}</div>
                    <div className="card-meta">
                      <small>{task.project_name || "Unassigned"}</small>
                      {Array.isArray(task.assigned_to) && task.assigned_to.length > 0 && (
                        <small className="assignee">👤 {task.assigned_to.map(m => m.full_name).join(', ')}</small>
                      )}
                    </div>
                    {task.due_date && (
                      <div className="card-deadline">📅 {new Date(task.due_date).toLocaleDateString()}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="kanban-column">
            <div className="column-header">
              <h3>Review</h3>
              <span className="count">{(kanbanData.review || []).length}</span>
            </div>
            <div className="column-cards">
              {(kanbanData.review || []).length === 0 ? (
                <p className="empty">No tasks</p>
              ) : (
                (kanbanData.review || []).map((task) => (
                  <div key={task.id} className="kanban-card review">
                    <div className="card-title">{task.title}</div>
                    <div className="card-meta">
                      <small>{task.project_name || "Unassigned"}</small>
                      {Array.isArray(task.assigned_to) && task.assigned_to.length > 0 && (
                        <small className="assignee">👤 {task.assigned_to.map(m => m.full_name).join(', ')}</small>
                      )}
                    </div>
                    {task.due_date && (
                      <div className="card-deadline">📅 {new Date(task.due_date).toLocaleDateString()}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="kanban-column">
            <div className="column-header">
              <h3>Done</h3>
              <span className="count">{(kanbanData.done || []).length}</span>
            </div>
            <div className="column-cards">
              {(kanbanData.done || []).length === 0 ? (
                <p className="empty">No tasks</p>
              ) : (
                (kanbanData.done || []).map((task) => (
                  <div key={task.id} className="kanban-card completed">
                    <div className="card-title">✓ {task.title}</div>
                    <div className="card-meta">
                      <small>{task.project_name || "Unassigned"}</small>
                      {Array.isArray(task.assigned_to) && task.assigned_to.length > 0 && (
                        <small className="assignee">👤 {task.assigned_to.map(m => m.full_name).join(', ')}</small>
                      )}
                    </div>
                    {task.completed_at && (
                      <div className="card-deadline">✓ {new Date(task.completed_at).toLocaleDateString()}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}