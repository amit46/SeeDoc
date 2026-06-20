import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

const PATIENT_METRICS = {
  P001: [
    { key: "hemoglobin", label: "Hemoglobin (g/dL)", color: "#dc2626", danger: v => v < 10, dangerLabel: "Low (<10)" },
    { key: "weight_lbs", label: "Weight (lbs)", color: "#d97706", danger: v => v < 150, dangerLabel: "Underweight concern" },
    { key: "hba1c", label: "HbA1c (%)", color: "#7c3aed", danger: v => v > 7.5, dangerLabel: "High (>7.5%)" },
    { key: "systolic_bp", label: "Systolic BP (mmHg)", color: "#0d9488", danger: v => v > 140, dangerLabel: "Elevated (>140)" },
  ],
  P002: [
    { key: "bmi", label: "BMI", color: "#0d9488", danger: () => false },
    { key: "allergy_severity", label: "Allergy Severity (1–10)", color: "#d97706", danger: v => v >= 5, dangerLabel: "Moderate–Severe" },
    { key: "systolic_bp", label: "Systolic BP (mmHg)", color: "#1e3a5f", danger: v => v > 130, dangerLabel: "Elevated (>130)" },
    { key: "energy_level", label: "Energy Level (1–10)", color: "#16a34a", danger: v => v <= 6, dangerLabel: "Low" },
  ],
  P003: [
    { key: "fasting_glucose", label: "Fasting Glucose (mg/dL)", color: "#dc2626", danger: v => v >= 110, dangerLabel: "Pre-diabetic concern" },
    { key: "weight_lbs", label: "Weight (lbs)", color: "#d97706", danger: v => v > 210, dangerLabel: "High" },
    { key: "systolic_bp", label: "Systolic BP (mmHg)", color: "#7c3aed", danger: v => v > 135, dangerLabel: "Elevated (>135)" },
    { key: "knee_pain_score", label: "Knee Pain Score (1–10)", color: "#c2410c", danger: v => v >= 7, dangerLabel: "Severe" },
  ],
};

const W = 580, H = 220, PL = 52, PR = 16, PT = 16, PB = 44;
const CW = W - PL - PR, CH = H - PT - PB;

function LineChart({ records, metricDef }) {
  const values = records.map(r => r.metrics?.[metricDef.key]).filter(v => v !== undefined && v !== null);
  if (values.length === 0) return <p style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>No data for this metric.</p>;

  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const padV = (maxV - minV) * 0.15 || 1;
  const lo = minV - padV, hi = maxV + padV;

  const toX = i => PL + (i / (records.length - 1)) * CW;
  const toY = v => PT + CH - ((v - lo) / (hi - lo)) * CH;

  const points = records.map((r, i) => {
    const v = r.metrics?.[metricDef.key];
    return v !== undefined ? `${toX(i)},${toY(v)}` : null;
  }).filter(Boolean).join(" ");

  const yTicks = 4;
  const trend = values.length >= 2 ? values[values.length - 1] - values[0] : 0;
  const latestDanger = metricDef.danger(values[values.length - 1]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--gray-700)" }}>
          Latest: <strong style={{ color: latestDanger ? "#dc2626" : "var(--navy)" }}>{values[values.length - 1]}</strong>
        </span>
        {latestDanger && <span style={{ fontSize: "0.75rem", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "4px", padding: "0.15rem 0.5rem", fontWeight: 600 }}>{metricDef.dangerLabel}</span>}
        <span style={{ fontSize: "0.78rem", color: trend > 0 ? "#dc2626" : trend < 0 ? "#16a34a" : "var(--gray-500)", fontWeight: 600 }}>
          {trend > 0 ? `▲ +${trend.toFixed(1)}` : trend < 0 ? `▼ ${trend.toFixed(1)}` : "→ Stable"} since first record
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", fontFamily: "Inter, system-ui, sans-serif" }}>
        {/* Grid lines */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const v = lo + ((hi - lo) * i) / yTicks;
          const y = toY(v);
          return (
            <g key={i}>
              <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={PL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v.toFixed(1)}</text>
            </g>
          );
        })}

        {/* Danger zone shading */}
        {metricDef.danger && (
          <rect x={PL} y={PT} width={CW} height={CH} fill={`${metricDef.color}08`} />
        )}

        {/* Line */}
        <polyline points={points} fill="none" stroke={metricDef.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* Data points */}
        {records.map((r, i) => {
          const v = r.metrics?.[metricDef.key];
          if (v === undefined) return null;
          const isDanger = metricDef.danger(v);
          return (
            <g key={i}>
              <circle cx={toX(i)} cy={toY(v)} r="4" fill={isDanger ? "#dc2626" : metricDef.color} stroke="white" strokeWidth="1.5" />
            </g>
          );
        })}

        {/* X-axis labels */}
        {records.map((r, i) => {
          if (records.length > 6 && i % 2 !== 0) return null;
          const label = r.recorded_at?.slice(0, 7) ?? "";
          return (
            <text key={i} x={toX(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#94a3b8">{label}</text>
          );
        })}
      </svg>
    </div>
  );
}

export default function HealthTrendChart({ patients }) {
  const [selectedPatient, setSelectedPatient] = useState(patients?.[0]?.id ?? "P001");
  const [selectedMetric, setSelectedMetric] = useState(0);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedPatient) return;
    setLoading(true);
    setSelectedMetric(0);
    fetch(`${API}/health-records/${selectedPatient}`)
      .then(r => r.json())
      .then(data => { setRecords(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedPatient]);

  const metrics = PATIENT_METRICS[selectedPatient] ?? [];
  const currentPatient = patients?.find(p => p.id === selectedPatient);

  return (
    <div>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--gray-500)", display: "block", marginBottom: "0.4rem" }}>Patient</label>
          <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} style={{ width: "100%" }}>
            {patients?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 2, minWidth: 200 }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--gray-500)", display: "block", marginBottom: "0.4rem" }}>Metric</label>
          <select value={selectedMetric} onChange={e => setSelectedMetric(Number(e.target.value))} style={{ width: "100%" }}>
            {metrics.map((m, i) => <option key={m.key} value={i}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {currentPatient && (
        <p style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginBottom: "1rem" }}>
          {currentPatient.name} · {currentPatient.age}{currentPatient.sex} · {Array.isArray(currentPatient.conditions) ? currentPatient.conditions.join(", ") : currentPatient.conditions}
        </p>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
      ) : (
        <LineChart records={records} metricDef={metrics[selectedMetric] ?? metrics[0]} />
      )}

      {records.length > 0 && (
        <p style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: "0.75rem" }}>
          {records.length} records from {records[0]?.recorded_at} to {records[records.length - 1]?.recorded_at}
        </p>
      )}
    </div>
  );
}
