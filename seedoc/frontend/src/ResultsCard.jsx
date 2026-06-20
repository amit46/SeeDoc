import { useState } from "react";
import BookingModal from "./BookingModal";

const SEVERITY_ICON = { low: "🟢", medium: "🟡", high: "🟠", critical: "🔴" };
const EMERGENCY_URGENCIES = ["emergency (call 911)", "urgent (same day)"];

export default function ResultsCard({ result, onStartOver }) {
  const [showBooking, setShowBooking] = useState(false);
  const isEmergency = EMERGENCY_URGENCIES.includes(result.urgency);
  const tone = ["low", "medium", "high", "critical"].includes(result.severity) ? result.severity : "medium";

  return (
    <div>
      {isEmergency && (
        <div className="urgency-banner">
          <span style={{ fontSize: "1.2rem" }}>🚨</span>
          Do not wait — go to Emergency or call your clinic now
        </div>
      )}

      <div className={`results-hero tone-${tone}`}>
        <div>
          <div className="results-hero-severity">{result.severity} priority</div>
          <div className="results-hero-urgency">Recommended timing: {result.urgency}</div>
        </div>
        <div className="results-hero-badge">{SEVERITY_ICON[result.severity]}</div>
      </div>

      <div className="results-body">
        <div className="form-group">
          <p className="section-label">Recommended Care Pathway</p>
          <div className="care-pathway-box">{result.carePathway}</div>
        </div>

        <div className="form-group">
          <p className="section-label">Self-Care While You Wait</p>
          <ul className="self-care-list">
            {result.selfCare?.map((tip, i) => <li key={i}>{tip}</li>)}
          </ul>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <p className="section-label">Clinical Reasoning</p>
          <div className="reasoning-box">{result.clinicalReasoning}</div>
        </div>
      </div>

      <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        {!isEmergency && (
          <button className="btn btn-primary" onClick={() => setShowBooking(true)}>
            📅 Request an Appointment
          </button>
        )}
        <button className="btn btn-outline" onClick={onStartOver}>
          ↩ Start New Assessment
        </button>
      </div>

      {showBooking && (
        <BookingModal
          urgency={result.urgency}
          patientId={result.patient?.id}
          patientName={result.patient?.name ?? "Patient"}
          chiefComplaint={result.carePathway ?? ""}
          onClose={() => setShowBooking(false)}
        />
      )}
    </div>
  );
}
