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
export default function AppRoutes() {
  return (
    <BrowserRouter>
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* All protected pages inside Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/users" element={<Users />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />

        {/* Profile SHOULD be here */}
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  </BrowserRouter>

  );
}
