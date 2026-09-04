/**
 * Canonical Grade and Subject Normalization Utilities
 * Pure zero-dependency functions to prevent circular import evaluation ordering issues.
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

  return raw.replace(/[^0-9]/g, "");
}

export function normalizeSubject(subject: string | undefined | null): string {
  if (!subject) return "";
  const raw = String(subject).trim().toLowerCase();
  if (raw.includes("math")) return "Mathematics";
  if (raw.includes("physic")) return "Physics";
  if (raw.includes("chem")) return "Chemistry";
  if (raw.includes("bio")) return "Biology";
  if (raw.includes("science")) return "Science";
  if (raw.includes("eng")) return "English";
  if (raw.includes("hindi")) return "Hindi";
  if (raw.includes("social") || raw.includes("sst")) return "Social Science";
  if (raw.includes("history")) return "History";
  if (raw.includes("geo")) return "Geography";
  if (raw.includes("pol")) return "Political Science";
  if (raw.includes("econ")) return "Economics";
  if (raw.includes("account")) return "Accountancy";
  if (raw.includes("business")) return "Business Studies";
  if (raw.includes("computer") || raw.includes("ip") || raw.includes("cs")) return "Computer Science";
  return subject.trim();
}
