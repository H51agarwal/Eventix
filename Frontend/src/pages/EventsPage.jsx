import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { eventsAPI } from "../api/index.js";
import "./EventsPage.css";

const CATEGORIES = ["All", "Tech", "Music", "Business", "Art", "Workshop"];
const PRICE_FILTERS = [
  { label: "Any price", value: "" },
  { label: "Free", value: "free" },
  { label: "Under ₹500", value: "500" },
  { label: "Under ₹2000", value: "2000" },
];
const CATEGORY_COLORS = {
  Tech: "badge-blue", Music: "badge-accent", Business: "badge-teal",
  Art: "badge-muted", Workshop: "badge-success",
};

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("");

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await eventsAPI.getAll();
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const filtered = events.filter(e => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || e.category === category;
    const minPrice = e.pricingTiers?.length
      ? Math.min(...e.pricingTiers.map(t => t.price))
      : 0;
    const matchPrice =
      !priceFilter ? true :
      priceFilter === "free" ? minPrice === 0 :
      minPrice < Number(priceFilter);
    return matchSearch && matchCat && matchPrice;
  });

  return (
    <div className="page">
      <div className="events-header">
        <div className="container">
          <h1 className="events-page-title">Browse events</h1>
          <p style={{ color: "var(--muted)", marginTop: 8 }}>
            {loading ? "Loading…" : `${filtered.length} events found`}
          </p>
          <div className="events-filters">
            <input
              className="input search-input"
              placeholder="Search by title, venue…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="cat-pills">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`cat-pill${category === c ? " active" : ""}`}
                  onClick={() => setCategory(c)}
                >{c}</button>
              ))}
            </div>
            <select
              className="input price-select"
              value={priceFilter}
              onChange={e => setPriceFilter(e.target.value)}
            >
              {PRICE_FILTERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="section-sm">
        <div className="container">
          {loading ? (
            <div className="no-results"><p>Loading events…</p></div>
          ) : filtered.length === 0 ? (
            <div className="no-results">
              <p>No events found. Be the first to create one!</p>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setSearch(""); setCategory("All"); setPriceFilter(""); }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="events-grid">
              {filtered.map(e => {
                const minPrice = e.pricingTiers?.length
                  ? Math.min(...e.pricingTiers.map(t => t.price))
                  : 0;
                const totalBooked = e._count?.bookings || 0;
                const spotsLeft = e.capacity - totalBooked;
                return (
                  <Link to={`/events/${e.id}`} key={e.id} className="card event-card-full">
                    <div className="ecf-top">
                      <span className={`badge ${CATEGORY_COLORS[e.category] || "badge-muted"}`}>
                        {e.category}
                      </span>
                      {spotsLeft < 20 && <span className="badge badge-accent">Almost full</span>}
                    </div>
                    <div className="ecf-body">
                      <h3 className="ecf-title">{e.title}</h3>
                      <p className="ecf-desc">{e.description}</p>
                    </div>
                    <div className="ecf-meta">
                      <div className="ecf-row"><span className="meta-icon">📅</span><span>{fmtDate(e.date)}</span></div>
                      <div className="ecf-row"><span className="meta-icon">📍</span><span>{e.venue}</span></div>
                      <div className="ecf-row"><span className="meta-icon">👥</span><span>{spotsLeft}/{e.capacity} spots left</span></div>
                    </div>
                    <div className="ecf-footer">
                      <span className="ecf-price">
                        {minPrice === 0 ? "Free" : `₹${minPrice.toLocaleString()}`}
                      </span>
                      <span className="btn btn-primary btn-sm">Book now</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}