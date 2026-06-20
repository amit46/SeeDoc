import "dotenv/config";
import supabase from "./db.js";

// ── Patients ──────────────────────────────────────────────────────────────────

const patients = [
  {
    id: "P001", name: "Margaret Chen", age: 71, sex: "F", username: "margaret", password: "patient123",
    conditions: ["COPD", "Type 2 Diabetes", "Iron Deficiency Anemia", "Hypertension"],
    history: `71-year-old female. Lives alone.
Conditions: COPD, Type 2 Diabetes, Iron Deficiency Anemia, Hypertension.
Visit history: 6 fatigue-related visits over the past 2 years. Iron deficiency anemia has been unresolved across multiple visits.
Recent ER visit for dyspnea (shortness of breath).
Labs: Hemoglobin trending downward over last 3 blood panels. Weight loss of 12 lbs over 6 months (unintentional).
Overdue: Colonoscopy overdue since 2018.
Medications: Metformin 1000mg BID, Lisinopril 10mg QD, Albuterol inhaler PRN, Ferrous sulfate 325mg TID (ongoing, poor adherence noted).
Social: Lives alone, limited mobility, no regular caregiver.`,
    family_history: `Mother: Colon cancer diagnosed at age 68 (treated surgically, deceased at 79 from unrelated causes).
Father: Type 2 Diabetes, died age 74 from myocardial infarction.
Sister (age 68): Iron deficiency anemia, managed with supplementation.
Maternal aunt: Colorectal polyps removed at age 62.
No known family history of Alzheimer's or neurological disease.
Hereditary risk note: Strong familial pattern of colorectal cancer on maternal side — colonoscopy is critically overdue given patient age and family history.`,
  },
  {
    id: "P002", name: "James Okonkwo", age: 34, sex: "M", username: "james", password: "patient123",
    conditions: ["Seasonal Allergies"],
    history: `34-year-old male. Generally healthy.
Conditions: Seasonal allergies only.
No significant past medical history. No chronic medications. No hospitalizations.
BMI: 24.1 (normal). Last physical exam: 1 year ago, all results within normal limits.
Vaccinations: Up to date.
Social: Active lifestyle, non-smoker, occasional alcohol.`,
    family_history: `Father (age 61): Hypertension diagnosed at 45, Type 2 Diabetes diagnosed at 52, currently managed with metformin and lisinopril.
Mother (age 58): Hypercholesterolemia, managed with statins.
Paternal grandfather: Alzheimer's disease, diagnosed at age 72, died age 81.
Paternal uncle: Early-onset Alzheimer's, diagnosed at age 65.
Maternal grandmother: Hypertension and stroke at age 70.
Hereditary risk note: Significant paternal family history of Alzheimer's disease. Patient should be counselled on modifiable risk factors. Father's cardiometabolic pattern suggests patient is at elevated risk for hypertension and T2DM by his 40s.`,
  },
  {
    id: "P003", name: "Eleanor Vasquez", age: 58, sex: "F", username: "eleanor", password: "patient123",
    conditions: ["Hypertension", "Pre-diabetes", "Knee Osteoarthritis", "Obesity"],
    history: `58-year-old female.
Conditions: Hypertension, Pre-diabetes, Knee Osteoarthritis (bilateral), Obesity (BMI 33.2).
Labs: Fasting glucose trending upward over last 3 checks (95 → 108 → 118 mg/dL). HbA1c: 6.1%.
BP: Average 138/88 on Amlodipine 5mg QD.
Overdue: Mammogram overdue (last: 4 years ago). Colon cancer screening overdue (never completed).
Knee pain: Moderate, limiting daily activity. Last X-ray showed moderate joint space narrowing.
Weight: Has gained 8 lbs over the past year.
Social: Sedentary job, reports difficulty exercising due to knee pain.`,
    family_history: `Mother: Breast cancer diagnosed at age 55 (ER+, treated with lumpectomy + radiation, currently in remission at age 80).
Father: Type 2 Diabetes, hypertension, died at age 71 from ischemic stroke.
Maternal grandmother: Alzheimer's disease, diagnosed at age 78, died age 85.
Sister (age 54): Recently diagnosed with BRCA2 mutation; undergoing genetic counselling.
Maternal aunt: Ovarian cancer at age 60.
Hereditary risk note: Strong maternal history of hormone-receptor-positive breast cancer and a sister with confirmed BRCA2 mutation. Overdue mammogram is high-priority — patient should be referred for BRCA genetic testing.`,
  },
];

