import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); setMenuOpen(false); };
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner container">
          <Link to="/" className="navbar-logo" onClick={closeMenu}>
            <span className="logo-mark">⬡</span>
            <span className="logo-text">Eventix</span>
          </Link>

          {/* Desktop links */}
          <div className="navbar-links">
            <Link to="/events" className={pathname === "/events" ? "nav-link active" : "nav-link"}>Browse</Link>
            {(user?.role === "organizer" || user?.role === "admin") && (
              <Link to="/dashboard" className={pathname.startsWith("/dashboard") ? "nav-link active" : "nav-link"}>Dashboard</Link>
            )}
            {user && (
              <Link to="/bookings" className={pathname === "/bookings" ? "nav-link active" : "nav-link"}>My Tickets</Link>
            )}
          </div>

          {/* Desktop actions */}
          <div className="navbar-actions">
            {user ? (
              <div className="navbar-user">
                <div className="user-chip">
                  <span className="user-avatar">{user.name?.[0]?.toUpperCase()}</span>
                  <span className="user-name">{user.name}</span>
                  <span className={`role-dot role-${user.role}`} title={user.role} />
                </div>
                <button className="theme-toggle" onClick={toggle}>{theme === "dark" ? "☀️" : "🌙"}</button>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button className="theme-toggle" onClick={toggle}>{theme === "dark" ? "☀️" : "🌙"}</button>
                <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button className="hamburger" onClick={() => setMenuOpen(o => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <Link to="/events" className={pathname === "/events" ? "mobile-nav-link active" : "mobile-nav-link"} onClick={closeMenu}>Browse</Link>
        {(user?.role === "organizer" || user?.role === "admin") && (
          <Link to="/dashboard" className={pathname.startsWith("/dashboard") ? "mobile-nav-link active" : "mobile-nav-link"} onClick={closeMenu}>Dashboard</Link>
        )}
        {user && (
          <Link to="/bookings" className={pathname === "/bookings" ? "mobile-nav-link active" : "mobile-nav-link"} onClick={closeMenu}>My Tickets</Link>
        )}
        <hr className="mobile-divider" />
        <div className="mobile-actions">
          <button className="theme-toggle" onClick={toggle}>{theme === "dark" ? "☀️" : "🌙"}</button>
          {user ? (
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm" onClick={closeMenu}>Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>Get started</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}