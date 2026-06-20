import { useState } from "react";

const QUICK_FILLS = [
  "Fatigue and cough",
  "Knee pain getting worse",
  "Shortness of breath",
  "Headache and dizziness",
];

export default function IntakeForm({ patient, onSubmit }) {
  const [chiefComplaint, setChiefComplaint] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!chiefComplaint.trim()) return;
    onSubmit({ chiefComplaint: chiefComplaint.trim() });
  }

  return (
    <div className="card">
      <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--gray-50)", borderRadius: "8px", border: "1px solid var(--gray-200)" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--gray-500)", marginBottom: "0.35rem" }}>Logged in as</p>
        <p style={{ fontWeight: 700, color: "var(--navy)", fontSize: "1rem" }}>{patient?.name}</p>
        <p style={{ fontSize: "0.82rem", color: "var(--gray-500)" }}>
          {patient?.age}{patient?.sex} · {patient?.conditions?.join(", ")}
        </p>
      </div>

      <h2 className="card-title">Tell us why you're coming in</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="complaint">Chief complaint</label>
          <textarea
            id="complaint"
            placeholder="Describe your main concern in your own words…"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
          />
          <div className="quick-fills">
            {QUICK_FILLS.map((q) => (
              <button
                key={q}
                type="button"
                className="quick-fill-btn"
                onClick={() => setChiefComplaint(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!chiefComplaint.trim()}
        >
          Continue →
        </button>
      </form>
    </div>
  );
}
