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
  const [saveStatus, setSaveStatus] = useState(null);

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
    <div className="card">
      <h2 className="intake-heading">What brings you in today?</h2>
      <p className="intake-subheading">
        Describe your main concern in your own words. Our AI reads your full record before responding.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="complaint">Chief complaint</label>
          <textarea
            id="complaint"
            placeholder="e.g. I've been feeling unusually tired and short of breath this week…"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
          />
          <div className="quick-fills">
            {QUICK_FILLS.map((q) => (
              <button key={q} type="button" className="quick-fill-btn" onClick={() => setChiefComplaint(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={!chiefComplaint.trim()}>
          Continue →
        </button>
      </form>

      <div style={{ marginTop: "1.5rem", borderTop: "1px dashed var(--sage-border)", paddingTop: "1.25rem" }}>
        <button
          type="button"
          onClick={() => setShowFamilyHistory((v) => !v)}
          style={{
            background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
            fontSize: "0.85rem", fontWeight: 600, color: "var(--teal)", display: "flex",
            alignItems: "center", gap: "0.4rem", padding: 0,
          }}
        >
          {showFamilyHistory ? "▲" : "✏️"} Update family history
        </button>

        {showFamilyHistory && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
              Add any new diagnoses or health developments in your family. This helps the AI flag hereditary risks.
            </p>
            <textarea
              rows={7}
              value={familyHistory}
              onChange={(e) => { setFamilyHistory(e.target.value); setSaveStatus(null); }}
              placeholder="e.g. Mother recently diagnosed with Type 2 diabetes at age 65…"
              style={{ fontSize: "0.85rem", lineHeight: 1.6 }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
              <button type="button" className="btn btn-primary" style={{ fontSize: "0.85rem", padding: "0.5rem 1.1rem" }}
                onClick={handleSaveFamilyHistory} disabled={saving || familyHistory === patient?.family_history}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              {saveStatus === "saved" && <span style={{ fontSize: "0.82rem", color: "var(--green)", fontWeight: 600 }}>✓ Saved</span>}
              {saveStatus === "error" && <span style={{ fontSize: "0.82rem", color: "var(--red)", fontWeight: 600 }}>Failed — try again.</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
