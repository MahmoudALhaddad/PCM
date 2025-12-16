import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Calendar from "../pages/Calendar";
import Projects from "../pages/Projects";
import Tasks from "../pages/Tasks";
import Users from "../pages/Users";
import Reports from "../pages/Reports";
import Layout from "../Layouts/Layout";
import Login from "../pages/Login";
import Profile from "../pages/Profile";
import MyTasks from "../pages/MyTasks"
import ProtectedRoute from "../components/ProtectedRoute";
import Chat from "../components/Chat";
import FileManagementPage from "../pages/FileManagementPage";
import ActivityLogs from "../pages/ActivityLogs";

const RoleProtectedRoute = ({ children, requiredRoles }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  if (!requiredRoles.includes(user.role)) {
    return <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
      <h2>Access Denied</h2>
      <p>You don't have permission to view this page. Only {requiredRoles.join(" and ")} can access this.</p>
    </div>;
  }
  
  return children;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/my-tasks" element={<MyTasks />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/users" element={<Users />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/files" element={<FileManagementPage />} />
          <Route 
            path="/activity" 
            element={
              <RoleProtectedRoute requiredRoles={["admin", "manager"]}>
                <ActivityLogs />
              </RoleProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}