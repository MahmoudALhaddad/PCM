import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Calendar from "../pages/Calendar";
import Chat from "../pages/Chat";
import Projects from "../pages/Projects";
import Tasks from "../pages/Tasks";
import Kanban from "../pages/Kanban";
import Users from "../pages/Users";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
import Layout from "../Layouts/Layout";
import Login from "../pages/Login";
import Profile from "../pages/Profile";
import MyTasks from "../pages/MyTasks"
import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
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
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/users" element={<Users />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
