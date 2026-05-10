import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bookingsAPI, refundAPI } from "../api/index.js";
import { useAuth } from "../context/AuthContext";

export default function BookingHistoryPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundPreview, setRefundPreview] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelling, setCancelling] = useState(null);

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

  async function handleCancelClick(booking) {
    setSelectedBooking(booking);
    try {
      const preview = await refundAPI.preview(booking.id);
      setRefundPreview(preview);
    } catch (err) {
      alert("Could not get refund details: " + err.message);
    }
  }

  async function confirmCancel() {
    if (!selectedBooking) return;
    setCancelling(selectedBooking.id);
    try {
      const result = await refundAPI.cancel(selectedBooking.id);
      setRefundPreview(null);
      setSelectedBooking(null);
      // Refresh bookings
      const data = await bookingsAPI.myBookings();
      setBookings(data);
      alert(`Ticket cancelled! Refund of ₹${result.refundAmount} (${result.refundPercentage}%) will be credited within 5-7 business days.`);
    } catch (err) {
      alert("Cancellation failed: " + err.message);
    } finally {
      setCancelling(null);
    }
  }

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

      {/* Refund Preview Modal */}
      {refundPreview && selectedBooking && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200, padding: 24
        }}>
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: 32, maxWidth: 440, width: "100%"
          }}>
            <h3 style={{ marginBottom: 16, fontSize: 20 }}>Cancel Ticket</h3>
            <div style={{ background: "var(--bg3)", borderRadius: "var(--radius-sm)", padding: 16, marginBottom: 20 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>{selectedBooking.event?.title}</p>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Total paid: ₹{selectedBooking.totalPrice?.toLocaleString()}</p>
            </div>

            {/* Refund breakdown */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--muted)", fontSize: 14 }}>Amount paid</span>
                <span style={{ fontWeight: 600 }}>₹{refundPreview.totalPaid?.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--muted)", fontSize: 14 }}>Refund ({refundPreview.percentage}%)</span>
                <span style={{ fontWeight: 700, color: refundPreview.amount > 0 ? "var(--success)" : "var(--danger)" }}>
                  ₹{refundPreview.amount?.toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                <span style={{ color: "var(--muted)", fontSize: 14 }}>Cancellation fee</span>
                <span style={{ color: "var(--danger)" }}>
                  ₹{(refundPreview.totalPaid - refundPreview.amount)?.toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ background: "rgba(62,207,142,0.08)", border: "1px solid rgba(62,207,142,0.2)", borderRadius: "var(--radius-sm)", padding: 12, marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>📋 Reason: {refundPreview.reason}</p>
              {refundPreview.amount > 0 && (
                <p style={{ fontSize: 13, color: "var(--success)", marginTop: 4 }}>
                  ✅ Refund will be credited within 5-7 business days
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => { setRefundPreview(null); setSelectedBooking(null); }}
              >
                Keep ticket
              </button>
              <button
                className="btn btn-sm"
                style={{
                  flex: 2, background: "rgba(232,64,64,0.1)",
                  color: "var(--danger)", border: "1px solid rgba(232,64,64,0.3)",
                  padding: "10px 20px", borderRadius: "var(--radius-sm)",
                  cursor: "pointer", fontFamily: "var(--font-head)", fontWeight: 600
                }}
                onClick={confirmCancel}
                disabled={cancelling === selectedBooking.id}
              >
                {cancelling === selectedBooking.id ? "Cancelling…" : `Confirm & get ₹${refundPreview.amount?.toLocaleString()} refund`}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div key={b.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <h3 style={{ fontSize: 16, fontFamily: "var(--font-head)" }}>{b.event?.title}</h3>
                    <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--muted)", flexWrap: "wrap" }}>
                      <span>📅 {new Date(b.event?.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span>📍 {b.event?.venue}</span>
                      <span>🎟 {b.quantity} × {b.tierLabel}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 18, color: "var(--accent)" }}>
                      ₹{b.totalPrice?.toLocaleString()}
                    </span>
                    <span className={`badge ${
                      b.status === "confirmed" ? "badge-success" :
                      b.status === "cancelled" ? "badge-accent" :
                      "badge-muted"
                    }`}>
                      {b.status}
                    </span>
                    <Link to={`/events/${b.eventId}`} className="btn btn-ghost btn-sm">View event</Link>
                    {b.status === "confirmed" && (
                      <button
                        className="btn btn-sm"
                        style={{
                          background: "rgba(232,64,64,0.1)",
                          color: "var(--danger)",
                          border: "1px solid rgba(232,64,64,0.3)",
                          padding: "7px 14px",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                          fontFamily: "var(--font-head)",
                          fontWeight: 600,
                          fontSize: 13
                        }}
                        onClick={() => handleCancelClick(b)}
                      >
                        Cancel ticket
                      </button>
                    )}
                  </div>
                </div>

                {/* Refund policy hint */}
                {b.status === "confirmed" && (
                  <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--bg3)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--muted)" }}>
                    💡 Refund policy: 75% if cancelled 1 week before · 50% within 1 week · 25% within 24hrs
                  </div>
                )}

                {/* Cancelled badge with refund info */}
                {b.status === "cancelled" && (
                  <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(232,64,64,0.08)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--danger)" }}>
                    ❌ Ticket cancelled — refund processed if applicable
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}