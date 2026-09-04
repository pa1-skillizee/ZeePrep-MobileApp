/**
 * ZeePrep — Board Examination Preparation Forecast Types
 * ------------------------------------------------------
 * Additive, backward-compatible layer that sits ON TOP of the authoritative
 * deterministic report engine (report-engine.ts). Nothing here alters factual
 * assessment scores; these types describe the *forecast* (interpretation) layer.
 */

export type ForecastConfidence = "insufficient" | "low" | "medium" | "high";

export type ForecastTrend =
  | "strong_growth"
  | "growth"
  | "stable"
  | "declining"
  | "strong_decline"
  | "inconsistent";

/** A single valid assessment contributing to a subject forecast (chronological). */
export interface AssessmentDataPoint {
  reportId: string;
  examId: string;
  examTitle: string;
  /** Deterministic actual score percentage from report-engine (0-100). */
  percentage: number;
  /** Effective difficulty of the exam on a 1..3 scale (level1..level3). */
  weightedDifficulty: number;
  totalQuestions: number;
  /** ISO timestamp of the attempt. */
  date: string;
  topics: string[];
  attemptNumber: number;
}

export interface LevelScorePrediction {
  level1PredictedScore: number; // 0-100 (Level 1 Foundational prediction)
  level2PredictedScore: number; // 0-100 (Level 2 Application prediction)
  level3PredictedScore: number; // 0-100 (Level 3 Advanced / HOTS prediction)
  overallAveragePredictedScore: number; // 0-100 (Average across all 3 levels)
  level1Accuracy: number; // Actual % on Level 1
  level2Accuracy: number; // Actual % on Level 2
  level3Accuracy: number; // Actual % on Level 3
  level1Attempts: number;
  level2Attempts: number;
  level3Attempts: number;
}

/** Deterministic, AI-free normalized profile for one subject. */
export interface SubjectAssessmentProfile {
  subjectKey: string;        // normalized (e.g. "mathematics")
  subjectDisplay: string;    // human display (e.g. "Mathematics")
  grade: string;
  board?: string;
  assessmentCount: number;
  dataPoints: AssessmentDataPoint[]; // chronological, deduped per exam (latest valid attempt)
  distinctTopics: string[];
  levelCoverage: { level1: number; level2: number; level3: number };
  levelPredictions?: LevelScorePrediction;
  /** 0-100 breadth heuristic (topics assessed + level spread + volume). NOT a true syllabus %. */
  coverageSignal: number;
  recencyWeightedScore: number;   // 0-100
  volatility: number;             // std-dev style spread of recent scores
  improvementRate: number;        // slope, percentage-points per assessment
  deterministicPrediction: number;// 0-100 baseline board-equivalent estimate
  deterministicRange: { min: number; max: number };
  trendDirection: ForecastTrend;
  strongTopics: string[];
  weakTopics: string[];
  hasEnoughData: boolean;
}

/** Compact forecast snapshot (what Gemini produces, after validation). */
export interface BoardForecastSnapshot {
  studentId: string;
  subjectKey: string;
  subjectDisplay: string;
  grade?: string;
  predictedPercentage: number;
  minPrediction: number;
  maxPrediction: number;
  confidence: ForecastConfidence;
  trend: ForecastTrend;
  summaryPointers: string[];
  strengths: string[];
  improvementAreas: string[];
  nextActions: string[];
  confidenceReasons: string[];
  warningFlags?: string[];
  levelPredictions?: LevelScorePrediction;
  assessmentCount: number;
  coverageSignal: number;
  latestExamId: string;
  generatedAt: string;       // ISO
  modelVersion: string;      // e.g. "forecast-v1/gemini-2.5-flash"
  source: "ai" | "deterministic";
}

/** One compact point in the persisted prediction history (how the forecast itself moved). */
export interface ForecastHistoryPoint {
  date: string;              // ISO
  predictedPercentage: number;
  actualPercentage: number;  // the assessment score that produced this update
  confidence: ForecastConfidence;
  examId: string;
  assessmentCount: number;
}

/** Persisted per (student, subject) forecast document. */
export interface SubjectForecastRecord {
  id: string;                // `${studentId}__${subjectKey}`
  studentId: string;
  subjectKey: string;
  subjectDisplay: string;
  grade?: string;
  latest: BoardForecastSnapshot;
  history: ForecastHistoryPoint[];
  updatedAt: string;
}

/** Raw shape we ask Gemini to return (validated before use). */
export interface BoardPredictionResult {
  predictedPercentage: number;
  likelyRange: { min: number; max: number };
  confidence: "low" | "medium" | "high";
  trend: ForecastTrend;
  summaryPointers: string[];
  strengths: string[];
  improvementAreas: string[];
  nextActions: string[];
  confidenceReasons: string[];
  warningFlags?: string[];
}
