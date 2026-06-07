/**
 * /src/interview/questionLoader.ts
 *
 * Loads and filters interview questions from questions.json.
 * All question definitions live in JSON — never in component code.
 */

import rawQuestions from "./questions.json";
import type { QuestionDefinition, InterviewStep } from "./types";

const ALL_QUESTIONS = rawQuestions as QuestionDefinition[];

/**
 * Get the ordered list of unique step names.
 * Steps appear in the order of first occurrence in questions.json.
 */
export function getSteps(): InterviewStep[] {
  const seen = new Set<string>();
  const steps: string[] = [];
  for (const q of ALL_QUESTIONS) {
    if (!seen.has(q.step)) {
      seen.add(q.step);
      steps.push(q.step);
    }
  }
  return steps;
}

/**
 * Get all questions for a given step, filtered by showIf conditions.
 *
 * @param step - Step label (e.g. "Location")
 * @param caseData - Current case answers (used for showIf evaluation)
 */
export function getQuestionsForStep(
  step: InterviewStep,
  caseData: Record<string, unknown>
): QuestionDefinition[] {
  return ALL_QUESTIONS.filter((q) => {
    if (q.step !== step) return false;
    if (!q.showIf) return true;
    return caseData[q.showIf.field] === q.showIf.value;
  });
}

/**
 * Get all questions for a step regardless of showIf (for testing).
 */
export function getAllQuestionsForStep(step: InterviewStep): QuestionDefinition[] {
  return ALL_QUESTIONS.filter((q) => q.step === step);
}

/**
 * Check whether all required questions for a step have been answered.
 */
export function isStepComplete(
  step: InterviewStep,
  caseData: Record<string, unknown>
): boolean {
  const questions = getQuestionsForStep(step, caseData);
  return questions
    .filter((q) => q.required)
    .every((q) => {
      const val = caseData[q.field];
      if (val === undefined || val === null || val === "") return false;
      return true;
    });
}

/** All questions (for admin/testing purposes) */
export function getAllQuestions(): QuestionDefinition[] {
  return ALL_QUESTIONS;
}
