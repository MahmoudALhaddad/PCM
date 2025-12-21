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
  isSameDay,
} from "date-fns";
import "../styles/calendar.css";

export default function CalendarPage() {
  const [tasks, setTasks] = useState([]);
  const [eventsByDate, setEventsByDate] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(
    window.innerWidth <= 768 ? "week" : "month"
  );

  /* ================= COLORS ================= */
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

  /* ================= RESPONSIVE VIEW ================= */
  useEffect(() => {
    const onResize = () => {
      setCurrentView(window.innerWidth <= 768 ? "week" : "month");
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ================= FETCH TASKS ================= */
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("http://localhost:5000/api/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTasks(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTasks();
  }, []);

  /* ================= GROUP TASKS ================= */
  useEffect(() => {
    const map = {};
    tasks.forEach((task) => {
      if (!task.due_date) return;
      const dateStr = task.due_date.split("T")[0];
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(task);
    });
    setEventsByDate(map);
  }, [tasks]);

  /* ================= MONTH GRID ================= */
  const getMonthDays = () => {
    const startMonth = startOfMonth(currentDate);
    const endMonth = endOfMonth(currentDate);
    const startDate = startOfWeek(startMonth);
    const endDate = addDays(startOfWeek(endMonth), 6);

    const days = [];
    let date = startDate;

    while (date <= endDate) {
      days.push({
        date: format(date, "yyyy-MM-dd"),
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: isSameDay(date, new Date()),
      });
      date = addDays(date, 1);
    }
    return days;
  };

  /* ================= WEEK DAYS ================= */
  const getWeekDays = () => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(start, i);
      return {
        date: format(d, "yyyy-MM-dd"),
        day: d.getDate(),
        isToday: isSameDay(d, new Date()),
      };
    });
  };

  /* ================= DESKTOP EVENTS ================= */
  const renderEvents = (events) => {
    if (!events) return null;

    return events.slice(0, 2).map((e) => (
      <div
        key={e.id}
        className="event"
        style={{ backgroundColor: statusColors[e.status] }}
        onClick={() => setSelectedEvent(e)}
      >
        <span
          className="priority-dot"
          style={{ backgroundColor: priorityColors[e.priority] }}
        />
        {e.title}
      </div>
    ));
  };

  /* ================= MOBILE WEEK (2 COLUMNS) ================= */
  const renderMobileWeek = () => {
    const weekDays = getWeekDays();

    return (
      <div className="mobile-week">
        {weekDays.map((day) => {
          const events = eventsByDate[day.date] || [];

          return (
            <div key={day.date} className="mobile-week-row">
              {/* LEFT COLUMN */}
              <div className={`mobile-day ${day.isToday ? "today" : ""}`}>
                <div className="weekday-name">
                  {format(new Date(day.date), "EEE")}
                </div>
                <div className="day-number-big">{day.day}</div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="mobile-events">
                {events.length === 0 && (
                  <div className="no-events">No tasks</div>
                )}

                {events.map((e) => (
                  <div
                    key={e.id}
                    className="event"
                    style={{ backgroundColor: statusColors[e.status] }}
                    onClick={() => setSelectedEvent(e)}
                  >
                    <span
                      className="priority-dot"
                      style={{ backgroundColor: priorityColors[e.priority] }}
                    />
                    {e.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ================= NAV ================= */
  const prev = () =>
    currentView === "month"
      ? setCurrentDate(subMonths(currentDate, 1))
      : setCurrentDate(subWeeks(currentDate, 1));

  const next = () =>
    currentView === "month"
      ? setCurrentDate(addMonths(currentDate, 1))
      : setCurrentDate(addWeeks(currentDate, 1));

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="calendar-page-container">
      <div className="calendar-header">
        <button onClick={prev}>&lt;</button>
        <h2>
          {currentView === "month"
            ? format(currentDate, "MMMM yyyy")
            : `Week of ${format(currentDate, "MMM dd")}`}
        </h2>
        <button onClick={next}>&gt;</button>
      </div>

      {/* Desktop only toggle */}
      <div className="calendar-view-toggle desktop-only">
        <button
          className={currentView === "month" ? "active" : ""}
          onClick={() => setCurrentView("month")}
        >
          Month
        </button>
        <button
          className={currentView === "week" ? "active" : ""}
          onClick={() => setCurrentView("week")}
        >
          Week
        </button>
      </div>

      {/* WEEKDAYS (desktop only) */}
      <div className="weekdays desktop-only">
        {weekdays.map((d) => (
          <div key={d} className="weekday">
            {d}
          </div>
        ))}
      </div>

      {/* GRID / MOBILE LIST */}
      {window.innerWidth <= 768 && currentView === "week" ? (
        renderMobileWeek()
      ) : (
        <div className={`calendar-grid ${currentView}`}>
          {(currentView === "month" ? getMonthDays() : getWeekDays()).map(
            (day) => (
              <div
                key={day.date}
                className={`day-cell ${day.isToday ? "today" : ""}`}
              >
                <div className="day-number">{day.day}</div>
                {renderEvents(eventsByDate[day.date])}
              </div>
            )
          )}
        </div>
      )}

      {/* EVENT MODAL */}
      {selectedEvent && (
        <div
          className="calendar-modal-overlay"
          onClick={() => setSelectedEvent(null)}
        >
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedEvent.title}</h2>
            <p><strong>Status:</strong> {selectedEvent.status}</p>
            <p><strong>Priority:</strong> {selectedEvent.priority}</p>
            <p>
              <strong>Due:</strong>{" "}
              {format(new Date(selectedEvent.due_date), "yyyy-MM-dd")}
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
