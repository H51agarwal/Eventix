import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPages.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    role: params.get("role") || "attendee",
    phone: "", notifyPreference: "email",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role, form.phone, form.notifyPreference);
      navigate(user.role === "attendee" ? "/events" : "/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
      setStep(1);
    } finally { setLoading(false); }
  }

  return (
    <div className="page auth-page">
      <div className="auth-card card">
        <div className="auth-logo">⬡ Eventix</div>
        <div className="step-indicator">
          <span className={"step-dot" + (step >= 1 ? " active" : "")} />
          <span className="step-line" />
          <span className={"step-dot" + (step >= 2 ? " active" : "")} />
        </div>

        {step === 1 && (
          <>
            <h2 className="auth-title">Create account</h2>
            <p className="auth-sub">Join as an attendee or organizer</p>
            {error && <div className="msg-error">{error}</div>}
            <div className="auth-form">
              <div className="field">
                <label>Full name</label>
                <input className="input" placeholder="Anya Sharma" value={form.name} onChange={set("name")} required />
              </div>
              <div className="field">
                <label>Email</label>
                <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
              </div>
              <div className="field">
                <label>Password</label>
                <input className="input" type="password" placeholder="Min 8 characters" value={form.password} onChange={set("password")} required minLength={8} />
              </div>
              <div className="field">
                <label>I am a…</label>
                <div className="role-picker">
                  {[
                    { value: "attendee", label: "Attendee", desc: "Browse & book events", color: "blue" },
                    { value: "organizer", label: "Organizer", desc: "Create & manage events", color: "teal" },
                  ].map(r => (
                    <label key={r.value} className={"role-option " + (form.role === r.value ? "active-" + r.color : "")}>
                      <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={set("role")} />
                      <div className="role-option-inner">
                        <span className="role-name">{r.label}</span>
                        <span className="role-desc">{r.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={() => {
                  if (!form.name || !form.email || !form.password) { setError("Please fill all fields"); return; }
                  setError(""); setStep(2);
                }}
              >
                Next →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="auth-title">Notification preferences</h2>
            <p className="auth-sub">How should we notify you about event updates?</p>
            {error && <div className="msg-error">{error}</div>}
            <div className="auth-form">
              <div className="field">
                <label>Notify me via</label>
                <div className="notify-picker">
                  {[
                    { value: "email", label: "📧 Email", desc: "Get updates in your inbox" },
                    { value: "sms", label: "📱 SMS", desc: "Get text messages" },
                    { value: "whatsapp", label: "💬 WhatsApp", desc: "Get WhatsApp messages" },
                  ].map(n => (
                    <label key={n.value} className={"notify-option " + (form.notifyPreference === n.value ? "active" : "")}>
                      <input type="radio" name="notify" value={n.value} checked={form.notifyPreference === n.value} onChange={set("notifyPreference")} />
                      <div className="notify-option-inner">
                        <span className="notify-label">{n.label}</span>
                        <span className="notify-desc">{n.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {(form.notifyPreference === "sms" || form.notifyPreference === "whatsapp") && (
                <div className="field">
                  <label>Phone number</label>
                  <input
                    className="input"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={set("phone")}
                  />
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={loading}>
                  {loading ? "Creating account…" : "Get started"}
                </button>
              </div>
            </div>
          </>
        )}

        <p className="auth-footer">Have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}