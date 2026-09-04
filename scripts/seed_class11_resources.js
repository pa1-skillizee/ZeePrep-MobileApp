/**
 * Seed Class 11 CBSE Mathematics Study Resources (2026 Edition)
 */
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCe8dpGyUuOsTGiNmPbDoCTC04N8yVl914",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "zeeprep01.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "zeeprep01",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "zeeprep01.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1032565153081",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1032565153081:web:48015a20f9cb2ad345dce8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const RESOURCES = [
  {
    id: "res_cbse11_math_sets_relations",
    title: "Sets, Relations & Functions: Master Revision & Formula Handbook",
    description: "Comprehensive formula sheet covering Cartesian products, real functions domain/range, power sets, and NCERT exemplar questions.",
    type: "pdf",
    url: "https://ncert.nic.in/textbook/pdf/kemh101.pdf",
    subject: "Mathematics",
    grade: "11",
    section: "A",
    stream: "Science",
    board: "CBSE",
    chapter: "Sets & Relations",
    topic: "Sets & Subsets",
    uploadedBy: "faculty_system",
    uploadedByName: "ZeePrep Mathematics Faculty",
    schoolName: "ZeePrep Demonstration Academy",
    downloadCount: 42,
    createdAt: new Date().toISOString(),
  },
  {
    id: "res_cbse11_math_trigonometry",
    title: "Trigonometric Functions & Compound Angles: Complete Reference Guide",
    description: "Step-by-step identity handbook, graph transformations, compound angle formulas (sin(A+B), cos(A+B), tan(A+B)), and general solutions.",
    type: "pdf",
    url: "https://ncert.nic.in/textbook/pdf/kemh103.pdf",
    subject: "Mathematics",
    grade: "11",
    section: "A",
    stream: "Science",
    board: "CBSE",
    chapter: "Trigonometric Functions",
    topic: "Trigonometric Identities",
    uploadedBy: "faculty_system",
    uploadedByName: "ZeePrep Mathematics Faculty",
    schoolName: "ZeePrep Demonstration Academy",
    downloadCount: 58,
    createdAt: new Date().toISOString(),
  },
  {
    id: "res_cbse11_math_complex_numbers",
    title: "Complex Numbers & Quadratic Equations: Modulus & Geometry Sheet",
    description: "Algebra of complex numbers, powers of i, conjugate, modulus-argument polar representation, and complex roots of quadratic equations.",
    type: "pdf",
    url: "https://ncert.nic.in/textbook/pdf/kemh104.pdf",
    subject: "Mathematics",
    grade: "11",
    section: "A",
    stream: "Science",
    board: "CBSE",
    chapter: "Complex Numbers",
    topic: "Complex Numbers & Modulus",
    uploadedBy: "faculty_system",
    uploadedByName: "ZeePrep Mathematics Faculty",
    schoolName: "ZeePrep Demonstration Academy",
    downloadCount: 35,
    createdAt: new Date().toISOString(),
  },
  {
    id: "res_cbse11_math_sequences_series",
    title: "Sequences and Series (A.P. & G.P.): Problem Solving Handbook",
    description: "Arithmetic & Geometric progressions, AM-GM inequalities, sum of n terms, and standard series problem solving patterns.",
    type: "pdf",
    url: "https://ncert.nic.in/textbook/pdf/kemh108.pdf",
    subject: "Mathematics",
    grade: "11",
    section: "A",
    stream: "Science",
    board: "CBSE",
    chapter: "Sequences and Series",
    topic: "Sequences & Progressions",
    uploadedBy: "faculty_system",
    uploadedByName: "ZeePrep Mathematics Faculty",
    schoolName: "ZeePrep Demonstration Academy",
    downloadCount: 29,
    createdAt: new Date().toISOString(),
  },
  {
    id: "res_cbse11_math_straight_lines_conics",
    title: "Coordinate Geometry & Conic Sections: Visual Formula Chart",
    description: "Straight line equations, distance between parallel lines, circles, parabola, ellipse, and hyperbola standard forms & eccentricities.",
    type: "pdf",
    url: "https://ncert.nic.in/textbook/pdf/kemh110.pdf",
    subject: "Mathematics",
    grade: "11",
    section: "A",
    stream: "Science",
    board: "CBSE",
    chapter: "Conic Sections",
    topic: "Conic Sections",
    uploadedBy: "faculty_system",
    uploadedByName: "ZeePrep Mathematics Faculty",
    schoolName: "ZeePrep Demonstration Academy",
    downloadCount: 51,
    createdAt: new Date().toISOString(),
  },
  {
    id: "res_cbse11_math_calculus_limits",
    title: "Limits & Derivatives: Calculus Fundamentals & Formulas",
    description: "Standard limits, trigonometric limits evaluation, product & quotient rules for derivatives with solved exemplar exercises.",
    type: "pdf",
    url: "https://ncert.nic.in/textbook/pdf/kemh112.pdf",
    subject: "Mathematics",
    grade: "11",
    section: "A",
    stream: "Science",
    board: "CBSE",
    chapter: "Limits and Derivatives",
    topic: "Limits & Continuity",
    uploadedBy: "faculty_system",
    uploadedByName: "ZeePrep Mathematics Faculty",
    schoolName: "ZeePrep Demonstration Academy",
    downloadCount: 64,
    createdAt: new Date().toISOString(),
  },
  {
    id: "res_cbse11_math_statistics_probability",
    title: "Statistics & Probability: Variance & Axiomatic Probability Guide",
    description: "Measures of dispersion, mean deviation, variance and standard deviation calculations, and axiomatic approach to probability.",
    type: "pdf",
    url: "https://ncert.nic.in/textbook/pdf/kemh114.pdf",
    subject: "Mathematics",
    grade: "11",
    section: "A",
    stream: "Science",
    board: "CBSE",
    chapter: "Statistics & Probability",
    topic: "Statistics & Variance",
    uploadedBy: "faculty_system",
    uploadedByName: "ZeePrep Mathematics Faculty",
    schoolName: "ZeePrep Demonstration Academy",
    downloadCount: 38,
    createdAt: new Date().toISOString(),
  },
];

async function run() {
  console.log("Seeding Class 11 Maths Study Resources...");
  for (const r of RESOURCES) {
    const ref = doc(db, "study_resources", r.id);
    await setDoc(ref, r, { merge: true });
    console.log(`[Resource Saved] ${r.title}`);
  }
  console.log("All study resources seeded successfully!");
}

run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
