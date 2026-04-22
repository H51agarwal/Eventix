import { Link } from "react-router-dom";
import "./HomePage.css";

const MOCK_FEATURED = [
  { id: 1, title: "Design Systems Summit", category: "Tech", date: "May 12, 2025", venue: "Online", price: 1200, spotsLeft: 48, total: 200 },
  { id: 2, title: "Mumbai Jazz Collective", category: "Music", date: "May 18, 2025", venue: "NCPA, Mumbai", price: 800, spotsLeft: 12, total: 150 },
  { id: 3, title: "Startup Pitch Night", category: "Business", date: "Jun 3, 2025", venue: "91springboard, Delhi", price: 500, spotsLeft: 63, total: 80 },
  { id: 4, title: "AI & Society Conference", category: "Tech", date: "Jun 14, 2025", venue: "Bengaluru", price: 2000, spotsLeft: 200, total: 500 },
];

const CATEGORY_COLORS = {
  Tech: "badge-blue", Music: "badge-accent", Business: "badge-teal",
  Art: "badge-muted", Workshop: "badge-success",
};

export default function HomePage() {
  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-blob blob-1" />
          <div className="hero-blob blob-2" />
          <div className="hero-grid" />
        </div>
        <div className="container hero-content">
          <div className="hero-eyebrow">
            <span className="badge badge-accent">AI-Powered Pricing</span>
          </div>
          <h1 className="hero-title">
            Events that <br />
            <span className="hero-accent">price themselves.</span>
          </h1>
          <p className="hero-sub">
            Create, manage, and book events with smart AI pricing suggestions.
            Set better prices, fill more seats.
          </p>
          <div className="hero-actions">
            <Link to="/events" className="btn btn-primary">Browse events</Link>
            <Link to="/register?role=organizer" className="btn btn-ghost">Host an event →</Link>
          </div>
          <div className="hero-stats">
            <div className="stat"><span className="stat-num">2.4k</span><span className="stat-label">Events created</span></div>
            <div className="stat-divider" />
            <div className="stat"><span className="stat-num">18k</span><span className="stat-label">Tickets booked</span></div>
            <div className="stat-divider" />
            <div className="stat"><span className="stat-num">₹9.2L</span><span className="stat-label">Revenue generated</span></div>
          </div>
        </div>
      </section>

      {/* Featured events */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Upcoming events</h2>
            <Link to="/events" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <div className="grid-4">
            {MOCK_FEATURED.map(e => (
              <Link to={`/events/${e.id}`} key={e.id} className="card event-card-home">
                <div className="event-card-top">
                  <span className={`badge ${CATEGORY_COLORS[e.category] || "badge-muted"}`}>{e.category}</span>
                  <span className="event-date-tag">{e.date}</span>
                </div>
                <div className="event-card-body">
                  <h3 className="event-card-title">{e.title}</h3>
                  <p className="event-venue">📍 {e.venue}</p>
                </div>
                <div className="event-card-footer">
                  <span className="event-price">₹{e.price.toLocaleString()}</span>
                  <span className={`spots ${e.spotsLeft < 20 ? "spots-low" : ""}`}>
                    {e.spotsLeft} left
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI pricing callout */}
      <section className="section ai-callout-section">
        <div className="container">
          <div className="ai-callout">
            <div className="ai-callout-left">
              <span className="badge badge-teal" style={{ marginBottom: 16 }}>AI Pricing Engine</span>
              <h2>Stop guessing your ticket price.</h2>
              <p>
                Our AI analyzes event type, duration, capacity, and audience
                to suggest a base price, early-bird discount, and group rate.
                You stay in control — the AI just does the math.
              </p>
              <Link to="/register?role=organizer" className="btn btn-teal" style={{ marginTop: 24 }}>
                Try it as an organizer
              </Link>
            </div>
            <div className="ai-callout-right">
              <div className="ai-preview">
                <div className="ai-preview-header">
                  <span className="ai-dot" /><span style={{ color: "var(--muted)", fontSize: 13 }}>AI Pricing Suggestion</span>
                </div>
                <div className="ai-row"><span className="ai-label">Base price</span><span className="ai-val accent">₹ 1,200</span></div>
                <div className="ai-row"><span className="ai-label">Early-bird (14+ days)</span><span className="ai-val teal">₹ 960</span></div>
                <div className="ai-row"><span className="ai-label">Group (3+ tickets)</span><span className="ai-val blue">₹ 1,020 / person</span></div>
                <div className="ai-reasoning">
                  Based on: Tech workshop · 4hrs · 120 capacity · Professional audience
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}