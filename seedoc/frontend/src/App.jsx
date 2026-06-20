import { useState } from "react";
import LoginPage from "./LoginPage";
import PatientFlow from "./PatientFlow";
import PhysicianDashboard from "./PhysicianDashboard";

function load(key, fallback = null) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export default function App() {
  const [role, setRole] = useState(() => load("seedoc_role"));
  const [patient, setPatient] = useState(() => load("seedoc_patient"));
  const [triageResult, setTriageResult] = useState(() => load("seedoc_triage"));
  const [chiefComplaint, setChiefComplaint] = useState(() => load("seedoc_complaint", ""));

  function handleLogin(r, patientData) {
    setRole(r);
    setPatient(patientData);
    save("seedoc_role", r);
    save("seedoc_patient", patientData);
  }

  function handleLogout() {
    setRole(null);
    setPatient(null);
    localStorage.removeItem("seedoc_role");
    localStorage.removeItem("seedoc_patient");
  }

  function handleResult(result, complaint) {
    setTriageResult(result);
    setChiefComplaint(complaint);
    if (result) {
      save("seedoc_triage", result);
      save("seedoc_complaint", complaint);
    } else {
      localStorage.removeItem("seedoc_triage");
      localStorage.removeItem("seedoc_complaint");
    }
  }

  if (!role) return <LoginPage onLogin={handleLogin} />;

  return (
    <>
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">S</div>
          <div>
            <span className="app-logo-text">SeeDoc</span>
            <span className="app-logo-sub">AI Patient Triage</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
            {role === "patient"
              ? `🧑‍⚕️ ${patient?.name ?? "Patient"}`
              : "👨‍⚕️ Physician Dashboard"}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "6px",
              color: "#94a3b8", padding: "0.35rem 0.85rem", cursor: "pointer",
              fontSize: "0.82rem", fontFamily: "inherit",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="app-main">
        {role === "patient" ? (
          <PatientFlow
            patient={patient}
            onResult={handleResult}
            savedResult={triageResult}
          />
        ) : (
          <PhysicianDashboard result={triageResult} chiefComplaint={chiefComplaint} />
        )}
      </main>
    </>
  );
}
