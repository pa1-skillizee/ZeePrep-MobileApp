import type {
  Report,
  StudyResource,
  DetailedQuestionAnalysis,
} from "../types";
import { callGeminiAPI } from "./ai";

export interface WeakTopicResourceRecommendation {
  resourceId: string;
  title: string;
  type: string;
  url: string;
  relevance: "high" | "medium";
  reason: string;
  class?: string;
  subject?: string;
}

export interface WeakTopicAnalysis {
  topic: string;
  accuracy: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  diagnosis: string;
  evidence: string[];
  recommendedResources: WeakTopicResourceRecommendation[];
}

export interface FactualTopicBreakdown {
  topic: string;
  chapter?: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  accuracy: number;
  isWeak: boolean;
  incorrectQuestions: {
    questionNumber: number;
    questionText: string;
    studentAnswer: string;
    correctAnswer: string;
  }[];
}

export interface StudentResourceContext {
  grade: string;
  subject: string;
  schoolId?: string;
  section?: string;
}

/**
 * Normalizes grade/class strings to clean canonical identifiers.
 * e.g., "7th", "Grade 7", "Class 7", "Class-7", "7" -> "7"
 * e.g., "10th", "Grade 10", "10" -> "10"
 */
export function normalizeGrade(grade: string | number | undefined | null): string {
  if (grade === undefined || grade === null) return "";
  const raw = String(grade).trim().toUpperCase();
  if (!raw) return "";

  // Roman numeral mappings
  const romanMap: Record<string, string> = {
    I: "1",
    II: "2",
    III: "3",
    IV: "4",
    V: "5",
    VI: "6",
    VII: "7",
    VIII: "8",
    IX: "9",
    X: "10",
    XI: "11",
    XII: "12",
  };

  // Check direct roman numeral matches (e.g. "CLASS VII" or "VII")
  const words = raw.split(/[\s-_]+/);
  for (const w of words) {
    if (romanMap[w]) return romanMap[w];
  }

  // Extract numeric digits (e.g., "Grade 7" -> "7", "10th" -> "10")
  const numMatch = raw.match(/\b([1-9]|1[0-2])\b/) || raw.match(/(\d+)/);
  if (numMatch) {
    return numMatch[1];
  }

  // Handle pre-primary labels
  if (raw.includes("UKG")) return "UKG";
  if (raw.includes("LKG")) return "LKG";
  if (raw.includes("NURSERY")) return "NURSERY";

  return raw.toLowerCase();
}

/**
 * Normalizes subject names into canonical subject keys.
 * e.g., "Math", "Maths", "Mathematics" -> "mathematics"
 * e.g., "Science", "Sci", "General Science" -> "science"
 */
export function normalizeSubject(subject: string | undefined | null): string {
  if (!subject) return "";
  const clean = subject.trim().toLowerCase().replace(/[^a-z0-9\s]/g, " ");

  if (
    clean.includes("math") ||
    clean.includes("arithmetic") ||
    clean.includes("algebra") ||
    clean.includes("geometry") ||
    clean.includes("calculus") ||
    clean.includes("trigonometry")
  ) {
    return "mathematics";
  }

  if (clean.includes("physics") || clean.includes("phy")) {
    return "physics";
  }

  if (clean.includes("chemistry") || clean.includes("chem")) {
    return "chemistry";
  }

  if (clean.includes("biology") || clean.includes("bio") || clean.includes("botany") || clean.includes("zoology")) {
    return "biology";
  }

  if (clean.includes("science") || clean.includes("sci") || clean.includes("general science")) {
    return "science";
  }

  if (clean.includes("english") || clean.includes("eng") || clean.includes("literature") || clean.includes("grammar")) {
    return "english";
  }

  if (
    clean.includes("social") ||
    clean.includes("sst") ||
    clean.includes("history") ||
    clean.includes("civics") ||
    clean.includes("geography")
  ) {
    return "social science";
  }

  if (
    clean.includes("computer") ||
    clean.includes("cs") ||
    clean.includes("it") ||
    clean.includes("informatics") ||
    clean.includes("coding")
  ) {
    return "computer science";
  }

  if (clean.includes("hindi")) return "hindi";
  if (clean.includes("sanskrit")) return "sanskrit";

  return clean.replace(/\s+/g, " ").trim();
}

