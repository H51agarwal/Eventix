import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { eventsAPI, bookingsAPI } from "../api/index.js";
import "./EventDetailPage.css";

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
}

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [booked, setBooked] = useState(false);
  const [booking, setBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEvent() {
      try {
        const data = await eventsAPI.getOne(id);
        setEvent(data);
      } catch (err) {
        console.error("Failed to fetch event:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  if (loading) return (
    <div className="page">
      <div className="container" style={{ paddingTop: 120, textAlign: "center", color: "var(--muted)" }}>
        Loading event…
      </div>
    </div>
  );

  if (!event) return (
    <div className="page">
      <div className="container" style={{ paddingTop: 120, textAlign: "center" }}>
        <h2>Event not found</h2>
        <Link to="/events" className="btn btn-ghost" style={{ marginTop: 20 }}>← Back to events</Link>
      </div>
    </div>
  );

  const tiers = event.pricingTiers || [];
  const tier = tiers[selectedTier];
  const total = tier ? tier.price * quantity : 0;
  const totalBooked = event._count?.bookings || 0;
  const spotsLeft = event.capacity - totalBooked;
  const pct = Math.round((totalBooked / event.capacity) * 100);

  async function handleBook() {
    if (!user) { navigate("/login"); return; }
    if (!tier) return;
    setBookingLoading(true); setError("");
    try {
      const data = await bookingsAPI.create(event.id, quantity, tier.label, total);
      setBooking(data);
      setBooked(true);
    } catch (err) {
      setError(err.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="ed-hero">
        <div className="container">
          <Link to="/events" className="back-link">← Back to events</Link>
          <div className="ed-hero-content">
            <div className="ed-badges">
              <span className="badge badge-blue">{event.category}</span>
              <span className="badge badge-muted">By {event.organizer?.name}</span>
            </div>
            <h1 className="ed-title">{event.title}</h1>
            <div className="ed-meta-row">
              <span>📅 {fmtDate(event.date)} · {event.time}</span>
              <span>📍 {event.venue}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-sm">
        <div className="container ed-layout">
          {/* Left: details */}
          <div className="ed-left">
            <div className="ed-section">
              <h3>About this event</h3>
              {event.description?.split("\n\n").map((p, i) => (
                <p key={i} className="ed-desc-para">{p}</p>
              ))}
            </div>

            <div className="ed-section">
              <h3>Capacity</h3>
              <div className="capacity-bar-wrap">
                <div className="capacity-bar">
                  <div className="capacity-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="capacity-label">
                  {totalBooked} / {event.capacity} booked ({pct}%) · {spotsLeft} spots left
                </span>
              </div>
            </div>

            {tiers.length > 0 && (
              <div className="ed-section">
                <h3>Pricing tiers</h3>
                <div className="tiers-list">
                  {tiers.map((t, i) => (
                    <div
                      key={i}
                      className={`tier-row ${selectedTier === i ? "active" : ""}`}
                      onClick={() => setSelectedTier(i)}
                    >
                      <div className="tier-radio">{selectedTier === i ? "●" : "○"}</div>
                      <div className="tier-info">
                        <span className="tier-label text-accent">{t.label}</span>
                        <span className="tier-desc">{t.desc}</span>
                      </div>
                      <span className="tier-price">₹{t.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: booking panel */}
          <div className="ed-right">
            {booked ? (
              <div className="booking-success">
                <div className="success-icon">✓</div>
                <h3>Booking confirmed!</h3>
                <p>{quantity} ticket{quantity > 1 ? "s" : ""} for {event.title}</p>
                <p className="success-total">Total paid: ₹{total.toLocaleString()}</p>
                <Link to="/bookings" className="btn btn-teal btn-full" style={{ marginTop: 16 }}>
                  View my tickets
                </Link>
              </div>
            ) : (
              <div className="booking-panel card">
                <div className="bp-header">
                  <span className="bp-price">
                    {tier ? `₹${tier.price.toLocaleString()}` : "Free"}
                  </span>
                  <span className="bp-tier-tag">{tier?.label}</span>
                </div>
                <hr className="divider" />

                {tiers.length > 0 && (
                  <div className="field">
                    <label>Tier</label>
                    <select
                      className="input"
                      value={selectedTier}
                      onChange={e => setSelectedTier(Number(e.target.value))}
                    >
                      {tiers.map((t, i) => (
                        <option key={i} value={i}>{t.label} — ₹{t.price}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="field" style={{ marginTop: 12 }}>
                  <label>Quantity</label>
                  <div className="qty-row">
                    <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                    <span className="qty-val">{quantity}</span>
                    <button className="qty-btn" onClick={() => setQuantity(q => Math.min(10, q + 1))}>+</button>
                  </div>
                </div>

                <hr className="divider" />
                <div className="bp-total-row">
                  <span>Total</span>
                  <span className="bp-total">₹{total.toLocaleString()}</span>
                </div>

                {quantity >= 3 && (
                  <div className="msg-success" style={{ fontSize: 12, marginTop: 8 }}>
                    🎉 Group discount may apply! Check the Group tier.
                  </div>
                )}

                {error && <div className="msg-error" style={{ marginTop: 8, fontSize: 13 }}>{error}</div>}

                <button
                  className="btn btn-primary btn-full"
                  style={{ marginTop: 16 }}
                  onClick={handleBook}
                  disabled={bookingLoading || spotsLeft === 0}
                >
                  {bookingLoading ? "Booking…" : spotsLeft === 0 ? "Sold out" : user ? "Book now" : "Sign in to book"}
                </button>
                <p className="bp-note">Free cancellation up to 48h before the event</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}