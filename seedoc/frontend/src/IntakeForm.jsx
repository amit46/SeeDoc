import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

const QUICK_FILLS = [
  "Fatigue and cough",
  "Knee pain getting worse",
  "Shortness of breath",
  "Headache and dizziness",
];

export default function IntakeForm({ onSubmit }) {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");

  useEffect(() => {
    fetch(`${API}/patients`)
      .then((r) => r.json())
      .then((data) => {
        setPatients(data);
        if (data.length) setPatientId(data[0].id);
      });
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!patientId || !chiefComplaint.trim()) return;
    onSubmit({ patientId, chiefComplaint: chiefComplaint.trim() });
  }

  return (
    <div className="card">
      <h2 className="card-title">Tell us why you're coming in</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="patient-select">Select your profile</label>
          <select
            id="patient-select"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.age}{p.sex}, {p.conditions.join(", ")}
              </option>
            ))}
          </select>
        </div>

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
          disabled={!patientId || !chiefComplaint.trim()}
        >
          Continue →
        </button>
      </form>
    </div>
  );
}
