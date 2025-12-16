import { useEffect, useState } from "react";
import axios from "axios";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  subMonths,
  addMonths,
  subWeeks,
  addWeeks,
  getDay,
} from "date-fns";
import "../styles/calendar.css";

export default function CalendarPage() {
  const [tasks, setTasks] = useState([]);
  const [eventsByDate, setEventsByDate] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [moreEvents, setMoreEvents] = useState([]);
  const [showMorePopup, setShowMorePopup] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month"); // "month" or "week"

  const statusColors = {
    todo: "#fbbf24",
    "in-progress": "#3b82f6",
    review: "#8b5cf6",
    done: "#10b981",
    blocked: "#ef4444",
    pending: "#f87171",
  };

  const priorityColors = {
    high: "#ef4444",
    medium: "#f59e0b",
    low: "#10b981",
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return console.error("No auth token found");

      const res = await axios.get("http://localhost:5000/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTasks(res.data);
    } catch (err) {
      console.error("Calendar fetch error:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

useEffect(() => {
  const mapByDate = {};
  tasks.forEach((task) => {
    if (!task.due_date) return; // skip tasks without a due date
    const dateStr = task.due_date.split("T")[0];
    if (!mapByDate[dateStr]) mapByDate[dateStr] = [];
    mapByDate[dateStr].push(task);
  });
  setEventsByDate(mapByDate);
}, [tasks]);
  // Helpers for month/week grid
  const getMonthDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = [];
    for (let d = start.getDate(); d <= end.getDate(); d++) {
      const dateStr = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), d), "yyyy-MM-dd");
      days.push({ date: dateStr, day: d });
    }
    return days;
  };
const getWeekDays = () => {
  // Set week to start on Monday (change 1 to 0 if you want Sunday)
  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dateObj = addDays(start, i);
    const dateStr = format(dateObj, "yyyy-MM-dd");
    days.push({ date: dateStr, day: dateObj.getDate() });
  }
  return days;
};

  // Render events for a day
  const renderEvents = (events) => {
    if (!events) return null;
    const maxVisible = 2;
    return (
      <>
        {events.slice(0, maxVisible).map((e) => (
          <div
            key={e.id}
            className="event"
            style={{ backgroundColor: statusColors[e.status] || "#4b5563" }}
            onClick={() => setSelectedEvent(e)}
          >
            <span
              className="priority-dot"
              style={{ backgroundColor: priorityColors[e.priority] || "#4b5563" }}
            ></span>
            {e.title}
          </div>
        ))}
        {events.length > maxVisible && (
          <button
            className="more-btn"
            onClick={() => {
              setMoreEvents(events);
              setShowMorePopup(true);
            }}
          >
            +{events.length - maxVisible} more
          </button>
        )}
      </>
    );
  };

  // Navigation
  const prev = () => {
    if (currentView === "month") setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };
  const next = () => {
    if (currentView === "month") setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };
  const toggleView = (view) => setCurrentView(view);

  // Weekday names
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="calendar-page-container">
      {/* Header */}
      <div className="calendar-header">
        <button onClick={prev}>&lt;</button>
        <h2>
          {currentView === "month"
            ? format(currentDate, "MMMM yyyy")
            : `Week of ${format(currentDate, "MMM d, yyyy")}`}
        </h2>
        <button onClick={next}>&gt;</button>
      </div>
      <div className="calendar-view-toggle">
        <button
          onClick={() => toggleView("month")}
          className={currentView === "month" ? "active" : ""}
        >
          Month
        </button>
        <button
          onClick={() => toggleView("week")}
          className={currentView === "week" ? "active" : ""}
        >
          Week
        </button>
      </div>

      {/* Weekday names */}
      <div className={`weekdays ${currentView}`}>
        {weekdays.map((d) => (
          <div key={d} className="weekday">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={`calendar-grid ${currentView}`}>
        {(currentView === "month" ? getMonthDays() : getWeekDays()).map((day) => (
          <div key={day.date} className="day-cell">
            <div className="day-number">{day.day}</div>
            {renderEvents(eventsByDate[day.date])}
          </div>
        ))}
      </div>

      {/* +N more popup */}
      {showMorePopup && (
        <div className="more-popup-overlay" onClick={() => setShowMorePopup(false)}>
          <div className="more-popup" onClick={(e) => e.stopPropagation()}>
            <h4>Events</h4>
            {moreEvents.map((e) => (
              <div
                key={e.id}
                className="event"
                style={{ backgroundColor: statusColors[e.status] || "#4b5563" }}
                onClick={() => {
                  setSelectedEvent(e);
                  setShowMorePopup(false);
                }}
              >
                <span
                  className="priority-dot"
                  style={{ backgroundColor: priorityColors[e.priority] || "#4b5563" }}
                ></span>
                {e.title}
              </div>
            ))}
            <button onClick={() => setShowMorePopup(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <div className="calendar-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedEvent.title}</h2>
            <p>
              <strong>Project:</strong> {selectedEvent.project_name}
            </p>
            <p>
              <strong>Priority:</strong> {selectedEvent.priority}
            </p>
            <p>
              <strong>Status:</strong> {selectedEvent.status}
            </p>
            <p>
              <strong>Assigned To:</strong>{" "}
              {selectedEvent.assigned_to.map((u) => u.full_name).join(", ")}
            </p>
            <p>
              <strong>Due:</strong> {format(new Date(selectedEvent.due_date), "yyyy-MM-dd")}
            </p>
            <button className="close-btn" onClick={() => setSelectedEvent(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
