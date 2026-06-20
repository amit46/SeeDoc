import { useState } from "react";
import Logo from "./Logo";
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

  function handlePatientUpdate(updatedPatient) {
    setPatient(updatedPatient);
    save("seedoc_patient", updatedPatient);
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
        <Logo size={34} />
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              fontSize: "0.82rem", fontWeight: 500, color: "var(--teal-dark)",
              background: "var(--teal-light)", padding: "0.35rem 0.9rem", borderRadius: "20px",
            }}
          >
            {role === "patient" ? patient?.name ?? "Patient" : "Physician Dashboard"}
          </span>
          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ fontSize: "0.8rem", padding: "0.42rem 0.95rem" }}
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
            onPatientUpdate={handlePatientUpdate}
            savedResult={triageResult}
          />
        ) : (
          <PhysicianDashboard result={triageResult} chiefComplaint={chiefComplaint} />
        )}
      </main>
    </>
  );
}
