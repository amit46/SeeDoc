import { useState, useEffect } from "react";
import AppointmentCalendar from "./AppointmentCalendar";
import HealthTrendChart from "./HealthTrendChart";

const API = import.meta.env.VITE_API_URL;

const URGENCY_PRIORITY = { "emergency (call 911)": 5, "urgent (same day)": 4, "within 3 days": 3, "within 1 week": 2, routine: 1 };
const URGENCY_COLOR = { "emergency (call 911)": "#dc2626", "urgent (same day)": "#c2410c", "within 3 days": "#d97706", "within 1 week": "#0d9488", routine: "#64748b" };

// ── Appointment Requests tab ──────────────────────────────────────────────────

function RequestsTab({ appointments, onAction }) {
  const pending = appointments.filter(a => a.status === "pending");
  const confirmed = appointments.filter(a => a.status === "confirmed");
  const [notes, setNotes] = useState({});
  const [processing, setProcessing] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  function getConflicts(req) {
    return confirmed.filter(c => {
      if (c.iso_date !== req.iso_date) return false;
      const reqPriority = URGENCY_PRIORITY[req.urgency] ?? 1;
      const cPriority = URGENCY_PRIORITY[c.urgency] ?? 1;
      return reqPriority > cPriority;
    });
  }

  async function handleAction(appt, status, extra = {}) {
    setProcessing(appt.id);
    await fetch(`${API}/appointments/${appt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes: notes[appt.id] || null, ...extra }),
    });
    setProcessing(null);
    onAction();
  }

  if (pending.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "3rem 2rem", color: "var(--gray-500)" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>✓</div>
        <p style={{ fontWeight: 600, color: "var(--gray-700)" }}>No pending requests</p>
        <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>All appointment requests have been reviewed.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {pending.map(req => {
        const conflicts = getConflicts(req);
        const urgColor = URGENCY_COLOR[req.urgency] ?? "#64748b";
        return (
          <div key={req.id} className="card" style={{ borderLeft: `4px solid ${urgColor}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--navy)" }}>{req.patient_name}</p>
                <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: "0.1rem" }}>"{req.chief_complaint}"</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "20px", background: `${urgColor}18`, color: urgColor, border: `1px solid ${urgColor}40` }}>{req.urgency}</span>
                <p style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginTop: "0.35rem" }}>{req.date} at {req.time}</p>
              </div>
            </div>

            {conflicts.length > 0 && (
              <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "0.75rem" }}>
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#c2410c", marginBottom: "0.35rem" }}>⚠️ Reschedule Recommendation</p>
                {conflicts.map(c => (
                  <p key={c.id} style={{ fontSize: "0.8rem", color: "#92400e" }}>
                    {c.patient_name} is scheduled at this time ({c.urgency}) — consider moving their appointment to accommodate this urgent request.
                  </p>
                ))}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: "0.75rem" }}>
              <label style={{ fontSize: "0.75rem" }}>Notes for patient (optional)</label>
              <textarea rows={2} style={{ minHeight: "auto" }}
                placeholder="e.g. Please arrive 10 mins early…"
                value={notes[req.id] ?? ""}
                onChange={e => setNotes(n => ({ ...n, [req.id]: e.target.value }))} />
            </div>

            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button className="btn btn-primary" style={{ fontSize: "0.83rem", padding: "0.5rem 1rem" }}
                disabled={processing === req.id}
                onClick={() => handleAction(req, "confirmed")}>
                ✓ Approve
              </button>
              <button className="btn" style={{ fontSize: "0.83rem", padding: "0.5rem 1rem", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                disabled={processing === req.id}
                onClick={() => handleAction(req, "rejected")}>
                ✗ Reject
              </button>
              <button className="btn btn-outline" style={{ fontSize: "0.83rem", padding: "0.5rem 1rem" }}
                disabled={processing === req.id}
                onClick={() => setRescheduleTarget(req)}>
                ↺ Reschedule
              </button>
            </div>
          </div>
        );
      })}

      {rescheduleTarget && (
        <RescheduleModal appt={rescheduleTarget} onClose={() => setRescheduleTarget(null)}
          onConfirm={(newDate, newIsoDate, newTime) => {
            handleAction(rescheduleTarget, "confirmed", { newDate, newIsoDate, newTime });
            setRescheduleTarget(null);
          }} />
      )}
    </div>
  );
}

