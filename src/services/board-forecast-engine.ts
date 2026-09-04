/**
 * ZeePrep — Board Examination Preparation Forecast Engine
 * =======================================================
 * A FORECAST layer that sits ON TOP of the authoritative deterministic report
 * engine (report-engine.ts). It NEVER changes factual scores. It turns a
 * student's history of valid assessments (per subject) into a board-preparation
 * estimate: predicted %, likely range, confidence, trend, coverage.
 *
 * Design principles enforced here:
 *  - NOT a simple average. Recency-weighted + difficulty(level)-weighted.
 *  - Exam level (1/2/3) matters: 95% on easy != 95% board readiness.
 *  - Recency matters but old evidence is not discarded.
 *  - Outliers are damped (winsorized) so one 98 does not spike the forecast.
 *  - Trend is derived deterministically and must not lie.
 *  - Confidence is explainable and gated by evidence (count / coverage / levels).
 *  - Subject isolation: history is scoped by normalized subject (+ grade).
 *  - Retakes: only the latest valid attempt per exam contributes.
 *  - Gemini interprets; it cannot invent numbers — output is clamped to a
 *    deterministic sanity band and the deterministic trend is authoritative.
 */

import type { Report } from "../types";
import type {
  SubjectAssessmentProfile,
  AssessmentDataPoint,
  BoardForecastSnapshot,
  ForecastConfidence,
  ForecastTrend,
  BoardPredictionResult,
} from "../types/forecast";
import { normalizeSubject, normalizeGrade } from "./weak-topic-resource-engine";
import { callGeminiAPI } from "./ai";

export const FORECAST_MODEL_VERSION = "forecast-v1";
const AI_MODEL_TAG = "gemini-2.5-flash";

const LEVEL_VALUE: Record<string, number> = { level1: 1, level2: 2, level3: 3 };

// ────────────────────────────────────────────────────────────────────────────
// small numeric helpers
// ────────────────────────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number) => Math.round(v);

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stddev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const variance = nums.reduce((a, b) => a + (b - m) * (b - m), 0) / nums.length;
  return Math.sqrt(variance);
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Least-squares slope of y over index 0..n-1 (percentage-points per assessment). */
function slope(nums: number[]): number {
  const n = nums.length;
  if (n < 2) return 0;
  const xs = nums.map((_, i) => i);
  const mx = mean(xs);
  const my = mean(nums);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (nums[i] - my);
    den += (xs[i] - mx) * (xs[i] - mx);
  }
  return den === 0 ? 0 : num / den;
}

function toTime(iso: any): number {
  const t = new Date(iso || 0).getTime();
  return isNaN(t) ? 0 : t;
}

