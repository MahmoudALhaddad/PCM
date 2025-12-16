import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Dashboard from "../pages/Dashboard";
import Calendar from "../pages/Calendar";
import Projects from "../pages/Projects";
import Tasks from "../pages/Tasks";
import Users from "../pages/Users";
import Reports from "../pages/Reports";
import Login from "../pages/Login";
import Profile from "../pages/Profile";
import MyTasks from "../pages/MyTasks";
import FileManagementPage from "../pages/FileManagementPage";
import ActivityLogs from "../pages/ActivityLogs";

// Layout & Components
import Layout from "../Layouts/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import Chat from "../components/Chat";

/* =========================
   ROLE PROTECTED ROUTE
========================= */
const RoleProtectedRoute = ({ children, requiredRoles }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user?.role || !requiredRoles.includes(user.role)) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "red" }}>
        <h2>Access Denied</h2>
        <p>
          You don't have permission to view this page.
          <br />
          Allowed roles: <b>{requiredRoles.join(", ")}</b>
        </p>
      </div>
    );
  }

  return children;
};

/* =========================
   APP ROUTES
========================= */
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- PUBLIC ---------- */}
        <Route path="/login" element={<Login />} />

        {/* ---------- PROTECTED ---------- */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />

          {/* General */}
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/files" element={<FileManagementPage />} />
          <Route path="/profile" element={<Profile />} />

          {/* Employee */}
          <Route path="/my-tasks" element={<MyTasks />} />

          {/* Admin + Manager ONLY */}
          <Route
            path="/tasks"
            element={
              <RoleProtectedRoute requiredRoles={["admin", "manager"]}>
                <Tasks />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <RoleProtectedRoute requiredRoles={["admin", "manager"]}>
                <Users />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/activity"
            element={
              <RoleProtectedRoute requiredRoles={["admin", "manager"]}>
                <ActivityLogs />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <RoleProtectedRoute requiredRoles={["admin", "manager"]}>
                <Reports />
              </RoleProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
