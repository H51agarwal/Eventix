import { useState } from "react";
import { Link } from "react-router-dom";
import "./EventsPage.css";

const MOCK_EVENTS = [
  { id: 1, title: "Design Systems Summit", category: "Tech", date: "2025-05-12", venue: "Online", price: 1200, spotsLeft: 48, total: 200, description: "A deep dive into building scalable design systems for modern products." },
  { id: 2, title: "Mumbai Jazz Collective", category: "Music", date: "2025-05-18", venue: "NCPA, Mumbai", price: 800, spotsLeft: 12, total: 150, description: "An evening of improvisational jazz featuring the city's finest musicians." },
  { id: 3, title: "Startup Pitch Night", category: "Business", date: "2025-06-03", venue: "91springboard, Delhi", price: 500, spotsLeft: 63, total: 80, description: "Watch 10 promising startups pitch to a panel of seasoned investors." },
  { id: 4, title: "AI & Society Conference", category: "Tech", date: "2025-06-14", venue: "Bengaluru", price: 2000, spotsLeft: 200, total: 500, description: "Exploring the intersection of artificial intelligence and its societal impact." },
  { id: 5, title: "Watercolor Workshop", category: "Art", date: "2025-06-22", venue: "Online", price: 350, spotsLeft: 20, total: 30, description: "A beginner-friendly 3-hour session on watercolor fundamentals." },
  { id: 6, title: "Product Leadership Summit", category: "Business", date: "2025-07-05", venue: "Hyderabad", price: 3000, spotsLeft: 75, total: 250, description: "Two days of talks, workshops, and networking for senior PMs." },
  { id: 7, title: "Indie Game Dev Jam", category: "Tech", date: "2025-07-19", venue: "Pune", price: 0, spotsLeft: 100, total: 100, description: "48-hour game development hackathon. Theme revealed at the start." },
  { id: 8, title: "Photography Walk: Dharavi", category: "Art", date: "2025-07-26", venue: "Mumbai", price: 600, spotsLeft: 8, total: 20, description: "A guided 4-hour photography walk through the streets of Dharavi." },
];

const CATEGORIES = ["All", "Tech", "Music", "Business", "Art", "Workshop"];
const PRICE_FILTERS = [
  { label: "Any price", value: "" },
  { label: "Free", value: "free" },
  { label: "Under ₹500", value: "500" },
  { label: "Under ₹2000", value: "2000" },
];
const CATEGORY_COLORS = { Tech: "badge-blue", Music: "badge-accent", Business: "badge-teal", Art: "badge-muted", Workshop: "badge-success" };

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("");

  const filtered = MOCK_EVENTS.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.venue.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || e.category === category;
    const matchPrice =
      !priceFilter ? true :
      priceFilter === "free" ? e.price === 0 :
      e.price < Number(priceFilter);
    return matchSearch && matchCat && matchPrice;
  });

  return (
    <div className="page">
      <div className="events-header">
        <div className="container">
          <h1 className="events-page-title">Browse events</h1>
          <p style={{ color: "var(--muted)", marginTop: 8 }}>{filtered.length} events found</p>
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
            <select className="input price-select" value={priceFilter} onChange={e => setPriceFilter(e.target.value)}>
              {PRICE_FILTERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="section-sm">
        <div className="container">
          {filtered.length === 0 ? (
            <div className="no-results">
              <p>No events match your filters.</p>
              <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); setCategory("All"); setPriceFilter(""); }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="events-grid">
              {filtered.map(e => (
                <Link to={`/events/${e.id}`} key={e.id} className="card event-card-full">
                  <div className="ecf-top">
                    <span className={`badge ${CATEGORY_COLORS[e.category] || "badge-muted"}`}>{e.category}</span>
                    {e.spotsLeft < 20 && <span className="badge badge-accent">Almost full</span>}
                  </div>
                  <div className="ecf-body">
                    <h3 className="ecf-title">{e.title}</h3>
                    <p className="ecf-desc">{e.description}</p>
                  </div>
                  <div className="ecf-meta">
                    <div className="ecf-row"><span className="meta-icon">📅</span><span>{fmtDate(e.date)}</span></div>
                    <div className="ecf-row"><span className="meta-icon">📍</span><span>{e.venue}</span></div>
                    <div className="ecf-row"><span className="meta-icon">👥</span>
                      <span>{e.spotsLeft}/{e.total} spots left</span>
                    </div>
                  </div>
                  <div className="ecf-footer">
                    <span className="ecf-price">{e.price === 0 ? "Free" : `₹${e.price.toLocaleString()}`}</span>
                    <span className="btn btn-primary btn-sm">Book now</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}