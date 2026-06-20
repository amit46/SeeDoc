import "dotenv/config";
import express from "express";
import cors from "cors";
import supabase from "./db.js";
import { generateFollowUpQuestions, analyzePatient, populationScan } from "./claude.js";

const app = express();
app.use(cors());
app.use(express.json());

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post("/login", async (req, res) => {
  const { username, password, role } = req.body;
  if (role === "doctor") {
    if (username === process.env.DOCTOR_USERNAME && password === process.env.DOCTOR_PASSWORD)
      return res.json({ ok: true, role: "doctor" });
    return res.status(401).json({ error: "Invalid credentials" });
  }
  if (role === "patient") {
    const { data, error } = await supabase
      .from("patients")
      .select("id, name, age, sex, conditions, history, family_history")
      .eq("username", username).eq("password", password).single();
    if (error || !data) return res.status(401).json({ error: "Invalid credentials" });
    return res.json({ ok: true, role: "patient", patient: data });
  }
  res.status(400).json({ error: "Unknown role" });
});

// ── Patients ──────────────────────────────────────────────────────────────────

app.get("/patients", async (_req, res) => {
  const { data, error } = await supabase
    .from("patients")
    .select("id, name, age, sex, conditions, history, family_history");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/patients/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("patients").select("id, name, age, sex, conditions, history, family_history")
    .eq("id", req.params.id).single();
  if (error || !data) return res.status(404).json({ error: "Not found" });
  res.json(data);
});

app.patch("/patients/:id/family-history", async (req, res) => {
  const { family_history } = req.body;
  if (typeof family_history !== "string") return res.status(400).json({ error: "Invalid" });
  const { error } = await supabase.from("patients").update({ family_history }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.patch("/patients/:id/medical", async (req, res) => {
  const { history, conditions } = req.body;
  const update = {};
  if (history !== undefined) update.history = history;
  if (conditions !== undefined) update.conditions = conditions;
  const { error } = await supabase.from("patients").update(update).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── AI endpoints ──────────────────────────────────────────────────────────────

app.post("/questions", async (req, res) => {
  try {
    const { patientId, chiefComplaint } = req.body;
    const { data: patient, error } = await supabase.from("patients").select("*").eq("id", patientId).single();
    if (error || !patient) return res.status(404).json({ error: "Patient not found" });
    const result = await generateFollowUpQuestions(patient, chiefComplaint);
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.post("/analyze", async (req, res) => {
  try {
    const { patientId, chiefComplaint, followUpAnswers } = req.body;
    const { data: patient, error } = await supabase.from("patients").select("*").eq("id", patientId).single();
    if (error || !patient) return res.status(404).json({ error: "Patient not found" });
    const { result } = await analyzePatient(patient, chiefComplaint, followUpAnswers);
    await supabase.from("triage_results").insert({ patient_id: patient.id, patient_name: patient.name, chief_complaint: chiefComplaint, result });
    res.json({ patient: { id: patient.id, name: patient.name }, ...result });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ── Appointments ──────────────────────────────────────────────────────────────

// Get available slots (excludes already-confirmed times)
app.get("/available-slots", async (req, res) => {
  const { urgency } = req.query;
  const now = new Date();
  const times = ["9:00 AM", "10:30 AM", "12:00 PM", "2:00 PM", "3:30 PM", "4:30 PM"];

  let startDay, spreadDays;
  if (urgency === "urgent (same day)") { startDay = 0; spreadDays = 1; }
  else if (urgency === "within 3 days") { startDay = 1; spreadDays = 3; }
  else if (urgency === "within 1 week") { startDay = 1; spreadDays = 7; }
  else { startDay = 14; spreadDays = 14; }

  // Get confirmed appointments in that window
  const windowStart = new Date(now); windowStart.setDate(windowStart.getDate() + startDay);
  const windowEnd = new Date(now); windowEnd.setDate(windowEnd.getDate() + startDay + spreadDays);
  const { data: booked } = await supabase.from("appointments")
    .select("iso_date, time").eq("status", "confirmed")
    .gte("iso_date", windowStart.toISOString().slice(0, 10))
    .lte("iso_date", windowEnd.toISOString().slice(0, 10));

  const bookedSet = new Set((booked || []).map(b => `${b.iso_date}|${b.time}`));

  const slots = [];
  for (let d = startDay; d < startDay + spreadDays && slots.length < 6; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    const iso = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
    for (const t of times) {
      if (!bookedSet.has(`${iso}|${t}`)) {
        slots.push({ date: label, isoDate: iso, time: t });
        if (slots.length >= 6) break;
      }
    }
  }
  res.json(slots);
});

app.get("/appointments", async (_req, res) => {
  const { data, error } = await supabase.from("appointments").select("*").order("iso_date", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Patient creates a pending request
app.post("/appointments", async (req, res) => {
  const { patientId, patientName, chiefComplaint, date, isoDate, time, confirmNum, urgency } = req.body;
  const { data, error } = await supabase.from("appointments")
    .insert({ patient_id: patientId, patient_name: patientName, chief_complaint: chiefComplaint, date, iso_date: isoDate, time, confirm_num: confirmNum, urgency, status: "pending", type: "patient_request" })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Doctor creates a confirmed appointment
app.post("/appointments/doctor", async (req, res) => {
  const { patientId, patientName, date, isoDate, time, notes, urgency } = req.body;
  const confirmNum = Math.floor(100000 + Math.random() * 900000);
  const { data, error } = await supabase.from("appointments")
    .insert({ patient_id: patientId, patient_name: patientName, chief_complaint: notes || "Doctor-scheduled appointment", date, iso_date: isoDate, time, confirm_num: confirmNum, urgency: urgency || "routine", status: "confirmed", type: "doctor_created", notes })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Doctor approves / rejects / reschedules a request
app.patch("/appointments/:id", async (req, res) => {
  const { status, notes, newDate, newIsoDate, newTime } = req.body;
  const update = { status };
  if (notes !== undefined) update.notes = notes;
  if (newDate) update.date = newDate;
  if (newIsoDate) update.iso_date = newIsoDate;
  if (newTime) update.time = newTime;
  const { error } = await supabase.from("appointments").update(update).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Proactive population scan ─────────────────────────────────────────────────

app.get("/population-scan", async (_req, res) => {
  try {
    const { data: patients, error } = await supabase.from("patients").select("*");
    if (error) return res.status(500).json({ error: error.message });
    const result = await populationScan(patients);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Health records ────────────────────────────────────────────────────────────

app.get("/health-records/:patientId", async (req, res) => {
  const { data, error } = await supabase.from("health_records")
    .select("*").eq("patient_id", req.params.patientId).order("recorded_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = 3001;
app.listen(PORT, () => console.log(`SeeDoc backend running on port ${PORT}`));
