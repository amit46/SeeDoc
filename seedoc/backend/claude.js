import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

export const patients = [
  {
    id: "P001",
    name: "Margaret Chen",
    age: 71,
    sex: "F",
    conditions: [
      "COPD",
      "Type 2 Diabetes",
      "Iron Deficiency Anemia",
      "Hypertension",
    ],
    history: `
71-year-old female. Lives alone.
Conditions: COPD, Type 2 Diabetes, Iron Deficiency Anemia, Hypertension.
Visit history: 6 fatigue-related visits over the past 2 years. Iron deficiency anemia has been unresolved across multiple visits.
Recent ER visit for dyspnea (shortness of breath).
Labs: Hemoglobin trending downward over last 3 blood panels. Weight loss of 12 lbs over 6 months (unintentional).
Overdue: Colonoscopy overdue since 2018.
Medications: Metformin 1000mg BID, Lisinopril 10mg QD, Albuterol inhaler PRN, Ferrous sulfate 325mg TID (ongoing, poor adherence noted).
Social: Lives alone, limited mobility, no regular caregiver.
    `.trim(),
  },
  {
    id: "P002",
    name: "James Okonkwo",
    age: 34,
    sex: "M",
    conditions: ["Seasonal Allergies"],
    history: `
34-year-old male. Generally healthy.
Conditions: Seasonal allergies only.
No significant past medical history. No chronic medications. No hospitalizations.
BMI: 24.1 (normal). Last physical exam: 1 year ago, all results within normal limits.
Vaccinations: Up to date.
Social: Active lifestyle, non-smoker, occasional alcohol.
    `.trim(),
  },
  {
    id: "P003",
    name: "Eleanor Vasquez",
    age: 58,
    sex: "F",
    conditions: [
      "Hypertension",
      "Pre-diabetes",
      "Knee Osteoarthritis",
      "Obesity",
    ],
    history: `
58-year-old female.
Conditions: Hypertension, Pre-diabetes, Knee Osteoarthritis (bilateral), Obesity (BMI 33.2).
Labs: Fasting glucose trending upward over last 3 checks (95 → 108 → 118 mg/dL). HbA1c: 6.1%.
BP: Average 138/88 on Amlodipine 5mg QD.
Overdue: Mammogram overdue (last: 4 years ago). Colon cancer screening overdue (never completed).
Knee pain: Moderate, limiting daily activity. Last X-ray showed moderate joint space narrowing.
Weight: Has gained 8 lbs over the past year.
Social: Sedentary job, reports difficulty exercising due to knee pain.
    `.trim(),
  },
];

export async function generateFollowUpQuestions(patientId, chiefComplaint) {
  const patient = patients.find((p) => p.id === patientId);
  if (!patient) throw new Error("Patient not found");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are a clinical triage AI. You will receive a patient's medical record and their chief complaint.
Return ONLY a JSON object with 2-3 targeted follow-up questions specific to this patient's history and complaint.
The questions should help clarify urgency and be grounded in the patient's known conditions and history.
Return format: {"questions": ["question1", "question2", "question3"]}
No markdown. No explanation. No preamble. Only valid JSON.`,
    messages: [
      {
        role: "user",
        content: `Patient Record:\n${patient.history}\n\nChief Complaint: ${chiefComplaint}`,
      },
    ],
  });

  const text = response.content[0].text.trim();
  return JSON.parse(text);
}

export async function analyzePatient(
  patientId,
  chiefComplaint,
  followUpAnswers
) {
  const patient = patients.find((p) => p.id === patientId);
  if (!patient) throw new Error("Patient not found");

  const answersText = followUpAnswers
    .map((a, i) => `Answer ${i + 1}: ${a}`)
    .join("\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are a clinical triage AI embedded in a patient intake platform. Given a patient's full medical record, chief complaint, and follow-up answers, return a complete triage assessment.
Return ONLY valid JSON matching this exact shape — no markdown, no explanation, no preamble:
{
  "severity": "low|medium|high|critical",
  "urgency": "emergency (call 911)|urgent (same day)|within 3 days|within 1 week|routine",
  "carePathway": "string describing recommended care pathway",
  "selfCare": ["string", "string"],
  "diagnosticDrift": {"detected": boolean, "summary": "string"},
  "whatChanged": ["string"],
  "careGaps": ["string"],
  "complexityScore": "low|medium|high",
  "visitLength": "string (e.g. 30 min, 45 min, 60 min)",
  "familyAlert": boolean,
  "clinicalReasoning": "string — 2-4 sentence clinical summary"
}`,
    messages: [
      {
        role: "user",
        content: `Patient Record:\n${patient.history}\n\nChief Complaint: ${chiefComplaint}\n\nFollow-up Q&A:\n${answersText}`,
      },
    ],
  });

  const text = response.content[0].text.trim();
  return { patient, result: JSON.parse(text) };
}
