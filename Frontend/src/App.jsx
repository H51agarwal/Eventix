import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import CreateEventPage from "./pages/CreateEventPage";
import BookingHistoryPage from "./pages/BookingHistoryPage";
import NotFoundPage from "./pages/NotFoundPage";

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={["organizer", "admin"]}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/create"
              element={
                <ProtectedRoute roles={["organizer", "admin"]}>
                  <CreateEventPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute roles={["attendee", "organizer", "admin"]}>
                  <BookingHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}