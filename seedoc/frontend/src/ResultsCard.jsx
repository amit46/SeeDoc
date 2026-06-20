import { useState } from "react";
import BookingModal from "./BookingModal";

const SEVERITY_CLASS = {
  low: "severity-low",
  medium: "severity-medium",
  high: "severity-high",
  critical: "severity-critical",
};

const SEVERITY_ICON = { low: "🟢", medium: "🟡", high: "🟠", critical: "🔴" };

const EMERGENCY_URGENCIES = ["emergency (call 911)", "urgent (same day)"];

export default function ResultsCard({ result, onStartOver }) {
  const [showBooking, setShowBooking] = useState(false);

  const isEmergency = EMERGENCY_URGENCIES.includes(result.urgency);

  return (
    <div>
      <div className="step-indicator" style={{ marginBottom: "1.5rem" }}>
        <div className="step-dot done">✓</div>
        <div className="step-line done" />
        <div className="step-dot done">✓</div>
        <div className="step-line done" />
        <div className="step-dot active">3</div>
      </div>

      {isEmergency && (
        <div className="urgency-banner">
          <span style={{ fontSize: "1.2rem" }}>🚨</span>
          Do not wait — go to Emergency or call your clinic now
        </div>
      )}

      <div className="card">
        <div className="results-header">
          <span className={`severity-badge ${SEVERITY_CLASS[result.severity] || "severity-medium"}`}>
            {SEVERITY_ICON[result.severity]} {result.severity}
          </span>
          <span className="urgency-tag">Urgency: <strong>{result.urgency}</strong></span>
        </div>

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

      {!isEmergency && (
        <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
          <button className="btn btn-primary" onClick={() => setShowBooking(true)}>
            📅 Book an Appointment
          </button>
        </div>
      )}

      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <button className="btn btn-outline" onClick={onStartOver}>
          ↩ Start New Assessment
        </button>
      </div>

      {showBooking && (
        <BookingModal
          urgency={result.urgency}
          patientName={result.patient?.name ?? "Patient"}
          chiefComplaint={result.carePathway ?? ""}
          onClose={() => setShowBooking(false)}
        />
      )}
    </div>
  );
}
