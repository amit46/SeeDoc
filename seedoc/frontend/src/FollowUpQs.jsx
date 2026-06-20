import { useState } from "react";

export default function FollowUpQs({ questions, onSubmit }) {
  const [answers, setAnswers] = useState(questions.map(() => ""));

  function handleChange(i, val) {
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? val : a)));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(answers);
  }

  const allAnswered = answers.every((a) => a.trim().length > 0);

  return (
    <div className="card">
      <div className="step-indicator">
        <div className="step-dot done">✓</div>
        <div className="step-line done" />
        <div className="step-dot active">2</div>
        <div className="step-line" />
        <div className="step-dot">3</div>
      </div>

      <h2 className="card-title">A few quick follow-up questions</h2>
      <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: "1.5rem" }}>
        Step 2 of 3 — Your answers help us assess urgency accurately.
      </p>

      <form onSubmit={handleSubmit}>
        {questions.map((q, i) => (
          <div className="form-group" key={i}>
            <label htmlFor={`q-${i}`}>{q}</label>
            <textarea
              id={`q-${i}`}
              rows={3}
              placeholder="Your answer…"
              value={answers[i]}
              onChange={(e) => handleChange(i, e.target.value)}
            />
          </div>
        ))}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!allAnswered}
        >
          Submit & Get Assessment →
        </button>
      </form>
    </div>
  );
}
