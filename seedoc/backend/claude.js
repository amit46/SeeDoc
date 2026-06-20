import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

function parseJSON(text) {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first > 0 || last < t.length - 1) t = t.slice(first, last + 1);
  return JSON.parse(t);
}

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

  return parseJSON(response.content[0].text);
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

  const result = parseJSON(response.content[0].text);
  return { patient, result };
}

export async function populationScan(patients) {
  const panel = patients
    .map((p, i) => `=== PATIENT ${i + 1} (id: ${p.id}) ===\n${buildPatientContext(p)}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: `You are a proactive population-health AI for a family medicine practice. You are given the FULL records of every patient on a physician's panel.
Your job is to proactively identify which patients need attention NOW — before they book — by detecting concerning trends, overdue screenings, diagnostic drift (signals missed across prior visits), and hereditary risks.
Rank patients by clinical priority. Only include patients with a genuine actionable concern; a healthy patient with no issues can be marked riskLevel "low" with a brief note.
Be specific and evidence-based: cite concrete data points from the record (lab trends, weight changes, overdue dates, family history).
Return ONLY valid JSON — no markdown, no preamble — matching this exact shape:
{
  "summary": "one-sentence overview, e.g. '2 of 3 patients flagged for proactive follow-up.'",
  "alerts": [
    {
      "patientId": "string (the id given)",
      "patientName": "string",
      "riskLevel": "critical|high|moderate|low",
      "headline": "short clinical headline (<10 words)",
      "evidence": ["concrete data point", "concrete data point"],
      "reasoning": "2-3 sentence clinical rationale, including any missed/drift signal",
      "recommendedAction": "specific next step the physician should take"
    }
  ]
}
Order alerts from highest to lowest riskLevel.`,
    messages: [
      {
        role: "user",
        content: `Physician panel — proactively scan all patients and rank who needs attention:\n\n${panel}`,
      },
    ],
  });

  return parseJSON(response.content[0].text);
}
