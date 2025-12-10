import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Calendar from "../pages/Calendar";
import Projects from "../pages/Projects";
import Tasks from "../pages/Tasks";
import Kanban from "../pages/Kanban";
import Users from "../pages/Users";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
import Layout from "../Layouts/Layout";
import Login from "../pages/Login";
import Profile from "../pages/Profile";
import ProtectedRoute from "../components/ProtectedRoute";
import Chat from "../components/Chat";//faisal

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
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/users" element={<Users />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />//faisal
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
