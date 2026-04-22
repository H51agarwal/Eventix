import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./OrganizerDashboard.css";

const MOCK_EVENTS = [
  { id: 1, title: "Design Systems Summit", date: "2025-05-12", booked: 152, total: 200, revenue: 182400, status: "active" },
  { id: 3, title: "Startup Pitch Night", date: "2025-06-03", booked: 17, total: 80, revenue: 8500, status: "active" },
  { id: 9, title: "Product Teardown Workshop", date: "2025-04-01", booked: 30, total: 30, revenue: 21000, status: "past" },
];

const STATS = [
  { label: "Total events", value: "3", sub: "2 active" },
  { label: "Total bookings", value: "199", sub: "this month" },
  { label: "Revenue", value: "₹2.1L", sub: "all time" },
  { label: "Avg fill rate", value: "81%", sub: "across events" },
];

export default function OrganizerDashboard() {
  const { user } = useAuth();

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
          <div className="grid-4 stats-grid">
            {STATS.map(s => (
              <div key={s.label} className="stat-card card">
                <div className="stat-card-val">{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-sm">
        <div className="container">
          <h2 className="section-label">Your events</h2>
          <div className="events-table">
            <div className="table-header">
              <span>Event</span><span>Date</span><span>Bookings</span><span>Revenue</span><span>Status</span><span></span>
            </div>
            {MOCK_EVENTS.map(e => {
              const pct = Math.round((e.booked / e.total) * 100);
              return (
                <div key={e.id} className="table-row">
                  <span className="trow-title">{e.title}</span>
                  <span className="trow-muted">{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 13 }}>{e.booked}/{e.total}</span>
                      <div className="mini-bar"><div className="mini-fill" style={{ width: `${pct}%` }} /></div>
                    </div>
                  </span>
                  <span className="trow-revenue">₹{e.revenue.toLocaleString()}</span>
                  <span>
                    <span className={`badge ${e.status === "active" ? "badge-success" : "badge-muted"}`}>
                      {e.status}
                    </span>
                  </span>
                  <span style={{ display: "flex", gap: 8 }}>
                    <Link to={`/events/${e.id}`} className="btn btn-ghost btn-sm">View</Link>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}