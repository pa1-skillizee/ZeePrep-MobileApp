/**
 * ZeePrep — Global Student Report Engine
 * Composes a combined cross-subject academic view FROM the per-subject forecasts
 * (reuses board-forecast-engine — no duplicate calculation engine). Never mixes
 * subjects inside a subject prediction; the overall figure is a transparent,
 * evidence-weighted composition of the subject-level predictions (NOT a naive
 * average of unrelated percentages). No fabricated points; no fake syllabus %.
 */
import type { Report } from "../types";
import type { ForecastConfidence, ForecastTrend } from "../types/forecast";
import {
  buildSubjectAssessmentProfile,
  buildDeterministicSnapshot,
  subjectKeyForReport,
  subjectDisplayForReport,
} from "./board-forecast-engine";

export interface GlobalSubjectSummary {
  subjectKey: string;
  subjectDisplay: string;
  assessmentCount: number;
  averageScore: number;
  latestScore: number;
  predictedPercentage: number;
  minPrediction: number;
  maxPrediction: number;
  confidence: ForecastConfidence;
  trend: ForecastTrend;
}

export interface GlobalStudentReport {
  studentId: string;
  grade?: string;
  subjects: GlobalSubjectSummary[];
  overallPredicted: number;
  overallRange: { min: number; max: number };
  overallConfidence: ForecastConfidence;
  overallTrend: ForecastTrend;
  overallTrendSeries: { date: string; value: number }[];
  strongestSubject?: string;
  weakestSubject?: string;
  improvingSubjects: string[];
  decliningSubjects: string[];
  totalAssessments: number;
  distinctSubjects: number;
  topicsAssessed: number;
  hasEnoughData: boolean;
  methodology: string;
}

const CONF_SCORE: Record<ForecastConfidence, number> = { insufficient: 0, low: 1, medium: 2, high: 3 };
const CONF_FROM_SCORE = (s: number): ForecastConfidence =>
  s >= 2.5 ? "high" : s >= 1.5 ? "medium" : s >= 0.75 ? "low" : "insufficient";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

function classifyTrend(pcts: number[]): ForecastTrend {
  const n = pcts.length;
  if (n < 2) return "stable";
  const m = mean(pcts);
  const vol = Math.sqrt(mean(pcts.map((p) => (p - m) * (p - m))));
  const mx = (n - 1) / 2;
  let num = 0, den = 0;
  pcts.forEach((p, i) => {
    num += (i - mx) * (p - m);
    den += (i - mx) * (i - mx);
  });
  const slope = den ? num / den : 0;
  const last3 = pcts.slice(-3);
  if (last3.length >= 3 && last3[0] > last3[1] && last3[1] > last3[2]) return slope <= -6 ? "strong_decline" : "declining";
  if (last3.length >= 3 && last3[0] < last3[1] && last3[1] < last3[2]) return slope >= 6 ? "strong_growth" : "growth";
  if (vol > 14) return "inconsistent";
  if (slope >= 4) return "growth";
  if (slope <= -4) return "declining";
  return "stable";
}

const isValid = (r: Report) =>
  !!(r && Array.isArray(r.detailedAnalysis) && r.detailedAnalysis.length > 0 &&
     typeof r.percentage === "number" && isFinite(r.percentage) && Number(r.totalQuestions) > 0);

