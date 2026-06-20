import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function AppointmentCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetch(`${API}/appointments`)
      .then((r) => r.json())
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([]));
  }, []);

  const apptMap = {};
  for (const a of appointments) {
    const key = a.iso_date;
    if (!apptMap[key]) apptMap[key] = [];
    apptMap[key].push(a);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelected(null);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelected(null);
  }

  function isoFor(day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const todayIso = today.toISOString().slice(0, 10);
  const selectedAppts = selected ? (apptMap[isoFor(selected)] ?? []) : [];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="cal-wrapper">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-month-label">{MONTHS[month]} {year}</span>
        <button className="cal-nav" onClick={nextMonth}>›</button>
      </div>

      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const iso = isoFor(day);
          const hasAppt = !!apptMap[iso];
          const isToday = iso === todayIso;
          const isSelected = selected === day;
          return (
            <button
              key={day}
              className={[
                "cal-day",
                isToday ? "cal-today" : "",
                isSelected ? "cal-selected" : "",
                hasAppt ? "cal-has-appt" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => setSelected(isSelected ? null : day)}
            >
              {day}
              {hasAppt && <span className="cal-dot" />}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="cal-detail">
          <p className="cal-detail-date">{MONTHS[month]} {selected}, {year}</p>
          {selectedAppts.length === 0 ? (
            <p className="cal-no-appt">No appointments this day.</p>
          ) : (
            selectedAppts.map((a, i) => (
              <div key={i} className="cal-appt-card">
                <div className="cal-appt-time">{a.time}</div>
                <div className="cal-appt-patient">{a.patient_name}</div>
                <div className="cal-appt-complaint">{a.chief_complaint}</div>
                <div className="cal-appt-confirm">Conf. #{a.confirm_num}</div>
              </div>
            ))
          )}
        </div>
      )}

      {appointments.length === 0 && (
        <p className="cal-empty">No appointments booked yet. They will appear here once patients book through the patient portal.</p>
      )}
    </div>
  );
}
