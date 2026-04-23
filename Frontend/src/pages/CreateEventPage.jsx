import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventsAPI, pricingAPI } from "../api/index.js";

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", date: "", time: "",
    venue: "", category: "Tech", capacity: "", type: "offline",
  });
  const [pricingTiers, setPricingTiers] = useState([
    { label: "Regular", price: "", desc: "Standard ticket" },
  ]);
  const [pricing, setPricing] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function getSuggestion() {
    setLoadingAI(true);
    try {
      const data = await pricingAPI.suggest({
        category: form.category,
        capacity: Number(form.capacity) || 100,
        duration: 4,
      });
      setPricing(data);
      // Auto-fill pricing tiers with suggestions
      setPricingTiers([
        { label: "Early Bird", price: data.earlyBird, desc: "Limited early access" },
        { label: "Regular", price: data.base, desc: "Standard ticket" },
        { label: "Group (3+)", price: data.group, desc: "Per person for groups" },
      ]);
    } catch (err) {
      console.error("Pricing error:", err);
    } finally { setLoadingAI(false); }
  }

  async function handleSubmit() {
    if (!form.title || !form.date || !form.venue || !form.capacity) {
      setError("Please fill in all required fields"); return;
    }
    setLoading(true); setError("");
    try {
      await eventsAPI.create({
        ...form,
        capacity: Number(form.capacity),
        pricingTiers: pricingTiers.map(t => ({
          ...t, price: Number(t.price)
        })),
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create event");
    } finally { setLoading(false); }
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
            {error && <div className="msg-error">{error}</div>}
            <div className="field">
              <label>Event title *</label>
              <input className="input" placeholder="e.g. Design Systems Summit" value={form.title} onChange={set("title")} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea className="input" rows={4} placeholder="What's this event about?" value={form.description} onChange={set("description")} style={{ resize: "vertical" }} />
            </div>
            <div className="grid-2">
              <div className="field"><label>Date *</label><input className="input" type="date" value={form.date} onChange={set("date")} /></div>
              <div className="field"><label>Time</label><input className="input" type="time" value={form.time} onChange={set("time")} /></div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Category</label>
                <select className="input" value={form.category} onChange={set("category")}>
                  {["Tech","Music","Business","Art","Workshop"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Type</label>
                <select className="input" value={form.type} onChange={set("type")}>
                  <option value="offline">In-person</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="field"><label>Venue *</label><input className="input" placeholder="Location or Zoom link" value={form.venue} onChange={set("venue")} /></div>
              <div className="field"><label>Capacity *</label><input className="input" type="number" placeholder="e.g. 100" value={form.capacity} onChange={set("capacity")} /></div>
            </div>

            {/* Pricing tiers */}
            <div className="field">
              <label>Pricing tiers</label>
              {pricingTiers.map((t, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginBottom: 8 }}>
                  <input className="input" placeholder="Label" value={t.label} onChange={e => { const updated = [...pricingTiers]; updated[i].label = e.target.value; setPricingTiers(updated); }} />
                  <input className="input" type="number" placeholder="Price ₹" value={t.price} onChange={e => { const updated = [...pricingTiers]; updated[i].price = e.target.value; setPricingTiers(updated); }} />
                  <input className="input" placeholder="Description" value={t.desc} onChange={e => { const updated = [...pricingTiers]; updated[i].desc = e.target.value; setPricingTiers(updated); }} />
                  <button className="btn btn-ghost btn-sm" onClick={() => setPricingTiers(pricingTiers.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => setPricingTiers([...pricingTiers, { label: "", price: "", desc: "" }])}>
                + Add tier
              </button>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Publishing…" : "Publish event"}
              </button>
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
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Fill in category and capacity first, then click below.</p>
            <button className="btn btn-teal btn-full" onClick={getSuggestion} disabled={loadingAI || !form.category}>
              {loadingAI ? "Analyzing…" : "✦ Suggest pricing"}
            </button>
            {pricing && (
              <div style={{ marginTop: 20 }}>
                {[
                  { label: "Base price", val: pricing.base, color: "var(--accent)" },
                  { label: "Early-bird", val: pricing.earlyBird, color: "var(--teal)" },
                  { label: "Group (3+)", val: pricing.group, color: "var(--blue)" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>{r.label}</span>
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, color: r.color }}>₹{r.val.toLocaleString()}</span>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>{pricing.reasoning}</p>
                <p style={{ fontSize: 12, color: "var(--teal)", marginTop: 8 }}>✓ Tiers auto-filled below</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}