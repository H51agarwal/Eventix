import "./EditEventsPage.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

const CATEGORIES = ["Tech", "Music", "Business", "Art", "Workshop", "Sports", "Food", "Other"];

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    category: "",
    capacity: "",
  });

  const [pricingTiers, setPricingTiers] = useState([]);

  // Load existing event data
  useEffect(() => {
    apiFetch(`/events/${id}`)
      .then((event) => {
        setForm({
          title: event.title || "",
          description: event.description || "",
          date: event.date ? event.date.slice(0, 10) : "",
          time: event.time || "",
          venue: event.venue || "",
          category: event.category || "",
          capacity: event.capacity || "",
        });
        setPricingTiers(event.pricingTiers || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTierChange = (index, field, value) => {
    setPricingTiers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const addTier = () => {
    setPricingTiers((prev) => [...prev, { name: "", price: "", description: "" }]);
  };

  const removeTier = (index) => {
    setPricingTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/events/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          capacity: Number(form.capacity),
          pricingTiers: pricingTiers.map((t) => ({
            name: t.name,
            price: Number(t.price),
            description: t.description || "",
          })),
        }),
      });
      setSuccess("Event updated successfully!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="eep-loading">Loading event…</div>;

  return (
    <div className="eep-root">
      <div className="eep-container">
        <div className="eep-header">
          <h1 className="eep-title">Edit Event</h1>
          <button className="eep-back" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </button>
        </div>

        {error && <div className="eep-error">⚠ {error}</div>}
        {success && <div className="eep-success">✓ {success}</div>}

        <form onSubmit={handleSubmit} className="eep-form">
          {/* Basic Details */}
          <div className="eep-section">
            <h2 className="eep-section-title">Basic Details</h2>
            <div className="eep-grid">
              <div className="eep-field eep-field--full">
                <label>Event Title</label>
                <input name="title" value={form.title} onChange={handleChange} required />
              </div>
              <div className="eep-field eep-field--full">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4} />
              </div>
              <div className="eep-field">
                <label>Date</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} required />
              </div>
              <div className="eep-field">
                <label>Time</label>
                <input type="time" name="time" value={form.time} onChange={handleChange} />
              </div>
              <div className="eep-field eep-field--full">
                <label>Venue</label>
                <input name="venue" value={form.venue} onChange={handleChange} required />
              </div>
              <div className="eep-field">
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="eep-field">
                <label>Capacity</label>
                <input type="number" name="capacity" value={form.capacity} onChange={handleChange} min={1} required />
              </div>
            </div>
          </div>

          {/* Pricing Tiers */}
          <div className="eep-section">
            <div className="eep-section-header">
              <h2 className="eep-section-title">Pricing Tiers</h2>
              <button type="button" className="eep-btn eep-btn--ghost" onClick={addTier}>
                + Add Tier
              </button>
            </div>
            {pricingTiers.length === 0 && (
              <p className="eep-empty">No pricing tiers. Click "Add Tier" to add one.</p>
            )}
            {pricingTiers.map((tier, index) => (
              <div className="eep-tier" key={index}>
                <div className="eep-tier-fields">
                  <div className="eep-field">
                    <label>Tier Name</label>
                    <input
                      value={tier.name}
                      onChange={(e) => handleTierChange(index, "name", e.target.value)}
                      placeholder="e.g. Early Bird"
                    />
                  </div>
                  <div className="eep-field">
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      value={tier.price}
                      onChange={(e) => handleTierChange(index, "price", e.target.value)}
                      placeholder="0"
                      min={0}
                    />
                  </div>
                  <div className="eep-field">
                    <label>Description</label>
                    <input
                      value={tier.description}
                      onChange={(e) => handleTierChange(index, "description", e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="eep-btn eep-btn--danger"
                  onClick={() => removeTier(index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="eep-actions">
            <button type="button" className="eep-btn eep-btn--ghost" onClick={() => navigate("/dashboard")}>
              Cancel
            </button>
            <button type="submit" className="eep-btn eep-btn--primary" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}