function sanitizeText(s: any, maxLen = 180): string {
  return String(s == null ? "" : s)
    .replace(/[`*#_>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function sanitizeList(arr: any, maxItems: number, maxLen = 180): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => sanitizeText(x, maxLen))
    .filter((x) => x.length > 0)
    .slice(0, maxItems);
}

// ────────────────────────────────────────────────────────────────────────────
// subject scoping / validity
// ────────────────────────────────────────────────────────────────────────────
export function subjectKeyForReport(report: Report): string {
  return normalizeSubject(report.subject || (report as any).examSubject || "");
}

export function subjectDisplayForReport(report: Report): string {
  const raw = String(report.subject || "").trim();
  if (!raw) return "General";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Only completed, integrity-valid reports may feed the forecast. */
function isValidReport(r: Report): boolean {
  return !!(
    r &&
    r.studentId &&
    Array.isArray(r.detailedAnalysis) &&
    r.detailedAnalysis.length > 0 &&
    Number(r.totalQuestions) > 0 &&
    typeof r.percentage === "number" &&
    isFinite(r.percentage) &&
    r.percentage >= 0 &&
    r.percentage <= 100
  );
}

/** Average per-question difficulty of a report on a 1..3 scale. */
function reportAvgDifficulty(r: Report): number {
  const levels = (r.detailedAnalysis || []).map((q) => LEVEL_VALUE[String(q.level || "level1")] || 1);
  return levels.length ? mean(levels) : 1;
}

/**
 * Deduplicate retakes: keep only the latest valid attempt per examId
 * (highest attemptNumber, tie-broken by newest date). Prevents a single exam
 * attempted many times from over-weighting the forecast.
 */
function latestValidAttemptsPerExam(reports: Report[]): Report[] {
  const byExam = new Map<string, Report>();
  for (const r of reports) {
    if (!isValidReport(r)) continue;
    const key = r.examId || r.id;
    const prev = byExam.get(key);
    if (!prev) {
      byExam.set(key, r);
      continue;
    }
    const rAtt = Number(r.attemptNumber || 1);
    const pAtt = Number(prev.attemptNumber || 1);
    if (rAtt > pAtt || (rAtt === pAtt && toTime(r.createdAt) > toTime(prev.createdAt))) {
      byExam.set(key, r);
    }
  }
  return Array.from(byExam.values());
}

// ────────────────────────────────────────────────────────────────────────────
// topic aggregation (strong / weak across the whole subject history)
// ────────────────────────────────────────────────────────────────────────────
function aggregateTopics(reports: Report[]): { strong: string[]; weak: string[] } {
  const acc = new Map<string, { correct: number; total: number }>();
  for (const r of reports) {
    for (const q of r.detailedAnalysis || []) {
      const t = String(q.topic || q.chapter || "").trim();
      if (!t || t.toLowerCase() === "general") continue;
      const cur = acc.get(t) || { correct: 0, total: 0 };
      if (q.isCorrect) cur.correct++;
      cur.total++;
      acc.set(t, cur);
    }
  }
  const strong: { t: string; a: number }[] = [];
  const weak: { t: string; a: number }[] = [];
  acc.forEach((v, t) => {
    if (v.total < 1) return;
    const a = (v.correct / v.total) * 100;
    if (a >= 75 && v.total >= 1) strong.push({ t, a });
    else if (a < 60) weak.push({ t, a });
  });
  strong.sort((x, y) => y.a - x.a);
  weak.sort((x, y) => x.a - y.a);
  return { strong: strong.slice(0, 4).map((x) => x.t), weak: weak.slice(0, 4).map((x) => x.t) };
}

// ────────────────────────────────────────────────────────────────────────────
// PROFILE BUILDER (deterministic, AI-free)
// ────────────────────────────────────────────────────────────────────────────
export function buildSubjectAssessmentProfile(
  allReports: Report[],
  opts: { subjectKey: string; subjectDisplay: string; grade?: string; board?: string }
): SubjectAssessmentProfile {
  const gradeNorm = opts.grade ? normalizeGrade(opts.grade) : "";

  // Scope by normalized subject (+ grade when known) → prevents cross-subject /
  // cross-grade contamination even though subjects are string-based.
  const scoped = allReports.filter((r) => {
    if (subjectKeyForReport(r) !== opts.subjectKey) return false;
    if (gradeNorm && normalizeGrade(r.grade) && normalizeGrade(r.grade) !== gradeNorm) return false;
    return true;
  });

  const deduped = latestValidAttemptsPerExam(scoped).sort(
    (a, b) => toTime(a.createdAt) - toTime(b.createdAt)
  );

  const dataPoints: AssessmentDataPoint[] = deduped.map((r) => {
    const topics = Array.from(
      new Set(
        (r.detailedAnalysis || [])
          .map((q) => String(q.topic || q.chapter || "").trim())
          .filter((t) => t && t.toLowerCase() !== "general")
      )
    );
    return {
      reportId: r.id,
      examId: r.examId || r.id,
      examTitle: r.examTitle || "Assessment",
      percentage: clamp(round(Number(r.percentage) || 0), 0, 100),
      weightedDifficulty: reportAvgDifficulty(r),
      totalQuestions: Number(r.totalQuestions) || 0,
      date: new Date(r.createdAt || Date.now()).toISOString(),
      topics,
      attemptNumber: Number(r.attemptNumber || 1),
    };
  });

  const count = dataPoints.length;
  const pcts = dataPoints.map((d) => d.percentage);

  const distinctTopics = Array.from(new Set(dataPoints.flatMap((d) => d.topics)));
  const levelCoverage = { level1: 0, level2: 0, level3: 0 };
  for (const r of deduped) {
    for (const q of r.detailedAnalysis || []) {
      const lv = String(q.level || "level1");
      if (lv === "level1") levelCoverage.level1++;
      else if (lv === "level2") levelCoverage.level2++;
      else if (lv === "level3") levelCoverage.level3++;
    }
  }
  const levelSpread =
    (levelCoverage.level1 > 0 ? 1 : 0) +
    (levelCoverage.level2 > 0 ? 1 : 0) +
    (levelCoverage.level3 > 0 ? 1 : 0);

  // Breadth heuristic (NOT a true syllabus %): topics assessed + level spread + volume.
  const coverageSignal = clamp(
    round(Math.min(70, distinctTopics.length * 9) + levelSpread * 8 + Math.min(count, 6) * 1.5),
    0,
    100
  );

  // Difficulty-adjusted effective score per assessment.
  // scaler: level1(1)->0.94, level2(2)->1.00, level3(3)->1.06
  const effective = dataPoints.map((d) => {
    const scaler = 0.88 + 0.06 * clamp(d.weightedDifficulty, 1, 3);
    return clamp(d.percentage * scaler, 0, 100);
  });

  // Winsorize effective scores around the median (±18) to damp outliers.
  const med = median(effective);
  const winsor = effective.map((e) => clamp(e, med - 18, med + 18));

  // Recency weights: newest weighted most, older retained (never zero).
  const decay = 0.72;
  const weights = winsor.map((_, i) => Math.pow(decay, count - 1 - i));
  const wSum = weights.reduce((a, b) => a + b, 0) || 1;

  const deterministicPrediction = count
    ? clamp(round(winsor.reduce((a, e, i) => a + e * weights[i], 0) / wSum), 0, 100)
    : 0;

  const recencyWeightedScore = count
    ? clamp(round(pcts.reduce((a, p, i) => a + p * weights[i], 0) / wSum), 0, 100)
    : 0;

  const recentPcts = pcts.slice(-5);
  const volatility = round(stddev(recentPcts));
  const improvementRate = round(slope(pcts) * 10) / 10;

  // Range half-width from volatility + data thinness + coverage thinness.
  const half = clamp(
    round(5 + volatility * 0.4 + (count < 3 ? 4 : 0) + (coverageSignal < 40 ? 3 : 0)),
    4,
    14
  );
  const deterministicRange = {
    min: clamp(deterministicPrediction - half, 0, 100),
    max: clamp(deterministicPrediction + half, 0, 100),
  };

  const trendDirection = classifyTrend(pcts, improvementRate, volatility);
  const { strong, weak } = aggregateTopics(deduped);

  // ── Requirement: Calculate Level 1, Level 2, Level 3 score predictions + overall average ──
  let l1Correct = 0, l1Total = 0, l1Attempts = 0;
  let l2Correct = 0, l2Total = 0, l2Attempts = 0;
  let l3Correct = 0, l3Total = 0, l3Attempts = 0;

  for (const r of deduped) {
    let rHasL1 = false, rHasL2 = false, rHasL3 = false;
    for (const q of r.detailedAnalysis || []) {
      const lv = String(q.level || "level1").toLowerCase();
      if (lv === "level1") {
        l1Total++;
        if (q.isCorrect) l1Correct++;
        rHasL1 = true;
      } else if (lv === "level2") {
        l2Total++;
        if (q.isCorrect) l2Correct++;
        rHasL2 = true;
      } else if (lv === "level3") {
        l3Total++;
        if (q.isCorrect) l3Correct++;
        rHasL3 = true;
      }
    }
    if (rHasL1) l1Attempts++;
    if (rHasL2) l2Attempts++;
    if (rHasL3) l3Attempts++;
  }

  // Base accuracies or calibrated estimates
  const baseScore = count > 0 ? recencyWeightedScore : 70;
  const level1Accuracy = l1Total > 0 ? round((l1Correct / l1Total) * 100) : clamp(round(baseScore * 1.05), 0, 100);
  const level2Accuracy = l2Total > 0 ? round((l2Correct / l2Total) * 100) : clamp(round(baseScore * 0.95), 0, 100);
  const level3Accuracy = l3Total > 0 ? round((l3Correct / l3Total) * 100) : clamp(round(baseScore * 0.85), 0, 100);

  // Score predictions: Level 1 (Foundational), Level 2 (Application), Level 3 (Advanced/HOTS)
  const level1PredictedScore = clamp(round(level1Accuracy * 0.98), 0, 100);
  const level2PredictedScore = clamp(round(level2Accuracy * 1.00), 0, 100);
  const level3PredictedScore = clamp(round(level3Accuracy * 1.05), 0, 100);

  // Averaged composite prediction across all 3 levels
  const overallAveragePredictedScore = clamp(
    round((level1PredictedScore + level2PredictedScore + level3PredictedScore) / 3),
    0,
    100
  );

  const levelPredictions = {
    level1PredictedScore,
    level2PredictedScore,
    level3PredictedScore,
    overallAveragePredictedScore,
    level1Accuracy,
    level2Accuracy,
    level3Accuracy,
    level1Attempts: l1Attempts,
    level2Attempts: l2Attempts,
    level3Attempts: l3Attempts,
  };

  return {
    subjectKey: opts.subjectKey,
    subjectDisplay: opts.subjectDisplay,
    grade: opts.grade || "",
    board: opts.board,
    assessmentCount: count,
    dataPoints,
    distinctTopics,
    levelCoverage,
    levelPredictions,
    coverageSignal,
    recencyWeightedScore,
    volatility,
    improvementRate,
    deterministicPrediction,
    deterministicRange,
    trendDirection,
    strongTopics: strong,
    weakTopics: weak,
    hasEnoughData: count >= 1,
  };
}

/** Deterministic trend — must not contradict the data (PART 39). */
function classifyTrend(pcts: number[], slp: number, volatility: number): ForecastTrend {
  const n = pcts.length;
  if (n < 2) return "stable";
  const last3 = pcts.slice(-3);
  const strictlyDown =
    last3.length >= 3 && last3[0] > last3[1] && last3[1] > last3[2];
  const strictlyUp = last3.length >= 3 && last3[0] < last3[1] && last3[1] < last3[2];
  if (strictlyDown) return slp <= -6 ? "strong_decline" : "declining";
  if (strictlyUp) return slp >= 6 ? "strong_growth" : "growth";
  if (volatility > 14) return "inconsistent";
  if (slp >= 4) return "growth";
  if (slp <= -4) return "declining";
  return "stable";
}

// ────────────────────────────────────────────────────────────────────────────
// CONFIDENCE (deterministic, explainable, evidence-gated)
// ────────────────────────────────────────────────────────────────────────────
const CONF_ORDER: ForecastConfidence[] = ["insufficient", "low", "medium", "high"];

export function deriveConfidence(profile: SubjectAssessmentProfile): ForecastConfidence {
  const { assessmentCount: n, coverageSignal, volatility, levelCoverage } = profile;
  const levelSpread =
    (levelCoverage.level1 > 0 ? 1 : 0) +
    (levelCoverage.level2 > 0 ? 1 : 0) +
    (levelCoverage.level3 > 0 ? 1 : 0);

  if (n === 0) return "insufficient";
  if (n === 1) return "low";
  if (n >= 4 && coverageSignal >= 55 && levelSpread >= 2 && volatility <= 12) return "high";
  if (coverageSignal < 30 || volatility > 20) return "low";
  return "medium";
}

function capConfidence(ai: ForecastConfidence, ceiling: ForecastConfidence): ForecastConfidence {
  return CONF_ORDER.indexOf(ai) > CONF_ORDER.indexOf(ceiling) ? ceiling : ai;
}

function confidenceReasons(profile: SubjectAssessmentProfile, conf: ForecastConfidence): string[] {
  const reasons: string[] = [];
  const n = profile.assessmentCount;
  reasons.push(
    `${n} valid ${profile.subjectDisplay} assessment${n === 1 ? "" : "s"} completed.`
  );
  reasons.push(`${profile.distinctTopics.length} distinct topic${profile.distinctTopics.length === 1 ? "" : "s"} assessed so far.`);
  const lvls: string[] = [];
  if (profile.levelCoverage.level1 > 0) lvls.push("Level 1");
  if (profile.levelCoverage.level2 > 0) lvls.push("Level 2");
  if (profile.levelCoverage.level3 > 0) lvls.push("Level 3");
  if (lvls.length) reasons.push(`Difficulty coverage: ${lvls.join(", ")}.`);
  if (n >= 2) reasons.push(`Recent results vary by about ${profile.volatility} percentage point${profile.volatility === 1 ? "" : "s"}.`);
  if (conf === "low" || conf === "insufficient") {
    reasons.push("More assessments across additional chapters and difficulty levels will raise confidence.");
  }
  return reasons.slice(0, 5);
}

// ────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC SNAPSHOT (fallback + baseline)
// ────────────────────────────────────────────────────────────────────────────
const TREND_PHRASE: Record<ForecastTrend, string> = {
  strong_growth: "Preparation is improving strongly across recent assessments.",
  growth: "Preparation is trending upward.",
  stable: "Preparation is holding steady.",
  declining: "Preparation has slipped over the last few assessments.",
  strong_decline: "Preparation has declined noticeably in recent assessments.",
  inconsistent: "Performance is currently inconsistent between assessments.",
};

export function buildDeterministicSnapshot(
  profile: SubjectAssessmentProfile,
  studentId: string
): BoardForecastSnapshot {
  const confidence = deriveConfidence(profile);
  const latestExamId = profile.dataPoints.length
    ? profile.dataPoints[profile.dataPoints.length - 1].examId
    : "";

  const summaryPointers: string[] = [TREND_PHRASE[profile.trendDirection]];
  if (profile.assessmentCount > 0) {
    summaryPointers.push(
      `Estimated board readiness is around ${profile.deterministicPrediction}% (likely ${profile.deterministicRange.min}%-${profile.deterministicRange.max}%).`
    );
  }
  if (profile.coverageSignal < 45) {
    summaryPointers.push("Only part of the subject has been assessed so far, so treat this as an early estimate.");
  }

  const strengths = profile.strongTopics.map((t) => `Consistent accuracy in ${t}.`);
  const improvementAreas = profile.weakTopics.map((t) => `Accuracy is low in ${t}.`);

  const nextActions: string[] = [];
  if (profile.weakTopics[0]) nextActions.push(`Revise ${profile.weakTopics[0]} before your next assessment.`);
  if (profile.weakTopics[1]) nextActions.push(`Practise more questions on ${profile.weakTopics[1]}.`);
  if (profile.levelCoverage.level3 === 0) {
    nextActions.push("Attempt a Level 3 assessment to test board-level readiness.");
  }
  if (profile.assessmentCount < 3) {
    nextActions.push("Complete more assessments to sharpen this forecast.");
  }
  if (nextActions.length === 0) {
    nextActions.push("Keep practising advanced questions to maintain your preparation.");
  }

  return {
    studentId,
    subjectKey: profile.subjectKey,
    subjectDisplay: profile.subjectDisplay,
    grade: profile.grade,
    predictedPercentage: profile.deterministicPrediction,
    minPrediction: profile.deterministicRange.min,
    maxPrediction: profile.deterministicRange.max,
    confidence,
    trend: profile.trendDirection,
    summaryPointers: summaryPointers.slice(0, 5),
    strengths: strengths.slice(0, 4),
    improvementAreas: improvementAreas.slice(0, 4),
    nextActions: nextActions.slice(0, 5),
    confidenceReasons: confidenceReasons(profile, confidence),
    warningFlags:
      profile.assessmentCount === 1
        ? ["Early estimate based on a single assessment."]
        : profile.trendDirection === "inconsistent"
        ? ["Scores vary a lot between assessments."]
        : [],
    levelPredictions: profile.levelPredictions,
    assessmentCount: profile.assessmentCount,
    coverageSignal: profile.coverageSignal,
    latestExamId,
    generatedAt: new Date().toISOString(),
    modelVersion: `${FORECAST_MODEL_VERSION}/deterministic`,
    source: "deterministic",
  };
}

// ────────────────────────────────────────────────────────────────────────────
// GEMINI FORECAST (interpretation only; numbers clamped to a sanity band)
// ────────────────────────────────────────────────────────────────────────────
function parseForecastJson(raw: string): BoardPredictionResult | null {
  try {
    const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as BoardPredictionResult;
  } catch {
    return null;
  }
}

function buildForecastPrompt(profile: SubjectAssessmentProfile): string {
  const rows = profile.dataPoints
    .map((d, i) => {
      const lv = d.weightedDifficulty.toFixed(1);
      return `#${i + 1} | date=${d.date.slice(0, 10)} | score=${d.percentage}% | avgLevel(1-3)=${lv} | questions=${d.totalQuestions} | topics=${d.topics.length}`;
    })
    .join("\n");

  return `You are the ZeePrep Board Preparation Forecast Engine. You interpret a student's assessment evidence for one subject and estimate readiness for their upcoming final/board examination.

STRICT RULES:
- Use ONLY the evidence below. Do NOT invent exams, topics, syllabus coverage, grades, board rules or resources.
- This is an educational estimate, NOT a guaranteed board result. Never claim certainty.
- Do NOT return any private reasoning or chain-of-thought. Return conclusions only.
- Return ONE valid JSON object and nothing else.

SUBJECT: ${profile.subjectDisplay}
GRADE: ${profile.grade || "unspecified"}
BOARD/FINAL TARGET: ${profile.board || "upcoming final/board examination"}
VALID ASSESSMENTS (chronological, oldest first): ${profile.assessmentCount}
${rows || "(none)"}

DETERMINISTIC ANALYSIS (already computed from the evidence — treat as ground truth):
- Difficulty/recency-weighted estimate: ${profile.deterministicPrediction}%
- Suggested likely range: ${profile.deterministicRange.min}%-${profile.deterministicRange.max}%
- Trend: ${profile.trendDirection}
- Recent score volatility: ${profile.volatility} percentage points
- Improvement rate: ${profile.improvementRate} points per assessment
- Breadth of topics assessed (0-100 heuristic, NOT a syllabus %): ${profile.coverageSignal}
- Distinct topics assessed: ${profile.distinctTopics.slice(0, 12).join(", ") || "none"}
- Level coverage: L1=${profile.levelCoverage.level1}, L2=${profile.levelCoverage.level2}, L3=${profile.levelCoverage.level3}
- Strong topics: ${profile.strongTopics.join(", ") || "none identified"}
- Weak topics: ${profile.weakTopics.join(", ") || "none identified"}

Return JSON with EXACTLY these keys:
{
  "predictedPercentage": number (0-100, stay within a few points of the deterministic estimate),
  "likelyRange": { "min": number, "max": number },
  "confidence": "low" | "medium" | "high",
  "trend": "strong_growth" | "growth" | "stable" | "declining" | "strong_decline" | "inconsistent",
  "summaryPointers": string[] (2-4 short one-idea sentences),
  "strengths": string[] (grounded in the strong topics / evidence),
  "improvementAreas": string[] (grounded in the weak topics / evidence),
  "nextActions": string[] (specific, actionable, one idea each),
  "confidenceReasons": string[] (why confidence is what it is),
  "warningFlags": string[] (optional; anomalies like a single outlier or very thin data)
}
Each string must be a single concise idea, no markdown, no numbering.`;
}

