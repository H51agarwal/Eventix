import { useAuth } from "../context/AuthContext";

const MOCK_BOOKINGS = [
  { id: 1, event: "Design Systems Summit", date: "May 12, 2025", venue: "Online", qty: 2, tier: "Early Bird", total: 1920, status: "confirmed" },
  { id: 2, event: "Mumbai Jazz Collective", date: "May 18, 2025", venue: "NCPA, Mumbai", qty: 1, tier: "Regular", total: 800, status: "confirmed" },
  { id: 3, event: "Product Teardown Workshop", date: "Apr 1, 2025", venue: "Online", qty: 1, tier: "Regular", total: 700, status: "attended" },
];

export default function BookingHistoryPage() {
  const { user } = useAuth();
  return (
    <div className="page">
      <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "calc(var(--nav-h) + 32px) 0 32px" }}>
        <div className="container">
          <h1 style={{ fontSize: 36 }}>My tickets</h1>
          <p style={{ color: "var(--muted)", marginTop: 8 }}>{MOCK_BOOKINGS.length} bookings</p>
        </div>
      </div>
      <div className="section-sm">
        <div className="container" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {MOCK_BOOKINGS.map(b => (
            <div key={b.id} className="card" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <h3 style={{ fontSize: 16, fontFamily: "var(--font-head)" }}>{b.event}</h3>
                <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--muted)" }}>
                  <span>📅 {b.date}</span>
                  <span>📍 {b.venue}</span>
                  <span>🎟 {b.qty} × {b.tier}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 18, color: "var(--accent)" }}>
                  ₹{b.total.toLocaleString()}
                </span>
                <span className={`badge ${b.status === "confirmed" ? "badge-success" : "badge-muted"}`}>
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}