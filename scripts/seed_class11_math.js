/**
 * ZeePrep — Class 11 CBSE Mathematics 3-Level Complete Syllabus Assessment (2026 Edition)
 * Covers 100% of Class 11 CBSE Mathematics across 3 sequential parts (25 questions each = 75 questions total):
 * 
 * - Level 1 (Part 1): Sets, Relations, Functions, Complex Numbers, Linear Inequalities, Permutations & Combinations
 * - Level 2 (Part 2): Trigonometric Functions, Sequences & Series, Straight Lines, Conic Sections, 3D Geometry
 * - Level 3 (Part 3): Limits & Derivatives (Calculus), Binomial Theorem, Statistics, Probability & Comprehensive Prep
 * 
 * All exams are standard board preparation level (no difficulty tiers).
 * Unlimited attempts allowed for all students.
 */

const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
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
const auth = getAuth(app);
const db = getFirestore(app);

// 1. DEMO STUDENT ACCOUNTS
const DEMO_STUDENTS = [
  {
    email: "demostudent1@zeeprep.com",
    password: "Password@123",
    name: "DemoStudent 1",
    loginId: "ZP-STU-1101",
    role: "student",
    grade: "11",
    section: "A",
    stream: "Science",
    board: "CBSE",
    schoolName: "ZeePrep Demonstration Academy",
    status: "active",
    approvalStatus: "approved",
  },
  {
    email: "demostudent2@zeeprep.com",
    password: "Password@123",
    name: "DemoStudent 2",
    loginId: "ZP-STU-1102",
    role: "student",
    grade: "11",
    section: "A",
    stream: "Science",
    board: "CBSE",
    schoolName: "ZeePrep Demonstration Academy",
    status: "active",
    approvalStatus: "approved",
  },
];

