import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "./AdminPanel.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

// ── Reusable stat card ──────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }) => (
  <div className={`ap-stat-card ${accent ? "ap-stat-card--accent" : ""}`}>
    <span className="ap-stat-label">{label}</span>
    <span className="ap-stat-value">{value}</span>
    {sub && <span className="ap-stat-sub">{sub}</span>}
  </div>
);

// ── Status badge ────────────────────────────────────────────────────────────
const Badge = ({ text, type }) => (
  <span className={`ap-badge ap-badge--${type}`}>{text}</span>
);

// ── Confirm modal ───────────────────────────────────────────────────────────
const ConfirmModal = ({ message, onConfirm, onCancel, danger }) => (
  <div className="ap-modal-overlay">
    <div className="ap-modal">
      <p className="ap-modal-msg">{message}</p>
      <div className="ap-modal-actions">
        <button className="ap-btn ap-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          className={`ap-btn ${danger ? "ap-btn--danger" : "ap-btn--primary"}`}
          onClick={onConfirm}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

// ── Toast notification ──────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`ap-toast ap-toast--${type}`}>
      {msg}
      <button className="ap-toast-close" onClick={onClose}>✕</button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// TAB 1 — Overview
// ════════════════════════════════════════════════════════════════════════════
const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/admin/stats")
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="ap-loading">Loading stats…</div>;
  if (error) return <div className="ap-error">⚠ {error}</div>;

  const fmt = (n) =>
    n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n.toFixed(0)}`;

  return (
    <div className="ap-tab-content">
      {/* Top stat cards */}
      <div className="ap-stat-grid">
        <StatCard
          label="Total Revenue"
          value={fmt(stats.totalRevenue)}
          sub="confirmed bookings"
          accent
        />
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          sub={`${stats.usersByRole.find((r) => r.role === "organizer")?._count?.role ?? 0} organizers`}
        />
        <StatCard
          label="Total Events"
          value={stats.totalEvents}
          sub="across all organizers"
        />
        <StatCard
          label="Total Bookings"
          value={stats.totalBookings}
          sub="confirmed only"
        />
      </div>

      <div className="ap-two-col">
        {/* Events by category */}
        <div className="ap-card">
          <h3 className="ap-card-title">Events by category</h3>
          <div className="ap-bar-list">
            {stats.eventsByCategory.map((c) => {
              const max = stats.eventsByCategory[0]._count.category;
              const pct = Math.round((c._count.category / max) * 100);
              return (
                <div className="ap-bar-row" key={c.category}>
                  <span className="ap-bar-label">{c.category || "—"}</span>
                  <div className="ap-bar-track">
                    <div className="ap-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="ap-bar-count">{c._count.category}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Events by city */}
        <div className="ap-card">
          <h3 className="ap-card-title">Events by city</h3>
          <div className="ap-bar-list">
            {stats.eventsByCity.map((c) => {
              const max = stats.eventsByCity[0]._count.city;
              const pct = Math.round((c._count.city / max) * 100);
              return (
                <div className="ap-bar-row" key={c.city}>
                  <span className="ap-bar-label">{c.city || "—"}</span>
                  <div className="ap-bar-track">
                    <div
                      className="ap-bar-fill ap-bar-fill--teal"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="ap-bar-count">{c._count.city}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top organizers */}
      <div className="ap-card">
        <h3 className="ap-card-title">Top organizers by revenue</h3>
        <table className="ap-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Events</th>
              <th>Bookings</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {stats.topOrganizers.map((o) => (
              <tr key={o.id}>
                <td>{o.name}</td>
                <td className="ap-muted">{o.email}</td>
                <td>{o.totalEvents}</td>
                <td>{o.totalBookings}</td>
                <td className="ap-highlight">₹{o.totalRevenue.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent bookings */}
      <div className="ap-card">
        <h3 className="ap-card-title">Recent bookings</h3>
        <table className="ap-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Event</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentBookings.map((b) => (
              <tr key={b.id}>
                <td>{b.user.name}</td>
                <td>{b.event.title}</td>
                <td className="ap-highlight">₹{b.totalAmount}</td>
                <td className="ap-muted">
                  {new Date(b.createdAt).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// TAB 2 — Users
// ════════════════════════════════════════════════════════════════════════════
const UsersTab = ({ showToast }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [confirm, setConfirm] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (roleFilter) params.append("role", roleFilter);
    apiFetch(`/admin/users?${params}`)
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const updateUser = async (id, data, successMsg) => {
    try {
      const updated = await apiFetch(`/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
      showToast(successMsg, "success");
    } catch (e) {
      showToast(e.message, "error");
    }
    setConfirm(null);
  };

  const roleBadgeType = (role) =>
    role === "admin" ? "purple" : role === "organizer" ? "blue" : "gray";

  return (
    <div className="ap-tab-content">
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="ap-toolbar">
        <input
          className="ap-search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="ap-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          <option value="attendee">Attendee</option>
          <option value="organizer">Organizer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="ap-loading">Loading users…</div>
      ) : (
        <div className="ap-card">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Bookings</th>
                <th>Events</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.banned ? "ap-row--banned" : ""}>
                  <td>{u.name}</td>
                  <td className="ap-muted">{u.email}</td>
                  <td>
                    <Badge text={u.role} type={roleBadgeType(u.role)} />
                  </td>
                  <td>{u._count.bookings}</td>
                  <td>{u._count.events}</td>
                  <td>
                    {u.banned ? (
                      <Badge text="Banned" type="red" />
                    ) : (
                      <Badge text="Active" type="green" />
                    )}
                  </td>
                  <td>
                    <div className="ap-action-row">
                      {/* Change role */}
                      <select
                        className="ap-select ap-select--sm"
                        value={u.role}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setConfirm({
                            message: `Change ${u.name}'s role to "${newRole}"?`,
                            onConfirm: () => updateUser(u.id, { role: newRole }, `Role updated to ${newRole}`),
                          });
                        }}
                      >
                        <option value="attendee">Attendee</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>

                      {/* Ban / Unban */}
                      <button
                        className={`ap-btn ap-btn--sm ${u.banned ? "ap-btn--success" : "ap-btn--danger"}`}
                        onClick={() =>
                          setConfirm({
                            message: u.banned
                              ? `Unban ${u.name}?`
                              : `Ban ${u.name}? They won't be able to log in.`,
                            danger: !u.banned,
                            onConfirm: () =>
                              updateUser(
                                u.id,
                                { banned: !u.banned },
                                u.banned ? "User unbanned" : "User banned"
                              ),
                          })
                        }
                      >
                        {u.banned ? "Unban" : "Ban"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="ap-empty">No users found.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// TAB 3 — Events
// ════════════════════════════════════════════════════════════════════════════
const EventsTab = ({ showToast }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirm, setConfirm] = useState(null);

  const fetchEvents = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (statusFilter) params.append("status", statusFilter);
    apiFetch(`/admin/events?${params}`)
      .then(setEvents)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, [search, statusFilter]);

  const deleteEvent = async (id) => {
    try {
      await apiFetch(`/admin/events/${id}`, { method: "DELETE" });
      setEvents((prev) => prev.filter((e) => e.id !== id));
      showToast("Event deleted and attendees notified", "success");
    } catch (e) {
      showToast(e.message, "error");
    }
    setConfirm(null);
  };

  const cancelEvent = async (id) => {
    try {
      await apiFetch(`/admin/events/${id}/cancel`, { method: "PATCH" });
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "CANCELLED" } : e))
      );
      showToast("Event cancelled and attendees notified", "success");
    } catch (e) {
      showToast(e.message, "error");
    }
    setConfirm(null);
  };

  const statusBadgeType = (s) =>
    s === "ACTIVE" ? "green" : s === "CANCELLED" ? "red" : "gray";

  return (
    <div className="ap-tab-content">
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="ap-toolbar">
        <input
          className="ap-search"
          placeholder="Search events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="ap-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="ap-loading">Loading events…</div>
      ) : (
        <div className="ap-card">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Organizer</th>
                <th>Date</th>
                <th>City</th>
                <th>Bookings</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td className="ap-muted">{e.user?.name ?? "—"}</td>
                  <td className="ap-muted">
                    {new Date(e.date).toLocaleDateString("en-IN")}
                  </td>
                  <td>{e.city}</td>
                  <td>{e._count.bookings}</td>
                  <td>
                    <Badge
                      text={e.status}
                      type={statusBadgeType(e.status)}
                    />
                  </td>
                  <td>
                    <div className="ap-action-row">
                      {e.status !== "CANCELLED" && (
                        <button
                          className="ap-btn ap-btn--sm ap-btn--warning"
                          onClick={() =>
                            setConfirm({
                              message: `Cancel "${e.title}"? All attendees will be notified.`,
                              danger: true,
                              onConfirm: () => cancelEvent(e.id),
                            })
                          }
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        className="ap-btn ap-btn--sm ap-btn--danger"
                        onClick={() =>
                          setConfirm({
                            message: `Permanently delete "${e.title}"? This cannot be undone.`,
                            danger: true,
                            onConfirm: () => deleteEvent(e.id),
                          })
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length === 0 && (
            <p className="ap-empty">No events found.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// TAB 4 — Organizers
// ════════════════════════════════════════════════════════════════════════════
const OrganizersTab = ({ showToast }) => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    apiFetch("/admin/organizers")
      .then(setOrganizers)
      .finally(() => setLoading(false));
  }, []);

  const revokeOrganizer = async (id, name) => {
    try {
      await apiFetch(`/admin/organizers/${id}/revoke`, { method: "PATCH" });
      setOrganizers((prev) => prev.filter((o) => o.id !== id));
      showToast(`${name}'s organizer role revoked`, "success");
    } catch (e) {
      showToast(e.message, "error");
    }
    setConfirm(null);
  };

  return (
    <div className="ap-tab-content">
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {loading ? (
        <div className="ap-loading">Loading organizers…</div>
      ) : (
        <div className="ap-card">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Events</th>
                <th>Bookings</th>
                <th>Revenue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizers.map((o) => (
                <tr key={o.id} className={o.banned ? "ap-row--banned" : ""}>
                  <td>{o.name}</td>
                  <td className="ap-muted">{o.email}</td>
                  <td>{o.totalEvents}</td>
                  <td>{o.totalBookings}</td>
                  <td className="ap-highlight">₹{o.totalRevenue.toFixed(0)}</td>
                  <td>
                    {o.banned ? (
                      <Badge text="Banned" type="red" />
                    ) : (
                      <Badge text="Active" type="green" />
                    )}
                  </td>
                  <td>
                    <button
                      className="ap-btn ap-btn--sm ap-btn--danger"
                      onClick={() =>
                        setConfirm({
                          message: `Revoke organizer role from ${o.name}? They'll become an attendee.`,
                          danger: true,
                          onConfirm: () => revokeOrganizer(o.id, o.name),
                        })
                      }
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {organizers.length === 0 && (
            <p className="ap-empty">No organizers found.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN AdminPanel component
// ════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "events", label: "Events" },
  { id: "organizers", label: "Organizers" },
];

export default function AdminPanel() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  if (!user || user.role !== "admin") {
    return (
      <div className="ap-forbidden">
        <h2>Access Denied</h2>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="ap-root">
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="ap-header">
        <div>
          <h1 className="ap-title">Admin Panel</h1>
          <p className="ap-subtitle">Logged in as {user.name}</p>
        </div>
      </div>

      <nav className="ap-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`ap-tab-btn ${activeTab === t.id ? "ap-tab-btn--active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {activeTab === "overview"    && <OverviewTab />}
        {activeTab === "users"       && <UsersTab showToast={showToast} />}
        {activeTab === "events"      && <EventsTab showToast={showToast} />}
        {activeTab === "organizers"  && <OrganizersTab showToast={showToast} />}
      </main>
    </div>
  );
}
