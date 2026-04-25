import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { eventsAPI } from "../api/index.js";
import "./OrganizerDashboard.css";

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalBookings: 0,
    totalRevenue: 0,
    avgFillRate: 0,
  });

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await eventsAPI.myEvents();
        setEvents(data);

        // Calculate real stats
        const totalEvents = data.length;
        const activeEvents = data.filter(e => e.status === "active").length;
        const totalBookings = data.reduce((sum, e) => sum + (e._count?.bookings || 0), 0);
        const totalRevenue = 0; // Will be real when bookings API returns revenue
        const avgFillRate = totalEvents > 0
          ? Math.round(data.reduce((sum, e) => sum + ((e._count?.bookings || 0) / e.capacity * 100), 0) / totalEvents)
          : 0;

        setStats({ totalEvents, activeEvents, totalBookings, totalRevenue, avgFillRate });
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  async function handleCancel(eventId) {
    if (!window.confirm("Cancel this event? All attendees will be notified!")) return;
    setCancelling(eventId);
    try {
      await eventsAPI.cancel(eventId);
      alert("Event cancelled and attendees notified!");
      // Refresh events
      const data = await eventsAPI.myEvents();
      setEvents(data);
    } catch (err) {
      alert("Failed to cancel: " + err.message);
    } finally {
      setCancelling(null);
    }
  }

  const STATS_DISPLAY = [
    { label: "Total events", value: stats.totalEvents, sub: `${stats.activeEvents} active` },
    { label: "Total bookings", value: stats.totalBookings, sub: "all time" },
    { label: "Avg fill rate", value: `${stats.avgFillRate}%`, sub: "across events" },
  ];

  return (
    <div className="page">
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
              <div className="stat-card card">
                <div className="stat-card-val" style={{ color: "var(--success)" }}>
                  {events.filter(e => e.status === "active").length > 0 ? "🟢" : "—"}
                </div>
                <div className="stat-card-label">Status</div>
                <div className="stat-card-sub">
                  {events.filter(e => e.status === "active").length} live events
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
                        day: "numeric", month: "short", year: "numeric"
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
                    <span>
                      <span className={`badge ${
                        e.status === "active" ? "badge-success" :
                        e.status === "cancelled" ? "badge-accent" :
                        "badge-muted"
                      }`}>
                        {e.status === "active" ? "✅ Active" :
                         e.status === "cancelled" ? "❌ Cancelled" :
                         "⏰ Past"}
                      </span>
                    </span>
                    <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link to={`/events/${e.id}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                      {e.status === "active" && (
                        <button
                          className="btn btn-sm"
                          style={{
                            background: "rgba(232,64,64,0.1)",
                            color: "var(--danger)",
                            border: "1px solid rgba(232,64,64,0.3)"
                          }}
                          onClick={() => handleCancel(e.id)}
                          disabled={cancelling === e.id}
                        >
                          {cancelling === e.id ? "Cancelling…" : "Cancel"}
                        </button>
                      )}
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