export function buildGlobalStudentReport(
  allReports: Report[],
  studentId: string,
  grade?: string
): GlobalStudentReport {
  const valid = (allReports || []).filter((r) => isValid(r) && r.studentId === studentId);

  // Group by normalized subject.
  const groups = new Map<string, Report[]>();
  for (const r of valid) {
    const key = subjectKeyForReport(r);
    if (!key) continue;
    (groups.get(key) || groups.set(key, []).get(key)!).push(r);
  }

  const subjects: GlobalSubjectSummary[] = [];
  const improvingSubjects: string[] = [];
  const decliningSubjects: string[] = [];
  let topicsAssessed = 0;

  groups.forEach((reps, key) => {
    const display = subjectDisplayForReport(reps[0]);
    const profile = buildSubjectAssessmentProfile(reps, {
      subjectKey: key,
      subjectDisplay: display,
      grade,
    });
    const snap = buildDeterministicSnapshot(profile, studentId);
    const pcts = profile.dataPoints.map((d) => d.percentage);
    topicsAssessed += profile.distinctTopics.length;

    const summary: GlobalSubjectSummary = {
      subjectKey: key,
      subjectDisplay: display,
      assessmentCount: profile.assessmentCount,
      averageScore: Math.round(mean(pcts)),
      latestScore: pcts.length ? pcts[pcts.length - 1] : 0,
      predictedPercentage: snap.predictedPercentage,
      minPrediction: snap.minPrediction,
      maxPrediction: snap.maxPrediction,
      confidence: snap.confidence,
      trend: profile.trendDirection,
    };
    subjects.push(summary);
    if (summary.trend === "growth" || summary.trend === "strong_growth") improvingSubjects.push(display);
    if (summary.trend === "declining" || summary.trend === "strong_decline") decliningSubjects.push(display);
  });

  subjects.sort((a, b) => b.predictedPercentage - a.predictedPercentage);

  const totalAssessments = valid.length;
  const distinctSubjects = subjects.length;

  // Overall = evidence-weighted composition of SUBJECT predictions (weight by
  // that subject's assessment count). This never averages raw unrelated exam
  // percentages; it composes the already difficulty/recency-aware subject models.
  const wSum = subjects.reduce((a, s) => a + s.assessmentCount, 0) || 1;
  const overallPredicted = subjects.length
    ? clamp(Math.round(subjects.reduce((a, s) => a + s.predictedPercentage * s.assessmentCount, 0) / wSum), 0, 100)
    : 0;
  const overallMin = subjects.length
    ? clamp(Math.round(subjects.reduce((a, s) => a + s.minPrediction * s.assessmentCount, 0) / wSum), 0, 100)
    : 0;
  const overallMax = subjects.length
    ? clamp(Math.round(subjects.reduce((a, s) => a + s.maxPrediction * s.assessmentCount, 0) / wSum), 0, 100)
    : 0;

  const overallConfidence = subjects.length
    ? CONF_FROM_SCORE(subjects.reduce((a, s) => a + CONF_SCORE[s.confidence] * s.assessmentCount, 0) / wSum)
    : "insufficient";

  // Real cross-subject trend series: all valid reports over time.
  const chronological = [...valid].sort(
    (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );
  const overallTrendSeries = chronological.map((r) => ({
    date: new Date(r.createdAt || Date.now()).toISOString(),
    value: clamp(Math.round(Number(r.percentage) || 0), 0, 100),
  }));
  const overallTrend = classifyTrend(overallTrendSeries.map((p) => p.value));

  return {
    studentId,
    grade,
    subjects,
    overallPredicted,
    overallRange: { min: Math.min(overallMin, overallPredicted), max: Math.max(overallMax, overallPredicted) },
    overallConfidence,
    overallTrend,
    overallTrendSeries,
    strongestSubject: subjects[0]?.subjectDisplay,
    weakestSubject: subjects.length ? subjects[subjects.length - 1].subjectDisplay : undefined,
    improvingSubjects,
    decliningSubjects,
    totalAssessments,
    distinctSubjects,
    topicsAssessed,
    hasEnoughData: totalAssessments >= 1 && distinctSubjects >= 1,
    methodology:
      "Overall is an evidence-weighted composition of each subject's board prediction, weighted by that subject's assessment count. Subject predictions are computed independently (difficulty-, recency- and outlier-aware) and are never mixed. Confidence and breadth derive from assessment count, distinct topics and level spread — not a syllabus percentage.",
  };
}
