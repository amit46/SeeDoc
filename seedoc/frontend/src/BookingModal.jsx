import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

export default function BookingModal({ urgency, patientId, patientName, chiefComplaint, onClose }) {
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitted, setSubmitted] = useState(null);
  const [saving, setSaving] = useState(false);
  const confirmNum = Math.floor(100000 + Math.random() * 900000);

  useEffect(() => {
    fetch(`${API}/available-slots?urgency=${encodeURIComponent(urgency)}`)
      .then(r => r.json())
      .then(data => { setSlots(data); setLoadingSlots(false); })
      .catch(() => setLoadingSlots(false));
  }, [urgency]);

  async function handleRequest(slot) {
    setSaving(true);
    try {
      await fetch(`${API}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, patientName, chiefComplaint, date: slot.date, isoDate: slot.isoDate, time: slot.time, confirmNum, urgency }),
      });
      setSubmitted(slot);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="confirmation-box">
            <div className="confirm-icon">📋</div>
            <div className="confirm-time">{submitted.date} at {submitted.time}</div>
            <div className="confirm-code">Request #{confirmNum}</div>
            <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: "0.5rem", marginTop: "0.25rem" }}>
              Your appointment request has been sent to your physician for approval.
            </p>
            <p style={{ fontSize: "0.82rem", color: "var(--gray-500)", marginBottom: "1.5rem" }}>
              You will be notified once the doctor confirms your slot.
            </p>
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Request an Appointment</h2>
        <p className="modal-sub">Select a preferred time — your doctor will confirm availability.</p>

        {loadingSlots ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div className="spinner" style={{ margin: "0 auto 0.75rem" }} />
            <p style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>Checking available slots…</p>
          </div>
        ) : slots.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: "1.5rem" }}>
            No available slots found in this window. Please call the clinic directly.
          </p>
        ) : (
          <div className="slot-grid" style={{ marginBottom: "1.5rem" }}>
            {slots.map((s, i) => (
              <button key={i} className="slot-btn" onClick={() => handleRequest(s)} disabled={saving}>
                <span className="slot-date">{s.date}</span>
                <span className="slot-time">{s.time}</span>
              </button>
            ))}
          </div>
        )}

        <button className="btn btn-outline" onClick={onClose} style={{ width: "100%" }}>Cancel</button>
      </div>
    </div>
  );
}
