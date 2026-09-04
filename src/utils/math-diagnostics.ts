/**
 * ZeePrep CBSE 2026 Mathematics Diagnostic Engine
 * Pinpoints specific mathematical problem types, chapters, topics, formulas,
 * student misconceptions, and targeted remedial steps.
 */

export interface MathDiagnosisResult {
  problemType: string;
  chapter: string;
  topic: string;
  formulaStruggledWith: string;
  conceptStruggledWith: string;
  exactRemedy: string;
  severity: "high" | "medium" | "low";
}

interface MathPattern {
  keywords: string[];
  problemType: string;
  chapter: string;
  topic: string;
  formula: string;
  concept: string;
  remedy: string;
}

const MATH_PATTERNS: MathPattern[] = [
  // 1. Sets & Relations
  {
    keywords: ["power set", "subset", "2^n", "cardinality", "p(a)"],
    problemType: "Power Set & Subset Cardinality Calculation",
    chapter: "Sets",
    topic: "Power Sets & Subsets",
    formula: "n(P(A)) = 2^n(A)",
    concept: "Counting total subsets including empty set ∅ and the set itself.",
    remedy: "Remember that a set with n elements has exactly 2ⁿ subsets and 2ⁿ - 1 proper non-empty subsets.",
  },
  {
    keywords: ["symmetric difference", "a △ b", "(a - b) ∪ (b - a)", "union", "intersection"],
    problemType: "Set Operations & Symmetric Difference",
    chapter: "Sets",
    topic: "Venn Diagrams & Set Operations",
    formula: "A △ B = (A ∪ B) - (A ∩ B) = (A - B) ∪ (B - A)",
    concept: "Elements that belong to either A or B, but NOT both simultaneously.",
    remedy: "Draw a 2-circle Venn diagram and shade the regions belonging to A only and B only.",
  },
  {
    keywords: ["domain", "range", "relation", "equivalence relation", "reflexive", "symmetric", "transitive"],
    problemType: "Relation Properties & Domain/Range Evaluation",
    chapter: "Relations & Functions",
    topic: "Equivalence Relations & Domain Analysis",
    formula: "Reflexive: (a,a)∈R; Symmetric: (a,b)∈R ⇒ (b,a)∈R; Transitive: (a,b),(b,c)∈R ⇒ (a,c)∈R",
    concept: "Testing all 3 criteria (reflexive, symmetric, transitive) across universal set elements.",
    remedy: "Check counterexamples for transitivity whenever (a,b) and (b,c) exist but (a,c) is absent.",
  },
  {
    keywords: ["f(x)", "modulus", "|x|", "square root", "domain of function", "√(x² - a²)"],
    problemType: "Real Function Domain & Constraint Finding",
    chapter: "Relations & Functions",
    topic: "Domain of Radical & Modulus Functions",
    formula: "For f(x) = √(g(x)), condition: g(x) ≥ 0; For 1/g(x), condition: g(x) ≠ 0",
    concept: "Ensuring radicand is non-negative and denominator is strictly non-zero.",
    remedy: "Solve the inequality g(x) ≥ 0 using the wavy curve (sign scheme) method.",
  },

  // 2. Complex Numbers
  {
    keywords: ["i^", "imaginary", "iota", "i²", "complex number", "real part", "imaginary part"],
    problemType: "Powers of Iota & Complex Arithmetic",
    chapter: "Complex Numbers & Quadratic Equations",
    topic: "Integral Powers of Iota (i)",
    formula: "i = √(-1), i² = -1, i³ = -i, i⁴ = 1  ⇒  i^(4k+r) = i^r",
    concept: "Reducing high powers of i by dividing the exponent by 4 and evaluating the remainder.",
    remedy: "Divide the power of i by 4; if remainder is 0 → 1, 1 → i, 2 → -1, 3 → -i.",
  },
  {
    keywords: ["modulus of complex", "|z|", "argument", "arg(z)", "polar form", "conjugate"],
    problemType: "Modulus & Principal Argument Calculation",
    chapter: "Complex Numbers & Quadratic Equations",
    topic: "Modulus and Argument of Complex Numbers",
    formula: "|z| = √(x² + y²),  θ = arg(z) = tan⁻¹(|y/x|) with Quadrant Sign Adjustment",
    concept: "Determining the principal argument in the interval (-π, π] based on Argand plane quadrant.",
    remedy: "Identify quadrant of z: Q1: θ=α, Q2: θ=π-α, Q3: θ=-(π-α), Q4: θ=-α where α = tan⁻¹(|y/x|).",
  },

  // 3. Linear Inequalities
  {
    keywords: ["inequality", "|x| < a", "|x| > a", "solution set", "interval"],
    problemType: "Absolute Value Linear Inequality Solving",
    chapter: "Linear Inequalities",
    topic: "Modulus Inequalities on Real Line",
    formula: "|x - c| ≤ r  ⟺  c - r ≤ x ≤ c + r;  |x - c| ≥ r  ⟺  x ≤ c - r or x ≥ c + r",
    concept: "Splitting modulus into dual bounded or unbounded intervals on the real number line.",
    remedy: "Remember that |x| < a means x lies within distance a of 0: (-a, a).",
  },

  // 4. Permutations & Combinations
  {
    keywords: ["permutation", "combination", "npr", "ncr", "arranged", "selected", "factorial"],
    problemType: "Combinatorial Selection & Arrangement",
    chapter: "Permutations and Combinations",
    topic: "Fundamental Principle of Counting & Combinations",
    formula: "ⁿPᵣ = n! / (n - r)!,  ⁿCᵣ = n! / (r!(n - r)!),  ⁿCᵣ = ⁿCₙ₋ᵣ",
    concept: "Distinguishing when order matters (Permutations) vs when order does not matter (Combinations).",
    remedy: "If forming teams/committees → use ⁿCᵣ. If seating in a row or assigning specific roles → use ⁿPᵣ.",
  },

  // 5. Trigonometric Functions
  {
    keywords: ["radian", "degree", "7π/6", "π radians", "180°"],
    problemType: "Radian to Degree Angle Conversion",
    chapter: "Trigonometric Functions",
    topic: "Angle Measurement & Radian Systems",
    formula: "Degree = Radian × (180° / π),  Radian = Degree × (π / 180°)",
    concept: "Converting between sexagesimal (degrees) and circular (radians) units.",
    remedy: "Multiply the radian value by 180 and divide by π; cancel π first.",
  },
  {
    keywords: ["sin(x + y)", "cos(x - y)", "tan(a + b)", "compound angle", "sin 75°", "cos 15°"],
    problemType: "Trigonometric Compound Angle Identity",
    chapter: "Trigonometric Functions",
    topic: "Compound Angle Addition & Subtraction",
    formula: "sin(A ± B) = sin A cos B ± cos A sin B;  cos(A ± B) = cos A cos B ∓ sin A sin B",
    concept: "Expanding composite angles into product terms with proper algebraic signs.",
    remedy: "For cos(A + B), remember the sign is NEGATIVE between products: cos A cos B - sin A sin B.",
  },
  {
    keywords: ["cos 2x", "sin 2x", "tan 2x", "double angle", "half angle", "1 - cos 2x", "1 + cos 2x"],
    problemType: "Double Angle & Sub-Multiple Angle Identity",
    chapter: "Trigonometric Functions",
    topic: "Multiple and Sub-Multiple Angles",
    formula: "cos 2θ = cos²θ - sin²θ = 2cos²θ - 1 = 1 - 2sin²θ;  1 - cos 2θ = 2sin²θ",
    concept: "Replacing double angle terms to simplify rational trigonometric fractions.",
    remedy: "Use 1 - cos 2θ = 2sin²θ and 1 + cos 2θ = 2cos²θ for immediate simplification in calculus & trig.",
  },

  // 6. Sequences & Series
  {
    keywords: ["arithmetic progression", "a.p.", "common difference", "sum of n terms", "a + (n-1)d"],
    problemType: "Arithmetic Progression General Term & Summation",
    chapter: "Sequences and Series",
    topic: "Arithmetic Progression (AP)",
    formula: "aₙ = a + (n - 1)d,  Sₙ = (n / 2)[2a + (n - 1)d] = (n / 2)[a + l]",
    concept: "Finding unknown common difference d or term count n from given system of linear equations.",
    remedy: "Express given conditions as equations in first term a and common difference d, then solve simultaneously.",
  },
  {
    keywords: ["geometric progression", "g.p.", "common ratio", "infinite gp", "sum to infinity"],
    problemType: "Geometric Progression & Infinite Sum Evaluation",
    chapter: "Sequences and Series",
    topic: "Geometric Progression (GP) & Infinite Series",
    formula: "aₙ = a·rⁿ⁻¹,  Sₙ = a(1 - rⁿ)/(1 - r) for r ≠ 1,  S_∞ = a / (1 - r) for |r| < 1",
    concept: "Summing convergent infinite geometric sequences when common ratio magnitude is less than 1.",
    remedy: "Check that |r| < 1 before using S_∞ = a / (1 - r); common ratio r = a₂ / a₁.",
  },

  // 7. Straight Lines & Coordinate Geometry
  {
    keywords: ["straight line", "slope", "perpendicular", "parallel lines", "y = mx + c", "distance of point"],
    problemType: "Line Equations, Slopes & Perpendicular Distance",
    chapter: "Straight Lines",
    topic: "Slope Condition & Normal Distance to Line",
    formula: "Perpendicular: m₁·m₂ = -1;  Distance d = |Ax₁ + By₁ + C| / √(A² + B²)",
    concept: "Perpendicular lines have negative reciprocal slopes; distance formula requires standard form Ax + By + C = 0.",
    remedy: "Write the line in standard form Ax + By + C = 0 before substituting (x₁, y₁) into the numerator.",
  },

  // 8. Conic Sections
  {
    keywords: ["parabola", "focus", "directrix", "latus rectum", "y² = 4ax", "x² = 4ay"],
    problemType: "Parabola Focal Geometry & Latus Rectum",
    chapter: "Conic Sections",
    topic: "Parabola Parameters & Equations",
    formula: "For y² = 4ax: Focus = (a, 0), Directrix: x = -a, Length of Latus Rectum = 4a",
    concept: "Identifying axis of symmetry and focal parameter a by equating coefficient of linear term to 4a.",
    remedy: "Divide the linear variable's coefficient by 4 to find focal length a.",
  },
  {
    keywords: ["ellipse", "hyperbola", "eccentricity", "foci", "major axis", "minor axis", "e = √(1 - b²/a²)"],
    problemType: "Ellipse & Hyperbola Eccentricity & Foci",
    chapter: "Conic Sections",
    topic: "Ellipse & Hyperbola Equations",
    formula: "Ellipse: b² = a²(1 - e²) ⇒ e = √(1 - b²/a²); Hyperbola: b² = a²(e² - 1) ⇒ e = √(1 + b²/a²)",
    concept: "Relating semi-major axis a, semi-minor axis b, and eccentricity e (e < 1 for ellipse, e > 1 for hyperbola).",
    remedy: "For an ellipse, e is always less than 1. Foci coordinates are (±ae, 0) along the major axis.",
  },

  // 9. Limits & Derivatives (Calculus)
  {
    keywords: ["limit", "lim", "x->0", "x→0", "sin x / x", "(e^x - 1)/x", "0/0 indeterminate"],
    problemType: "Indeterminate Limit Evaluation via Standard Limits",
    chapter: "Limits and Derivatives",
    topic: "Standard Trigonometric & Algebraic Limits",
    formula: "lim(x→0) (sin x / x) = 1,  lim(x→0) (tan x / x) = 1,  lim(x→a) (xⁿ - aⁿ)/(x - a) = n·aⁿ⁻¹",
    concept: "Transforming 0/0 indeterminate forms by algebraic factoring or standard limit substitution.",
    remedy: "Match the argument inside sin(kx) by multiplying and dividing by k in the denominator.",
  },
  {
    keywords: ["derivative", "d/dx", "differentiation", "quotient rule", "product rule", "chain rule"],
    problemType: "Calculus Product & Quotient Rule Differentiation",
    chapter: "Limits and Derivatives",
    topic: "Rules of Differentiation (Product & Quotient)",
    formula: "Product: (u·v)' = u'v + uv';  Quotient: (u/v)' = (v·u' - u·v') / v²",
    concept: "Applying systematic differentiation rules while keeping denominator squared in quotient rule.",
    remedy: "Write down u and v separately, calculate u' and v', then assemble (v u' - u v') / v².",
  },

  // 10. Statistics & Probability
  {
    keywords: ["variance", "standard deviation", "mean deviation", "sigma", "σ²"],
    problemType: "Measures of Dispersion & Variance Calculation",
    chapter: "Statistics",
    topic: "Variance and Standard Deviation",
    formula: "Variance σ² = (1/N)·Σxᵢ² - (x̄)²,  Standard Deviation σ = √Variance",
    concept: "Calculating sum of squares and subtracting the square of the arithmetic mean.",
    remedy: "First compute the mean x̄ = (Σx)/N, then calculate Σx² to use the formula σ² = (Σx²)/N - (x̄)².",
  },
  {
    keywords: ["probability", "p(a ∪ b)", "mutually exclusive", "independent events", "p(a ∩ b)"],
    problemType: "Addition & Multiplication Theorem of Probability",
    chapter: "Probability",
    topic: "Axiomatic Probability & Compound Events",
    formula: "P(A ∪ B) = P(A) + P(B) - P(A ∩ B);  For Independent Events: P(A ∩ B) = P(A)·P(B)",
    concept: "Subtracting intersection probability to avoid double counting overlapping sample points.",
    remedy: "Check if events are mutually exclusive (P(A ∩ B) = 0) or independent (P(A ∩ B) = P(A)P(B)).",
  },
];

