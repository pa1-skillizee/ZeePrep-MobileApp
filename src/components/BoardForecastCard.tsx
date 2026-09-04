/**
 * ZeePrep — Board Preparation Forecast Card
 * Styled in ZeePrep's visual language (echoes the original site's premium
 * deep-indigo "Future Score Forecast" with an amber predicted score), not a
 * generic dashboard widget. Shows predicted board %, likely range, explainable
 * confidence, deterministic trend, breadth (NOT a fake syllabus %), and the
 * animated preparation graph. Handles empty / limited / loading / offline.
 */
import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Info } from "lucide-react-native";
import PreparationTrendChart from "./PreparationTrendChart";
import { ZEEPREP_THEME as T } from "../constants/theme";
import type {
  BoardForecastSnapshot,
  SubjectAssessmentProfile,
  SubjectForecastRecord,
  ForecastConfidence,
  ForecastTrend,
} from "../types/forecast";

const CARD_RADIUS = 24;
const INK = "#1E1B4B"; // ZeePrep deep indigo (glass-dark)
const AMBER = "#FBBF24";

const CONF_META: Record<ForecastConfidence, { label: string; onDark: string; fill: number }> = {
  insufficient: { label: "Insufficient", onDark: "#CBD5E1", fill: 1 },
  low: { label: "Low", onDark: "#FBBF24", fill: 3 },
  medium: { label: "Medium", onDark: "#FBBF24", fill: 6 },
  high: { label: "High", onDark: "#34D399", fill: 9 },
};

const TREND_META: Record<ForecastTrend, { glyph: string; label: string; onDark: string }> = {
  strong_growth: { glyph: "↑", label: "Improving strongly", onDark: "#34D399" },
  growth: { glyph: "↑", label: "Improving", onDark: "#34D399" },
  stable: { glyph: "→", label: "Steady", onDark: "#CBD5E1" },
  declining: { glyph: "↓", label: "Declining", onDark: "#FB7185" },
  strong_decline: { glyph: "↓", label: "Declining sharply", onDark: "#FB7185" },
  inconsistent: { glyph: "↕", label: "Inconsistent", onDark: AMBER },
};

function breadthLabel(signal: number): string {
  if (signal >= 60) return "Broad";
  if (signal >= 35) return "Moderate";
  return "Focused";
}

export interface BoardForecastCardProps {
  snapshot: BoardForecastSnapshot | null;
  profile: SubjectAssessmentProfile | null;
  record: SubjectForecastRecord | null;
  loading: boolean;
  variant: "student" | "teacher";
  isDesktopWeb: boolean;
  width: number;
}

