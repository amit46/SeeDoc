import "dotenv/config";
import supabase from "./db.js";

const patients = [
  {
    id: "P001",
    name: "Margaret Chen",
    age: 71,
    sex: "F",
    username: "margaret",
    password: "patient123",
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
    id: "P002",
    name: "James Okonkwo",
    age: 34,
    sex: "M",
    username: "james",
    password: "patient123",
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
Hereditary risk note: Significant paternal family history of Alzheimer's disease. Patient should be counselled on modifiable risk factors (cardiovascular health, sleep, exercise). Father's cardiometabolic pattern suggests patient is at elevated risk for hypertension and T2DM by his 40s — baseline labs warranted.`,
  },
  {
    id: "P003",
    name: "Eleanor Vasquez",
    age: 58,
    sex: "F",
    username: "eleanor",
    password: "patient123",
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
Hereditary risk note: Strong maternal history of hormone-receptor-positive breast cancer and a sister with confirmed BRCA2 mutation. Overdue mammogram is high-priority — patient should be referred for BRCA genetic testing. Paternal diabetes pattern mirrors patient's own glucose trajectory. Alzheimer's risk elevated on maternal side.`,
  },
];

async function seed() {
  console.log("Seeding patients…");
  for (const p of patients) {
    const { error } = await supabase
      .from("patients")
      .upsert(p, { onConflict: "id" });
    if (error) {
      console.error(`Failed to seed ${p.name}:`, error.message);
    } else {
      console.log(`✓ ${p.name}`);
    }
  }
  console.log("Done.");
}

seed();
