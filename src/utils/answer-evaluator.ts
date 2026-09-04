/**
 * Authoritative Answer Evaluator & Canonical Option Normalizer
 * Guarantees 100% deterministic correctness calculation and 100% human-readable text resolution
 * across all question types (Excel/CSV, AI generated, Teacher custom, Question Bank, Firestore legacy).
 */

export interface CanonicalOption {
  index: number; // 0, 1, 2, 3
  letter: string; // "A", "B", "C", "D"
  label: string; // "Option A", "Option B"
  id: string; // "opt_q_a", "opt_1", etc.
  text: string; // "Irreversible change"
  cleanText: string; // "irreversible change"
}

export function extractCanonicalOptions(rawOptions: any[]): CanonicalOption[] {
  if (!Array.isArray(rawOptions)) return [];
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return rawOptions.map((opt, idx) => {
    const letter = letters[idx] || String.fromCharCode(65 + idx);
    let text = "";
    let optId = "";

    if (opt === null || opt === undefined) {
      text = "";
    } else if (typeof opt === "string" || typeof opt === "number") {
      text = String(opt).trim();
    } else if (typeof opt === "object") {
      optId = String(opt.id ?? opt.opt_id ?? opt.key ?? opt.value ?? "").trim();
      text = String(
        opt.text ?? opt.value ?? opt.label ?? opt.optionText ?? opt.option ?? ""
      ).trim();

      // If text looks like internal opt_ ID but opt has another text field
      if (/^opt_[a-z0-9_]+$/i.test(text)) {
        if (opt.text && !/^opt_[a-z0-9_]+$/i.test(String(opt.text))) {
          text = String(opt.text).trim();
        } else if (opt.label && !/^opt_[a-z0-9_]+$/i.test(String(opt.label))) {
          text = String(opt.label).trim();
        } else if (opt.value && !/^opt_[a-z0-9_]+$/i.test(String(opt.value))) {
          text = String(opt.value).trim();
        }
      }
    }

    // Clean out prefix letter if text starts with "A. ", "B) ", etc.
    const cleanDisplay = text.replace(/^[A-H][.\):]\s*/i, "").trim();

    return {
      index: idx,
      letter,
      label: `Option ${letter}`,
      id: optId,
      text: cleanDisplay || text,
      cleanText: (cleanDisplay || text).toLowerCase().trim(),
    };
  });
}

/**
 * Maps any answer representation (text, 0-based index, letter A-D, label "Option A", object, internal ID "opt_q_a")
 * to its 0-based option index within canonicalOptions. Returns -1 if unmapped.
 */
export function resolveOptionIndex(ans: any, canonicalOptions: CanonicalOption[]): number {
  if (ans === undefined || ans === null || ans === "") return -1;

  // If ans is an object
  if (typeof ans === "object") {
    if (ans.index !== undefined && typeof ans.index === "number" && ans.index >= 0 && ans.index < canonicalOptions.length) {
      return ans.index;
    }
    if (ans.id) {
      const idxFromId = resolveOptionIndex(ans.id, canonicalOptions);
      if (idxFromId !== -1) return idxFromId;
    }
    if (ans.text) {
      const idxFromText = resolveOptionIndex(ans.text, canonicalOptions);
      if (idxFromText !== -1) return idxFromText;
    }
    if (ans.value) {
      const idxFromVal = resolveOptionIndex(ans.value, canonicalOptions);
      if (idxFromVal !== -1) return idxFromVal;
    }
    if (ans.label) {
      const idxFromLbl = resolveOptionIndex(ans.label, canonicalOptions);
      if (idxFromLbl !== -1) return idxFromLbl;
    }
  }

  const strVal = String(ans).trim();
  const cleanVal = strVal.toLowerCase();

  // 1. Direct ID match against option.id
  const directIdOpt = canonicalOptions.find(
    (o) => o.id && o.id.toLowerCase() === cleanVal
  );
  if (directIdOpt) return directIdOpt.index;

  // 2. Pattern match for internal IDs (e.g. opt_q_a -> 0, opt_q_ai_12345_2 -> 2, opt_a_ai -> 0, etc.)
  const internalIdMatch = cleanVal.match(/^opt_(?:q_)?([a-h])(?:_[a-z0-9_]+)?$/i);
  if (internalIdMatch) {
    const char = internalIdMatch[1].toLowerCase();
    const letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const idx = letters.indexOf(char);
    if (idx >= 0 && idx < canonicalOptions.length) return idx;
  }

  // 2b. Pattern match for internal IDs with trailing number (e.g. opt_q_ai_1786090138440_2 -> index 2)
  const trailingNumMatch = cleanVal.match(/^opt_.*_([0-7])$/i);
  if (trailingNumMatch) {
    const numIdx = parseInt(trailingNumMatch[1], 10);
    if (!isNaN(numIdx) && numIdx >= 0 && numIdx < canonicalOptions.length) return numIdx;
  }

  // 3. Numeric index check (e.g. 0, 1, 2, 3 or "0", "1", "2", "3")
  const numVal = Number(strVal);
  if (!isNaN(numVal) && Number.isInteger(numVal) && numVal >= 0 && numVal < canonicalOptions.length) {
    return numVal;
  }

  // 4. Single letter check ("A", "B", "C", "D" or "a", "b", "c", "d")
  const letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
  if (cleanVal.length === 1 && letters.includes(cleanVal)) {
    const lIdx = letters.indexOf(cleanVal);
    if (lIdx < canonicalOptions.length) return lIdx;
  }

  // 5. "Option A", "Option B", "Option 1"
  const optionMatch = cleanVal.match(/^option\s*([a-h1-8])$/i);
  if (optionMatch) {
    const char = optionMatch[1].toLowerCase();
    const isNum = !isNaN(Number(char));
    const idx = isNum ? Number(char) - 1 : letters.indexOf(char);
    if (idx >= 0 && idx < canonicalOptions.length) return idx;
  }

  // 6. Exact text match (ignoring leading A./B. prefix)
  const cleanStripped = cleanVal.replace(/^[a-h][.\):]\s*/i, "").trim();
  const exactOpt = canonicalOptions.find(
    (o) => o.cleanText === cleanVal || o.cleanText === cleanStripped
  );
  if (exactOpt) return exactOpt.index;

  // 7. Substring match for longer strings
  if (cleanStripped.length > 2) {
    const subOpt = canonicalOptions.find(
      (o) => o.cleanText.length > 2 && (o.cleanText.includes(cleanStripped) || cleanStripped.includes(o.cleanText))
    );
    if (subOpt) return subOpt.index;
  }

  return -1;
}