/**
 * Derives specific CBSE mathematical diagnostics for a question based on its text,
 * chapter, topic, and student submission outcome.
 */
export function deriveMathProblemDiagnosis(
  question: {
    questionText?: string;
    text?: string;
    chapter?: string;
    topic?: string;
    explanation?: string;
    marks?: number;
  },
  studentAnswer: string | number | undefined,
  isCorrect: boolean,
  isUnanswered: boolean
): MathDiagnosisResult {
  const qText = String(question.questionText || question.text || "").toLowerCase();
  const qChapter = String(question.chapter || "").trim();
  const qTopic = String(question.topic || "").trim();
  const qExpl = String(question.explanation || "").toLowerCase();
  const combinedHaystack = `${qText} ${qChapter.toLowerCase()} ${qTopic.toLowerCase()} ${qExpl}`;

  // Find best matching mathematical pattern
  let bestMatch: MathPattern | null = null;
  let bestScore = 0;

  for (const pattern of MATH_PATTERNS) {
    let score = 0;
    for (const kw of pattern.keywords) {
      if (combinedHaystack.includes(kw.toLowerCase())) {
        score += 2;
      }
    }
    if (qChapter && qChapter.toLowerCase().includes(pattern.chapter.toLowerCase())) {
      score += 3;
    }
    if (qTopic && qTopic.toLowerCase().includes(pattern.topic.toLowerCase())) {
      score += 4;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = pattern;
    }
  }

  if (bestMatch && bestScore >= 2) {
    return {
      problemType: bestMatch.problemType,
      chapter: qChapter || bestMatch.chapter,
      topic: qTopic || bestMatch.topic,
      formulaStruggledWith: bestMatch.formula,
      conceptStruggledWith: bestMatch.concept,
      exactRemedy: isUnanswered
        ? `Skipped question. ${bestMatch.remedy}`
        : `Calculation / formula misapplication. ${bestMatch.remedy}`,
      severity: isUnanswered ? "medium" : "high",
    };
  }

  // Generic fallback if no specific keywords matched
  const fallbackChapter = qChapter || "CBSE Mathematics";
  const fallbackTopic = qTopic || "Analytical Problem Solving";

  return {
    problemType: `${fallbackTopic} Multi-Step Problem`,
    chapter: fallbackChapter,
    topic: fallbackTopic,
    formulaStruggledWith: "Direct Fundamental Equation & Algebraic Expansion",
    conceptStruggledWith: `Applying multi-step deductive methods in ${fallbackTopic}.`,
    exactRemedy: isUnanswered
      ? "Ensure you allocate sufficient time during the exam to attempt this problem type."
      : "Carefully verify algebraic steps, signs, and formula substitution before final option selection.",
    severity: isUnanswered ? "medium" : "high",
  };
}