// =========================================================================
// LEVEL 1 QUESTIONS (Part 1: Sets, Relations, Functions, Algebra & Combinatorics)
// =========================================================================
const LEVEL_1_QUESTIONS = [
  {
    id: "q_cbse11_math_l1_01",
    text: "If set A = {x : x is a natural number and x < 6}, what is the cardinal number n(A)?",
    options: ["4", "5", "6", "Infinite"],
    correctAnswer: "5",
    explanation: "Natural numbers strictly less than 6 are {1, 2, 3, 4, 5}. Therefore, the number of elements n(A) = 5.",
    chapter: "Sets",
    topic: "Sets & Subsets",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_02",
    text: "If a set S has 4 elements, what is the total number of subsets of S?",
    options: ["8", "12", "16", "32"],
    correctAnswer: "16",
    explanation: "The total number of subsets of a finite set containing n elements is 2^n. For n = 4, total subsets = 2^4 = 16.",
    chapter: "Sets",
    topic: "Sets & Subsets",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_03",
    text: "For any two sets A and B, which of the following represents De Morgan's Law?",
    options: ["(A ∪ B)' = A' ∩ B'", "(A ∪ B)' = A' ∪ B'", "(A ∩ B)' = A' ∩ B'", "A ∪ (B ∩ C) = (A ∪ B) ∩ C"],
    correctAnswer: "(A ∪ B)' = A' ∩ B'",
    explanation: "De Morgan's Laws state: (1) (A ∪ B)' = A' ∩ B' and (2) (A ∩ B)' = A' ∪ B'.",
    chapter: "Sets",
    topic: "Set Operations & Laws",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_04",
    text: "If n(U) = 70, n(A) = 35, n(B) = 40, and n(A ∩ B) = 15, what is n(A ∪ B)'?",
    options: ["10", "15", "20", "25"],
    correctAnswer: "10",
    explanation: "n(A ∪ B) = n(A) + n(B) - n(A ∩ B) = 35 + 40 - 15 = 60. Therefore, n((A ∪ B)') = n(U) - n(A ∪ B) = 70 - 60 = 10.",
    chapter: "Sets",
    topic: "Practical Applications of Sets",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_05",
    text: "What is the domain of the real-valued function f(x) = √(16 - x²)?",
    options: ["(-∞, 4]", "[0, 4]", "[-4, 4]", "(-4, 4)"],
    correctAnswer: "[-4, 4]",
    explanation: "For f(x) to be real, the quantity under square root must be non-negative: 16 - x² ≥ 0 ⇒ x² ≤ 16 ⇒ -4 ≤ x ≤ 4. Thus, Domain = [-4, 4].",
    chapter: "Relations and Functions",
    topic: "Domain and Range of Real Functions",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_06",
    text: "What is the range of the real-valued function f(x) = |x| / x for all x ≠ 0 (Signum Function)?",
    options: ["{-1, 1}", "[-1, 1]", "Real numbers R", "[0, ∞)"],
    correctAnswer: "{-1, 1}",
    explanation: "For x > 0, |x|/x = x/x = 1. For x < 0, |x|/x = -x/x = -1. Therefore, the range is strictly the discrete set {-1, 1}.",
    chapter: "Relations and Functions",
    topic: "Special Functions",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_07",
    text: "If A = {1, 2} and B = {3, 4, 5}, how many relations can be defined from A into B?",
    options: ["6", "36", "64", "2^6 = 64"],
    correctAnswer: "2^6 = 64",
    explanation: "n(A × B) = n(A) * n(B) = 2 * 3 = 6. Total number of relations is total subsets of (A × B) = 2^6 = 64.",
    chapter: "Relations and Functions",
    topic: "Relations & Cartesian Product",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_08",
    text: "What is the value of i^99, where i = √(-1)?",
    options: ["1", "-1", "i", "-i"],
    correctAnswer: "-i",
    explanation: "99 = 4 * 24 + 3. Therefore, i^99 = (i^4)^24 * i^3 = (1)^24 * (-i) = -i.",
    chapter: "Complex Numbers",
    topic: "Powers of Iota",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_09",
    text: "What is the modulus of the complex number z = 3 - 4i?",
    options: ["1", "5", "7", "25"],
    correctAnswer: "5",
    explanation: "|z| = √(Real² + Imaginary²) = √(3² + (-4)²) = √(9 + 16) = √25 = 5.",
    chapter: "Complex Numbers",
    topic: "Modulus & Conjugate",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_10",
    text: "What is the multiplicative inverse of the complex number z = 4 - 3i?",
    options: ["(4 + 3i)/25", "(4 - 3i)/25", "(3 + 4i)/25", "-4 + 3i"],
    correctAnswer: "(4 + 3i)/25",
    explanation: "z^(-1) = z̄ / |z|² = (4 + 3i) / (4² + (-3)²) = (4 + 3i) / 25.",
    chapter: "Complex Numbers",
    topic: "Algebra of Complex Numbers",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_11",
    text: "What is the principal argument of the complex number z = -1 + i√3?",
    options: ["π/3", "2π/3", "4π/3", "-π/3"],
    correctAnswer: "2π/3",
    explanation: "Here x = -1 < 0 and y = √3 > 0, so z lies in the 2nd quadrant. tan α = |y/x| = √3 ⇒ α = π/3. Principal argument θ = π - α = π - π/3 = 2π/3.",
    chapter: "Complex Numbers",
    topic: "Polar Representation & Argument",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_12",
    text: "Find the complex roots of the quadratic equation x² + 2 = 0.",
    options: ["±√2", "±i√2", "±2i", "±i/2"],
    correctAnswer: "±i√2",
    explanation: "x² = -2 ⇒ x = ±√(-2) = ±i√2.",
    chapter: "Complex Numbers",
    topic: "Quadratic Equations with Complex Roots",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_13",
    text: "Solve the linear inequality in real numbers: 3(x - 2) / 5 ≤ 5(2 - x) / 3.",
    options: ["x ≤ 2", "x ≥ 2", "x ≤ 4", "x ≥ 4"],
    correctAnswer: "x ≤ 2",
    explanation: "Cross multiply by 15: 9(x - 2) ≤ 25(2 - x) ⇒ 9x - 18 ≤ 50 - 25x ⇒ 34x ≤ 68 ⇒ x ≤ 2.",
    chapter: "Linear Inequalities",
    topic: "Algebraic Solutions of Linear Inequalities",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_14",
    text: "What is the solution set of |x - 3| < 5 for x ∈ R?",
    options: ["(-2, 8)", "[-2, 8]", "(-8, 2)", "(-5, 5)"],
    correctAnswer: "(-2, 8)",
    explanation: "|x - 3| < 5 ⇒ -5 < x - 3 < 5. Adding 3 throughout: -2 < x < 8. In interval notation, x ∈ (-2, 8).",
    chapter: "Linear Inequalities",
    topic: "Modulus Inequalities",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_15",
    text: "How many 3-digit even numbers can be formed from digits 1, 2, 3, 4, 5, 6 if repetition of digits is NOT allowed?",
    options: ["40", "60", "80", "120"],
    correctAnswer: "60",
    explanation: "Units place must be even: 2, 4, or 6 (3 choices). Tens place has 5 remaining choices. Hundreds place has 4 remaining choices. Total = 3 * 5 * 4 = 60 numbers.",
    chapter: "Permutations and Combinations",
    topic: "Fundamental Principle of Counting",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_16",
    text: "If ⁿP₄ = 20 × ⁿP₂, what is the value of n?",
    options: ["5", "6", "7", "8"],
    correctAnswer: "7",
    explanation: "n(n-1)(n-2)(n-3) = 20 * n(n-1). Since n ≥ 4, divide by n(n-1): (n-2)(n-3) = 20 ⇒ n² - 5n + 6 = 20 ⇒ n² - 5n - 14 = 0 ⇒ (n - 7)(n + 2) = 0 ⇒ n = 7.",
    chapter: "Permutations and Combinations",
    topic: "Permutations Formulas",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_17",
    text: "In how many ways can 5 boys and 4 girls be arranged in a row so that no two girls sit together?",
    options: ["5! × ⁶P₄", "5! × 4!", "9! - 4!", "5! × 5!"],
    correctAnswer: "5! × ⁶P₄",
    explanation: "First arrange the 5 boys in 5! ways. This creates 6 available spaces (including ends) for the 4 girls. Arrange 4 girls in 6 spaces in ⁶P₄ ways. Total = 5! × ⁶P₄.",
    chapter: "Permutations and Combinations",
    topic: "Permutation Restrictions",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_18",
    text: "If ⁿC₈ = ⁿC₂, what is the value of ⁿC₂?",
    options: ["10", "45", "90", "120"],
    correctAnswer: "45",
    explanation: "ⁿCx = ⁿCy implies x = y or n = x + y. Here 8 ≠ 2, so n = 8 + 2 = 10. Then ¹⁰C₂ = (10 * 9) / (2 * 1) = 45.",
    chapter: "Permutations and Combinations",
    topic: "Combinations Properties",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_19",
    text: "A committee of 3 persons is to be chosen from 5 men and 4 women. How many committees contain exactly 1 woman?",
    options: ["20", "30", "40", "60"],
    correctAnswer: "40",
    explanation: "Select 1 woman from 4 in ⁴C₁ ways, and 2 men from 5 in ⁵C₂ ways. Total = ⁴C₁ * ⁵C₂ = 4 * 10 = 40 committees.",
    chapter: "Permutations and Combinations",
    topic: "Selection Problems",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_20",
    text: "What is the total number of chords that can be drawn through 21 points on a circle?",
    options: ["190", "210", "420", "441"],
    correctAnswer: "210",
    explanation: "A chord is formed by joining any 2 distinct points on a circle. Total chords = ²¹C₂ = (21 * 20) / 2 = 210.",
    chapter: "Permutations and Combinations",
    topic: "Geometric Combinations",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_21",
    text: "If f(x) = x² + 2x + 1 and g(x) = 2x - 3, what is (f + g)(2)?",
    options: ["8", "10", "12", "14"],
    correctAnswer: "10",
    explanation: "f(2) = 2² + 2(2) + 1 = 4 + 4 + 1 = 9. g(2) = 2(2) - 3 = 1. (f + g)(2) = f(2) + g(2) = 9 + 1 = 10.",
    chapter: "Relations and Functions",
    topic: "Algebra of Functions",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_22",
    text: "What is the conjugate of the complex number z = (1 + i) / (1 - i)?",
    options: ["i", "-i", "1 - i", "1 + i"],
    correctAnswer: "-i",
    explanation: "z = (1 + i)² / (1 - i)(1 + i) = (1 - 1 + 2i) / 2 = 2i/2 = i. The conjugate z̄ = -i.",
    chapter: "Complex Numbers",
    topic: "Conjugate of Complex Numbers",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_23",
    text: "If A and B are two sets such that n(A) = 3 and n(B) = 2, what is the number of elements in A × B?",
    options: ["5", "6", "8", "9"],
    correctAnswer: "6",
    explanation: "n(A × B) = n(A) * n(B) = 3 * 2 = 6.",
    chapter: "Relations and Functions",
    topic: "Cartesian Product",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_24",
    text: "If 1/6! + 1/7! = x/8!, what is the value of x?",
    options: ["56", "64", "72", "81"],
    correctAnswer: "64",
    explanation: "Multiply throughout by 8!: (8!/6!) + (8!/7!) = x ⇒ (8 * 7) + 8 = x ⇒ 56 + 8 = 64.",
    chapter: "Permutations and Combinations",
    topic: "Factorial Notation",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l1_25",
    text: "What is the solution of the linear inequality -3 ≤ 4 - 7x/2 ≤ 18 for x ∈ R?",
    options: "[-4, 2]",
    options: ["[-4, 2]", "[-2, 4]", "(-4, 2)", "[-4, ∞)"],
    correctAnswer: "[-4, 2]",
    explanation: "-3 - 4 ≤ -7x/2 ≤ 18 - 4 ⇒ -7 ≤ -7x/2 ≤ 14. Multiply by -2/7 (reversing inequality signs): 2 ≥ x ≥ -4 ⇒ -4 ≤ x ≤ 2. In interval form: [-4, 2].",
    chapter: "Linear Inequalities",
    topic: "Compound Linear Inequalities",
    marks: 1,
  },
];

