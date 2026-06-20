import { useState } from "react";
import IntakeForm from "./IntakeForm";
import FollowUpQs from "./FollowUpQs";
import ResultsCard from "./ResultsCard";

const API = import.meta.env.VITE_API_URL;

export default function PatientFlow({ patient, onResult, savedResult }) {
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

  if (loading) {
    return (
      <div className="card loading-state">
        <div className="spinner" />
        <p>{step === 1 ? "Generating follow-up questions…" : "Analyzing your assessment…"}</p>
        <p style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "var(--gray-300)" }}>
          Powered by Claude AI
        </p>
      </div>
    );
  }

  if (step === 1) return <IntakeForm patient={patient} onSubmit={handleIntake} />;
  if (step === 2) return <FollowUpQs questions={questions} onSubmit={handleFollowUp} />;
  return <ResultsCard result={result} onStartOver={handleStartOver} />;
}
