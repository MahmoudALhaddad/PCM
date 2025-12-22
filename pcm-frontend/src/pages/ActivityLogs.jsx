import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/activityLogs.css";

const getTimeAgo = (timestamp) => {
  const time = new Date(timestamp);
  
  const day = String(time.getDate()).padStart(2, '0');
  const month = time.toLocaleString('en-US', { month: 'short' });
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  
  return `${day} ${month} | ${hours}:${minutes}:${seconds}`;
};

const getActivityIcon = (action) => {
  if (action.includes('Created project')) return '📁';
  if (action.includes('Created task')) return '✨';
  if (action.includes('Updated project')) return '📝';
  if (action.includes('Updated task')) return '✏️';
  if (action.includes('Deleted project')) return '🗑️';
  if (action.includes('Deleted task')) return '❌';
  if (action.includes('Logged in')) return '🔐';
  if (action.includes('Updated user')) return '👤';
  if (action.includes('Deleted user')) return '⚠️';
  return '📋';
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });
  const [filters, setFilters] = useState({
    userName: '',
    projectName: '',
    taskTitle: '',
  });

  useEffect(() => {
    fetchActivityLogs();
  }, [pagination.offset, filters.userName, filters.projectName, filters.taskTitle]);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: pagination.offset,
        ...(filters.userName && { userName: filters.userName }),
        ...(filters.projectName && { projectName: filters.projectName }),
        ...(filters.taskTitle && { taskTitle: filters.taskTitle }),
      });

      console.log('Fetching with params:', params.toString());

      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/activity?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogs(res.data.logs || []);
      setPagination(prev => ({
        ...prev,
        total: res.data.pagination?.total || 0,
        hasMore: res.data.pagination?.hasMore || false,
      }));
      setLoading(false);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
      setError("Failed to load activity logs");
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({ userName: '', projectName: '', taskTitle: '' });
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const loadMore = () => {
    setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
  };

  const loadPrevious = () => {
    setPagination(prev => ({ 
      ...prev, 
      offset: Math.max(0, prev.offset - prev.limit) 
    }));
  };

  if (loading && logs.length === 0) {
    return <div className="activity-logs"><p>Loading activity logs...</p></div>;
  }

  if (error) {
    return <div className="activity-logs"><p className="error">{error}</p></div>;
  }

  return (
    <div className="activity-logs">
      <div className="page-header">
        <h2> Activity Logs</h2>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>User Name</label>
          <input
            type="text"
            placeholder="Filter by user name"
            value={filters.userName}
            onChange={(e) => handleFilterChange('userName', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Project Name</label>
          <input
            type="text"
            placeholder="Filter by project name"
            value={filters.projectName}
            onChange={(e) => handleFilterChange('projectName', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Task Title</label>
          <input
            type="text"
            placeholder="Filter by task title"
            value={filters.taskTitle}
            onChange={(e) => handleFilterChange('taskTitle', e.target.value)}
          />
        </div>
        <button className="clear-btn" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      <div className="stats-bar">
        <span>Total Activities: <strong>{pagination.total}</strong></span>
        <span>Showing: <strong>{pagination.offset + 1}</strong> - <strong>{Math.min(pagination.offset + pagination.limit, pagination.total)}</strong></span>
      </div>

      <div className="activity-list">
        {logs.length === 0 ? (
          <p className="empty-state">No activity logs found</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="activity-item">
              <div className="activity-icon">{getActivityIcon(log.action)}</div>
              <div className="activity-content">
                <div className="activity-header">
                  <span className="activity-user">
                    {log.user_name || 'Unknown User'} 
                    {log.user_role && <span className="role-badge">{log.user_role}</span>}
                  </span>
                  <span className="activity-time">{getTimeAgo(log.created_at)}</span>
                </div>
                <p className="activity-action">{log.action}</p>
                {(log.project_name || log.task_title) && (
                  <div className="activity-meta">
                    {log.project_name && <span className="meta-badge project">📁 {log.project_name}</span>}
                    {log.task_title && <span className="meta-badge task">📝 {log.task_title}</span>}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pagination-controls">
        <button 
          onClick={loadPrevious} 
          disabled={pagination.offset === 0}
          className="pagination-btn"
        >
          ← Previous
        </button>
        <span className="page-info">
          Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
        </span>
        <button 
          onClick={loadMore} 
          disabled={!pagination.hasMore}
          className="pagination-btn"
        >
          Next →
        </button>
      </div>
    </div>
  );
}