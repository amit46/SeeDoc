import { useState } from "react";
import PatientFlow from "./PatientFlow";
import PhysicianDashboard from "./PhysicianDashboard";

export default function App() {
  const [view, setView] = useState("patient");
  const [triageResult, setTriageResult] = useState(null);
  const [chiefComplaint, setChiefComplaint] = useState("");

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
        <div className="view-toggle">
          <button
            className={view === "patient" ? "active" : ""}
            onClick={() => setView("patient")}
          >
            Patient View
          </button>
          <button
            className={view === "physician" ? "active" : ""}
            onClick={() => setView("physician")}
          >
            Physician View
          </button>
        </div>
      </header>

      <main className="app-main">
        {view === "patient" ? (
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
