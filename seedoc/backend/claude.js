import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";
const MOCK = process.env.MOCK === "true";

if (MOCK) console.log("⚠️  MOCK mode enabled — Claude API will not be called.");

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

// ── Mock responses ────────────────────────────────────────────────────────────

const MOCK_QUESTIONS = {
  P001: {
    questions: [
      "How long have you been experiencing fatigue — has it worsened over the past few weeks compared to your usual baseline?",
      "Are you experiencing any new or worsening shortness of breath, chest tightness, or dizziness when standing up?",
      "Have you been taking your iron supplements and inhalers regularly, or have there been any gaps recently?",
    ],
  },
  P002: {
    questions: [
      "When did the symptoms start and have they been getting better, worse, or staying the same?",
      "Do you have a fever, chills, or any other symptoms alongside this?",
      "Have you been exposed to anyone who was recently sick, or have you traveled anywhere recently?",
    ],
  },
  P003: {
    questions: [
      "How would you rate your knee pain on a scale of 1–10, and is it affecting your sleep or ability to do daily tasks?",
      "Have you noticed any swelling, warmth, or redness around the knee joint?",
      "Are you currently taking any over-the-counter pain medications, and if so, how often?",
    ],
  },
};

const MOCK_ANALYSIS = {
  P001: {
    severity: "high",
    urgency: "urgent (same day)",
    carePathway:
      "Urgent same-day assessment by primary care or urgent care. CBC, iron studies, and FOBT ordered. GI referral for overdue colonoscopy. Medication adherence review.",
    selfCare: [
      "Rest and avoid exertion until seen by a physician.",
      "Take iron supplements with vitamin C to improve absorption.",
      "Use your albuterol inhaler if you experience shortness of breath.",
      "Call 911 if you feel chest pain, sudden severe dizziness, or cannot breathe.",
    ],
    diagnosticDrift: {
      detected: true,
      summary:
        "Hemoglobin has been trending downward across 3 consecutive panels with unresolved iron deficiency despite supplementation — pattern suggests possible occult GI blood loss, not nutritional deficiency alone.",
    },
    whatChanged: [
      "Hemoglobin trending downward (now likely below 10 g/dL based on trajectory)",
      "Unintentional 12 lb weight loss over 6 months",
      "Recent ER visit for dyspnea — escalation from outpatient pattern",
      "Poor adherence to ferrous sulfate documented",
    ],
    careGaps: [
      "Colonoscopy overdue since 2018",
      "Iron deficiency unresolved for 2+ years",
      "No documented caregiver or emergency contact",
    ],
    complexityScore: "high",
    visitLength: "60 min",
    familyAlert: true,
    clinicalReasoning:
      "Margaret presents with a complex, high-acuity picture: progressive anemia, COPD exacerbation risk, unintentional weight loss, and a colonoscopy 6 years overdue. The combination of downtrending hemoglobin and weight loss in a 71-year-old living alone warrants urgent evaluation to rule out occult malignancy. Same-day assessment is appropriate given her recent ER visit and social vulnerability.",
  },
  P002: {
    severity: "low",
    urgency: "within 1 week",
    carePathway:
      "Non-urgent primary care visit within 1 week. Symptom monitoring at home. Return precautions discussed.",
    selfCare: [
      "Rest and stay well hydrated.",
      "Over-the-counter antihistamines or decongestants if allergies are suspected.",
      "Monitor temperature — if fever exceeds 38.5°C seek care sooner.",
      "Avoid known allergy triggers if applicable.",
    ],
    diagnosticDrift: {
      detected: false,
      summary:
        "No significant diagnostic drift detected. Patient has no chronic conditions and no prior pattern of similar complaints.",
    },
    whatChanged: [
      "New acute complaint in an otherwise healthy patient",
      "No change in baseline health status",
    ],
    careGaps: ["Annual physical due — last completed 1 year ago"],
    complexityScore: "low",
    visitLength: "20 min",
    familyAlert: false,
    clinicalReasoning:
      "James is a healthy 34-year-old with seasonal allergies and no significant history. His current complaint is likely benign and consistent with his allergy history or a mild viral illness. No red flags identified. A routine visit within a week is appropriate; he should return sooner if symptoms escalate.",
  },
  P003: {
    severity: "medium",
    urgency: "within 3 days",
    carePathway:
      "Semi-urgent primary care visit within 3 days. Review fasting glucose trend, assess knee for effusion, update overdue cancer screenings.",
    selfCare: [
      "Apply ice to the knee for 15–20 minutes several times a day to reduce swelling.",
      "Avoid prolonged standing or climbing stairs where possible.",
      "Acetaminophen 500–1000mg as needed for pain (do not exceed 3g/day).",
      "Follow a low-glycemic diet to help manage rising blood glucose.",
    ],
    diagnosticDrift: {
      detected: true,
      summary:
        "Fasting glucose rising across 3 consecutive checks (95 → 108 → 118 mg/dL) with HbA1c at 6.1% — trajectory suggests pre-diabetes progressing toward Type 2 diabetes without intervention.",
    },
    whatChanged: [
      "Fasting glucose increased from 95 to 118 mg/dL over 3 visits",
      "Weight gain of 8 lbs in past year",
      "Knee pain worsening and limiting daily activity",
    ],
    careGaps: [
      "Mammogram overdue (4 years)",
      "Colon cancer screening never completed",
      "No diabetes prevention program referral despite escalating glucose",
    ],
    complexityScore: "medium",
    visitLength: "45 min",
    familyAlert: false,
    clinicalReasoning:
      "Eleanor presents with worsening knee pain compounded by obesity, and a glucose trajectory that signals imminent diabetes without lifestyle intervention. The visit should address both the acute knee complaint and initiate a diabetes prevention referral. Two overdue cancer screenings also require scheduling. A 45-minute visit is recommended to address the multi-system complexity.",
  },
};

// ── Exported functions ────────────────────────────────────────────────────────

export async function generateFollowUpQuestions(patientId, chiefComplaint) {
  const patient = patients.find((p) => p.id === patientId);
  if (!patient) throw new Error("Patient not found");

  if (MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return MOCK_QUESTIONS[patientId] ?? MOCK_QUESTIONS["P002"];
  }

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

export async function analyzePatient(patientId, chiefComplaint, followUpAnswers) {
  const patient = patients.find((p) => p.id === patientId);
  if (!patient) throw new Error("Patient not found");

  if (MOCK) {
    await new Promise((r) => setTimeout(r, 1200));
    const result = MOCK_ANALYSIS[patientId] ?? MOCK_ANALYSIS["P002"];
    return { patient, result };
  }

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
