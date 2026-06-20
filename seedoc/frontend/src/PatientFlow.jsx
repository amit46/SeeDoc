import { useState } from "react";
import IntakeForm from "./IntakeForm";
import FollowUpQs from "./FollowUpQs";
import ResultsCard from "./ResultsCard";

const API = import.meta.env.VITE_API_URL;

export default function PatientFlow({ onResult }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [intake, setIntake] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);

  async function handleIntake({ patientId, chiefComplaint }) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, chiefComplaint }),
      });
      const data = await res.json();
      setIntake({ patientId, chiefComplaint });
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

  if (step === 1) return <IntakeForm onSubmit={handleIntake} />;
  if (step === 2) return <FollowUpQs questions={questions} onSubmit={handleFollowUp} />;
  return <ResultsCard result={result} />;
}
