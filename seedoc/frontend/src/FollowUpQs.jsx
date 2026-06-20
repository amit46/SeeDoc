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
      <h2 className="intake-heading">A few quick questions</h2>
      <p className="intake-subheading">
        Your answers help us assess urgency accurately. These were generated specifically from your history.
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

        <button type="submit" className="btn btn-primary" disabled={!allAnswered}>
          Submit &amp; Get Assessment →
        </button>
      </form>
    </div>
  );
}
