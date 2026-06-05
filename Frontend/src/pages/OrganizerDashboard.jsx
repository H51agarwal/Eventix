import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { eventsAPI } from "../api/index.js";
import "./OrganizerDashboard.css";

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ message, subMessage, onConfirm, onCancel, loading }) {
  return (
    <div className="od-modal-overlay">
      <div className="od-modal">
        <p className="od-modal-msg">{message}</p>
        {subMessage && <p className="od-modal-sub">{subMessage}</p>}
        <div className="od-modal-actions">
          <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-sm"
            style={{ background: "var(--danger, #ef4444)", color: "#fff" }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'cancel'|'delete', eventId, title }
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalBookings: 0,
    avgFillRate: 0,
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEvents = async () => {
    try {
      const data = await eventsAPI.myEvents();
      setEvents(data);

      const totalEvents = data.length;
      const activeEvents = data.filter(e => e.status === "active").length;
      const totalBookings = data.reduce((sum, e) => sum + (e._count?.bookings || 0), 0);

      const totalRevenue = data.reduce((sum, e) => sum + (e.revenue || 0), 0);

      const avgFillRate = totalEvents > 0
        ? Math.round(data.reduce((sum, e) => sum + ((e._count?.bookings || 0) / e.capacity * 100), 0) / totalEvents)
        : 0;

      setStats({ totalEvents, activeEvents, totalBookings, avgFillRate });
    } catch (err) {
      showToast("Failed to fetch events: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  // ── Cancel event ────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await eventsAPI.cancel(confirm.eventId);
      showToast("Event cancelled — all attendees notified ✓");
      await fetchEvents();
    } catch (err) {
      showToast("Failed to cancel: " + err.message, "error");
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  };

  // ── Delete event ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API}/events/${confirm.eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      showToast(`Event deleted — ${data.notified} attendee(s) notified ✓`);
      await fetchEvents();
    } catch (err) {
      showToast("Failed to delete: " + err.message, "error");
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  };

  const STATS_DISPLAY = [
  { label: "Total events",   value: stats.totalEvents,                          sub: `${stats.activeEvents} active` },
  { label: "Total revenue",  value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, sub: "confirmed bookings" },
  { label: "Total bookings", value: stats.totalBookings,                         sub: "all time" },
  { label: "Avg fill rate",  value: `${stats.avgFillRate}%`,                    sub: "across events" },
];

  return (
    <div className="page">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`od-toast od-toast--${toast.type}`}>
          {toast.msg}
          <button className="od-toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      {/* ── Confirm Modal ──────────────────────────────────────────────────── */}
      {confirm && (
        <ConfirmModal
          message={
            confirm.type === "delete"
              ? `Permanently delete "${confirm.title}"?`
              : `Cancel "${confirm.title}"?`
          }
          subMessage={
            confirm.type === "delete"
              ? "This cannot be undone. All confirmed attendees will be notified and their bookings cancelled."
              : "All confirmed attendees will be notified that the event is cancelled."
          }
          loading={actionLoading}
          onConfirm={confirm.type === "delete" ? handleDelete : handleCancel}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="dash-header">
        <div className="container">
          <div className="dash-title-row">
            <div>
              <h1 className="dash-title">Dashboard</h1>
              <p className="dash-sub">Welcome back, {user?.name || "Organizer"}</p>
            </div>
            <Link to="/dashboard/create" className="btn btn-primary">+ New event</Link>
          </div>

          {loading ? (
            <p style={{ color: "var(--muted)" }}>Loading stats…</p>
          ) : (
            <div className="grid-4 stats-grid">
              {STATS_DISPLAY.map(s => (
                <div key={s.label} className="stat-card card">
                  <div className="stat-card-val">{s.value}</div>
                  <div className="stat-card-label">{s.label}</div>
                  <div className="stat-card-sub">{s.sub}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Events Table ──────────────────────────────────────────────────── */}
      <div className="section-sm">
        <div className="container">
          <h2 className="section-label">Your events</h2>

          {loading ? (
            <p style={{ color: "var(--muted)" }}>Loading events…</p>
          ) : events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
              <p style={{ marginBottom: 16 }}>No events yet. Create your first one!</p>
              <Link to="/dashboard/create" className="btn btn-primary">+ Create event</Link>
            </div>
          ) : (
            <div className="events-table">
              <div className="table-header">
                <span>Event</span>
                <span>Date</span>
                <span>Bookings</span>
                <span>Revenue</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {events.map(e => {
                const booked = e._count?.bookings || 0;
                const pct = Math.round((booked / e.capacity) * 100);
                return (
                  <div key={e.id} className="table-row">
                    <span className="trow-title">{e.title}</span>
                    <span className="trow-muted">
                      {new Date(e.date).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    <span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 13 }}>{booked}/{e.capacity}</span>
                        <div className="mini-bar">
                          <div className="mini-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </span>
                    <span style={{ fontWeight: 600, color: "var(--accent, #6c47ff)" }}>
                      ₹{(e.revenue || 0).toLocaleString("en-IN")}
                    </span>
                    <span>
                      <span className={`badge ${
                        e.status === "active"    ? "badge-success" :
                        e.status === "cancelled" ? "badge-accent"  : "badge-muted"
                      }`}>
                        {e.status === "active"    ? "✅ Active"    :
                         e.status === "cancelled" ? "❌ Cancelled" : "⏰ Past"}
                      </span>
                    </span>

                    {/* ── Action buttons ── */}
                    <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Link to={`/events/${e.id}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>

                      {/* Edit — only for active events */}
                      {e.status === "active" && (
                        <button
                          className="btn btn-sm"
                          style={{
                            background: "rgba(108,71,255,0.1)",
                            color: "var(--accent, #6c47ff)",
                            border: "1px solid rgba(108,71,255,0.3)",
                          }}
                          onClick={() => navigate(`/dashboard/edit/${e.id}`)}
                        >
                          Edit
                        </button>
                      )}

                      {e.status === "active" && (
                        <button
                          className="btn btn-sm"
                          style={{
                            background: "rgba(245,158,11,0.1)",
                            color: "#b45309",
                            border: "1px solid rgba(245,158,11,0.3)",
                          }}
                          onClick={() => setConfirm({ type: "cancel", eventId: e.id, title: e.title })}
                        >
                          Cancel
                        </button>
                      )}

                      {/* Delete — always visible */}
                      <button
                        className="btn btn-sm"
                        style={{
                          background: "rgba(232,64,64,0.1)",
                          color: "var(--danger, #ef4444)",
                          border: "1px solid rgba(232,64,64,0.3)",
                        }}
                        onClick={() => setConfirm({ type: "delete", eventId: e.id, title: e.title })}
                      >
                        Delete
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}