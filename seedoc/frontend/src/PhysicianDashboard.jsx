export default function PhysicianDashboard({ result, chiefComplaint }) {
  if (!result) {
    return (
      <div className="card physician-placeholder">
        <div className="ph-icon">🩺</div>
        <h3>No patient assessment yet</h3>
        <p>Complete a patient intake to see the clinical briefing here.</p>
      </div>
    );
  }

  const complexityClass = `complexity-badge complexity-${result.complexityScore}`;

  return (
    <div>
      <div className="patient-header">
        <h2>{result.patient?.name ?? "Patient"}</h2>
        <p className="chief">"{chiefComplaint}"</p>
      </div>

      {result.familyAlert && (
        <div className="family-alert-banner">
          <span style={{ fontSize: "1.2rem" }}>⚠️</span>
          Family notification recommended — patient may need caregiver involvement.
        </div>
      )}

      <div className="dash-grid">
        {/* Diagnostic Drift */}
        <div className="dash-card">
          <p className="dash-card-title">Diagnostic Drift</p>
          {result.diagnosticDrift?.detected ? (
            <p className="drift-detected">⚡ Drift Detected</p>
          ) : (
            <p className="drift-none">✓ No Drift</p>
          )}
          <p className="drift-summary">{result.diagnosticDrift?.summary}</p>
        </div>

        {/* Complexity & Visit Length */}
        <div className="dash-card">
          <p className="dash-card-title">Complexity &amp; Visit</p>
          <div className="complexity-row">
            <span className={complexityClass}>{result.complexityScore}</span>
            <span className="visit-length">⏱ {result.visitLength}</span>
          </div>
        </div>

        {/* What Changed */}
        <div className="dash-card">
          <p className="dash-card-title">What Changed</p>
          <ul className="what-changed-list">
            {result.whatChanged?.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Care Gaps */}
        <div className="dash-card">
          <p className="dash-card-title">Care Gaps</p>
          <div>
            {result.careGaps?.map((gap, i) => (
              <span key={i} className="care-gap-badge">{gap}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Clinical Reasoning */}
      <div className="card" style={{ marginTop: 0 }}>
        <p className="section-label" style={{ marginBottom: "0.75rem" }}>Clinical Reasoning</p>
        <div className="reasoning-box">{result.clinicalReasoning}</div>
      </div>
    </div>
  );
}
