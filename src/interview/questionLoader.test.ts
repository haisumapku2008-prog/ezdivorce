import { describe, it, expect } from "vitest";
import {
  getSteps,
  getQuestionsForStep,
  getAllQuestionsForStep,
  isStepComplete,
  getAllQuestions,
} from "./questionLoader";

describe("getSteps", () => {
  it("returns an array of step names", () => {
    const steps = getSteps();
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("includes expected step names", () => {
    const steps = getSteps();
    expect(steps).toContain("Location");
    expect(steps).toContain("Residency");
    expect(steps).toContain("Marriage");
    expect(steps).toContain("Children");
    expect(steps).toContain("Property");
    expect(steps).toContain("Parties");
  });

  it("has no duplicate step names", () => {
    const steps = getSteps();
    expect(new Set(steps).size).toBe(steps.length);
  });
});

describe("getAllQuestions", () => {
  it("returns all question definitions", () => {
    const questions = getAllQuestions();
    expect(questions.length).toBeGreaterThan(0);
  });

  it("every question has required fields", () => {
    for (const q of getAllQuestions()) {
      expect(typeof q.id).toBe("string");
      expect(typeof q.step).toBe("string");
      expect(typeof q.type).toBe("string");
      expect(typeof q.question).toBe("string");
      expect(typeof q.field).toBe("string");
    }
  });

  it("no duplicate question ids", () => {
    const ids = getAllQuestions().map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getQuestionsForStep", () => {
  it("returns only questions for the given step", () => {
    const questions = getQuestionsForStep("Location", {});
    expect(questions.every((q) => q.step === "Location")).toBe(true);
  });

  it("filters out questions whose showIf condition is not met", () => {
    // county question has showIf: { field: "state", value: "WA" }
    const questionsNoWA = getQuestionsForStep("Location", { state: "CA" });
    expect(questionsNoWA.find((q) => q.id === "county")).toBeUndefined();
  });

  it("includes questions whose showIf condition is met", () => {
    const questionsWA = getQuestionsForStep("Location", { state: "WA" });
    expect(questionsWA.find((q) => q.id === "county")).toBeDefined();
  });

  it("includes questions with no showIf condition regardless of caseData", () => {
    const questions = getQuestionsForStep("Location", {});
    expect(questions.find((q) => q.id === "state")).toBeDefined();
  });

  it("childrenCount is hidden when hasChildren is false", () => {
    const qs = getQuestionsForStep("Children", { hasChildren: false });
    expect(qs.find((q) => q.id === "childrenCount")).toBeUndefined();
  });

  it("childrenCount is shown when hasChildren is true", () => {
    const qs = getQuestionsForStep("Children", { hasChildren: true });
    expect(qs.find((q) => q.id === "childrenCount")).toBeDefined();
  });
});

describe("isStepComplete", () => {
  it("returns false when required field is missing", () => {
    expect(isStepComplete("Parties", {})).toBe(false);
  });

  it("returns false when required field is empty string", () => {
    expect(
      isStepComplete("Parties", { petitionerName: "", respondentName: "John" })
    ).toBe(false);
  });

  it("returns true when all required fields are filled", () => {
    expect(
      isStepComplete("Parties", {
        petitionerName: "Jane Doe",
        respondentName: "John Doe",
      })
    ).toBe(true);
  });

  it("optional fields do not block step completion", () => {
    // petitionerEmail is optional in Parties step
    expect(
      isStepComplete("Parties", {
        petitionerName: "Jane Doe",
        respondentName: "John Doe",
        petitionerEmail: "",
      })
    ).toBe(true);
  });

  it("Marriage step is complete even without dates (both optional)", () => {
    expect(isStepComplete("Marriage", {})).toBe(true);
  });

  it("Residency step requires livesInState, isContested, spouseLocatable", () => {
    expect(isStepComplete("Residency", {})).toBe(false);
    expect(
      isStepComplete("Residency", {
        livesInState: true,
        isContested: false,
        spouseLocatable: true,
      })
    ).toBe(true);
  });

  it("boolean false is treated as answered (not missing)", () => {
    // isContested: false is a valid answer, not an empty field
    expect(
      isStepComplete("Residency", {
        livesInState: true,
        isContested: false,
        spouseLocatable: false,
      })
    ).toBe(true);
  });
});

describe("Question schema integrity", () => {
  it("all boolean questions have labels defined", () => {
    const booleanQs = getAllQuestions().filter((q) => q.type === "boolean");
    for (const q of booleanQs) {
      expect(q.labels).toBeDefined();
      expect(q.labels?.length).toBe(2);
    }
  });

  it("all select questions have options defined", () => {
    const selectQs = getAllQuestions().filter((q) => q.type === "select");
    for (const q of selectQs) {
      expect(q.options).toBeDefined();
      expect(q.options!.length).toBeGreaterThan(0);
    }
  });

  it("all showIf references point to valid question fields", () => {
    const allFields = new Set(getAllQuestions().map((q) => q.field));
    const conditionalQs = getAllQuestions().filter((q) => q.showIf);
    for (const q of conditionalQs) {
      expect(allFields.has(q.showIf!.field)).toBe(true);
    }
  });
});
