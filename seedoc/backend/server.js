import "dotenv/config";
import express from "express";
import cors from "cors";
import supabase from "./db.js";
import { generateFollowUpQuestions, analyzePatient } from "./claude.js";

const app = express();
app.use(cors());
app.use(express.json());

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post("/login", async (req, res) => {
  const { username, password, role } = req.body;

  if (role === "doctor") {
    if (
      username === process.env.DOCTOR_USERNAME &&
      password === process.env.DOCTOR_PASSWORD
    ) {
      return res.json({ ok: true, role: "doctor" });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (role === "patient") {
    const { data, error } = await supabase
      .from("patients")
      .select("id, name, age, sex, conditions, history, family_history")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    return res.json({ ok: true, role: "patient", patient: data });
  }

  res.status(400).json({ error: "Unknown role" });
});

// ── Patients ──────────────────────────────────────────────────────────────────

app.get("/patients", async (_req, res) => {
  const { data, error } = await supabase
    .from("patients")
    .select("id, name, age, sex, conditions");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── AI endpoints ──────────────────────────────────────────────────────────────

app.post("/questions", async (req, res) => {
  try {
    const { patientId, chiefComplaint } = req.body;

    // Fetch full patient record from DB
    const { data: patient, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .single();
    if (error || !patient) return res.status(404).json({ error: "Patient not found" });

    const result = await generateFollowUpQuestions(patient, chiefComplaint);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/analyze", async (req, res) => {
  try {
    const { patientId, chiefComplaint, followUpAnswers } = req.body;

    const { data: patient, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .single();
    if (error || !patient) return res.status(404).json({ error: "Patient not found" });

    const { result } = await analyzePatient(patient, chiefComplaint, followUpAnswers);

    // Persist triage result
    await supabase.from("triage_results").insert({
      patient_id: patient.id,
      patient_name: patient.name,
      chief_complaint: chiefComplaint,
      result,
    });

    res.json({ patient: { id: patient.id, name: patient.name }, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Patient self-service updates ─────────────────────────────────────────────

app.patch("/patients/:id/family-history", async (req, res) => {
  const { id } = req.params;
  const { family_history } = req.body;
  if (typeof family_history !== "string") {
    return res.status(400).json({ error: "family_history must be a string" });
  }
  const { error } = await supabase
    .from("patients")
    .update({ family_history })
    .eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Appointments ──────────────────────────────────────────────────────────────

app.get("/appointments", async (_req, res) => {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("iso_date", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/appointments", async (req, res) => {
  const { patientId, patientName, chiefComplaint, date, isoDate, time, confirmNum } = req.body;
  const { data, error } = await supabase
    .from("appointments")
    .insert({ patient_id: patientId, patient_name: patientName, chief_complaint: chiefComplaint, date, iso_date: isoDate, time, confirm_num: confirmNum })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = 3001;
app.listen(PORT, () => console.log(`SeeDoc backend running on port ${PORT}`));