export async function generateBoardForecast(
  profile: SubjectAssessmentProfile,
  studentId: string
): Promise<BoardForecastSnapshot> {
  // No usable evidence → deterministic insufficient snapshot, no API spend.
  if (!profile.hasEnoughData) {
    const snap = buildDeterministicSnapshot(profile, studentId);
    snap.confidence = "insufficient";
    snap.summaryPointers = ["Not enough assessment data yet to forecast board preparation."];
    return snap;
  }

  const ceiling = deriveConfidence(profile);

  let raw: string | null = null;
  try {
    raw = await callGeminiAPI(buildForecastPrompt(profile), "boardForecast");
  } catch {
    raw = null;
  }

  const parsed = raw ? parseForecastJson(raw) : null;
  if (!parsed) {
    return buildDeterministicSnapshot(profile, studentId);
  }

  // ── VALIDATE + CLAMP (never trust AI numbers) ──
  let predicted = Number(parsed.predictedPercentage);
  if (!isFinite(predicted)) return buildDeterministicSnapshot(profile, studentId);
  // Keep AI within +/-8 of the deterministic estimate, then to [0,100].
  predicted = clamp(
    predicted,
    profile.deterministicPrediction - 8,
    profile.deterministicPrediction + 8
  );
  predicted = clamp(round(predicted), 0, 100);

  let lo = Number(parsed?.likelyRange?.min);
  let hi = Number(parsed?.likelyRange?.max);
  if (!isFinite(lo) || !isFinite(hi) || lo > hi) {
    lo = profile.deterministicRange.min;
    hi = profile.deterministicRange.max;
  }
  lo = clamp(round(lo), 0, 100);
  hi = clamp(round(hi), 0, 100);
  // Ensure min <= predicted <= max.
  lo = Math.min(lo, predicted);
  hi = Math.max(hi, predicted);

  const aiConf: ForecastConfidence =
    parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
      ? parsed.confidence
      : ceiling;
  const confidence = capConfidence(aiConf, ceiling);

  const strengths = sanitizeList(parsed.strengths, 4);
  const improvementAreas = sanitizeList(parsed.improvementAreas, 4);
  const nextActions = sanitizeList(parsed.nextActions, 5);
  const summaryPointers = sanitizeList(parsed.summaryPointers, 4);

  const det = buildDeterministicSnapshot(profile, studentId);

  return {
    studentId,
    subjectKey: profile.subjectKey,
    subjectDisplay: profile.subjectDisplay,
    grade: profile.grade,
    predictedPercentage: predicted,
    minPrediction: lo,
    maxPrediction: hi,
    confidence,
    // Deterministic trend is authoritative — AI interpretation must not contradict history.
    trend: profile.trendDirection,
    summaryPointers: summaryPointers.length ? summaryPointers : det.summaryPointers,
    strengths: strengths.length ? strengths : det.strengths,
    improvementAreas: improvementAreas.length ? improvementAreas : det.improvementAreas,
    nextActions: nextActions.length ? nextActions : det.nextActions,
    confidenceReasons: confidenceReasons(profile, confidence),
    warningFlags: sanitizeList(parsed.warningFlags, 3),
    levelPredictions: profile.levelPredictions,
    assessmentCount: profile.assessmentCount,
    coverageSignal: profile.coverageSignal,
    latestExamId: det.latestExamId,
    generatedAt: new Date().toISOString(),
    modelVersion: `${FORECAST_MODEL_VERSION}/${AI_MODEL_TAG}`,
    source: "ai",
  };
}