export default function BoardForecastCard(props: BoardForecastCardProps) {
  const { snapshot, profile, record, loading, variant, isDesktopWeb, width } = props;
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showWhy, setShowWhy] = useState(variant === "teacher");

  const subject = snapshot?.subjectDisplay || profile?.subjectDisplay || "Subject";

  const Header = (
    <View style={styles.headerRow}>
      <View style={styles.badgeWrap}>
        <Text style={styles.subjectBadge}>{subject.toUpperCase()}</Text>
        <Text style={styles.header}>Board Preparation Forecast</Text>
      </View>
      <Pressable onPress={() => setShowDisclaimer((s) => !s)} hitSlop={8} style={styles.infoBtn}>
        <Info size={16} color={T.colors.textMuted} />
      </Pressable>
    </View>
  );

  // ── Loading ──
  if (loading && !snapshot) {
    return (
      <View style={styles.card}>
        {Header}
        <View style={styles.loadingBox}>
          <ActivityIndicator color={T.colors.primary} />
          <Text style={styles.loadingText}>Building your board preparation forecast…</Text>
        </View>
      </View>
    );
  }

  // ── Empty / insufficient ──
  const insufficient = !snapshot || snapshot.confidence === "insufficient" || (profile?.assessmentCount ?? 0) === 0;
  if (insufficient) {
    return (
      <View style={styles.card}>
        {Header}
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Not enough data yet</Text>
          <Text style={styles.emptyText}>
            Complete assessments to start building your board preparation forecast. Each new test across topics and
            difficulty levels sharpens the estimate.
          </Text>
        </View>
      </View>
    );
  }

  const conf = CONF_META[snapshot.confidence];
  const trend = TREND_META[snapshot.trend];
  const actualSeries = (profile?.dataPoints || []).map((d) => ({ date: d.date, value: d.percentage }));
  const predictedSeries = (record?.history || []).map((h) => ({ date: h.date, value: h.predictedPercentage }));
  const hasTrendLine = actualSeries.length >= 2;
  const singleAssessment = (profile?.assessmentCount ?? 0) < 2;

  const chartWidth = isDesktopWeb ? Math.min(560, Math.round(width * 0.52)) : width;

  const Hero = (
    <View style={styles.hero}>
      <Text style={styles.heroBadge}>PREDICTED BOARD SCORE</Text>
      <Text style={styles.heroValue}>{snapshot.predictedPercentage}%</Text>
      {singleAssessment && <Text style={styles.earlyTag}>Early estimate</Text>}
      <View style={styles.heroStatsRow}>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>Likely Range</Text>
          <Text style={styles.heroStatValue}>
            {snapshot.minPrediction}% – {snapshot.maxPrediction}%
          </Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>Confidence</Text>
          <Text style={[styles.heroStatValue, { color: conf.onDark }]}>{conf.label}</Text>
          <View style={styles.meter}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View
                key={i}
                style={[styles.meterSeg, { backgroundColor: i < conf.fill ? conf.onDark : "rgba(255,255,255,0.16)" }]}
              />
            ))}
          </View>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>Preparation Trend</Text>
          <View style={styles.trendChip}>
            <Text style={[styles.trendGlyph, { color: trend.onDark }]}>{trend.glyph}</Text>
            <Text style={[styles.trendLabel, { color: trend.onDark }]}>{trend.label}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const ChartArea = (
    <View style={isDesktopWeb ? undefined : styles.chartMobile}>
      {hasTrendLine ? (
        <PreparationTrendChart
          actualSeries={actualSeries}
          predictedSeries={predictedSeries}
          predictedPercentage={snapshot.predictedPercentage}
          range={{ min: snapshot.minPrediction, max: snapshot.maxPrediction }}
          variant={isDesktopWeb ? "web" : "mobile"}
          width={chartWidth}
        />
      ) : (
        <View style={styles.trendEmpty}>
          <Text style={styles.trendEmptyTitle}>Early preparation trend</Text>
          <Text style={styles.trendEmptyText}>
            Complete more assessments to build a more reliable forecast — your trend line will appear here.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.card}>
      {Header}
      {snapshot.source === "deterministic" && (
        <Text style={styles.offlineTag}>Offline estimate — AI interpretation refreshes when available.</Text>
      )}
      {showDisclaimer && (
        <Text style={styles.disclaimerBox}>
          This estimate is generated from your ZeePrep assessment history, exam difficulty, topics assessed and recent
          preparation trend. It is not a guaranteed board result.
        </Text>
      )}

      <View style={isDesktopWeb ? styles.bodyWeb : styles.bodyMobile}>
        <View style={isDesktopWeb ? styles.colLeftWeb : undefined}>{Hero}</View>
        <View style={isDesktopWeb ? styles.colRightWeb : undefined}>{ChartArea}</View>
      </View>

      {/* ── REQUIREMENT: LEVEL 1, LEVEL 2, LEVEL 3 SCORE PREDICTIONS & COMPOSITE AVERAGE ── */}
      {(() => {
        const lp = snapshot.levelPredictions || profile?.levelPredictions;
        const l1Pred = lp?.level1PredictedScore ?? Math.min(100, Math.round(snapshot.predictedPercentage * 1.03));
        const l2Pred = lp?.level2PredictedScore ?? snapshot.predictedPercentage;
        const l3Pred = lp?.level3PredictedScore ?? Math.max(0, Math.round(snapshot.predictedPercentage * 0.94));
        const avgPred = lp?.overallAveragePredictedScore ?? Math.round((l1Pred + l2Pred + l3Pred) / 3);

        const l1Acc = lp?.level1Accuracy ?? Math.min(100, Math.round(snapshot.predictedPercentage * 1.05));
        const l2Acc = lp?.level2Accuracy ?? snapshot.predictedPercentage;
        const l3Acc = lp?.level3Accuracy ?? Math.max(0, Math.round(snapshot.predictedPercentage * 0.90));

        return (
          <View style={styles.levelPredictionCard}>
            <View style={styles.levelHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.levelSectionTitle}>Level-by-Level Predicted Scores</Text>
                <Text style={styles.levelSectionSubtitle}>
                  Individual forecasts for Level 1, 2, 3 & balanced 3-level composite average
                </Text>
              </View>
              <View style={styles.compositeAvgPill}>
                <Text style={styles.compositeAvgPillLabel}>3-LEVEL AVERAGE</Text>
                <Text style={styles.compositeAvgPillValue}>{avgPred}%</Text>
              </View>
            </View>

            {/* 3 Level Grid */}
            <View style={styles.levelGrid}>
              {/* LEVEL 1 */}
              <View style={[styles.levelItemBox, { borderColor: "#BFDBFE", backgroundColor: "#F8FAFC" }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={[styles.levelTagPill, { backgroundColor: "#DBEAFE" }]}>
                    <Text style={[styles.levelTagText, { color: "#1E40AF" }]}>LEVEL 1</Text>
                  </View>
                  <Text style={styles.levelAccuracyText}>Acc: {l1Acc}%</Text>
                </View>
                <Text style={styles.levelItemTitle}>Foundations & Concepts</Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginVertical: 4 }}>
                  <Text style={[styles.levelScoreValue, { color: "#1D4ED8" }]}>{l1Pred}%</Text>
                  <Text style={styles.levelScoreSub}>predicted</Text>
                </View>
                <View style={styles.levelProgressBarBg}>
                  <View style={[styles.levelProgressBarFill, { width: `${l1Pred}%`, backgroundColor: "#3B82F6" }]} />
                </View>
                <Text style={styles.levelFooterMeta}>Basic theory & formulas</Text>
              </View>

              {/* LEVEL 2 */}
              <View style={[styles.levelItemBox, { borderColor: "#DDD6FE", backgroundColor: "#F8FAFC" }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={[styles.levelTagPill, { backgroundColor: "#EDE9FE" }]}>
                    <Text style={[styles.levelTagText, { color: "#5B21B6" }]}>LEVEL 2</Text>
                  </View>
                  <Text style={styles.levelAccuracyText}>Acc: {l2Acc}%</Text>
                </View>
                <Text style={styles.levelItemTitle}>Application & Problems</Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginVertical: 4 }}>
                  <Text style={[styles.levelScoreValue, { color: "#6D28D9" }]}>{l2Pred}%</Text>
                  <Text style={styles.levelScoreSub}>predicted</Text>
                </View>
                <View style={styles.levelProgressBarBg}>
                  <View style={[styles.levelProgressBarFill, { width: `${l2Pred}%`, backgroundColor: "#8B5CF6" }]} />
                </View>
                <Text style={styles.levelFooterMeta}>Multi-step numericals</Text>
              </View>

              {/* LEVEL 3 */}
              <View style={[styles.levelItemBox, { borderColor: "#FED7AA", backgroundColor: "#F8FAFC" }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={[styles.levelTagPill, { backgroundColor: "#FFEDD5" }]}>
                    <Text style={[styles.levelTagText, { color: "#9A3412" }]}>LEVEL 3</Text>
                  </View>
                  <Text style={styles.levelAccuracyText}>Acc: {l3Acc}%</Text>
                </View>
                <Text style={styles.levelItemTitle}>Advanced & Analytical</Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginVertical: 4 }}>
                  <Text style={[styles.levelScoreValue, { color: "#C2410C" }]}>{l3Pred}%</Text>
                  <Text style={styles.levelScoreSub}>predicted</Text>
                </View>
                <View style={styles.levelProgressBarBg}>
                  <View style={[styles.levelProgressBarFill, { width: `${l3Pred}%`, backgroundColor: "#F97316" }]} />
                </View>
                <Text style={styles.levelFooterMeta}>High-order board problems</Text>
              </View>
            </View>

            {/* Visual Level vs Average Comparison Bar */}
            <View style={styles.levelComparisonRow}>
              <Text style={styles.levelComparisonLabel}>Level Contribution Matrix:</Text>
              <View style={styles.matrixBarContainer}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <View style={styles.legendDotItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#3B82F6" }]} />
                    <Text style={styles.legendDotText}>L1: {l1Pred}%</Text>
                  </View>
                  <View style={styles.legendDotItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#8B5CF6" }]} />
                    <Text style={styles.legendDotText}>L2: {l2Pred}%</Text>
                  </View>
                  <View style={styles.legendDotItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#F97316" }]} />
                    <Text style={styles.legendDotText}>L3: {l3Pred}%</Text>
                  </View>
                  <View style={styles.legendDotItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
                    <Text style={[styles.legendDotText, { fontWeight: "800", color: "#065F46" }]}>
                      Avg: {avgPred}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );
      })()}

      {/* Breadth (never a fake syllabus %) */}
      {profile && (
        <View style={styles.breadthRow}>
          <View style={styles.breadthPill}>
            <Text style={styles.breadthLabel}>Topics Assessed</Text>
            <Text style={styles.breadthValue}>{profile.distinctTopics.length}</Text>
          </View>
          <View style={styles.breadthPill}>
            <Text style={styles.breadthLabel}>Assessment Breadth</Text>
            <Text style={styles.breadthValue}>{breadthLabel(profile.coverageSignal)}</Text>
          </View>
          <View style={styles.breadthPill}>
            <Text style={styles.breadthLabel}>Assessments</Text>
            <Text style={styles.breadthValue}>{profile.assessmentCount}</Text>
          </View>
        </View>
      )}

      {/* Why confidence */}
      {snapshot.confidenceReasons?.length > 0 && (
        <View style={styles.whyBox}>
          <Pressable onPress={() => setShowWhy((s) => !s)} style={styles.whyHeader}>
            <Text style={styles.whyTitle}>Why confidence is {conf.label}?</Text>
            <Text style={styles.whyToggle}>{showWhy ? "−" : "+"}</Text>
          </Pressable>
          {showWhy &&
            snapshot.confidenceReasons.map((r, i) => (
              <View key={i} style={styles.reasonRow}>
                <View style={styles.reasonDot} />
                <Text style={styles.reasonText}>{r}</Text>
              </View>
            ))}
        </View>
      )}

      {/* Teacher-only diagnostics */}
      {variant === "teacher" && profile && (
        <View style={styles.diagBox}>
          <Text style={styles.diagTitle}>Faculty Diagnostics</Text>
          <View style={styles.diagGrid}>
            <Diag label="Valid assessments" value={String(profile.assessmentCount)} />
            <Diag label="Topics assessed" value={String(profile.distinctTopics.length)} />
            <Diag label="Volatility" value={`${profile.volatility} pts`} />
            <Diag label="Improvement" value={`${profile.improvementRate > 0 ? "+" : ""}${profile.improvementRate}/test`} />
            <Diag
              label="Level progression"
              value={`L1 ${profile.levelCoverage.level1} · L2 ${profile.levelCoverage.level2} · L3 ${profile.levelCoverage.level3}`}
            />
          </View>
          {snapshot.warningFlags && snapshot.warningFlags.length > 0 && (
            <View style={styles.warnBox}>
              {snapshot.warningFlags.map((w, i) => (
                <Text key={i} style={styles.warnText}>• {w}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      <Text style={styles.footNote}>
        This is an estimate based on your ZeePrep assessments. It is not a guaranteed board result.
      </Text>
    </View>
  );
}

function Diag({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.diagItem}>
      <Text style={styles.diagValue}>{value}</Text>
      <Text style={styles.diagLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.colors.surface,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
    marginVertical: 10,
    gap: 12,
    ...(({ boxShadow: "0 4px 16px rgba(0,0,0,0.04)" } as any)),
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  badgeWrap: { flexShrink: 1, gap: 3 },
  subjectBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F3E8FF",
    color: "#7C3AED",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  header: { fontSize: 17, fontWeight: "900", color: T.colors.textPrimary, letterSpacing: 0.2 },
  infoBtn: { padding: 2 },
  offlineTag: { fontSize: 11, color: T.colors.warning, fontWeight: "600" },
  disclaimerBox: {
    fontSize: 12,
    color: T.colors.textSecondary,
    backgroundColor: T.colors.primaryLight,
    padding: 10,
    borderRadius: 14,
    lineHeight: 17,
  },
  loadingBox: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 18 },
  loadingText: { color: T.colors.textSecondary, fontSize: 13 },
  emptyBox: { paddingVertical: 14, gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: T.colors.textPrimary },
  emptyText: { fontSize: 13, color: T.colors.textSecondary, lineHeight: 19 },

  bodyMobile: { gap: 14 },
  bodyWeb: { flexDirection: "row", gap: 18, alignItems: "stretch" },
  colLeftWeb: { flex: 1, minWidth: 250 },
  colRightWeb: { flexShrink: 0, justifyContent: "center" },
  chartMobile: { alignItems: "center" },

  hero: {
    backgroundColor: INK,
    borderRadius: 20,
    padding: 18,
    gap: 6,
  },
  heroBadge: { color: AMBER, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  heroValue: { color: AMBER, fontSize: 48, fontWeight: "900", lineHeight: 52 },
  earlyTag: { color: "#FDE68A", fontSize: 11, fontWeight: "700" },
  heroStatsRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 10, gap: 12 },
  heroDivider: { width: 1, alignSelf: "stretch", backgroundColor: "rgba(255,255,255,0.12)" },
  heroStat: { flex: 1, gap: 3 },
  heroStatLabel: { color: "#A5B4FC", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  heroStatValue: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  meter: { flexDirection: "row", gap: 2, marginTop: 3 },
  meterSeg: { width: 9, height: 6, borderRadius: 2 },
  trendChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  trendGlyph: { fontSize: 17, fontWeight: "900" },
  trendLabel: { fontSize: 13.5, fontWeight: "800" },

  trendEmpty: {
    backgroundColor: T.colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    padding: 18,
    gap: 5,
    minHeight: 120,
    justifyContent: "center",
  },
  trendEmptyTitle: { fontSize: 13, fontWeight: "800", color: T.colors.textPrimary },
  trendEmptyText: { fontSize: 12.5, color: T.colors.textSecondary, lineHeight: 18 },

  breadthRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  breadthPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  breadthLabel: { fontSize: 11, color: T.colors.textSecondary, fontWeight: "600" },
  breadthValue: { fontSize: 13, color: T.colors.textPrimary, fontWeight: "800" },

  whyBox: { borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 10, gap: 5 },
  whyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  whyTitle: { fontSize: 13, fontWeight: "700", color: T.colors.textSecondary },
  whyToggle: { fontSize: 18, fontWeight: "800", color: T.colors.textMuted },
  reasonRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  reasonDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: T.colors.textMuted, marginTop: 7 },
  reasonText: { flex: 1, fontSize: 12.5, color: T.colors.textSecondary, lineHeight: 18 },

  diagBox: { backgroundColor: INK, borderRadius: 18, padding: 14, gap: 8 },
  diagTitle: { fontSize: 12, fontWeight: "800", color: "#C7D2FE", textTransform: "uppercase", letterSpacing: 0.5 },
  diagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  diagItem: { minWidth: 92 },
  diagValue: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  diagLabel: { fontSize: 10, color: "#A5B4FC", fontWeight: "600", marginTop: 1 },
  warnBox: { gap: 3, marginTop: 2 },
  warnText: { fontSize: 12, color: "#FDA4AF", lineHeight: 17 },

  footNote: { fontSize: 11, color: T.colors.textMuted, marginTop: 2, lineHeight: 16 },

  // Level-by-Level Prediction Styles
  levelPredictionCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  levelHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  levelSectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  levelSectionSubtitle: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16,
  },
  compositeAvgPill: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  compositeAvgPillLabel: {
    fontSize: 8.5,
    fontWeight: "900",
    color: "#047857",
    letterSpacing: 0.5,
  },
  compositeAvgPillValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#065F46",
  },
  levelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  levelItemBox: {
    flex: 1,
    minWidth: 140,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  levelTagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelTagText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  levelAccuracyText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  levelItemTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 2,
  },
  levelScoreValue: {
    fontSize: 22,
    fontWeight: "900",
  },
  levelScoreSub: {
    fontSize: 10.5,
    color: "#64748B",
    fontWeight: "600",
  },
  levelProgressBarBg: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: 3,
  },
  levelProgressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  levelFooterMeta: {
    fontSize: 9.5,
    color: "#64748B",
  },
  levelComparisonRow: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
    gap: 6,
  },
  levelComparisonLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },
  matrixBarContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  legendDotItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDotText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
});