function RescheduleModal({ appt, onClose, onConfirm }) {
  const [isoDate, setIsoDate] = useState(appt.iso_date);
  const [time, setTime] = useState(appt.time);
  const TIMES = ["9:00 AM", "10:30 AM", "12:00 PM", "2:00 PM", "3:30 PM", "4:30 PM"];

  function handleSubmit(e) {
    e.preventDefault();
    const d = new Date(isoDate + "T12:00:00");
    const label = d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
    onConfirm(label, isoDate, time);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Reschedule Appointment</h2>
        <p className="modal-sub">Confirm a new date and time for {appt.patient_name}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Date</label>
            <input type="date" value={isoDate} onChange={e => setIsoDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="form-group">
            <label>New Time</label>
            <select value={time} onChange={e => setTime(e.target.value)}>
              {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button type="submit" className="btn btn-primary">Confirm Reschedule</button>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Appointment Modal ─────────────────────────────────────────────────────

function AddAppointmentModal({ patients, onClose, onAdded }) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [isoDate, setIsoDate] = useState("");
  const [time, setTime] = useState("9:00 AM");
  const [notes, setNotes] = useState("");
  const [urgency, setUrgency] = useState("routine");
  const [saving, setSaving] = useState(false);
  const TIMES = ["9:00 AM", "10:30 AM", "12:00 PM", "2:00 PM", "3:30 PM", "4:30 PM"];
  const URGENCIES = ["routine", "within 1 week", "within 3 days", "urgent (same day)", "emergency (call 911)"];

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const patient = patients.find(p => p.id === patientId);
    const d = new Date(isoDate + "T12:00:00");
    const label = d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
    await fetch(`${API}/appointments/doctor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, patientName: patient?.name, date: label, isoDate, time, notes, urgency }),
    });
    setSaving(false);
    onAdded();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Add Appointment</h2>
        <p className="modal-sub">Schedule a confirmed appointment directly</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Patient</label>
            <select value={patientId} onChange={e => setPatientId(e.target.value)}>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={isoDate} onChange={e => setIsoDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} required />
          </div>
          <div className="form-group">
            <label>Time</label>
            <select value={time} onChange={e => setTime(e.target.value)}>
              {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={urgency} onChange={e => setUrgency(e.target.value)}>
              {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Notes / Reason</label>
            <textarea rows={2} style={{ minHeight: "auto" }} placeholder="Reason for appointment…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button type="submit" className="btn btn-primary" disabled={saving || !isoDate}>
              {saving ? "Saving…" : "Add Appointment"}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Patients tab ──────────────────────────────────────────────────────────────

function PatientsTab({ patients }) {
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState(null);
  const [saveStatus, setSaveStatus] = useState({});

  function startEdit(p) {
    setEditing(e => ({
      ...e,
      [p.id]: { history: p.history, conditions: Array.isArray(p.conditions) ? p.conditions.join(", ") : p.conditions },
    }));
  }

  async function handleSave(p) {
    setSaving(p.id);
    const ed = editing[p.id];
    await fetch(`${API}/patients/${p.id}/medical`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: ed.history, conditions: ed.conditions.split(",").map(s => s.trim()).filter(Boolean) }),
    });
    setSaving(null);
    setSaveStatus(s => ({ ...s, [p.id]: "saved" }));
    setTimeout(() => setSaveStatus(s => ({ ...s, [p.id]: null })), 3000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {patients.map(p => {
        const isExpanded = expanded === p.id;
        const ed = editing[p.id];
        return (
          <div key={p.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => { setExpanded(isExpanded ? null : p.id); if (!editing[p.id]) startEdit(p); }}>
              <div>
                <p style={{ fontWeight: 700, color: "var(--navy)", fontSize: "1rem" }}>{p.name}</p>
                <p style={{ fontSize: "0.82rem", color: "var(--gray-500)", marginTop: "0.1rem" }}>
                  {p.age}{p.sex} · {Array.isArray(p.conditions) ? p.conditions.join(", ") : p.conditions}
                </p>
              </div>
              <span style={{ color: "var(--teal)", fontSize: "1.1rem" }}>{isExpanded ? "▲" : "▼"}</span>
            </div>

            {isExpanded && ed && (
              <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--gray-200)", paddingTop: "1.25rem" }}>
                <div className="form-group">
                  <label>Conditions (comma-separated)</label>
                  <input type="text" value={ed.conditions}
                    onChange={e => setEditing(ev => ({ ...ev, [p.id]: { ...ed, conditions: e.target.value } }))} />
                </div>
                <div className="form-group">
                  <label>Medical History</label>
                  <textarea rows={6} value={ed.history}
                    onChange={e => setEditing(ev => ({ ...ev, [p.id]: { ...ed, history: e.target.value } }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Family History <span style={{ fontWeight: 400, color: "var(--gray-500)" }}>(patient-editable)</span></label>
                  <textarea rows={4} value={p.family_history ?? ""} readOnly
                    style={{ background: "var(--gray-50)", color: "var(--gray-500)", cursor: "default" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
                  <button className="btn btn-primary" style={{ fontSize: "0.85rem", padding: "0.5rem 1.1rem" }}
                    disabled={saving === p.id} onClick={() => handleSave(p)}>
                    {saving === p.id ? "Saving…" : "Save Changes"}
                  </button>
                  {saveStatus[p.id] === "saved" && <span style={{ fontSize: "0.82rem", color: "var(--green)", fontWeight: 600 }}>✓ Saved</span>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Latest Assessment ─────────────────────────────────────────────────────────

function AssessmentTab({ result, chiefComplaint }) {
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
        <div className="dash-card">
          <p className="dash-card-title">Diagnostic Drift</p>
          {result.diagnosticDrift?.detected
            ? <p className="drift-detected">⚡ Drift Detected</p>
            : <p className="drift-none">✓ No Drift</p>}
          <p className="drift-summary">{result.diagnosticDrift?.summary}</p>
        </div>
        <div className="dash-card">
          <p className="dash-card-title">Complexity &amp; Visit</p>
          <div className="complexity-row">
            <span className={complexityClass}>{result.complexityScore}</span>
            <span className="visit-length">⏱ {result.visitLength}</span>
          </div>
        </div>
        <div className="dash-card">
          <p className="dash-card-title">What Changed</p>
          <ul className="what-changed-list">
            {result.whatChanged?.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
        <div className="dash-card">
          <p className="dash-card-title">Care Gaps</p>
          <div>{result.careGaps?.map((gap, i) => <span key={i} className="care-gap-badge">{gap}</span>)}</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 0 }}>
        <p className="section-label" style={{ marginBottom: "0.75rem" }}>Clinical Reasoning</p>
        <div className="reasoning-box">{result.clinicalReasoning}</div>
      </div>
    </div>
  );
}

// ── Main physician dashboard ──────────────────────────────────────────────────

export default function PhysicianDashboard({ result, chiefComplaint }) {
  const [tab, setTab] = useState("requests");
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showAddAppt, setShowAddAppt] = useState(false);

  const pendingCount = appointments.filter(a => a.status === "pending").length;

  function fetchAppointments() {
    fetch(`${API}/appointments`).then(r => r.json()).then(setAppointments).catch(() => {});
  }

  useEffect(() => {
    fetchAppointments();
    fetch(`${API}/patients`).then(r => r.json()).then(setPatients).catch(() => {});
  }, []);

  const TABS = [
    { id: "requests", label: "Requests", badge: pendingCount },
    { id: "calendar", label: "Calendar" },
    { id: "patients", label: "Patients" },
    { id: "trends", label: "Health Trends" },
    { id: "assessment", label: "Latest Assessment" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="doc-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`doc-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
            {t.badge > 0 && <span className="tab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "requests" && (
        <RequestsTab appointments={appointments} onAction={fetchAppointments} />
      )}

      {tab === "calendar" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <p className="card-title" style={{ marginBottom: 0 }}>📅 Appointment Calendar</p>
            <button className="btn btn-primary" style={{ fontSize: "0.83rem", padding: "0.45rem 1rem" }}
              onClick={() => setShowAddAppt(true)}>
              + Add Appointment
            </button>
          </div>
          <AppointmentCalendar appointments={appointments} />
          {showAddAppt && (
            <AddAppointmentModal patients={patients} onClose={() => setShowAddAppt(false)} onAdded={fetchAppointments} />
          )}
        </div>
      )}

      {tab === "patients" && (
        <PatientsTab patients={patients} />
      )}

      {tab === "trends" && (
        <div className="card">
          <p className="card-title">📈 Health Trends</p>
          <HealthTrendChart patients={patients} />
        </div>
      )}

      {tab === "assessment" && (
        <AssessmentTab result={result} chiefComplaint={chiefComplaint} />
      )}
    </div>
  );
}