/**
 * Deterministic Hard Access & Recommendation Filter
 * Enforces Class/Grade + Subject + School + Section Isolation BEFORE AI.
 */
export function isResourceEligibleForStudent(
  resource: StudyResource,
  studentContext: StudentResourceContext
): boolean {
  if (!resource || !resource.url || !resource.title) {
    return false;
  }

  // 1. HARD RULE: CLASS / GRADE ISOLATION (MANDATORY)
  const normResGrade = normalizeGrade(resource.grade);
  const normStudGrade = normalizeGrade(studentContext.grade);

  if (!normResGrade || !normStudGrade || normResGrade !== normStudGrade) {
    // Cross-class recommendation strictly blocked
    return false;
  }

  // 2. HARD RULE: SUBJECT ISOLATION (MANDATORY)
  const normResSub = normalizeSubject(resource.subject);
  const normStudSub = normalizeSubject(studentContext.subject);

  if (!normResSub || !normStudSub || normResSub !== normStudSub) {
    // Cross-subject recommendation strictly blocked
    return false;
  }

  // 3. HARD RULE: SCHOOL / TENANT ISOLATION
  if (resource.schoolId && studentContext.schoolId) {
    if (resource.schoolId !== studentContext.schoolId) {
      return false;
    }
  }

  // 4. HARD RULE: SECTION ISOLATION (if section is explicitly assigned)
  if (
    resource.section &&
    resource.section !== "All" &&
    resource.section !== "all" &&
    studentContext.section
  ) {
    if (
      resource.section.trim().toLowerCase() !==
      studentContext.section.trim().toLowerCase()
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Filters the library into a strictly authorized, eligible pool.
 */
export function filterEligibleResources(
  availableResources: StudyResource[],
  studentContext: StudentResourceContext
): StudyResource[] {
  if (!availableResources || !Array.isArray(availableResources)) return [];
  return availableResources.filter((res) => isResourceEligibleForStudent(res, studentContext));
}

export function resolveActualTopic(
  rawTopic: string | undefined | null,
  chapter: string | undefined | null,
  subject: string | undefined | null,
  questionText: string | undefined | null,
  examTitle: string | undefined | null
): string {
  const normSub = normalizeSubject(subject);
  const cleanTopic = String(rawTopic || "").trim();
  const cleanChap = String(chapter || "").trim();

  // 1. If topic is already a specific subtopic (not equal to subject or generic placeholder)
  if (
    cleanTopic &&
    cleanTopic.toLowerCase() !== (subject || "").toLowerCase() &&
    cleanTopic.toLowerCase() !== normSub &&
    cleanTopic.toLowerCase() !== "general" &&
    cleanTopic.toLowerCase() !== "general concept" &&
    cleanTopic.toLowerCase() !== "core concepts" &&
    cleanTopic.toLowerCase() !== "assessment" &&
    cleanTopic.toLowerCase() !== "undefined"
  ) {
    return cleanTopic;
  }

  // 2. If chapter is specific and distinct
  if (
    cleanChap &&
    cleanChap.toLowerCase() !== (subject || "").toLowerCase() &&
    cleanChap.toLowerCase() !== normSub &&
    cleanChap.toLowerCase() !== "general" &&
    cleanChap.toLowerCase() !== "undefined"
  ) {
    return cleanChap;
  }

  // 3. Fallback: Intelligent concept extraction from question text & exam title
  const txt = (String(questionText || "") + " " + String(examTitle || "")).toLowerCase();

  // Physics concepts
  if (normSub === "physics" || normSub === "science" || txt.includes("physic")) {
    if (
      txt.includes("speed") ||
      txt.includes("velocity") ||
      txt.includes("acceleration") ||
      txt.includes("displacement") ||
      txt.includes("motion") ||
      txt.includes("distance-time")
    ) {
      return "Kinematics & Motion";
    }
    if (
      txt.includes("force") ||
      txt.includes("newton") ||
      txt.includes("inertia") ||
      txt.includes("momentum") ||
      txt.includes("friction") ||
      txt.includes("impulse")
    ) {
      return "Laws of Motion & Force";
    }
    if (
      txt.includes("work") ||
      txt.includes("kinetic energy") ||
      txt.includes("potential energy") ||
      txt.includes("power") ||
      txt.includes("joule") ||
      txt.includes("watt")
    ) {
      return "Work, Energy & Power";
    }
    if (
      txt.includes("gravitation") ||
      txt.includes("gravity") ||
      txt.includes("free fall") ||
      txt.includes("weight") ||
      txt.includes("kepler") ||
      txt.includes("orbital")
    ) {
      return "Gravitation & Gravity";
    }
    if (
      txt.includes("current") ||
      txt.includes("voltage") ||
      txt.includes("resistance") ||
      txt.includes("resistor") ||
      txt.includes("ohm") ||
      txt.includes("circuit") ||
      txt.includes("ampere") ||
      txt.includes("electric")
    ) {
      return "Current Electricity & Circuits";
    }
    if (
      txt.includes("magnet") ||
      txt.includes("solenoid") ||
      txt.includes("lorentz") ||
      txt.includes("induction") ||
      txt.includes("flux") ||
      txt.includes("fleming")
    ) {
      return "Magnetic Effects & Induction";
    }
    if (
      txt.includes("light") ||
      txt.includes("reflection") ||
      txt.includes("refraction") ||
      txt.includes("mirror") ||
      txt.includes("lens") ||
      txt.includes("focal") ||
      txt.includes("snell") ||
      txt.includes("prism") ||
      txt.includes("ray")
    ) {
      return "Ray Optics & Light";
    }
    if (
      txt.includes("sound") ||
      txt.includes("echo") ||
      txt.includes("frequency") ||
      txt.includes("wavelength") ||
      txt.includes("ultrasound") ||
      txt.includes("sonar") ||
      txt.includes("vibration") ||
      txt.includes("wave")
    ) {
      return "Sound & Waves";
    }
    if (
      txt.includes("heat") ||
      txt.includes("temperature") ||
      txt.includes("thermal") ||
      txt.includes("calori") ||
      txt.includes("conduction") ||
      txt.includes("radiation") ||
      txt.includes("specific heat")
    ) {
      return "Thermodynamics & Heat";
    }
    if (
      txt.includes("pressure") ||
      txt.includes("density") ||
      txt.includes("buoyant") ||
      txt.includes("archimedes") ||
      txt.includes("pascal") ||
      txt.includes("fluid")
    ) {
      return "Fluid Mechanics & Pressure";
    }
    if (
      txt.includes("semiconductor") ||
      txt.includes("diode") ||
      txt.includes("transistor") ||
      txt.includes("logic gate") ||
      txt.includes("p-n")
    ) {
      return "Semiconductors & Electronics";
    }
    if (
      txt.includes("atom") ||
      txt.includes("nucleus") ||
      txt.includes("nuclear") ||
      txt.includes("radioactiv") ||
      txt.includes("bohr") ||
      txt.includes("rutherford")
    ) {
      return "Atomic & Nuclear Physics";
    }
  }

  // Chemistry concepts
  if (normSub === "chemistry" || normSub === "science" || txt.includes("chem")) {
    if (
      txt.includes("acid") ||
      txt.includes("base") ||
      txt.includes("indicator") ||
      txt.includes("ph") ||
      txt.includes("neutraliz") ||
      txt.includes("litmus") ||
      txt.includes("salt")
    ) {
      return "Acids, Bases & Salts";
    }
    if (
      txt.includes("metal") ||
      txt.includes("non-metal") ||
      txt.includes("lustr") ||
      txt.includes("malleab") ||
      txt.includes("reactivity series") ||
      txt.includes("metallurgy") ||
      txt.includes("corrosion")
    ) {
      return "Metals & Non-Metals";
    }
    if (
      txt.includes("carbon") ||
      txt.includes("covalent") ||
      txt.includes("alkane") ||
      txt.includes("alkene") ||
      txt.includes("alkyne") ||
      txt.includes("isomer") ||
      txt.includes("alcohol") ||
      txt.includes("hydrocarbon")
    ) {
      return "Carbon & Its Compounds";
    }
    if (
      txt.includes("periodic") ||
      txt.includes("mendeleev") ||
      txt.includes("atomic radius") ||
      txt.includes("electronegativ") ||
      txt.includes("group") ||
      txt.includes("period")
    ) {
      return "Periodic Classification of Elements";
    }
    if (
      txt.includes("reaction") ||
      txt.includes("equation") ||
      txt.includes("combination") ||
      txt.includes("decomposition") ||
      txt.includes("displacement") ||
      txt.includes("redox") ||
      txt.includes("oxidation")
    ) {
      return "Chemical Reactions & Equations";
    }
    if (
      txt.includes("mole") ||
      txt.includes("molar") ||
      txt.includes("avogadro") ||
      txt.includes("stoichiometry")
    ) {
      return "Mole Concept & Stoichiometry";
    }
  }

  // Mathematics concepts
  if (normSub === "mathematics" || txt.includes("math")) {
    if (txt.includes("quadratic") || txt.includes("discriminant") || txt.includes("roots of")) {
      return "Quadratic Equations";
    }
    if (
      txt.includes("arithmetic progression") ||
      txt.includes("common difference") ||
      txt.includes("a.p.") ||
      txt.includes("nth term")
    ) {
      return "Arithmetic Progressions";
    }
    if (
      txt.includes("trigonometr") ||
      txt.includes("sin") ||
      txt.includes("cos") ||
      txt.includes("tan") ||
      txt.includes("cosec") ||
      txt.includes("sec") ||
      txt.includes("cot")
    ) {
      return "Trigonometry & Identities";
    }
    if (txt.includes("height") || txt.includes("elevation") || txt.includes("depression")) {
      return "Heights & Distances";
    }
    if (
      txt.includes("triangle") ||
      txt.includes("similarity") ||
      txt.includes("pythagoras") ||
      txt.includes("thales") ||
      txt.includes("congruen")
    ) {
      return "Triangles & Geometry";
    }
    if (txt.includes("circle") || txt.includes("tangent") || txt.includes("chord") || txt.includes("secant")) {
      return "Circles & Tangents";
    }
    if (
      txt.includes("surface area") ||
      txt.includes("volume") ||
      txt.includes("cylinder") ||
      txt.includes("cone") ||
      txt.includes("sphere")
    ) {
      return "Surface Areas & Volumes";
    }
    if (txt.includes("probability") || txt.includes("dice") || txt.includes("coin") || txt.includes("cards")) {
      return "Probability";
    }
    if (
      txt.includes("mean") ||
      txt.includes("median") ||
      txt.includes("mode") ||
      txt.includes("frequency distribution") ||
      txt.includes("ogive")
    ) {
      return "Statistics";
    }
    if (txt.includes("coordinate") || txt.includes("distance formula") || txt.includes("section formula")) {
      return "Coordinate Geometry";
    }
    if (txt.includes("linear equation") || txt.includes("pair of linear")) {
      return "Linear Equations in Two Variables";
    }
    if (txt.includes("polynomial") || txt.includes("zeroes") || txt.includes("factor theorem")) {
      return "Polynomials";
    }
  }

  // Biology concepts
  if (normSub === "biology" || normSub === "science" || txt.includes("bio")) {
    if (
      txt.includes("photosynthesis") ||
      txt.includes("respiration") ||
      txt.includes("digestion") ||
      txt.includes("excretion") ||
      txt.includes("circulation") ||
      txt.includes("heart") ||
      txt.includes("nephron")
    ) {
      return "Life Processes & Physiology";
    }
    if (
      txt.includes("neuron") ||
      txt.includes("brain") ||
      txt.includes("reflex") ||
      txt.includes("hormone") ||
      txt.includes("endocrine") ||
      txt.includes("nervous")
    ) {
      return "Control & Coordination";
    }
    if (
      txt.includes("reproduction") ||
      txt.includes("pollination") ||
      txt.includes("fertilization") ||
      txt.includes("gamete") ||
      txt.includes("binary fission") ||
      txt.includes("budding")
    ) {
      return "How Organisms Reproduce";
    }
    if (
      txt.includes("heredity") ||
      txt.includes("genetics") ||
      txt.includes("mendel") ||
      txt.includes("chromosome") ||
      txt.includes("gene") ||
      txt.includes("dna")
    ) {
      return "Heredity & Evolution";
    }
    if (
      txt.includes("ecosystem") ||
      txt.includes("food chain") ||
      txt.includes("trophic") ||
      txt.includes("ozone") ||
      txt.includes("biodiversity")
    ) {
      return "Our Environment & Ecosystem";
    }
    if (
      txt.includes("cell") ||
      txt.includes("mitochondria") ||
      txt.includes("chloroplast") ||
      txt.includes("nucleus") ||
      txt.includes("membrane")
    ) {
      return "Cell Structure & Function";
    }
  }

  if (
    examTitle &&
    examTitle.toLowerCase() !== (subject || "").toLowerCase() &&
    examTitle.toLowerCase() !== "assessment" &&
    examTitle.toLowerCase() !== "exam" &&
    examTitle.toLowerCase() !== "mock test"
  ) {
    return examTitle;
  }

  return "Core Conceptual Problem Solving";
}

/**
 * 1. Deterministically derives factual topic performance from question-level telemetry.
 * QUALIFYING AS WEAK TOPIC: Accuracy < 60% OR (accuracy <= 70% with at least 2 questions).
 */
export function deriveFactualTopicBreakdown(report: Report): FactualTopicBreakdown[] {
  const analysis = report.detailedAnalysis || [];
  if (analysis.length === 0) return [];

  const topicGroups = new Map<string, DetailedQuestionAnalysis[]>();

  analysis.forEach((q, idx) => {
    const resolvedTopic = resolveActualTopic(
      q.topic,
      q.chapter,
      report.subject,
      q.questionText,
      report.examTitle
    );
    const topicKey = resolvedTopic.length > 0 ? resolvedTopic : "Core Concepts";
    if (!topicGroups.has(topicKey)) {
      topicGroups.set(topicKey, []);
    }
    topicGroups.get(topicKey)!.push({
      ...q,
      questionNumber: q.questionNumber || idx + 1,
    });
  });

  const breakdowns: FactualTopicBreakdown[] = [];

  topicGroups.forEach((questions, topic) => {
    const totalQuestions = questions.length;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    const incorrectQuestions: FactualTopicBreakdown["incorrectQuestions"] = [];

    questions.forEach((q) => {
      if (q.isCorrect) {
        correctCount++;
      } else if (q.isUnanswered || !q.studentAnswer || String(q.studentAnswer).trim() === "") {
        unansweredCount++;
        incorrectQuestions.push({
          questionNumber: q.questionNumber || 1,
          questionText: q.questionText,
          studentAnswer: "― Unanswered",
          correctAnswer: String(q.correctAnswer || ""),
        });
      } else {
        wrongCount++;
        incorrectQuestions.push({
          questionNumber: q.questionNumber || 1,
          questionText: q.questionText,
          studentAnswer: String(q.studentAnswer || ""),
          correctAnswer: String(q.correctAnswer || ""),
        });
      }
    });

    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const isWeak = accuracy < 60 || (totalQuestions >= 2 && accuracy <= 70 && wrongCount + unansweredCount > 0);

    breakdowns.push({
      topic,
      chapter: questions[0]?.chapter || "",
      totalQuestions,
      correctCount,
      wrongCount,
      unansweredCount,
      accuracy,
      isWeak,
      incorrectQuestions,
    });
  });

  // Sort by lowest accuracy first
  breakdowns.sort((a, b) => a.accuracy - b.accuracy);
  return breakdowns;
}

/**
 * 2. Deterministic keyword matching fallback across ELIGIBLE resources only.
 */
export function matchResourcesLocally(
  weakTopic: FactualTopicBreakdown,
  eligibleResources: StudyResource[]
): WeakTopicResourceRecommendation[] {
  if (!eligibleResources || eligibleResources.length === 0) return [];

  const seenIds = new Set<string>();
  const uniqueEligible = eligibleResources.filter((r) => {
    if (!r.id || seenIds.has(r.id)) return false;
    seenIds.add(r.id);
    return true;
  });

  const cleanTopicWords = weakTopic.topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["and", "the", "for", "with", "from"].includes(w));

  const scored = uniqueEligible.map((res) => {
    let score = 0;
    const titleLower = (res.title || "").toLowerCase();
    const descLower = (res.description || "").toLowerCase();
    const topicLower = (res.topic || res.chapter || "").toLowerCase();

    cleanTopicWords.forEach((word) => {
      if (titleLower.includes(word)) score += 5;
      if (descLower.includes(word)) score += 3;
      if (topicLower.includes(word)) score += 4;
    });

    return { res, score };
  });

  const matches = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // If no keyword match found, pick the top eligible resources of the exact same class and subject
  if (matches.length === 0 && uniqueEligible.length > 0) {
    const topEligible = uniqueEligible.slice(0, 2);
    return topEligible.map((res) => ({
      resourceId: res.id,
      title: res.title,
      type: res.type || "pdf",
      url: res.url || "",
      relevance: "medium",
      reason: `Authorized reference material for ${res.subject} (Grade ${res.grade}).`,
      class: res.grade,
      subject: res.subject,
    }));
  }

  return matches.map(({ res, score }) => ({
    resourceId: res.id,
    title: res.title,
    type: res.type || "pdf",
    url: res.url || "",
    relevance: score >= 5 ? "high" : "medium",
    reason: `Targeted revision resource for ${weakTopic.topic} (Grade ${res.grade} ${res.subject}).`,
    class: res.grade,
    subject: res.subject,
  }));
}

/**
 * 3. AI-Powered Resource Matcher & Diagnosis using Gemini 2.5 Flash.
 * Enforces strict Class/Grade + Subject hard isolation BEFORE and AFTER AI.
 */
export async function matchWeakTopicsWithZeePrepResources(
  report: Report,
  availableResources: StudyResource[]
): Promise<WeakTopicAnalysis[]> {
  const topicBreakdowns = deriveFactualTopicBreakdown(report);
  const weakTopics = topicBreakdowns.filter((t) => t.isWeak);

  // If student performed well across all topics
  if (weakTopics.length === 0) {
    return [];
  }

  // 1. EXTRACT AUTHORITATIVE STUDENT & EXAM CONTEXT
  const studentContext: StudentResourceContext = {
    grade: report.grade || "10",
    subject: (report as any).subject || report.examTitle || "General",
    schoolId: (report as any).schoolId || "",
    section: report.section || "",
  };

  // 2. HARD FILTER BEFORE AI (CLASS + SUBJECT + SCHOOL ISOLATION)
  const eligibleResources = filterEligibleResources(availableResources, studentContext);

  console.log(`[WeakTopicEngine] Authoritative Filtering: Total ${availableResources.length} -> Eligible ${eligibleResources.length} for Grade ${studentContext.grade} (${studentContext.subject})`);

  // If no authorized resources exist for this class & subject, return empty resource arrays immediately
  if (eligibleResources.length === 0) {
    return weakTopics.map((wt) => ({
      topic: wt.topic,
      accuracy: wt.accuracy,
      totalQuestions: wt.totalQuestions,
      correctCount: wt.correctCount,
      wrongCount: wt.wrongCount,
      unansweredCount: wt.unansweredCount,
      diagnosis: `Needs structured practice and concept review in ${wt.topic} (${wt.accuracy}% accuracy).`,
      evidence: wt.incorrectQuestions.map((iq) => `Missed Question ${iq.questionNumber}`),
      recommendedResources: [],
    }));
  }

  // Build eligible resource catalogue summary for Gemini (ONLY authorized resources sent to AI)
  const resourceCatalog = eligibleResources.map((r) => ({
    resourceId: r.id,
    title: r.title,
    type: r.type,
    subject: r.subject,
    grade: r.grade,
    topic: r.topic || r.chapter || "",
    description: r.description || "",
    url: r.url,
  }));

  // Build structured weak topics summary
  const weakTopicsSummary = weakTopics.map((wt) => ({
    topic: wt.topic,
    accuracy: `${wt.accuracy}%`,
    questionsAttempted: `${wt.correctCount}/${wt.totalQuestions} correct`,
    incorrectQuestions: wt.incorrectQuestions.map(
      (iq) => `Q${iq.questionNumber}: "${iq.questionText}" (Student answered: "${iq.studentAnswer}", Correct: "${iq.correctAnswer}")`
    ),
  }));

  const prompt = `You are ZeePrep AI Academic Remediation Engine.
Your task is to analyze student weak areas from an exam and recommend ACTUAL uploaded learning resources.

STUDENT ACADEMIC CONTEXT:
Class / Grade: ${studentContext.grade}
Subject: ${studentContext.subject}

STUDENT WEAK AREAS (Factual Data):
${JSON.stringify(weakTopicsSummary, null, 2)}

CATALOGUE OF AUTHORIZED CLASS ${studentContext.grade} ${studentContext.subject.toUpperCase()} RESOURCES:
${JSON.stringify(resourceCatalog, null, 2)}

INSTRUCTIONS:
1. For each weak topic, provide a concise, factual diagnosis (1 sentence) and specific evidence based on questions missed.
2. Match up to 3 most relevant resources from the CATALOGUE OF AUTHORIZED RESOURCES that actually cover and explain the missed topic concepts.
3. CRITICAL RULES:
   - You MUST ONLY select resources that exist in the provided catalogue. Use their exact resourceId, title, and type. NEVER invent or fabricate resource IDs or URLs.
   - If a topic is not given in any uploaded content, or is not sufficiently described/explained in the catalogue, return an empty "resources": [] array so the student is prompted to ask their teacher.

Return ONLY a JSON array matching this exact schema:
[
  {
    "topic": string,
    "diagnosis": string,
    "evidence": string[],
    "resources": [
      {
        "resourceId": string,
        "reason": string,
        "relevance": "high" | "medium"
      }
    ]
  }
]`;

  try {
    const aiResponseText = await callGeminiAPI(prompt, "weakTopicRemediation");

    if (aiResponseText) {
      const cleanJson = aiResponseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const jsonMatch = cleanJson.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const parsedAI = JSON.parse(jsonMatch[0]) as any[];

        if (Array.isArray(parsedAI) && parsedAI.length > 0) {
          const results: WeakTopicAnalysis[] = weakTopics.map((wt) => {
            const aiItem = parsedAI.find(
              (p) => String(p.topic || "").trim().toLowerCase() === wt.topic.trim().toLowerCase()
            );

            const seenRecIds = new Set<string>();
            let recommendedResources: WeakTopicResourceRecommendation[] = [];

            if (aiItem && Array.isArray(aiItem.resources) && aiItem.resources.length > 0) {
              aiItem.resources.forEach((rObj: any) => {
                const targetId = rObj?.resourceId || rObj?.id;
                if (!targetId || seenRecIds.has(targetId)) return;
                const matchedCatalogItem = eligibleResources.find((c) => c.id === targetId);
                // POST-AI VALIDATION (DEFENSE IN DEPTH): Must be strictly eligible
                if (
                  matchedCatalogItem &&
                  isResourceEligibleForStudent(matchedCatalogItem, studentContext)
                ) {
                  seenRecIds.add(matchedCatalogItem.id);
                  recommendedResources.push({
                    resourceId: matchedCatalogItem.id,
                    title: matchedCatalogItem.title,
                    type: matchedCatalogItem.type,
                    url: matchedCatalogItem.url,
                    relevance: rObj.relevance === "high" ? "high" : "medium",
                    reason: String(rObj.reason || `Targeted practice for ${wt.topic}`),
                    class: matchedCatalogItem.grade,
                    subject: matchedCatalogItem.subject,
                  });
                }
              });
            }

            // Fallback to deterministic local keyword matching if AI returned no catalogue matches but eligible resources exist
            if (recommendedResources.length === 0 && eligibleResources.length > 0) {
              recommendedResources = matchResourcesLocally(wt, eligibleResources);
            }

            return {
              topic: wt.topic,
              accuracy: wt.accuracy,
              totalQuestions: wt.totalQuestions,
              correctCount: wt.correctCount,
              wrongCount: wt.wrongCount,
              unansweredCount: wt.unansweredCount,
              diagnosis:
                aiItem?.diagnosis ||
                `Needs additional conceptual revision and numerical practice in ${wt.topic}.`,
              evidence:
                aiItem?.evidence ||
                wt.incorrectQuestions.map((iq) => `Missed Question ${iq.questionNumber}`),
              recommendedResources,
            };
          });

          return results;
        }
      }
    }
  } catch (err) {
    console.warn("[WeakTopicEngine] AI recommendation call failed, using deterministic matching on eligible pool:", err);
  }

  // Pure Deterministic Fallback across ELIGIBLE resources ONLY
  return weakTopics.map((wt) => ({
    topic: wt.topic,
    accuracy: wt.accuracy,
    totalQuestions: wt.totalQuestions,
    correctCount: wt.correctCount,
    wrongCount: wt.wrongCount,
    unansweredCount: wt.unansweredCount,
    diagnosis: `Needs structured practice and concept review in ${wt.topic} (${wt.accuracy}% accuracy).`,
    evidence: wt.incorrectQuestions.map((iq) => `Missed Question ${iq.questionNumber}`),
    recommendedResources: matchResourcesLocally(wt, eligibleResources),
  }));
}
