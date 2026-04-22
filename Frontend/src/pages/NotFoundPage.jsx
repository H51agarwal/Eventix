import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 80, fontFamily: "var(--font-head)", fontWeight: 800, color: "var(--border)" }}>404</div>
        <h2 style={{ marginBottom: 12 }}>Page not found</h2>
        <p style={{ color: "var(--muted)", marginBottom: 24 }}>The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary">Go home</Link>
      </div>
    </div>
  );
}