import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

const RISK = {
  critical: { label: "Critical", cls: "risk-critical", icon: "🔴" },
  high: { label: "High", cls: "risk-high", icon: "🟠" },
  moderate: { label: "Moderate", cls: "risk-moderate", icon: "🟡" },
  low: { label: "Low", cls: "risk-low", icon: "🟢" },
};

export default function PriorityInbox() {
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function runScan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/population-scan`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setScan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { runScan(); }, []);

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <p className="card-title" style={{ marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🧠</span> AI Priority Inbox
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>
              {loading ? "Scanning every patient record for risk signals…" : scan?.summary ?? "Proactive scan of your entire panel."}
            </p>
          </div>
          <button className="btn btn-outline" style={{ fontSize: "0.83rem", padding: "0.45rem 1rem" }} onClick={runScan} disabled={loading}>
            {loading ? "Scanning…" : "↻ Re-run scan"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card loading-state">
          <div className="spinner" />
          <p>Claude is reading all patient histories…</p>
          <p style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "var(--gray-300)" }}>
            Detecting trends, drift, overdue screenings &amp; hereditary risk
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="card" style={{ textAlign: "center", color: "var(--red)" }}>
          <p style={{ fontWeight: 600 }}>Scan failed</p>
          <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: "0.25rem" }}>{error}</p>
        </div>
      )}

      {!loading && scan?.alerts && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {scan.alerts.map((a, i) => {
            const r = RISK[a.riskLevel] ?? RISK.moderate;
            return (
              <div key={i} className={`inbox-card ${r.cls} fade-up`} style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="inbox-rail" />
                <div style={{ flex: 1 }}>
                  <div className="inbox-head">
                    <span className="inbox-rank">{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div className="inbox-patient">{a.patientName}</div>
                      <div className="inbox-headline">{a.headline}</div>
                    </div>
                    <span className={`risk-badge ${r.cls}`}>{r.icon} {r.label}</span>
                  </div>

                  {a.evidence?.length > 0 && (
                    <div className="inbox-evidence">
                      {a.evidence.map((e, j) => <span key={j} className="evidence-chip">{e}</span>)}
                    </div>
                  )}

                  <p className="inbox-reasoning">{a.reasoning}</p>

                  {a.recommendedAction && (
                    <div className="inbox-action">
                      <span className="inbox-action-label">Recommended action</span>
                      {a.recommendedAction}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
