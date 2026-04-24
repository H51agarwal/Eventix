import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo">
          <span className="logo-mark">⬡</span>
          <span className="logo-text">Eventix</span>
        </Link>

        <div className="navbar-links">
          <Link to="/events" className={pathname === "/events" ? "nav-link active" : "nav-link"}>
            Browse
          </Link>
          {user?.role === "organizer" || user?.role === "admin" ? (
            <Link to="/dashboard" className={pathname.startsWith("/dashboard") ? "nav-link active" : "nav-link"}>
              Dashboard
            </Link>
          ) : null}
          {user && (
            <Link to="/bookings" className={pathname === "/bookings" ? "nav-link active" : "nav-link"}>
              My Tickets
            </Link>
          )}
        </div>

        <div className="navbar-actions">
          {user ? (
            <div className="navbar-user">
              <div className="user-chip">
                <span className="user-avatar">{user.name?.[0]?.toUpperCase()}</span>
                <span className="user-name">{user.name}</span>
                <span className={`role-dot role-${user.role}`} title={user.role} />
              </div>
              <button className="theme-toggle" onClick={toggle} title="Toggle theme">
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}