// =========================================================================
// LEVEL 2 QUESTIONS (Part 2: Trigonometry, Coordinate Geometry, Sequences & Series, 3D Geometry)
// =========================================================================
const LEVEL_2_QUESTIONS = [
  {
    id: "q_cbse11_math_l2_01",
    text: "What is the degree measure of an angle of 7π/6 radians?",
    options: ["150°", "210°", "225°", "240°"],
    correctAnswer: "210°",
    explanation: "Degree = (7π/6) * (180°/π) = 7 * 30° = 210°.",
    chapter: "Trigonometric Functions",
    topic: "Angles & Radian Measures",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_02",
    text: "What is the exact value of sin(765°)?",
    options: ["1/2", "√3/2", "1/√2", "-1/√2"],
    correctAnswer: "1/√2",
    explanation: "765° = 2 * 360° + 45°. Therefore, sin(765°) = sin(45°) = 1/√2.",
    chapter: "Trigonometric Functions",
    topic: "Trigonometric Values of Large Angles",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_03",
    text: "What is the value of cos(15°)?",
    options: ["(√6 + √2)/4", "(√6 - √2)/4", "(√3 + 1)/2", "(√3 - 1)/2"],
    correctAnswer: "(√6 + √2)/4",
    explanation: "cos(15°) = cos(45° - 30°) = cos 45° cos 30° + sin 45° sin 30° = (1/√2)(√3/2) + (1/√2)(1/2) = (√3 + 1)/(2√2) = (√6 + √2)/4.",
    chapter: "Trigonometric Functions",
    topic: "Compound Angles",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_04",
    text: "Simplify: (sin x + sin y)² + (cos x + cos y)².",
    options: ["2 + 2 cos(x - y)", "2 - 2 cos(x - y)", "2 + 2 sin(x - y)", "4"],
    correctAnswer: "2 + 2 cos(x - y)",
    explanation: "Expand: sin²x + sin²y + 2 sin x sin y + cos²x + cos²y + 2 cos x cos y = (sin²x + cos²x) + (sin²y + cos²y) + 2(cos x cos y + sin x sin y) = 1 + 1 + 2 cos(x - y) = 2 + 2 cos(x - y).",
    chapter: "Trigonometric Functions",
    topic: "Trigonometric Identities",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_05",
    text: "What is the general solution of the trigonometric equation tan(2x) = -cot(x + π/3)?",
    options: ["x = nπ + 5π/6", "x = (n + 1/2)π - π/3", "x = nπ/3 + 5π/18", "x = 2nπ + π/6"],
    correctAnswer: "x = nπ/3 + 5π/18",
    explanation: "tan(2x) = tan(π/2 + x + π/3) = tan(x + 5π/6). General solution: 2x = nπ + x + 5π/6 ⇒ x = nπ + 5π/6. With period consideration, x = nπ/3 + 5π/18.",
    chapter: "Trigonometric Functions",
    topic: "Trigonometric Equations",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_06",
    text: "In an AP, if the 7th term is 1/9 and the 9th term is 1/7, what is the value of the 63rd term a₆₃?",
    options: ["0", "1/63", "1", "63"],
    correctAnswer: "1",
    explanation: "a + 6d = 1/9 and a + 8d = 1/7. Subtracting gives 2d = 2/63 ⇒ d = 1/63, and a = 1/63. Then a₆₃ = a + 62d = 1/63 + 62/63 = 63/63 = 1.",
    chapter: "Sequences and Series",
    topic: "Arithmetic Progressions",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_07",
    text: "What is the sum of the infinite Geometric Progression: 5, 20/7, 80/49, ...?",
    options: ["35/3", "25/3", "15", "35/4"],
    correctAnswer: "35/3",
    explanation: "Here first term a = 5 and common ratio r = (20/7)/5 = 4/7 < 1. Sum S_∞ = a / (1 - r) = 5 / (1 - 4/7) = 5 / (3/7) = 35/3.",
    chapter: "Sequences and Series",
    topic: "Infinite Geometric Series",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_08",
    text: "If AM and GM of two positive numbers a and b are 10 and 8 respectively, find the two numbers.",
    options: ["4 and 16", "2 and 18", "6 and 14", "8 and 12"],
    correctAnswer: "4 and 16",
    explanation: "(a + b)/2 = 10 ⇒ a + b = 20. √(ab) = 8 ⇒ ab = 64. Solving quadratic x² - 20x + 64 = 0 gives (x - 16)(x - 4) = 0. The numbers are 4 and 16.",
    chapter: "Sequences and Series",
    topic: "AM-GM Relationship",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_09",
    text: "What is the slope of the line passing through points (3, -2) and (-1, 4)?",
    options: ["-3/2", "3/2", "-2/3", "2/3"],
    correctAnswer: "-3/2",
    explanation: "Slope m = (y₂ - y₁) / (x₂ - x₁) = (4 - (-2)) / (-1 - 3) = 6 / (-4) = -3/2.",
    chapter: "Straight Lines",
    topic: "Slope of a Line",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_10",
    text: "Find the acute angle between the lines y - √3x - 5 = 0 and √3y - x + 6 = 0.",
    options: ["15°", "30°", "45°", "60°"],
    correctAnswer: "30°",
    explanation: "m₁ = √3 and m₂ = 1/√3. tan θ = |(m₁ - m₂) / (1 + m₁m₂)| = |(√3 - 1/√3) / (1 + √3 * 1/√3)| = |(2/√3) / 2| = 1/√3 ⇒ θ = 30°.",
    chapter: "Straight Lines",
    topic: "Angle Between Two Lines",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_11",
    text: "What is the perpendicular distance of the point (2, 3) from the line 3x + 4y - 8 = 0?",
    options: ["1 unit", "2 units", "3 units", "4 units"],
    correctAnswer: "2 units",
    explanation: "d = |Ax₁ + By₁ + C| / √(A² + B²) = |3(2) + 4(3) - 8| / √(3² + 4²) = |6 + 12 - 8| / 5 = 10 / 5 = 2 units.",
    chapter: "Straight Lines",
    topic: "Distance of a Point from a Line",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_12",
    text: "What is the distance between the parallel lines 3x - 4y + 7 = 0 and 3x - 4y + 5 = 0?",
    options: ["2/5", "1/5", "2/25", "12/5"],
    correctAnswer: "2/5",
    explanation: "d = |C₁ - C₂| / √(A² + B²) = |7 - 5| / √(3² + (-4)²) = 2 / 5.",
    chapter: "Straight Lines",
    topic: "Distance Between Parallel Lines",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_13",
    text: "Find the centre and radius of the circle: x² + y² - 4x + 6y - 12 = 0.",
    options: ["Centre (2, -3), Radius = 5", "Centre (-2, 3), Radius = 5", "Centre (2, -3), Radius = 25", "Centre (4, -6), Radius = 5"],
    correctAnswer: "Centre (2, -3), Radius = 5",
    explanation: "2g = -4 ⇒ g = -2; 2f = 6 ⇒ f = 3; c = -12. Centre = (-g, -f) = (2, -3). Radius = √(g² + f² - c) = √((-2)² + 3² - (-12)) = √(4 + 9 + 12) = √25 = 5.",
    chapter: "Conic Sections",
    topic: "Equation of Circle",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_14",
    text: "What are the coordinates of the focus and the equation of directrix of the parabola y² = 12x?",
    options: ["Focus (3, 0), Directrix x = -3", "Focus (0, 3), Directrix y = -3", "Focus (-3, 0), Directrix x = 3", "Focus (6, 0), Directrix x = -6"],
    correctAnswer: "Focus (3, 0), Directrix x = -3",
    explanation: "Standard form y² = 4ax. 4a = 12 ⇒ a = 3. Focus is (a, 0) = (3, 0) and directrix is x = -a ⇒ x = -3.",
    chapter: "Conic Sections",
    topic: "Parabola",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_15",
    text: "Find the eccentricity of the ellipse x²/25 + y²/9 = 1.",
    options: ["4/5", "3/5", "16/25", "5/4"],
    correctAnswer: "4/5",
    explanation: "Here a² = 25, b² = 9. Since a > b, eccentricity e = √(1 - b²/a²) = √(1 - 9/25) = √(16/25) = 4/5.",
    chapter: "Conic Sections",
    topic: "Ellipse & Eccentricity",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_16",
    text: "What is the length of the latus rectum of the hyperbola x²/16 - y²/9 = 1?",
    options: ["9/2", "9/4", "18/5", "8/3"],
    correctAnswer: "9/2",
    explanation: "Here a² = 16 (a = 4), b² = 9. Length of latus rectum = 2b² / a = 2(9) / 4 = 18/4 = 9/2.",
    chapter: "Conic Sections",
    topic: "Hyperbola",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_17",
    text: "In which octant does the point P(-3, 1, -2) lie in 3D coordinate space?",
    options: ["Octant II", "Octant III", "Octant VI", "Octant VIII"],
    correctAnswer: "Octant VI",
    explanation: "Signs are (-, +, -). In standard 3D coordinate convention, (-, +, +) is Octant II and (-, +, -) is Octant VI.",
    chapter: "Introduction to Three-Dimensional Geometry",
    topic: "Coordinate Planes & Octants",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_18",
    text: "Find the distance between the points P(1, -3, 4) and Q(-4, 1, 2) in 3D space.",
    options: ["3√5", "√45", "√45 = 3√5", "7"],
    correctAnswer: "3√5",
    explanation: "d = √[(-4 - 1)² + (1 - (-3))² + (2 - 4)²] = √[(-5)² + (4)² + (-2)²] = √[25 + 16 + 4] = √45 = 3√5.",
    chapter: "Introduction to Three-Dimensional Geometry",
    topic: "Distance Formula in 3D",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_19",
    text: "Find the coordinates of the point which divides the line segment joining (1, -2, 3) and (3, 4, -5) internally in the ratio 2 : 3.",
    options: ["(9/5, 2/5, -1/5)", "(7/5, 2/5, -1/5)", "(2, 1, -1)", "(5/2, 1, -1)"],
    correctAnswer: "(9/5, 2/5, -1/5)",
    explanation: "Using section formula: x = (2*3 + 3*1)/5 = 9/5; y = (2*4 + 3*(-2))/5 = (8-6)/5 = 2/5; z = (2*(-5) + 3*3)/5 = (-10+9)/5 = -1/5. Point is (9/5, 2/5, -1/5).",
    chapter: "Introduction to Three-Dimensional Geometry",
    topic: "Section Formula in 3D",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_20",
    text: "If sin θ + cosec θ = 2, what is the value of sin¹⁰ θ + cosec¹⁰ θ?",
    options: ["1", "2", "2¹⁰", "10"],
    correctAnswer: "2",
    explanation: "sin θ + 1/sin θ = 2 ⇒ sin²θ - 2sin θ + 1 = 0 ⇒ (sin θ - 1)² = 0 ⇒ sin θ = 1. Then cosec θ = 1. Thus sin¹⁰θ + cosec¹⁰θ = 1¹⁰ + 1¹⁰ = 2.",
    chapter: "Trigonometric Functions",
    topic: "Trigonometric Identities",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_21",
    text: "What is the 10th term of the Geometric Progression: 5, 25, 125, ...?",
    options: ["5¹⁰", "5⁹", "5⁸", "2500"],
    correctAnswer: "5¹⁰",
    explanation: "First term a = 5, common ratio r = 5. The 10th term a₁₀ = a * r^(10 - 1) = 5 * 5⁹ = 5¹⁰.",
    chapter: "Sequences and Series",
    topic: "Geometric Progressions",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_22",
    text: "What is the equation of the line passing through (2, 2√3) and inclined with the x-axis at an angle of 75°?",
    options: ["(√3 + 1)x - (√3 - 1)y = 4(1 - √3)", "(2 + √3)x - y + (2√3 - 4 - 2√3) = 0", "(2 + √3)x - y - 4 = 0", "√3x + y = 6"],
    correctAnswer: "(2 + √3)x - y - 4 = 0",
    explanation: "Slope m = tan 75° = 2 + √3. Point is (2, 2√3). Equation: y - 2√3 = (2 + √3)(x - 2) ⇒ y - 2√3 = (2 + √3)x - 4 - 2√3 ⇒ (2 + √3)x - y - 4 = 0.",
    chapter: "Straight Lines",
    topic: "Equation of a Line",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_23",
    text: "Find the coordinates of the foci of the hyperbola 9y² - 4x² = 36.",
    options: ["(0, ±√13)", "(±√13, 0)", "(0, ±5)", "(±5, 0)"],
    correctAnswer: "(0, ±√13)",
    explanation: "Divide by 36: y²/4 - x²/9 = 1 (vertical hyperbola). a² = 4, b² = 9. c² = a² + b² = 4 + 9 = 13 ⇒ c = √13. Foci are (0, ±c) = (0, ±√13).",
    chapter: "Conic Sections",
    topic: "Hyperbola Foci",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_24",
    text: "Find the ratio in which the YZ-plane divides the line segment formed by joining (-2, 4, 7) and (3, -5, 8).",
    options: ["2 : 3 internally", "2 : 3 externally", "3 : 2 internally", "1 : 2 internally"],
    correctAnswer: "2 : 3 internally",
    explanation: "On the YZ-plane, x = 0. Let ratio be k : 1. x = (3k - 2) / (k + 1) = 0 ⇒ 3k - 2 = 0 ⇒ k = 2/3. Thus the ratio is 2 : 3 internally.",
    chapter: "Introduction to Three-Dimensional Geometry",
    topic: "Coordinate Plane Intercepts",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l2_25",
    text: "What is the value of tan(13π/12)?",
    options: ["2 - √3", "2 + √3", "√3 - 1", "√3 + 1"],
    correctAnswer: "2 - √3",
    explanation: "tan(13π/12) = tan(π + π/12) = tan(π/12) = tan(15°) = (√3 - 1)/(√3 + 1) = (√3 - 1)²/2 = (4 - 2√3)/2 = 2 - √3.",
    chapter: "Trigonometric Functions",
    topic: "Trigonometric Values",
    marks: 1,
  },
];

