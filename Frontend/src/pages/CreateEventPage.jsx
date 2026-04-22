import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { pricingAPI } from "../api/index.js";

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", date: "", time: "", venue: "", category: "Tech", capacity: "", type: "offline" });
  const [pricing, setPricing] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function getSuggestion() {
    setLoadingAI(true);
    try {
      // Mock AI suggestion until backend is ready
      await new Promise(r => setTimeout(r, 1000));
      const base = { Tech: 1200, Music: 800, Business: 1500, Art: 400, Workshop: 600 }[form.category] || 1000;
      setPricing({ base, earlyBird: Math.round(base * 0.8), group: Math.round(base * 0.85) });
    } finally { setLoadingAI(false); }
  }

  return (
    <div className="page">
      <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "calc(var(--nav-h) + 32px) 0 32px" }}>
        <div className="container">
          <h1 style={{ fontSize: 36 }}>Create event</h1>
          <p style={{ color: "var(--muted)", marginTop: 8 }}>Fill in the details and get AI pricing suggestions</p>
        </div>
      </div>
      <div className="section-sm">
        <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 40, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="field"><label>Event title</label><input className="input" placeholder="e.g. Design Systems Summit" value={form.title} onChange={set("title")} /></div>
            <div className="field"><label>Description</label><textarea className="input" rows={4} placeholder="What's this event about?" value={form.description} onChange={set("description")} style={{ resize: "vertical" }} /></div>
            <div className="grid-2">
              <div className="field"><label>Date</label><input className="input" type="date" value={form.date} onChange={set("date")} /></div>
              <div className="field"><label>Time</label><input className="input" type="time" value={form.time} onChange={set("time")} /></div>
            </div>
            <div className="grid-2">
              <div className="field"><label>Category</label>
                <select className="input" value={form.category} onChange={set("category")}>
                  {["Tech","Music","Business","Art","Workshop"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field"><label>Type</label>
                <select className="input" value={form.type} onChange={set("type")}>
                  <option value="offline">In-person</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="field"><label>Venue</label><input className="input" placeholder="Location or Zoom link" value={form.venue} onChange={set("venue")} /></div>
              <div className="field"><label>Capacity</label><input className="input" type="number" placeholder="e.g. 100" value={form.capacity} onChange={set("capacity")} /></div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>Publish event</button>
              <button className="btn btn-ghost" onClick={() => navigate("/dashboard")}>Cancel</button>
            </div>
          </div>

          {/* AI Pricing Panel */}
          <div className="card" style={{ padding: 24, position: "sticky", top: "calc(var(--nav-h) + 20px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--teal)", display: "inline-block" }} />
              <span style={{ fontSize: 13, color: "var(--muted)" }}>AI Pricing Engine</span>
            </div>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Get a price suggestion</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Fill in category and capacity, then click below.</p>
            <button className="btn btn-teal btn-full" onClick={getSuggestion} disabled={loadingAI || !form.category}>
              {loadingAI ? "Analyzing…" : "✦ Suggest pricing"}
            </button>
            {pricing && (
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: "Base price", val: pricing.base, color: "var(--accent)" },
                  { label: "Early-bird (14+ days)", val: pricing.earlyBird, color: "var(--teal)" },
                  { label: "Group (3+ tickets)", val: pricing.group, color: "var(--blue)" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>{r.label}</span>
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, color: r.color }}>₹{r.val.toLocaleString()}</span>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>Based on: {form.category} · {form.capacity || "?"} capacity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}