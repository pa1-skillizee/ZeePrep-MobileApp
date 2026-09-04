/**
 * ZeePrep — Professional A4 Report HTML generator (shared web + native).
 * Produces ONE self-contained HTML document used for PDF export on both:
 *   - Web: printed via browser print / Save as PDF
 *   - Android/iOS APK: printed via react-native-webview window.print()
 * The print CSS enforces A4 portrait pages and strict break-inside: avoid on every block/row,
 * so sections, cards, tables, and charts never get cut across page boundaries.
 */
import type { Report } from "../types";
import type { BoardForecastSnapshot, SubjectAssessmentProfile, SubjectForecastRecord } from "../types/forecast";
import { resolveActualTopic } from "./weak-topic-resource-engine";

function esc(s: any): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

const CONF_LABEL: Record<string, string> = {
  insufficient: "Insufficient data",
  low: "Low",
  medium: "Medium",
  high: "High",
};
const TREND_LABEL: Record<string, string> = {
  strong_growth: "Improving strongly",
  growth: "Improving",
  stable: "Steady",
  declining: "Declining",
  strong_decline: "Declining sharply",
  inconsistent: "Inconsistent",
};

/** Build a static inline SVG for the preparation-trend chart. */
export function buildTrendSvg(
  actual: { date: string; value: number }[],
  predicted: { date: string; value: number }[],
  range?: { min: number; max: number }
): string {
  const W = 760;
  const H = 260;
  const pad = { l: 44, r: 20, t: 20, b: 36 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const n = Math.max(actual.length, predicted.length, 1);
  const sx = (i: number) => pad.l + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const sy = (v: number) => pad.t + (1 - clamp(v, 0, 100) / 100) * plotH;

  const aPts = actual.map((p, i) => ({ x: sx(i), y: sy(p.value), v: p.value, d: p.date }));
  const pPts = predicted.map((p, i) => ({ x: sx(i), y: sy(p.value), v: p.value }));

  const grid = [0, 25, 50, 75, 100]
    .map((g) => {
      const y = sy(g);
      return `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="#E2E8F0" stroke-width="1"/>` +
        `<text x="${pad.l - 8}" y="${y + 3}" font-size="10" fill="#94A3B8" text-anchor="end">${g}</text>`;
    })
    .join("");

  const band =
    range && pPts.length
      ? (() => {
          const lastX = pPts[pPts.length - 1].x;
          const firstX = pPts.length > 1 ? pPts[Math.max(0, pPts.length - 3)].x : pad.l;
          return `<polygon points="${firstX},${sy(range.max)} ${lastX},${sy(range.max)} ${lastX},${sy(range.min)} ${firstX},${sy(range.min)}" fill="rgba(79,70,229,0.08)"/>`;
        })()
      : "";

  const aPath = aPts.length ? "M " + aPts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") : "";
  const pPath = pPts.length ? "M " + pPts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") : "";

  const aLine = aPts.length > 1 ? `<path d="${aPath}" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` : "";
  const pLine = pPts.length > 1 ? `<path d="${pPath}" fill="none" stroke="#64748B" stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round"/>` : "";

  const pDots = pPts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#FFFFFF" stroke="#64748B" stroke-width="1.5"/>`).join("");
  const aDots = aPts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#4F46E5" stroke="#FFFFFF" stroke-width="1.5"/>`).join("");

  const xlabels = aPts
    .map((p, i) => {
      if (n > 6 && i % Math.ceil(n / 6) !== 0 && i !== n - 1) return "";
      const d = new Date(p.d);
      const lbl = isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return `<text x="${p.x}" y="${H - pad.b + 18}" font-size="10" fill="#94A3B8" text-anchor="middle">${esc(lbl)}</text>`;
    })
    .join("");

  return `<svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="max-width:${W}px">
    ${grid}${band}${pLine}${aLine}${pDots}${aDots}${xlabels}
  </svg>`;
}

function pointerList(items: string[] | undefined, color: string): string {
  if (!items || items.length === 0) return "";
  return `<ul class="pointers">${items.map((t) => `<li style="--dot:${color}">${esc(t)}</li>`).join("")}</ul>`;
}

export interface ReportHtmlInput {
  report: Report;
  forecast?: BoardForecastSnapshot | null;
  profile?: SubjectAssessmentProfile | null;
  record?: SubjectForecastRecord | null;
  variant?: "student" | "teacher";
}

export function buildReportHtml(input: ReportHtmlInput): string {
  const { report, forecast, profile, record, variant = "student" } = input;
  const generated = new Date().toLocaleString(undefined, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const subject = report.subject || "Assessment";
  const grade = report.grade ? (String(report.grade).toLowerCase().includes("class") || String(report.grade).toLowerCase().includes("grade") ? report.grade : `Class ${report.grade}`) : "";

  const da = report.detailedAnalysis || [];
  const questionRows = da
    .map((q, i) => {
      const status = q.isCorrect ? "Correct" : q.isUnanswered ? "Unanswered" : "Incorrect";
      const cls = q.isCorrect ? "ok" : q.isUnanswered ? "skip" : "bad";
      const resolvedTopic = resolveActualTopic(
        q.topic,
        q.chapter,
        report.subject,
        q.questionText,
        report.examTitle
      );
      return `<tr>
        <td class="col-num">${i + 1}</td>
        <td class="qtext">${esc(String(q.questionText || "").slice(0, 180))}</td>
        <td class="col-topic">${esc(resolvedTopic || "-")}</td>
        <td class="col-lvl">${esc(String(q.level || "").replace("level", "L"))}</td>
        <td class="col-res ${cls}">${status}</td>
        <td class="col-marks">${q.awardedMarks ?? 0}/${q.marks ?? 1}</td>
      </tr>`;
    })
    .join("");

  // Forecast block
  let forecastBlock = "";
  if (forecast && forecast.confidence !== "insufficient" && (profile?.assessmentCount ?? 0) > 0) {
    const actualSeries = (profile?.dataPoints || []).map((d) => ({ date: d.date, value: d.percentage }));
    const predictedSeries = (record?.history || []).map((h) => ({ date: h.date, value: h.predictedPercentage }));
    const svg = buildTrendSvg(actualSeries, predictedSeries, { min: forecast.minPrediction, max: forecast.maxPrediction });
    const teacherDiag =
      variant === "teacher" && profile
        ? `<div class="diag">
            <span><b>${profile.assessmentCount}</b> valid assessments</span>
            <span><b>${profile.distinctTopics.length}</b> topics assessed</span>
            <span>Coverage <b>${profile.coverageSignal}/100</b></span>
            <span>Consistency <b>${profile.volatility} pts variance</b></span>
            <span>Levels <b>L1 ${profile.levelCoverage.level1} · L2 ${profile.levelCoverage.level2} · L3 ${profile.levelCoverage.level3}</b></span>
          </div>`
        : "";
    forecastBlock = `
    <div class="section page-avoid">
      <h2>${esc(forecast.subjectDisplay)} — Board Preparation Forecast</h2>
      <div class="fc-hero">
        <div class="fc-primary"><div class="fc-label">Predicted Board Score</div><div class="fc-value">${forecast.predictedPercentage}%</div></div>
        <div class="fc-stat"><div class="fc-label">Likely Range</div><div class="fc-sv">${forecast.minPrediction}% – ${forecast.maxPrediction}%</div></div>
        <div class="fc-stat"><div class="fc-label">Confidence</div><div class="fc-sv">${CONF_LABEL[forecast.confidence] || forecast.confidence}</div></div>
        <div class="fc-stat"><div class="fc-label">Trend</div><div class="fc-sv">${TREND_LABEL[forecast.trend] || forecast.trend}</div></div>
      </div>
      <div class="chart">${svg}</div>
      <div class="legend"><span class="lg lg-a">Assessment score</span><span class="lg lg-p">Predicted trajectory</span><span class="lg lg-b">Likely range</span></div>
      ${forecast.summaryPointers?.length ? `<div class="subsec"><h3>Summary</h3>${pointerList(forecast.summaryPointers, "#4F46E5")}</div>` : ""}
      <div class="cols">
        ${forecast.strengths?.length ? `<div class="subsec"><h3 class="c-green">Mastered Topics</h3>${pointerList(forecast.strengths, "#16A34A")}</div>` : ""}
        ${forecast.improvementAreas?.length ? `<div class="subsec"><h3 class="c-red">Focus Areas</h3>${pointerList(forecast.improvementAreas, "#DC2626")}</div>` : ""}
        ${forecast.nextActions?.length ? `<div class="subsec"><h3 class="c-indigo">Action Plan</h3>${pointerList(forecast.nextActions, "#4F46E5")}</div>` : ""}
      </div>
      ${teacherDiag}
    </div>`;
  }

  // Real Resolved Weak Topics
  const weakList = (report.weakTopics || [])
    .map((t) => resolveActualTopic(String(t), null, report.subject, null, report.examTitle))
    .filter((t) => Boolean(t) && t.toLowerCase() !== String(report.subject || "").toLowerCase());
  const uniqueWeakList = Array.from(new Set(weakList)).slice(0, 8);
  const topicBlock = uniqueWeakList.length
    ? `<div class="section page-avoid"><h2>Priority Weak Topics</h2>${pointerList(uniqueWeakList, "#DC2626")}</div>`
    : "";

  const remarks = report.teacherRemarks || report.teacherReview?.overallRemark || "";
  const remarksBlock = remarks
    ? `<div class="section page-avoid"><h2>Faculty Remarks</h2><p class="remarks-text">${esc(remarks)}</p></div>`
    : "";

  // Time analysis
  const totalMin = Math.round((Number(report.timeSpentSeconds) || 0) / 60);
  const avgSec = report.totalQuestions ? Math.round((Number(report.timeSpentSeconds) || 0) / report.totalQuestions) : 0;
  const timeBlock = `<div class="section page-avoid"><h2>Time Analysis</h2><div class="scorebar">
      <div class="scorebox"><div class="v">${totalMin}m</div><div class="l">Total Time</div></div>
      <div class="scorebox"><div class="v">${avgSec}s</div><div class="l">Avg / Question</div></div>
      ${report.mostTimeSpentTopic ? `<div class="scorebox"><div class="v" style="font-size:13px">${esc(report.mostTimeSpentTopic)}</div><div class="l">Most Time On</div></div>` : ""}
    </div></div>`;

  // Recommended resources
  const resItems: string[] = [];
  ((report.weakTopicInsights as any[]) || []).forEach((wi) => {
    (wi?.recommendedResources || []).forEach((r: any) => {
      if (r && r.title) resItems.push(`${r.title}${r.type ? " (" + String(r.type).toUpperCase() + ")" : ""}`);
    });
  });
  const uniqueRes = Array.from(new Set(resItems)).slice(0, 8);
  const resourcesBlock = uniqueRes.length
    ? `<div class="section page-avoid"><h2>Recommended Study Resources</h2>${pointerList(uniqueRes, "#4F46E5")}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<title>ZeePrep Academic Report — ${esc(report.studentName || "Student")}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 14mm 14mm 14mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #FFFFFF;
    color: #0F172A;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 11.5px;
    line-height: 1.45;
  }

  /* Screen Action Bar (hidden on print) */
  .no-print {
    display: block;
  }
  @media print {
    .no-print {
      display: none !important;
    }
  }
  .print-header-bar {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: #0F172A;
    padding: 10px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  }
  .print-bar-title {
    color: #FFFFFF;
    font-size: 13px;
    font-weight: 700;
  }
  .btn-print {
    background: #4F46E5;
    color: #FFFFFF;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .report-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 16px;
  }
  @media print {
    .report-container {
      max-width: 100%;
      padding: 0;
      margin: 0;
    }
  }

  /* Header Branding */
  .brandbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 2px solid #4F46E5;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .brand {
    font-size: 20px;
    font-weight: 900;
    color: #4F46E5;
    letter-spacing: -0.5px;
  }
  .brand small {
    color: #64748B;
    font-weight: 600;
    font-size: 11px;
    margin-left: 6px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .gendate {
    font-size: 10px;
    color: #64748B;
    text-align: right;
  }

  /* Identity Card */
  .idcard {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 12px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .idcard div {
    font-size: 11px;
    color: #475569;
  }
  .idcard b {
    color: #0F172A;
  }

  /* Score Summary Bar */
  .scorebar {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .scorebox {
    flex: 1;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 8px 6px;
    text-align: center;
    background: #FFFFFF;
  }
  .scorebox .v {
    font-size: 18px;
    font-weight: 800;
    color: #0F172A;
    line-height: 1.2;
  }
  .scorebox .l {
    font-size: 9.5px;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-top: 2px;
  }
  .ok { color: #16A34A !important; }
  .bad { color: #DC2626 !important; }
  .skip { color: #64748B !important; }

  /* Sections */
  .section {
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 12px;
    background: #FFFFFF;
  }
  .page-avoid {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .section h2 {
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 8px;
    color: #0F172A;
  }
  .subsec {
    margin-top: 8px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .subsec h3 {
    font-size: 11px;
    margin: 0 0 4px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  .c-green { color: #16A34A; }
  .c-red { color: #DC2626; }
  .c-indigo { color: #4F46E5; }
  .cols {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 20px;
  }
  .cols .subsec {
    flex: 1;
    min-width: 180px;
  }

  /* Pointers */
  ul.pointers {
    list-style: none;
    margin: 4px 0;
    padding: 0;
  }
  ul.pointers li {
    position: relative;
    padding-left: 14px;
    margin: 3px 0;
    break-inside: avoid;
    page-break-inside: avoid;
    font-size: 11px;
  }
  ul.pointers li:before {
    content: "";
    position: absolute;
    left: 2px;
    top: 5px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--dot, #4F46E5);
  }

  /* Forecast Hero */
  .fc-hero {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
    align-items: flex-end;
    margin-bottom: 8px;
  }
  .fc-primary .fc-value {
    font-size: 32px;
    font-weight: 900;
    color: #4F46E5;
    line-height: 1;
  }
  .fc-label {
    font-size: 9.5px;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }
  .fc-sv {
    font-size: 14px;
    font-weight: 800;
    color: #0F172A;
  }
  .chart {
    break-inside: avoid;
    page-break-inside: avoid;
    margin: 6px 0;
  }
  .legend {
    display: flex;
    gap: 16px;
    justify-content: center;
    font-size: 9.5px;
    color: #475569;
    margin-top: 4px;
  }
  .lg:before {
    content: "";
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;
    vertical-align: middle;
  }
  .lg-a:before { background: #4F46E5; }
  .lg-p:before { background: #FFFFFF; border: 1.5px solid #64748B; }
  .lg-b:before { background: rgba(79,70,229,0.2); border-radius: 2px; }

  .diag {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    background: #0F172A;
    color: #E2E8F0;
    border-radius: 6px;
    padding: 6px 10px;
    margin-top: 8px;
    font-size: 10px;
  }
  .diag b { color: #FFFFFF; }

  /* Question Table */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5px;
    page-break-inside: auto;
  }
  thead {
    display: table-header-group;
  }
  tfoot {
    display: table-footer-group;
  }
  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  th {
    background: #F1F5F9;
    text-align: left;
    padding: 6px 8px;
    border-bottom: 2px solid #E2E8F0;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #475569;
  }
  td {
    padding: 6px 8px;
    border-bottom: 1px solid #F1F5F9;
    vertical-align: top;
  }
  .col-num { width: 28px; font-weight: 700; color: #64748B; }
  .col-topic { width: 140px; font-weight: 600; color: #334155; }
  .col-lvl { width: 36px; color: #64748B; }
  .col-res { width: 75px; font-weight: 700; }
  .col-marks { width: 50px; text-align: right; font-weight: 600; }
  td.qtext {
    max-width: 320px;
    word-break: break-word;
    overflow-wrap: break-word;
    color: #0F172A;
  }

  .remarks-text {
    margin: 0;
    font-size: 11px;
    color: #334155;
    white-space: pre-wrap;
  }
  .note {
    font-size: 9.5px;
    color: #94A3B8;
    margin-top: 8px;
    text-align: center;
  }
</style>
</head>
<body>
  <div class="no-print print-header-bar">
    <div class="print-bar-title">ZeePrep Academic Report Preview</div>
    <button class="btn-print" onclick="window.print()">📥 Print / Save as PDF</button>
  </div>

  <div class="report-container">
    <div class="brandbar">
      <div class="brand">ZeePrep <small>Academic Performance Report</small></div>
      <div class="gendate">Generated: ${esc(generated)}</div>
    </div>

    <div class="idcard">
      <div>Student: <b>${esc(report.studentName || "Student")}</b></div>
      <div>Subject: <b>${esc(subject)}</b></div>
      <div>Grade: <b>${esc(grade)}${report.section ? " (Sec " + esc(report.section) + ")" : ""}</b></div>
      <div>Assessment: <b>${esc(report.examTitle || "Assessment")}</b></div>
      <div>Attempt: <b>#${report.attemptNumber || 1}</b></div>
    </div>

    <div class="scorebar">
      <div class="scorebox"><div class="v">${report.obtainedMarks}/${report.totalMarks}</div><div class="l">Score</div></div>
      <div class="scorebox"><div class="v">${report.percentage}%</div><div class="l">Percentage</div></div>
      <div class="scorebox"><div class="v ok">${report.correctAnswers}</div><div class="l">Correct</div></div>
      <div class="scorebox"><div class="v bad">${report.incorrectAnswers}</div><div class="l">Wrong</div></div>
      <div class="scorebox"><div class="v skip">${report.unattempted}</div><div class="l">Skipped</div></div>
      <div class="scorebox"><div class="v">${report.accuracy}%</div><div class="l">Accuracy</div></div>
    </div>

    ${forecastBlock}
    ${topicBlock}

    <div class="section">
      <h2>Question-by-Question Telemetry Analysis</h2>
      <table>
        <thead><tr><th>#</th><th>Question</th><th>Topic</th><th>Lvl</th><th>Result</th><th style="text-align:right">Marks</th></tr></thead>
        <tbody>${questionRows}</tbody>
      </table>
    </div>

    ${timeBlock}
    ${resourcesBlock}
    ${remarksBlock}

    <p class="note">ZeePrep Smart LMS Platform · Official Academic Evaluation · ${esc(subject)}</p>
  </div>
</body>
</html>`;
}
