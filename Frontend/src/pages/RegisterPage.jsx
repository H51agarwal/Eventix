import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPages.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    role: params.get("role") || "attendee",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      navigate(user.role === "attendee" ? "/events" : "/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="page auth-page">
      <div className="auth-card card">
        <div className="auth-logo">⬡ Eventix</div>
        <h2 className="auth-title">Create account</h2>
        <p className="auth-sub">Join as an attendee or organizer</p>
        {error && <div className="msg-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
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
                <label key={r.value} className={`role-option ${form.role === r.value ? "active-" + r.color : ""}`}>
                  <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={set("role")} />
                  <div className="role-option-inner">
                    <span className="role-name">{r.label}</span>
                    <span className="role-desc">{r.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Get started"}
          </button>
        </form>
        <p className="auth-footer">Have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}