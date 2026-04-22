import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./EventDetailPage.css";

const MOCK = {
  1: { id: 1, title: "Design Systems Summit", category: "Tech", date: "2025-05-12", time: "10:00 AM – 6:00 PM", venue: "Online (Zoom)", description: "A full-day deep dive into building scalable design systems for modern products. Learn from industry leaders at companies like Figma, Atlassian, and Linear.\n\nYou'll walk away with practical frameworks for token architecture, component governance, and documentation strategy.", organizer: "DesignOps India", capacity: 200, booked: 152, tiers: [ { label: "Early Bird", price: 960, desc: "Ends May 5", type: "teal" }, { label: "Regular", price: 1200, desc: "Standard ticket", type: "accent" }, { label: "Group (3+)", price: 1020, desc: "Per person", type: "blue" } ] },
  2: { id: 2, title: "Mumbai Jazz Collective", category: "Music", date: "2025-05-18", time: "7:00 PM – 10:00 PM", venue: "NCPA, Mumbai", description: "An evening of improvisational jazz featuring the city's finest musicians.\n\nExpect soulful sets, unexpected collaborations, and the kind of music that makes you forget time.", organizer: "Mumbai Jazz Society", capacity: 150, booked: 138, tiers: [ { label: "Regular", price: 800, desc: "Standard ticket", type: "accent" }, { label: "Group (3+)", price: 680, desc: "Per person", type: "blue" } ] },
};

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const event = MOCK[id];

  const [selectedTier, setSelectedTier] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [booked, setBooked] = useState(false);

  if (!event) return (
    <div className="page"><div className="container" style={{ paddingTop: 120, textAlign: "center" }}>
      <h2>Event not found</h2>
      <Link to="/events" className="btn btn-ghost" style={{ marginTop: 20 }}>← Back to events</Link>
    </div></div>
  );

  const tier = event.tiers[selectedTier];
  const total = tier.price * quantity;
  const pct = Math.round((event.booked / event.capacity) * 100);

  function handleBook() {
    if (!user) { navigate("/login"); return; }
    setBooked(true);
  }

  return (
    <div className="page">
      <div className="ed-hero">
        <div className="container">
          <Link to="/events" className="back-link">← Back to events</Link>
          <div className="ed-hero-content">
            <div className="ed-badges">
              <span className="badge badge-blue">{event.category}</span>
              <span className="badge badge-muted">By {event.organizer}</span>
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
          <div className="ed-left">
            <div className="ed-section">
              <h3>About this event</h3>
              {event.description.split("\n\n").map((p, i) => (
                <p key={i} className="ed-desc-para">{p}</p>
              ))}
            </div>
            <div className="ed-section">
              <h3>Capacity</h3>
              <div className="capacity-bar-wrap">
                <div className="capacity-bar"><div className="capacity-fill" style={{ width: `${pct}%` }} /></div>
                <span className="capacity-label">{event.booked} / {event.capacity} booked ({pct}%)</span>
              </div>
            </div>
            <div className="ed-section">
              <h3>Pricing tiers</h3>
              <div className="tiers-list">
                {event.tiers.map((t, i) => (
                  <div key={i} className={`tier-row ${selectedTier === i ? "active" : ""}`} onClick={() => setSelectedTier(i)}>
                    <div className="tier-radio">{selectedTier === i ? "●" : "○"}</div>
                    <div className="tier-info">
                      <span className={`tier-label text-${t.type}`}>{t.label}</span>
                      <span className="tier-desc">{t.desc}</span>
                    </div>
                    <span className="tier-price">₹{t.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
                  <span className="bp-price">₹{tier.price.toLocaleString()}</span>
                  <span className="bp-tier-tag">{tier.label}</span>
                </div>
                <hr className="divider" />
                <div className="field">
                  <label>Tier</label>
                  <select className="input" value={selectedTier} onChange={e => setSelectedTier(Number(e.target.value))}>
                    {event.tiers.map((t, i) => <option key={i} value={i}>{t.label} — ₹{t.price}</option>)}
                  </select>
                </div>
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
                    🎉 Group discount applies! Switch to "Group" tier for savings.
                  </div>
                )}
                <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={handleBook}>
                  {user ? "Book now" : "Sign in to book"}
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