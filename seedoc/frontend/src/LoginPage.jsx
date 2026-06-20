import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState(null); // null | "patient" | "doctor"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role: mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
      } else {
        onLogin(data.role, data.patient ?? null);
      }
    } catch {
      setError("Cannot reach server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  if (!mode) {
    return (
      <div className="login-landing">
        <div className="login-brand">
          <div className="login-logo-icon">S</div>
          <h1 className="login-logo-text">SeeDoc</h1>
          <p className="login-tagline">AI-Powered Patient Triage &amp; Appointment Booking</p>
        </div>
        <p className="login-choose">Who are you signing in as?</p>
        <div className="login-role-cards">
          <button className="role-card" onClick={() => setMode("patient")}>
            <span className="role-icon">🧑‍⚕️</span>
            <span className="role-title">Patient</span>
            <span className="role-desc">Describe your symptoms and get an AI-assisted triage assessment</span>
          </button>
          <button className="role-card" onClick={() => setMode("doctor")}>
            <span className="role-icon">👨‍⚕️</span>
            <span className="role-title">Physician</span>
            <span className="role-desc">View clinical briefings, diagnostic drift, and care gap summaries</span>
          </button>
        </div>
      </div>
    );
  }

  const isPatient = mode === "patient";

  return (
    <div className="login-landing">
      <div className="login-brand">
        <div className="login-logo-icon">S</div>
        <h1 className="login-logo-text">SeeDoc</h1>
      </div>

      <div className="login-form-card">
        <div className={`login-role-badge ${isPatient ? "badge-patient" : "badge-doctor"}`}>
          {isPatient ? "🧑‍⚕️ Patient Login" : "👨‍⚕️ Physician Login"}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder={isPatient ? "e.g. margaret" : "doctor"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          {isPatient && (
            <div className="login-hint">
              Demo accounts: <code>margaret</code>, <code>james</code>, or <code>eleanor</code> — password <code>patient123</code>
            </div>
          )}
          {!isPatient && (
            <div className="login-hint">
              Demo credentials: <code>doctor / doctor123</code>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading || !username || !password}
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        <button
          className="login-back"
          onClick={() => { setMode(null); setError(""); setUsername(""); setPassword(""); }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