// =========================================================================
// LEVEL 3 QUESTIONS (Part 3: Calculus, Binomial Theorem, Statistics, Probability & Comprehensive Synthesis)
// =========================================================================
const LEVEL_3_QUESTIONS = [
  {
    id: "q_cbse11_math_l3_01",
    text: "Evaluate the limit: lim(x → 0) [sin(4x) / sin(2x)].",
    options: ["1/2", "1", "2", "4"],
    correctAnswer: "2",
    explanation: "Rewrite as lim(x→0) [(sin 4x / 4x) * 4x] / [(sin 2x / 2x) * 2x] = (1 * 4) / (1 * 2) = 4 / 2 = 2.",
    chapter: "Limits and Derivatives",
    topic: "Trigonometric Limits",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_02",
    text: "Evaluate the limit: lim(x → 0) [(1 - cos x) / x²].",
    options: ["0", "1/2", "1", "Does not exist"],
    correctAnswer: "1/2",
    explanation: "1 - cos x = 2 sin²(x/2). Then lim(x→0) [2 sin²(x/2) / x²] = 2 * lim [(sin(x/2) / (x/2)) * (1/2)]² = 2 * (1/4) = 1/2.",
    chapter: "Limits and Derivatives",
    topic: "Standard Calculus Limits",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_03",
    text: "Evaluate: lim(x → 2) [(x³ - 8) / (x - 2)].",
    options: ["4", "8", "12", "16"],
    correctAnswer: "12",
    explanation: "Using standard formula lim(x→a) (xⁿ - aⁿ)/(x - a) = n*a^(n-1): here n = 3, a = 2. Limit = 3 * 2^(3-1) = 3 * 4 = 12.",
    chapter: "Limits and Derivatives",
    topic: "Algebraic Limits",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_04",
    text: "Find the derivative of f(x) = sin x · cos x with respect to x.",
    options: ["cos(2x)", "sin(2x)", "cos²x - sin²x", "cos(2x)"],
    correctAnswer: "cos(2x)",
    explanation: "f(x) = (1/2) sin(2x). Differentiating: f'(x) = (1/2) * 2 cos(2x) = cos(2x) = cos²x - sin²x.",
    chapter: "Limits and Derivatives",
    topic: "Product Rule of Differentiation",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_05",
    text: "Find the derivative of f(x) = (x + 1) / (x - 1) for x ≠ 1.",
    options: ["-2 / (x - 1)²", "2 / (x - 1)²", "-2 / (x + 1)²", "1 / (x - 1)²"],
    correctAnswer: "-2 / (x - 1)²",
    explanation: "Using quotient rule: f'(x) = [(x - 1)(1) - (x + 1)(1)] / (x - 1)² = [x - 1 - x - 1] / (x - 1)² = -2 / (x - 1)².",
    chapter: "Limits and Derivatives",
    topic: "Quotient Rule of Differentiation",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_06",
    text: "Find the derivative of tan x from first principles.",
    options: ["sec x", "sec² x", "-sec² x", "cosec² x"],
    correctAnswer: "sec² x",
    explanation: "d/dx(tan x) = lim(h→0) [tan(x+h) - tan x]/h = lim(h→0) [sin h / (h cos(x+h) cos x)] = 1 / cos²x = sec²x.",
    chapter: "Limits and Derivatives",
    topic: "First Principle of Differentiation",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_07",
    text: "What is the total number of terms in the binomial expansion of (x + 2a)⁸?",
    options: ["7", "8", "9", "16"],
    correctAnswer: "9",
    explanation: "In the expansion of (a + b)ⁿ, the total number of terms is always n + 1. For n = 8, number of terms = 8 + 1 = 9.",
    chapter: "Binomial Theorem",
    topic: "Number of Terms in Expansion",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_08",
    text: "Find the 4th term T₄ in the expansion of (x - 2y)¹².",
    options: ["-1760 x⁹ y³", "1760 x⁹ y³", "-220 x⁹ y³", "220 x⁹ y³"],
    correctAnswer: "-1760 x⁹ y³",
    explanation: "T_{r+1} = ⁿCᵣ x^(n-r) y^r. For r = 3 (4th term): T₄ = ¹²C₃ (x)^(12-3) (-2y)³ = 220 * x⁹ * (-8y³) = -1760 x⁹ y³.",
    chapter: "Binomial Theorem",
    topic: "General Term in Expansion",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_09",
    text: "What is the middle term in the expansion of (x/3 + 9y)¹⁰?",
    options: ["T₅", "T₆", "T₇", "Both T₅ and T₆"],
    correctAnswer: "T₆",
    explanation: "Here n = 10 (even). Number of terms is 11. The unique middle term is T_{(n/2)+1} = T_{(10/2)+1} = T₆.",
    chapter: "Binomial Theorem",
    topic: "Middle Term in Binomial Expansion",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_10",
    text: "Find the term independent of x in the expansion of (3x²/2 - 1/3x)⁶.",
    options: ["5/12", "15/8", "5/18", "5/8"],
    correctAnswer: "5/12",
    explanation: "T_{r+1} = ⁶Cᵣ (3x²/2)^(6-r) (-1/3x)^r. Exponent of x is 2(6 - r) - r = 12 - 3r. For term independent of x: 12 - 3r = 0 ⇒ r = 4. T₅ = ⁶C₄ (3/2)² (-1/3)⁴ = 15 * (9/4) * (1/81) = 15 / 36 = 5/12.",
    chapter: "Binomial Theorem",
    topic: "Independent Term",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_11",
    text: "What is the mean of the first n natural numbers?",
    options: ["n/2", "(n + 1)/2", "n(n + 1)/2", "(2n + 1)/2"],
    correctAnswer: "(n + 1)/2",
    explanation: "Sum of first n natural numbers is n(n + 1)/2. Mean = Sum / n = [n(n + 1)/2] / n = (n + 1)/2.",
    chapter: "Statistics",
    topic: "Measures of Central Tendency",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_12",
    text: "Find the variance of the observations: 2, 4, 6, 8, 10.",
    options: ["4", "8", "10", "16"],
    correctAnswer: "8",
    explanation: "Mean x̄ = (2+4+6+8+10)/5 = 30/5 = 6. Deviations (x - x̄): -4, -2, 0, 2, 4. Squared: 16, 4, 0, 4, 16. Sum = 40. Variance σ² = 40 / 5 = 8.",
    chapter: "Statistics",
    topic: "Variance and Standard Deviation",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_13",
    text: "If each observation in a data set is multiplied by a constant k = 3, what happens to the standard deviation σ?",
    options: ["Remains unchanged", "Becomes 3 times original σ", "Becomes 9 times original σ", "Becomes √3 times original σ"],
    correctAnswer: "Becomes 3 times original σ",
    explanation: "Multiplying each observation by a constant k multiplies the standard deviation by |k|. Here k = 3, so new SD = 3σ.",
    chapter: "Statistics",
    topic: "Properties of Standard Deviation",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_14",
    text: "If two events A and B are mutually exclusive, which of the following is always true?",
    options: ["P(A ∩ B) = 0", "P(A ∪ B) = 1", "P(A) = P(B)", "P(A ∩ B) = P(A) · P(B)"],
    correctAnswer: "P(A ∩ B) = 0",
    explanation: "Mutually exclusive events cannot occur simultaneously, which means A ∩ B = ∅. Therefore, P(A ∩ B) = 0.",
    chapter: "Probability",
    topic: "Axiomatic Probability & Event Algebra",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_15",
    text: "If P(A) = 3/5, P(B) = 1/5, and A and B are mutually exclusive events, find P(A ∪ B).",
    options: ["2/5", "3/25", "4/5", "1"],
    correctAnswer: "4/5",
    explanation: "For mutually exclusive events: P(A ∪ B) = P(A) + P(B) = 3/5 + 1/5 = 4/5.",
    chapter: "Probability",
    topic: "Addition Theorem of Probability",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_16",
    text: "Two dice are thrown simultaneously. What is the probability of getting a sum of 8?",
    options: ["5/36", "1/6", "7/36", "1/12"],
    correctAnswer: "5/36",
    explanation: "Total outcomes = 36. Favorable pairs with sum 8 are: (2,6), (3,5), (4,4), (5,3), (6,2) — exactly 5 outcomes. Probability = 5/36.",
    chapter: "Probability",
    topic: "Classical Probability",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_17",
    text: "If P(A) = 0.5, P(B) = 0.3, and P(A ∩ B) = 0.15, find P(A' ∩ B').",
    options: ["0.35", "0.45", "0.65", "0.85"],
    correctAnswer: "0.35",
    explanation: "By De Morgan's Law: P(A' ∩ B') = P((A ∪ B)') = 1 - P(A ∪ B). P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = 0.5 + 0.3 - 0.15 = 0.65. Thus P(A' ∩ B') = 1 - 0.65 = 0.35.",
    chapter: "Probability",
    topic: "Probability of Complementary Events",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_18",
    text: "Evaluate: lim(x → 0) [(e^(3x) - 1) / x].",
    options: ["1", "3", "e³", "0"],
    correctAnswer: "3",
    explanation: "Using standard exponential limit lim(u→0) (e^u - 1)/u = 1. Here lim(x→0) [(e^(3x) - 1) / (3x)] * 3 = 1 * 3 = 3.",
    chapter: "Limits and Derivatives",
    topic: "Exponential Limits",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_19",
    text: "Find the derivative of f(x) = x³ · e^x with respect to x.",
    options: ["x² e^x (x + 3)", "3x² e^x", "x³ e^x", "x² e^x (x - 3)"],
    correctAnswer: "x² e^x (x + 3)",
    explanation: "f'(x) = (d/dx(x³)) e^x + x³ (d/dx(e^x)) = 3x² e^x + x³ e^x = x² e^x (3 + x) = x² e^x (x + 3).",
    chapter: "Limits and Derivatives",
    topic: "Product Rule with Exponential Functions",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_20",
    text: "What is the coefficient of x⁵ in the expansion of (1 + x)¹⁰?",
    options: ["120", "210", "252", "504"],
    correctAnswer: "252",
    explanation: "Coefficient of x⁵ is ¹⁰C₅ = (10 * 9 * 8 * 7 * 6) / (5 * 4 * 3 * 2 * 1) = 252.",
    chapter: "Binomial Theorem",
    topic: "Binomial Coefficients",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_21",
    text: "Find the mean deviation about the mean for the data: 6, 7, 10, 12, 13, 4, 8, 12.",
    options: ["2.75", "3.25", "3.75", "4.25"],
    correctAnswer: "2.75",
    explanation: "Sum = 72, n = 8 ⇒ Mean x̄ = 72/8 = 9. Absolute deviations |x - 9|: 3, 2, 1, 3, 4, 5, 1, 3. Sum of deviations = 22. Mean deviation = 22 / 8 = 2.75.",
    chapter: "Statistics",
    topic: "Mean Deviation",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_22",
    text: "A card is drawn from a well-shuffled pack of 52 cards. What is the probability that the card is either a King or a Diamond?",
    options: ["4/13", "16/52 = 4/13", "17/52", "1/4"],
    correctAnswer: "4/13",
    explanation: "P(King) = 4/52, P(Diamond) = 13/52, P(King of Diamonds) = 1/52. P(King ∪ Diamond) = (4 + 13 - 1)/52 = 16/52 = 4/13.",
    chapter: "Probability",
    topic: "Addition Rule in Card Problems",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_23",
    text: "Evaluate: lim(x → 0) [ln(1 + 5x) / x].",
    options: ["1", "5", "1/5", "0"],
    correctAnswer: "5",
    explanation: "Using standard logarithmic limit lim(u→0) ln(1 + u)/u = 1. Here lim(x→0) [ln(1 + 5x) / 5x] * 5 = 1 * 5 = 5.",
    chapter: "Limits and Derivatives",
    topic: "Logarithmic Limits",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_24",
    text: "Find the derivative of f(x) = cosec x · cot x with respect to x.",
    options: ["-cosec x (cosec² x + cot² x)", "cosec x (cosec² x - cot² x)", "-cosec² x cot x", "cosec x cot² x"],
    correctAnswer: "-cosec x (cosec² x + cot² x)",
    explanation: "f'(x) = (d/dx(cosec x)) cot x + cosec x (d/dx(cot x)) = (-cosec x cot x) cot x + cosec x (-cosec² x) = -cosec x (cot² x + cosec² x).",
    chapter: "Limits and Derivatives",
    topic: "Trigonometric Derivatives",
    marks: 1,
  },
  {
    id: "q_cbse11_math_l3_25",
    text: "If standard deviation of a sample is 4 and mean is 20, what is the coefficient of variation (CV)?",
    options: ["16%", "20%", "25%", "80%"],
    correctAnswer: "20%",
    explanation: "Coefficient of Variation (CV) = (σ / Mean) * 100 = (4 / 20) * 100 = 20%.",
    chapter: "Statistics",
    topic: "Coefficient of Variation",
    marks: 1,
  },
];

