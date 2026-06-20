import { useState } from "react";
import IntakeForm from "./IntakeForm";
import FollowUpQs from "./FollowUpQs";
import ResultsCard from "./ResultsCard";

const API = import.meta.env.VITE_API_URL;

const STEPS = [
  { n: 1, label: "Step 1", title: "Describe symptoms" },
  { n: 2, label: "Step 2", title: "Follow-up questions" },
  { n: 3, label: "Step 3", title: "Your assessment" },
];

function initials(name = "") {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function Sidebar({ patient, step }) {
  const conditions = Array.isArray(patient?.conditions) ? patient.conditions : [];
  return (
    <aside className="patient-sidebar">
      <div className="avatar">{initials(patient?.name)}</div>
      <div className="sidebar-name">{patient?.name}</div>
      <div className="sidebar-meta">{patient?.age}{patient?.sex} · Your care assistant</div>
      {conditions.length > 0 && (
        <div className="sidebar-conditions">
          {conditions.map((c) => <span key={c} className="condition-chip">{c}</span>)}
        </div>
      )}
      <div className="vstepper">
        {STEPS.map((s) => {
          const state = step > s.n ? "done" : step === s.n ? "active" : "";
          return (
            <div key={s.n} className={`vstep ${state}`}>
              <div className="vstep-dot">{step > s.n ? "✓" : s.n}</div>
              <div>
                <div className="vstep-label">{s.label}</div>
                <div className="vstep-title">{s.title}</div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default function PatientFlow({ patient, onResult, onPatientUpdate, savedResult }) {
  const [step, setStep] = useState(savedResult ? 3 : 1);
  const [loading, setLoading] = useState(false);
  const [intake, setIntake] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(savedResult);

  async function handleIntake({ chiefComplaint }) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, chiefComplaint }),
      });
      const data = await res.json();
      setIntake({ patientId: patient.id, chiefComplaint });
      setQuestions(data.questions);
      setStep(2);
    } catch (err) {
      alert("Error reaching the server. Is the backend running on port 3001?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollowUp(answers) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...intake, followUpAnswers: answers }),
      });
      const data = await res.json();
      setResult(data);
      onResult(data, intake.chiefComplaint);
      setStep(3);
    } catch (err) {
      alert("Error during analysis. Check the backend logs.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleStartOver() {
    setResult(null);
    setIntake(null);
    setQuestions([]);
    setStep(1);
    onResult(null, "");
  }

  let content;
  if (loading) {
    content = (
      <div className="card loading-state">
        <div className="spinner" />
        <p>{step === 1 ? "Generating follow-up questions…" : "Analyzing your assessment…"}</p>
        <p style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "var(--gray-300)" }}>Powered by Claude AI</p>
      </div>
    );
  } else if (step === 1) {
    content = <IntakeForm patient={patient} onSubmit={handleIntake} onPatientUpdate={onPatientUpdate} />;
  } else if (step === 2) {
    content = <FollowUpQs questions={questions} onSubmit={handleFollowUp} />;
  } else {
    content = <ResultsCard result={result} onStartOver={handleStartOver} />;
  }

  return (
    <div className="patient-shell">
      <Sidebar patient={patient} step={step} />
      <div className="patient-content fade-up" key={step}>
        {content}
      </div>
    </div>
  );
}