// ── Mock appointments ─────────────────────────────────────────────────────────

const appointments = [
  // Past confirmed appointments
  { patient_id:"P001", patient_name:"Margaret Chen", chief_complaint:"Fatigue and shortness of breath follow-up", date:"Sat, Apr 5", iso_date:"2026-04-05", time:"10:00 AM", confirm_num:100001, status:"confirmed", urgency:"within 1 week", type:"patient_request", notes:"Reviewed iron levels. Adjusted ferrous sulfate dosing. Repeat CBC in 6 weeks." },
  { patient_id:"P003", patient_name:"Eleanor Vasquez", chief_complaint:"Knee pain and mobility review", date:"Sun, Apr 12", iso_date:"2026-04-12", time:"2:00 PM", confirm_num:100002, status:"confirmed", urgency:"within 1 week", type:"patient_request", notes:"X-ray reviewed. Referred to physio. NSAID as needed." },
  { patient_id:"P002", patient_name:"James Okonkwo", chief_complaint:"Annual physical and allergy review", date:"Mon, Apr 28", iso_date:"2026-04-28", time:"9:00 AM", confirm_num:100003, status:"confirmed", urgency:"routine", type:"doctor_created", notes:"All vitals normal. Allergy meds adjusted for spring season." },
  { patient_id:"P001", patient_name:"Margaret Chen", chief_complaint:"Iron levels follow-up + hemoglobin recheck", date:"Sat, May 10", iso_date:"2026-05-10", time:"11:30 AM", confirm_num:100004, status:"confirmed", urgency:"within 1 week", type:"patient_request", notes:"Hgb still trending down to 8.9. Discussed colonoscopy urgency. Patient reluctant." },
  { patient_id:"P003", patient_name:"Eleanor Vasquez", chief_complaint:"Glucose monitoring and lifestyle review", date:"Thu, May 22", iso_date:"2026-05-22", time:"2:00 PM", confirm_num:100005, status:"confirmed", urgency:"within 1 week", type:"patient_request", notes:"Fasting glucose now 118. Referred to diabetes prevention program. Mammogram re-discussed — overdue 4 years." },
  { patient_id:"P001", patient_name:"Margaret Chen", chief_complaint:"Post-ER dyspnea follow-up", date:"Fri, Jun 5", iso_date:"2026-06-05", time:"10:00 AM", confirm_num:100006, status:"confirmed", urgency:"urgent (same day)", type:"patient_request", notes:"Post-ER visit. Albuterol use increased. COPD action plan updated. Weight now 145 lbs (down 12 lbs in 6 months). Colonoscopy referral placed." },
  { patient_id:"P002", patient_name:"James Okonkwo", chief_complaint:"Seasonal allergy flare", date:"Sun, Jun 15", iso_date:"2026-06-15", time:"9:00 AM", confirm_num:100007, status:"confirmed", urgency:"within 1 week", type:"patient_request", notes:"Allergy symptoms moderate. Switched to cetirizine. Discussed Alzheimer's family risk — lifestyle counselling provided." },

  // Upcoming confirmed
  { patient_id:"P003", patient_name:"Eleanor Vasquez", chief_complaint:"Mammogram referral and BRCA discussion", date:"Sat, Jun 27", iso_date:"2026-06-27", time:"2:00 PM", confirm_num:100008, status:"confirmed", urgency:"within 1 week", type:"doctor_created", notes:"Scheduled by Dr. — mammogram critical given family history and 4-year gap." },
  { patient_id:"P001", patient_name:"Margaret Chen", chief_complaint:"Colonoscopy prep consultation", date:"Fri, Jul 3", iso_date:"2026-07-03", time:"11:30 AM", confirm_num:100009, status:"confirmed", urgency:"within 1 week", type:"doctor_created", notes:"Colonoscopy booked for July 10. Pre-procedure consultation." },
  { patient_id:"P002", patient_name:"James Okonkwo", chief_complaint:"Routine follow-up and baseline metabolic panel", date:"Wed, Jul 15", iso_date:"2026-07-15", time:"9:00 AM", confirm_num:100010, status:"confirmed", urgency:"routine", type:"doctor_created", notes:"Order baseline lipids, glucose, BP — track cardiometabolic risk given family history." },

  // Pending patient requests
  { patient_id:"P001", patient_name:"Margaret Chen", chief_complaint:"Severe fatigue and worsening shortness of breath", date:"Mon, Jun 23", iso_date:"2026-06-23", time:"9:00 AM", confirm_num:100011, status:"pending", urgency:"urgent (same day)", type:"patient_request", notes:null },
  { patient_id:"P003", patient_name:"Eleanor Vasquez", chief_complaint:"Knee pain significantly worse, difficulty walking", date:"Wed, Jun 25", iso_date:"2026-06-25", time:"2:00 PM", confirm_num:100012, status:"pending", urgency:"within 3 days", type:"patient_request", notes:null },
];

