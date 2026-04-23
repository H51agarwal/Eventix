import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { eventsAPI, realEventsAPI } from "../api/index.js";
import "./EventsPage.css";

const CATEGORIES = ["All", "Tech", "Music", "Business", "Art", "Workshop"];
const CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Goa"];
const CATEGORY_COLORS = {
  Tech: "badge-blue", Music: "badge-accent", Business: "badge-teal",
  Art: "badge-muted", Workshop: "badge-success", General: "badge-muted",
};

function fmtDate(d) {
  if (!d) return "";
  const parsed = new Date(d);
  if (isNaN(parsed)) return d;
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function EventsPage() {
  const [myEvents, setMyEvents] = useState([]);
  const [realEvents, setRealEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realLoading, setRealLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("Mumbai");
  const [tab, setTab] = useState("real");

  useEffect(() => {
    async function fetchMyEvents() {
      try {
        const data = await eventsAPI.getAll();
        setMyEvents(data);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyEvents();
  }, []);

  useEffect(() => {
    async function fetchRealEvents() {
      setRealLoading(true);
      try {
        const data = await realEventsAPI.getByCity(city, category);
        setRealEvents(data);
      } catch (err) {
        console.error("Failed to fetch real events:", err);
      } finally {
        setRealLoading(false);
      }
    }
    if (tab === "real") fetchRealEvents();
  }, [city, category, tab]);

  const filteredMyEvents = myEvents.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.venue.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || e.category === category;
    return matchSearch && matchCat;
  });

  const filteredRealEvents = realEvents.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="events-header">
        <div className="container">
          <h1 className="events-page-title">Browse events</h1>
          <div className="events-tabs">
            <button className={"events-tab" + (tab === "real" ? " active" : "")} onClick={() => setTab("real")}>
              🌍 Real events
            </button>
            <button className={"events-tab" + (tab === "mine" ? " active" : "")} onClick={() => setTab("mine")}>
              ⬡ Eventix events
            </button>
          </div>
          <div className="events-filters">
            <input className="input search-input" placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} />
            {tab === "real" && (
              <select className="input" style={{ maxWidth: 160 }} value={city} onChange={e => setCity(e.target.value)}>
                {CITIES.map(c => (
                  <option key={c} value={c}>📍 {c}</option>
                ))}
              </select>
            )}
            <div className="cat-pills">
              {CATEGORIES.map(c => (
                <button key={c} className={"cat-pill" + (category === c ? " active" : "")} onClick={() => setCategory(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="section-sm">
        <div className="container">
          {tab === "real" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <p style={{ color: "var(--muted)", fontSize: 14 }}>
                  {realLoading ? "Fetching live events…" : filteredRealEvents.length + " events in " + city}
                </p>
                <span className="badge badge-teal">Live from Google Events</span>
              </div>
              {realLoading ? (
                <div className="no-results"><p>Fetching real events from Google…</p></div>
              ) : filteredRealEvents.length === 0 ? (
                <div className="no-results"><p>No events found in {city}. Try another city!</p></div>
              ) : (
                <div className="events-grid">
                  {filteredRealEvents.map(e => (
                    <div key={e.id} className="card event-card-full" style={{ cursor: "pointer" }} onClick={() => window.open(e.link ? e.link : "#", "_blank")}>
                      {e.thumbnail && (
                        <img src={e.thumbnail} alt={e.title} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                      )}
                      <div className="ecf-top">
                        <span className={"badge " + (CATEGORY_COLORS[e.category] || "badge-muted")}>{e.category}</span>
                        <span className="badge badge-muted">📍 {e.city}</span>
                      </div>
                      <div className="ecf-body">
                        <h3 className="ecf-title">{e.title}</h3>
                        <p className="ecf-desc">{e.description ? e.description.slice(0, 100) : ""}...</p>
                      </div>
                      <div className="ecf-meta">
                        <div className="ecf-row"><span className="meta-icon">📅</span><span>{e.time ? e.time : fmtDate(e.date)}</span></div>
                        <div className="ecf-row"><span className="meta-icon">📍</span><span>{e.venue}</span></div>
                      </div>
                      <div className="ecf-footer">
                        <span className="ecf-price">{e.price ? e.price : "See details"}</span>
                        <span className="btn btn-primary btn-sm">View →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "mine" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: "var(--muted)", fontSize: 14 }}>
                  {loading ? "Loading…" : filteredMyEvents.length + " events on Eventix"}
                </p>
              </div>
              {loading ? (
                <div className="no-results"><p>Loading events…</p></div>
              ) : filteredMyEvents.length === 0 ? (
                <div className="no-results"><p>No Eventix events yet.</p></div>
              ) : (
                <div className="events-grid">
                  {filteredMyEvents.map(e => {
                    const minPrice = e.pricingTiers && e.pricingTiers.length ? Math.min(...e.pricingTiers.map(t => t.price)) : 0;
                    const spotsLeft = e.capacity - (e._count ? e._count.bookings : 0);
                    return (
                      <Link to={"/events/" + e.id} key={e.id} className="card event-card-full">
                        <div className="ecf-top">
                          <span className={"badge " + (CATEGORY_COLORS[e.category] || "badge-muted")}>{e.category}</span>
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
                          <span className="ecf-price">{minPrice === 0 ? "Free" : "₹" + minPrice.toLocaleString()}</span>
                          <span className="btn btn-primary btn-sm">Book now</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}