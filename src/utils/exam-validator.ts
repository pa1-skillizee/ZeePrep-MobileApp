/**
 * ZeePrep — Exam Composition Validator
 * Deterministic integrity gate so corrupted exams never enter production data:
 * every question must belong to the exam's grade + subject (normalized), marks
 * must be valid, ids present, and duplicates flagged. Pure + unit-testable.
 */
import type { Exam, Question } from "../types";
import { normalizeGrade, normalizeSubject } from "../services/weak-topic-resource-engine";

export interface ExamValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  mismatchedQuestionIds: string[];
}

export function validateExamComposition(exam: Partial<Exam>, questions: Question[]): ExamValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const mismatchedQuestionIds: string[] = [];

  if (!questions || questions.length === 0) {
    errors.push("Exam has no questions.");
    return { valid: false, errors, warnings, mismatchedQuestionIds };
  }

  const examSubject = normalizeSubject(exam.subject || "");
  const examGrade = normalizeGrade(exam.grade || "");

  const seen = new Set<string>();
  for (const q of questions) {
    if (!q || !q.id) {
      errors.push("A question is missing its id.");
      continue;
    }
    if (seen.has(q.id)) {
      warnings.push(`Duplicate question ${q.id} included more than once.`);
    }
    seen.add(q.id);

    // Subject isolation (only enforce when both sides declare it).
    if (examSubject && q.subject && normalizeSubject(q.subject) !== examSubject) {
      mismatchedQuestionIds.push(q.id);
      errors.push(`Question ${q.id} subject "${q.subject}" does not match exam subject "${exam.subject}".`);
    }
    // Grade isolation (only enforce when both sides declare it).
    if (examGrade && q.grade && normalizeGrade(q.grade) !== examGrade) {
      if (!mismatchedQuestionIds.includes(q.id)) mismatchedQuestionIds.push(q.id);
      errors.push(`Question ${q.id} grade "${q.grade}" does not match exam grade "${exam.grade}".`);
    }
    // Marks sanity.
    const marks = Number(q.marks);
    if (!isFinite(marks) || marks <= 0) {
      warnings.push(`Question ${q.id} has invalid marks (${q.marks}); defaulting to 1 at scoring time.`);
    }
  }

  return { valid: errors.length === 0, errors, warnings, mismatchedQuestionIds };
}