async function seed() {
  console.log("=======================================================");
  console.log("SEEDING 75 CBSE CLASS 11 MATHS QUESTIONS & 3 PROGRESSIVE EXAMS");
  console.log("=======================================================");

  // 1. Create Demo Students in Auth and Firestore
  for (const s of DEMO_STUDENTS) {
    let uid = "";
    try {
      const cred = await createUserWithEmailAndPassword(auth, s.email, s.password);
      uid = cred.user.uid;
      console.log(`[Auth Created] ${s.name} (${s.email})`);
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        try {
          const cred = await signInWithEmailAndPassword(auth, s.email, s.password);
          uid = cred.user.uid;
          console.log(`[Auth Exists] ${s.name} (${s.email})`);
        } catch (signInErr) {
          console.warn(`Could not sign in ${s.email}:`, signInErr.message);
        }
      } else {
        console.warn(`Auth creation error for ${s.email}:`, e.message);
      }
    }

    if (uid) {
      await setDoc(doc(db, "users", uid), { ...s, uid, createdAt: new Date().toISOString() }, { merge: true });
      await setDoc(doc(db, "loginIds", s.loginId), { email: s.email, uid, role: s.role }, { merge: true });
      console.log(`[User Record Saved] UID: ${uid} | LoginID: ${s.loginId}`);
    }
  }

  // 1.5 Authenticate as Teacher/Admin for Question & Exam Write Authorization
  try {
    await signInWithEmailAndPassword(auth, "teacher1@zeeprep.com", "Password@123");
    console.log("[Auth] Authenticated as Faculty Superadmin: teacher1@zeeprep.com");
  } catch (tErr) {
    try {
      const tCred = await createUserWithEmailAndPassword(auth, "teacher1@zeeprep.com", "Password@123");
      await setDoc(doc(db, "users", tCred.user.uid), {
        uid: tCred.user.uid,
        email: "teacher1@zeeprep.com",
        name: "ZeePrep Faculty Admin",
        role: "teacher",
        status: "active",
        approvalStatus: "approved",
      }, { merge: true });
      console.log("[Auth] Created & Authenticated as Faculty Superadmin: teacher1@zeeprep.com");
    } catch (e2) {
      console.warn("[Auth] Teacher sign-in warning:", e2.message);
    }
  }

  // 2. Upload all 75 questions to question_bank
  const allQuestions = [...LEVEL_1_QUESTIONS, ...LEVEL_2_QUESTIONS, ...LEVEL_3_QUESTIONS];
  console.log(`[Firestore] Seeding ${allQuestions.length} Questions to question_bank...`);

  for (const q of allQuestions) {
    const qRef = doc(db, "questions", q.id);
    await setDoc(
      qRef,
      {
        id: q.id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        chapter: q.chapter,
        topic: q.topic,
        grade: "11",
        subject: "Mathematics",
        stream: "Science",
        board: "CBSE",
        marks: q.marks || 1,
        createdBy: "faculty_system",
        isTeacherAuthority: true,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
  console.log(`[Firestore] All ${allQuestions.length} questions successfully uploaded.`);

  // 3. Create 3 Progressive Level Exams (Covering the entire syllabus)
  const EXAMS = [
    {
      id: "exam_cbse11_math_lvl1",
      title: "Class 11 CBSE Mathematics — Level 1: Sets, Relations, Complex Numbers & Algebra (Part 1)",
      description: "Level 1 Assessment covering Sets, Relations, Functions, Complex Numbers, Linear Inequalities, and Permutations & Combinations (25 Questions). Complete this part to unlock Level 2.",
      subject: "Mathematics",
      grade: "11",
      section: "A",
      stream: "Science",
      board: "CBSE",
      academicSession: "2026-2027",
      durationMinutes: 60,
      totalMarks: 25,
      passingMarks: 10,
      passingPercentage: 40,
      negativeMarkingEnabled: false,
      maxAttempts: "unlimited",
      level: "level1",
      levelNumber: 1,
      totalLevels: 3,
      seriesId: "cbse11_math_3levels",
      questionIds: LEVEL_1_QUESTIONS.map((q) => q.id),
      status: "published",
      createdBy: "faculty_system",
      createdByName: "ZeePrep Mathematics Faculty",
      instructions: [
        "This examination contains 25 CBSE board-aligned multiple-choice questions.",
        "Total duration is 60 minutes (1 Hour).",
        "Each question carries 1 mark. There is no negative marking.",
        "Covers: Sets, Relations & Functions, Complex Numbers, Linear Inequalities, and Permutations & Combinations.",
        "A separate diagnostic scorecard and topic breakdown is generated upon submission.",
        "Submitting this level unlocks Level 2 (Part 2 of the syllabus).",
      ],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "exam_cbse11_math_lvl2",
      title: "Class 11 CBSE Mathematics — Level 2: Trigonometry, Coordinate Geometry & Sequences (Part 2)",
      description: "Level 2 Assessment covering Trigonometric Functions, Sequences & Series (AP/GP), Straight Lines, Conic Sections, and 3D Geometry (25 Questions). Prerequisite: Level 1 submitted.",
      subject: "Mathematics",
      grade: "11",
      section: "A",
      stream: "Science",
      board: "CBSE",
      academicSession: "2026-2027",
      durationMinutes: 60,
      totalMarks: 25,
      passingMarks: 10,
      passingPercentage: 40,
      negativeMarkingEnabled: false,
      maxAttempts: "unlimited",
      level: "level2",
      levelNumber: 2,
      totalLevels: 3,
      seriesId: "cbse11_math_3levels",
      prerequisiteExamId: "exam_cbse11_math_lvl1",
      questionIds: LEVEL_2_QUESTIONS.map((q) => q.id),
      status: "published",
      createdBy: "faculty_system",
      createdByName: "ZeePrep Mathematics Faculty",
      instructions: [
        "This examination contains 25 CBSE board-aligned multiple-choice questions.",
        "Total duration is 60 minutes (1 Hour).",
        "Each question carries 1 mark. There is no negative marking.",
        "Covers: Trigonometric Functions, Sequences and Series, Straight Lines, Conic Sections, and 3D Geometry.",
        "Prerequisite: You must complete and submit Level 1 before accessing this level.",
        "Submitting this level unlocks Level 3 (Part 3 of the syllabus).",
      ],
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "exam_cbse11_math_lvl3",
      title: "Class 11 CBSE Mathematics — Level 3: Limits, Calculus, Statistics & Probability (Part 3)",
      description: "Level 3 Assessment covering Limits & Derivatives (Calculus), Binomial Theorem, Statistics, Axiomatic Probability, and Comprehensive Prep (25 Questions). Prerequisite: Level 2 submitted.",
      subject: "Mathematics",
      grade: "11",
      section: "A",
      stream: "Science",
      board: "CBSE",
      academicSession: "2026-2027",
      durationMinutes: 60,
      totalMarks: 25,
      passingMarks: 10,
      passingPercentage: 40,
      negativeMarkingEnabled: false,
      maxAttempts: "unlimited",
      level: "level3",
      levelNumber: 3,
      totalLevels: 3,
      seriesId: "cbse11_math_3levels",
      prerequisiteExamId: "exam_cbse11_math_lvl2",
      questionIds: LEVEL_3_QUESTIONS.map((q) => q.id),
      status: "published",
      createdBy: "faculty_system",
      createdByName: "ZeePrep Mathematics Faculty",
      instructions: [
        "This examination contains 25 CBSE board-aligned multiple-choice questions.",
        "Total duration is 60 minutes (1 Hour).",
        "Each question carries 1 mark.",
        "Covers: Limits & Derivatives (Calculus), Binomial Theorem, Measures of Dispersion & Variance, Axiomatic Probability, and Comprehensive Board Prep.",
        "Prerequisite: You must complete and submit Level 2 before accessing this level.",
        "All 3 levels together provide 100% preparation for Class 11 CBSE Mathematics.",
      ],
      createdAt: new Date().toISOString(),
    },
  ];

  console.log(`[Firestore] Writing 3 Progressive Level exams...`);
  for (const ex of EXAMS) {
    const exRef = doc(db, "exams", ex.id);
    await setDoc(exRef, ex, { merge: true });
    console.log(`[Firestore] Exam created: ${ex.title} (${ex.id})`);
  }

  console.log("\n=======================================================");
  console.log("SEEDED SUCCESSFULLY!");
  console.log("=======================================================");
  console.log("Student 1: demostudent1@zeeprep.com (ID: ZP-STU-1101) / Password@123");
  console.log("Student 2: demostudent2@zeeprep.com (ID: ZP-STU-1102) / Password@123");
  console.log("3 Levels: Part 1 (Algebra), Part 2 (Trigonometry & Conics), Part 3 (Calculus & Stats)");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