// ── Health records ────────────────────────────────────────────────────────────

const healthRecords = [
  // Margaret Chen — hemoglobin declining, weight loss, HbA1c worsening
  { patient_id:"P001", recorded_at:"2024-06-01", visit_notes:"Routine checkup. Fatigue reported.", metrics:{ hemoglobin:11.2, weight_lbs:162, hba1c:7.1, systolic_bp:138 } },
  { patient_id:"P001", recorded_at:"2024-09-01", visit_notes:"Fatigue persisting. Iron supplementation started.", metrics:{ hemoglobin:10.8, weight_lbs:160, hba1c:7.3, systolic_bp:140 } },
  { patient_id:"P001", recorded_at:"2024-12-01", visit_notes:"Hemoglobin dropping despite supplements.", metrics:{ hemoglobin:10.1, weight_lbs:157, hba1c:7.2, systolic_bp:142 } },
  { patient_id:"P001", recorded_at:"2025-03-01", visit_notes:"Weight loss noted. ER visit last month.", metrics:{ hemoglobin:9.8, weight_lbs:154, hba1c:7.5, systolic_bp:145 } },
  { patient_id:"P001", recorded_at:"2025-06-01", visit_notes:"Colonoscopy overdue — patient refusing.", metrics:{ hemoglobin:9.4, weight_lbs:152, hba1c:7.4, systolic_bp:143 } },
  { patient_id:"P001", recorded_at:"2025-09-01", visit_notes:"Adherence to iron supplement poor.", metrics:{ hemoglobin:9.1, weight_lbs:150, hba1c:7.6, systolic_bp:144 } },
  { patient_id:"P001", recorded_at:"2025-12-01", visit_notes:"Dyspnea worsening. COPD exacerbation noted.", metrics:{ hemoglobin:8.9, weight_lbs:149, hba1c:7.8, systolic_bp:146 } },
  { patient_id:"P001", recorded_at:"2026-03-01", visit_notes:"Post-ER visit. Colonoscopy referral placed.", metrics:{ hemoglobin:8.6, weight_lbs:147, hba1c:7.7, systolic_bp:148 } },
  { patient_id:"P001", recorded_at:"2026-06-01", visit_notes:"Hemoglobin at critical low. Urgent follow-up.", metrics:{ hemoglobin:8.3, weight_lbs:145, hba1c:7.9, systolic_bp:149 } },

  // Eleanor Vasquez — glucose rising, weight up, BP creeping, knee pain worsening
  { patient_id:"P003", recorded_at:"2024-06-01", visit_notes:"Pre-diabetes monitoring initiated.", metrics:{ fasting_glucose:95, weight_lbs:198, systolic_bp:132, knee_pain_score:3 } },
  { patient_id:"P003", recorded_at:"2024-09-01", visit_notes:"Glucose slightly elevated. Diet counselling.", metrics:{ fasting_glucose:101, weight_lbs:200, systolic_bp:135, knee_pain_score:4 } },
  { patient_id:"P003", recorded_at:"2024-12-01", visit_notes:"Weight increasing. Knee pain limiting exercise.", metrics:{ fasting_glucose:105, weight_lbs:202, systolic_bp:136, knee_pain_score:5 } },
  { patient_id:"P003", recorded_at:"2025-03-01", visit_notes:"Glucose 108 — approaching diabetic threshold.", metrics:{ fasting_glucose:108, weight_lbs:205, systolic_bp:138, knee_pain_score:5 } },
  { patient_id:"P003", recorded_at:"2025-06-01", visit_notes:"Physio referral for knee. Glucose still rising.", metrics:{ fasting_glucose:110, weight_lbs:206, systolic_bp:137, knee_pain_score:6 } },
  { patient_id:"P003", recorded_at:"2025-09-01", visit_notes:"Mammogram reminder given again. Declined.", metrics:{ fasting_glucose:113, weight_lbs:208, systolic_bp:139, knee_pain_score:6 } },
  { patient_id:"P003", recorded_at:"2025-12-01", visit_notes:"HbA1c 6.1%. Borderline diabetes. DPP referral.", metrics:{ fasting_glucose:115, weight_lbs:210, systolic_bp:140, knee_pain_score:7 } },
  { patient_id:"P003", recorded_at:"2026-03-01", visit_notes:"Glucose 118 — intervention urgently needed.", metrics:{ fasting_glucose:118, weight_lbs:212, systolic_bp:138, knee_pain_score:7 } },
  { patient_id:"P003", recorded_at:"2026-06-01", visit_notes:"Glucose 121. Knee worsening. Mammogram overdue 4yr.", metrics:{ fasting_glucose:121, weight_lbs:213, systolic_bp:141, knee_pain_score:8 } },

  // James Okonkwo — generally stable, minor allergy fluctuations
  { patient_id:"P002", recorded_at:"2024-06-01", visit_notes:"Annual physical. Healthy.", metrics:{ bmi:24.1, allergy_severity:3, systolic_bp:118, energy_level:8 } },
  { patient_id:"P002", recorded_at:"2024-09-01", visit_notes:"Post-summer checkup. Symptoms mild.", metrics:{ bmi:24.0, allergy_severity:2, systolic_bp:116, energy_level:9 } },
  { patient_id:"P002", recorded_at:"2024-12-01", visit_notes:"Routine. All normal.", metrics:{ bmi:24.2, allergy_severity:1, systolic_bp:117, energy_level:8 } },
  { patient_id:"P002", recorded_at:"2025-03-01", visit_notes:"Spring allergy flare. Antihistamine adjusted.", metrics:{ bmi:24.3, allergy_severity:5, systolic_bp:120, energy_level:7 } },
  { patient_id:"P002", recorded_at:"2025-06-01", visit_notes:"Allergies controlled. Physical normal.", metrics:{ bmi:24.1, allergy_severity:3, systolic_bp:119, energy_level:8 } },
  { patient_id:"P002", recorded_at:"2025-09-01", visit_notes:"Healthy. Discussed Alzheimer's family risk.", metrics:{ bmi:24.0, allergy_severity:2, systolic_bp:117, energy_level:9 } },
  { patient_id:"P002", recorded_at:"2025-12-01", visit_notes:"Routine checkup. Baseline labs ordered.", metrics:{ bmi:24.2, allergy_severity:1, systolic_bp:118, energy_level:9 } },
  { patient_id:"P002", recorded_at:"2026-03-01", visit_notes:"Lipids normal. BP normal. Allergy mild.", metrics:{ bmi:24.1, allergy_severity:2, systolic_bp:119, energy_level:8 } },
  { patient_id:"P002", recorded_at:"2026-06-01", visit_notes:"Spring allergy season. Symptoms manageable.", metrics:{ bmi:24.3, allergy_severity:4, systolic_bp:121, energy_level:8 } },
];

async function seed() {
  console.log("Seeding patients…");
  for (const p of patients) {
    const { error } = await supabase.from("patients").upsert(p, { onConflict: "id" });
    if (error) console.error(`  ✗ ${p.name}:`, error.message);
    else console.log(`  ✓ ${p.name}`);
  }

  console.log("Clearing old appointments…");
  await supabase.from("appointments").delete().gte("id", 0);

  console.log("Seeding appointments…");
  for (const a of appointments) {
    const { error } = await supabase.from("appointments").insert(a);
    if (error) console.error(`  ✗ ${a.patient_name} ${a.iso_date}:`, error.message);
    else console.log(`  ✓ ${a.patient_name} — ${a.iso_date} [${a.status}]`);
  }

  console.log("Clearing old health records…");
  await supabase.from("health_records").delete().gte("id", 0);

  console.log("Seeding health records…");
  for (const r of healthRecords) {
    const { error } = await supabase.from("health_records").insert(r);
    if (error) console.error(`  ✗ ${r.patient_id} ${r.recorded_at}:`, error.message);
    else console.log(`  ✓ ${r.patient_id} — ${r.recorded_at}`);
  }

  console.log("\nDone.");
}

seed();
