import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

const QUICK_FILLS = [
  "Fatigue and cough",
  "Knee pain getting worse",
  "Shortness of breath",
  "Headache and dizziness",
];

export default function IntakeForm({ patient, onSubmit, onPatientUpdate }) {
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [showFamilyHistory, setShowFamilyHistory] = useState(false);
  const [familyHistory, setFamilyHistory] = useState(patient?.family_history ?? "");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | "saved" | "error"

  async function handleSaveFamilyHistory() {
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch(`${API}/patients/${patient.id}/family-history`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family_history: familyHistory }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus("saved");
      onPatientUpdate({ ...patient, family_history: familyHistory });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!chiefComplaint.trim()) return;
    onSubmit({ chiefComplaint: chiefComplaint.trim() });
  }

  return (
    <div>
      {/* ── Patient profile card ── */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--gray-500)", marginBottom: "0.3rem" }}>Your Profile</p>
            <p style={{ fontWeight: 700, color: "var(--navy)", fontSize: "1.05rem" }}>{patient?.name}</p>
            <p style={{ fontSize: "0.83rem", color: "var(--gray-500)", marginTop: "0.15rem" }}>
              {patient?.age}{patient?.sex} &nbsp;·&nbsp; {Array.isArray(patient?.conditions) ? patient.conditions.join(", ") : patient?.conditions}
            </p>
          </div>
          <button
            type="button"
            className={`btn ${showFamilyHistory ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}
            onClick={() => setShowFamilyHistory(v => !v)}
          >
            {showFamilyHistory ? "▲ Close" : "✏️ Edit Family History"}
          </button>
        </div>

        {/* ── Editable family history ── */}
        {showFamilyHistory && (
          <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--gray-200)", paddingTop: "1.25rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--gray-500)", marginBottom: "0.5rem" }}>
              Family History
            </p>
            <p style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
              You can update this if a family member has received a new diagnosis or health development. This information is used by AI triage to flag hereditary risks.
            </p>
            <textarea
              rows={8}
              value={familyHistory}
              onChange={(e) => { setFamilyHistory(e.target.value); setSaveStatus(null); }}
              placeholder="e.g. Mother recently diagnosed with Type 2 diabetes at age 65…"
              style={{ fontFamily: "inherit", fontSize: "0.85rem", lineHeight: 1.65 }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: "0.85rem", padding: "0.5rem 1.1rem" }}
                onClick={handleSaveFamilyHistory}
                disabled={saving || familyHistory === patient?.family_history}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              {saveStatus === "saved" && (
                <span style={{ fontSize: "0.82rem", color: "var(--green)", fontWeight: 600 }}>✓ Saved</span>
              )}
              {saveStatus === "error" && (
                <span style={{ fontSize: "0.82rem", color: "var(--red)", fontWeight: 600 }}>Failed to save. Try again.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Intake form ── */}
      <div className="card">
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
    </div>
  );
}
