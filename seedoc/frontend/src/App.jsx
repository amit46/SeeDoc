import { useState } from "react";
import LoginPage from "./LoginPage";
import PatientFlow from "./PatientFlow";
import PhysicianDashboard from "./PhysicianDashboard";

export default function App() {
  const [role, setRole] = useState(null); // null | "patient" | "doctor"
  const [triageResult, setTriageResult] = useState(null);
  const [chiefComplaint, setChiefComplaint] = useState("");

  function handleLogout() {
    setRole(null);
  }

  if (!role) {
    return <LoginPage onLogin={setRole} />;
  }

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
            {role === "patient" ? "🧑‍⚕️ Patient Portal" : "👨‍⚕️ Physician Dashboard"}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "6px",
              color: "#94a3b8",
              padding: "0.35rem 0.85rem",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontFamily: "inherit",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="app-main">
        {role === "patient" ? (
          <PatientFlow
            onResult={(result, complaint) => {
              setTriageResult(result);
              setChiefComplaint(complaint);
            }}
          />
        ) : (
          <PhysicianDashboard result={triageResult} chiefComplaint={chiefComplaint} />
        )}
      </main>
    </>
  );
}
