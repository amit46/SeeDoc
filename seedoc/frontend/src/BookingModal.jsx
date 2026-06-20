import { useState } from "react";

function generateSlots(urgency) {
  const now = new Date();
  const slots = [];
  const times = ["9:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"];

  let startDay, count, spreadDays;
  if (urgency === "within 3 days") {
    startDay = 1; spreadDays = 3; count = 4;
  } else if (urgency === "within 1 week") {
    startDay = 1; spreadDays = 7; count = 5;
  } else {
    startDay = 14; spreadDays = 10; count = 4;
  }

  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + startDay + Math.floor((i / count) * spreadDays));
    slots.push({
      date: d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" }),
      time: times[i % times.length],
    });
  }
  return slots;
}

export default function BookingModal({ urgency, onClose }) {
  const [booked, setBooked] = useState(null);
  const slots = generateSlots(urgency);
  const confirmNum = Math.floor(100000 + Math.random() * 900000);

  if (booked) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="confirmation-box">
            <div className="confirm-icon">✓</div>
            <div className="confirm-time">{booked.date} at {booked.time}</div>
            <div className="confirm-code">Confirmation #{confirmNum}</div>
            <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: "1.5rem" }}>
              Your appointment has been requested. You will receive a confirmation by email.
            </p>
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Book an Appointment</h2>
        <p className="modal-sub">Select an available time slot</p>
        <div className="slot-grid">
          {slots.map((s, i) => (
            <button key={i} className="slot-btn" onClick={() => setBooked(s)}>
              <span className="slot-date">{s.date}</span>
              <span className="slot-time">{s.time}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-outline" onClick={onClose} style={{ width: "100%" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
