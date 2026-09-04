/**
 * ZeePrep — Global Student Report card.
 * Combined cross-subject academic view composed FROM the per-subject forecasts
 * (see global-report-engine). Overall %, range, confidence, trend, per-subject
 * breakdown, strongest/weakest, breadth (no fake syllabus %), real trend series.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PreparationTrendChart from "./PreparationTrendChart";
import { ZEEPREP_THEME as T } from "../constants/theme";
import type { GlobalStudentReport } from "../services/global-report-engine";
import type { ForecastTrend, ForecastConfidence } from "../types/forecast";

const INK = "#1E1B4B";
const AMBER = "#FBBF24";

const TREND: Record<ForecastTrend, { glyph: string; color: string }> = {
  strong_growth: { glyph: "↑", color: "#059669" },
  growth: { glyph: "↑", color: "#059669" },
  stable: { glyph: "→", color: "#64748B" },
  declining: { glyph: "↓", color: "#DC2626" },
  strong_decline: { glyph: "↓", color: "#DC2626" },
  inconsistent: { glyph: "↕", color: "#B45309" },
};
const CONF_LABEL: Record<ForecastConfidence, string> = {
  insufficient: "Insufficient", low: "Low", medium: "Medium", high: "High",
};

export interface GlobalReportCardProps {
  report: GlobalStudentReport | null;
  isDesktopWeb: boolean;
  width: number;
}

export default function GlobalReportCard({ report, isDesktopWeb, width }: GlobalReportCardProps) {
  if (!report || !report.hasEnoughData) {
    return (
      <View style={styles.card}>
        <Text style={styles.header}>Global Preparation</Text>
        <Text style={styles.empty}>
          Your combined academic report will appear here once you complete assessments across your subjects.
        </Text>
      </View>
    );
  }

  const trend = TREND[report.overallTrend];
  const chartWidth = isDesktopWeb ? Math.min(560, Math.round(width * 0.5)) : Math.max(260, width - 88);
  const series = report.overallTrendSeries.map((p) => ({ date: p.date, value: p.value }));

  return (
    <View style={styles.card}>
      <Text style={styles.header}>Global Preparation Report</Text>

      <View style={isDesktopWeb ? styles.bodyWeb : undefined}>
        <View style={isDesktopWeb ? styles.colLeft : undefined}>
          {/* Overall hero */}
          <View style={styles.hero}>
            <Text style={styles.heroBadge}>OVERALL PREDICTED PERFORMANCE</Text>
            <Text style={styles.heroValue}>{report.overallPredicted}%</Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroLabel}>Likely Range</Text>
                <Text style={styles.heroSv}>{report.overallRange.min}% – {report.overallRange.max}%</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroLabel}>Confidence</Text>
                <Text style={styles.heroSv}>{CONF_LABEL[report.overallConfidence]}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroLabel}>Trend</Text>
                <Text style={[styles.heroSv, { color: trend.color === "#64748B" ? "#CBD5E1" : trend.color }]}>
                  {trend.glyph} {report.overallTrend.replace("_", " ")}
                </Text>
              </View>
            </View>
          </View>

          {/* Breadth */}
          <View style={styles.breadthRow}>
            <Pill label="Subjects" value={String(report.distinctSubjects)} />
            <Pill label="Topics Assessed" value={String(report.topicsAssessed)} />
            <Pill label="Assessments" value={String(report.totalAssessments)} />
          </View>
        </View>

        <View style={isDesktopWeb ? styles.colRight : styles.chartMobile}>
          {series.length >= 2 ? (
            <PreparationTrendChart
              actualSeries={series}
              variant={isDesktopWeb ? "web" : "mobile"}
              width={chartWidth}
            />
          ) : (
            <Text style={styles.miniNote}>Overall trend will build as you complete more assessments.</Text>
          )}
        </View>
      </View>

      {/* Subject breakdown */}
      <Text style={styles.sectionTitle}>Subject Breakdown</Text>
      <View style={styles.subjectList}>
        {report.subjects.map((s) => {
          const st = TREND[s.trend];
          return (
            <View key={s.subjectKey} style={styles.subjectRow}>
              <Text style={styles.subjectName} numberOfLines={1}>{s.subjectDisplay}</Text>
              <View style={styles.subjectBarTrack}>
                <View style={[styles.subjectBarFill, { width: `${s.predictedPercentage}%` }]} />
              </View>
              <Text style={styles.subjectPct}>{s.predictedPercentage}%</Text>
              <Text style={[styles.subjectTrend, { color: st.color }]}>{st.glyph}</Text>
            </View>
          );
        })}
      </View>

      {(report.strongestSubject || report.weakestSubject) && (
        <View style={styles.chips}>
          {report.strongestSubject && (
            <Text style={[styles.chip, styles.chipGood]}>Strongest: {report.strongestSubject}</Text>
          )}
          {report.weakestSubject && report.weakestSubject !== report.strongestSubject && (
            <Text style={[styles.chip, styles.chipWarn]}>Needs focus: {report.weakestSubject}</Text>
          )}
        </View>
      )}

      <Text style={styles.footNote}>
        Overall combines each subject's independent prediction, weighted by how many assessments back it. It is an estimate, not a guaranteed board result.
      </Text>
    </View>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
    marginVertical: 10,
    gap: 12,
    ...(({ boxShadow: "0 4px 16px rgba(0,0,0,0.04)" } as any)),
  },
  header: { fontSize: 17, fontWeight: "900", color: T.colors.textPrimary },
  empty: { fontSize: 13, color: T.colors.textSecondary, lineHeight: 19 },
  bodyWeb: { flexDirection: "row", gap: 18, alignItems: "flex-start" },
  colLeft: { flex: 1, minWidth: 250, gap: 12 },
  colRight: { flexShrink: 0 },
  chartMobile: { alignItems: "center" },
  hero: { backgroundColor: INK, borderRadius: 20, padding: 18, gap: 6 },
  heroBadge: { color: AMBER, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  heroValue: { color: AMBER, fontSize: 46, fontWeight: "900", lineHeight: 50 },
  heroStatsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  heroDivider: { width: 1, alignSelf: "stretch", backgroundColor: "rgba(255,255,255,0.12)" },
  heroStat: { flex: 1, gap: 3 },
  heroLabel: { color: "#A5B4FC", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  heroSv: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  breadthRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB",
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  pillLabel: { fontSize: 11, color: T.colors.textSecondary, fontWeight: "600" },
  pillValue: { fontSize: 13, color: T.colors.textPrimary, fontWeight: "800" },
  miniNote: { fontSize: 12, color: T.colors.textMuted, textAlign: "center", padding: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: T.colors.textPrimary, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 4 },
  subjectList: { gap: 8 },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  subjectName: { width: 108, fontSize: 13, fontWeight: "700", color: T.colors.textPrimary },
  subjectBarTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "#EEF2FF", overflow: "hidden" },
  subjectBarFill: { height: 8, borderRadius: 4, backgroundColor: T.colors.primary },
  subjectPct: { width: 42, textAlign: "right", fontSize: 13, fontWeight: "800", color: T.colors.textPrimary },
  subjectTrend: { width: 16, textAlign: "center", fontSize: 16, fontWeight: "900" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { fontSize: 12, fontWeight: "700", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, overflow: "hidden" },
  chipGood: { backgroundColor: "#ECFDF5", color: "#059669" },
  chipWarn: { backgroundColor: "#FFFBEB", color: "#B45309" },
  footNote: { fontSize: 11, color: T.colors.textMuted, marginTop: 4, lineHeight: 16 },
});
