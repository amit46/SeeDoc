import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  patients,
  generateFollowUpQuestions,
  analyzePatient,
} from "./claude.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/patients", (_req, res) => {
  res.json(
    patients.map(({ id, name, age, sex, conditions }) => ({
      id,
      name,
      age,
      sex,
      conditions,
    }))
  );
});

app.post("/questions", async (req, res) => {
  try {
    const { patientId, chiefComplaint } = req.body;
    const result = await generateFollowUpQuestions(patientId, chiefComplaint);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/analyze", async (req, res) => {
  try {
    const { patientId, chiefComplaint, followUpAnswers } = req.body;
    const { patient, result } = await analyzePatient(
      patientId,
      chiefComplaint,
      followUpAnswers
    );
    res.json({ patient: { id: patient.id, name: patient.name }, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`SeeDoc backend running on port ${PORT}`));
