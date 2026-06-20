import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

function buildPatientContext(patient) {
  return `PATIENT RECORD
Name: ${patient.name} | Age: ${patient.age} | Sex: ${patient.sex}
Conditions: ${Array.isArray(patient.conditions) ? patient.conditions.join(", ") : patient.conditions}

MEDICAL HISTORY:
${patient.history}

FAMILY HISTORY:
${patient.family_history || "Not recorded."}`;
}

export async function generateFollowUpQuestions(patient, chiefComplaint) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are a clinical triage AI. You will receive a patient's full medical record including family history, and their chief complaint.
Generate 2-3 targeted follow-up questions to clarify urgency. Questions should be grounded in the patient's known conditions, history, and family history.
Where relevant, consider hereditary risk factors (e.g. family history of cancer, Alzheimer's, diabetes, cardiovascular disease) when forming questions.
Return ONLY valid JSON — no markdown, no explanation:
{"questions": ["question1", "question2", "question3"]}`,
    messages: [
      {
        role: "user",
        content: `${buildPatientContext(patient)}\n\nChief Complaint: ${chiefComplaint}`,
      },
    ],
  });

  return JSON.parse(response.content[0].text.trim());
}

export async function analyzePatient(patient, chiefComplaint, followUpAnswers) {
  const answersText = followUpAnswers.map((a, i) => `Answer ${i + 1}: ${a}`).join("\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: `You are a clinical triage AI embedded in a patient intake platform.
Given a patient's full medical record (including family history), chief complaint, and follow-up answers, return a complete triage assessment.
When assessing care gaps, whatChanged, and clinicalReasoning, explicitly flag hereditary risks where relevant — for example, if a patient has a family history of Alzheimer's, breast cancer, colorectal cancer, or cardiometabolic disease, note how this affects urgency or screening priorities.
Return ONLY valid JSON matching this exact shape — no markdown, no explanation:
{
  "severity": "low|medium|high|critical",
  "urgency": "emergency (call 911)|urgent (same day)|within 3 days|within 1 week|routine",
  "carePathway": "string",
  "selfCare": ["string"],
  "diagnosticDrift": {"detected": boolean, "summary": "string"},
  "whatChanged": ["string"],
  "careGaps": ["string"],
  "complexityScore": "low|medium|high",
  "visitLength": "string",
  "familyAlert": boolean,
  "clinicalReasoning": "string — 2-4 sentences including hereditary context where applicable"
}`,
    messages: [
      {
        role: "user",
        content: `${buildPatientContext(patient)}\n\nChief Complaint: ${chiefComplaint}\n\nFollow-up Q&A:\n${answersText}`,
      },
    ],
  });

  const result = JSON.parse(response.content[0].text.trim());
  return { patient, result };
}
