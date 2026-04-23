import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bookingsAPI } from "../api/index.js";
import { useAuth } from "../context/AuthContext";

export default function BookingHistoryPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const data = await bookingsAPI.myBookings();
        setBookings(data);
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  return (
    <div className="page">
      <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "calc(var(--nav-h) + 32px) 0 32px" }}>
        <div className="container">
          <h1 style={{ fontSize: 36 }}>My tickets</h1>
          <p style={{ color: "var(--muted)", marginTop: 8 }}>
            {loading ? "Loading…" : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div className="section-sm">
        <div className="container" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: 60 }}>Loading your tickets…</div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: 60 }}>
              <p style={{ marginBottom: 16 }}>No bookings yet.</p>
              <Link to="/events" className="btn btn-primary">Browse events</Link>
            </div>
          ) : (
            bookings.map(b => (
              <div key={b.id} className="card" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <h3 style={{ fontSize: 16, fontFamily: "var(--font-head)" }}>{b.event?.title}</h3>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--muted)", flexWrap: "wrap" }}>
                    <span>📅 {new Date(b.event?.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span>📍 {b.event?.venue}</span>
                    <span>🎟 {b.quantity} × {b.tierLabel}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 18, color: "var(--accent)" }}>
                    ₹{b.totalPrice.toLocaleString()}
                  </span>
                  <span className={`badge ${b.status === "confirmed" ? "badge-success" : "badge-muted"}`}>
                    {b.status}
                  </span>
                  <Link to={`/events/${b.eventId}`} className="btn btn-ghost btn-sm">View event</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}