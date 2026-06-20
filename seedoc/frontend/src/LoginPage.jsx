import { useState } from "react";
import Logo from "./Logo";

const API = import.meta.env.VITE_API_URL;

function Hero() {
  return (
    <div className="auth-hero">
      <div className="hero-shape s1" />
      <div className="hero-shape s2" />
      <div className="hero-shape s3" />
      <div className="hero-content">
        <Logo size={42} showText={false} markColor="#ffffff" plusColor="#15433a" />
        <h1>Care that sees the <span className="accent">whole</span> you.</h1>
        <p className="hero-sub">
          SeeDoc reads your full history, asks the right questions, and routes you to the
          right level of care — in minutes, not days.
        </p>
        <div className="hero-feature">
          <span className="hero-feature-icon">✓</span>
          <span className="hero-feature-text"><strong>AI-guided triage</strong>Smart follow-ups tailored to your record</span>
        </div>
        <div className="hero-feature">
          <span className="hero-feature-icon">✓</span>
          <span className="hero-feature-text"><strong>History-aware insights</strong>Considers your medical &amp; family history</span>
        </div>
        <div className="hero-feature">
          <span className="hero-feature-icon">✓</span>
          <span className="hero-feature-text"><strong>Book only when needed</strong>Self-care guidance for the rest</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState(null);
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
      if (!res.ok) setError(data.error || "Invalid credentials.");
      else onLogin(data.role, data.patient ?? null);
    } catch {
      setError("Cannot reach server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  const isPatient = mode === "patient";

  return (
    <div className="auth">
      <Hero />
      <div className="auth-panel">
        <div className="auth-panel-inner fade-up">
          {!mode ? (
            <>
              <p className="auth-eyebrow">Welcome to SeeDoc</p>
              <h2 className="auth-title">Sign in to continue</h2>
              <p className="auth-desc">Choose how you'd like to sign in.</p>
              <div className="role-pick">
                <button className="role-pick-card" onClick={() => setMode("patient")}>
                  <span className="role-pick-icon">🧑</span>
                  <span>
                    <span className="role-pick-title">I'm a Patient</span>
                    <span className="role-pick-desc">Describe symptoms &amp; get an assessment</span>
                  </span>
                  <span className="role-pick-arrow">→</span>
                </button>
                <button className="role-pick-card" onClick={() => setMode("doctor")}>
                  <span className="role-pick-icon">🩺</span>
                  <span>
                    <span className="role-pick-title">I'm a Physician</span>
                    <span className="role-pick-desc">Review briefings, requests &amp; trends</span>
                  </span>
                  <span className="role-pick-arrow">→</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="auth-eyebrow">{isPatient ? "Patient portal" : "Physician portal"}</p>
              <h2 className="auth-title">Sign in</h2>
              <p className="auth-desc">Enter your credentials to access your {isPatient ? "care assistant" : "dashboard"}.</p>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input id="username" type="text" placeholder={isPatient ? "e.g. margaret" : "doctor"}
                    value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input id="password" type="password" placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                </div>
                {error && <p className="login-error">{error}</p>}
                <div className="login-hint">
                  {isPatient
                    ? <>Demo: <code>margaret</code>, <code>james</code>, or <code>eleanor</code> · <code>patient123</code></>
                    : <>Demo: <code>doctor</code> / <code>doctor123</code></>}
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }}
                  disabled={loading || !username || !password}>
                  {loading ? "Signing in…" : "Sign In →"}
                </button>
              </form>
              <button className="login-back" onClick={() => { setMode(null); setError(""); setUsername(""); setPassword(""); }}>
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