/**
 * Universal helper that resolves ANY raw answer value (ID, letter, index, text, object)
 * into clean, human-readable option text for display (e.g. "B. Irreversible change").
 * NEVER returns raw internal IDs like opt_q_a or opt_q_ai_...
 */
export function resolveOptionText(ans: any, question: any, includePrefix: boolean = true): string {
  if (ans === undefined || ans === null || String(ans).trim() === "") {
    return "";
  }

  const rawOpts = question?.options || [];
  const canonicalOpts = extractCanonicalOptions(rawOpts);
  const idx = resolveOptionIndex(ans, canonicalOpts);

  if (idx >= 0 && idx < canonicalOpts.length) {
    const opt = canonicalOpts[idx];
    return includePrefix ? `${opt.letter}. ${opt.text}` : opt.text;
  }

  const strVal = String(ans).trim();

  // If answer was an internal ID with trailing number (e.g. opt_q_ai_1786090138440_2 -> Option C)
  const trailingNum = strVal.match(/^opt_.*_([0-7])$/i);
  if (trailingNum) {
    const numIdx = parseInt(trailingNum[1], 10);
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const letter = letters[numIdx] || "A";
    return includePrefix ? `Option ${letter}` : `Option ${letter}`;
  }

  // If answer was an internal ID with letter (e.g. opt_q_b -> Option B)
  if (/^opt_[a-z0-9_]+$/i.test(strVal)) {
    const match = strVal.match(/^opt_(?:q_)?([a-h])/i);
    if (match) {
      const letter = match[1].toUpperCase();
      return includePrefix ? `Option ${letter}` : `Option ${letter}`;
    }
    return "Answer recorded";
  }

  // Clean out any [object Object] anomalies
  if (strVal === "[object Object]") {
    return "Answer recorded";
  }

  return strVal;
}

export interface EvaluationResult {
  isAnswered: boolean;
  isCorrect: boolean;
  studentOptionIndex: number;
  correctOptionIndex: number;
  canonicalStudentAnswer: string;
  canonicalCorrectAnswer: string;
}

/**
 * Authoritative evaluation of a single student response against a question.
 */
export function evaluateQuestionAnswer(studentAns: any, question: any): EvaluationResult {
  const isAnswered = studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== "";
  const canonicalOpts = extractCanonicalOptions(question.options || []);

  const correctIndex = resolveOptionIndex(question.correctAnswer, canonicalOpts);
  const studentIndex = isAnswered ? resolveOptionIndex(studentAns, canonicalOpts) : -1;

  let isCorrect = false;

  if (isAnswered) {
    if (studentIndex !== -1 && correctIndex !== -1) {
      isCorrect = studentIndex === correctIndex;
    } else {
      const cleanStudent = String(studentAns).trim().toLowerCase();
      const cleanCorrect = String(question.correctAnswer ?? "").trim().toLowerCase();
      isCorrect = cleanStudent === cleanCorrect;
    }
  }

  const canonicalStudentAnswer = isAnswered
    ? resolveOptionText(studentAns, question, true)
    : "";
  const canonicalCorrectAnswer = resolveOptionText(question.correctAnswer, question, true);

  return {
    isAnswered,
    isCorrect,
    studentOptionIndex: studentIndex,
    correctOptionIndex: correctIndex,
    canonicalStudentAnswer,
    canonicalCorrectAnswer,
  };
}
