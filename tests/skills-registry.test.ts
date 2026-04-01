import { describe, it, expect } from "vitest";
import {
  CURATED_SKILLS,
  getSkillsByCategory,
  getSkillsForCategories,
  searchSkills,
} from "../src/skills/skills-registry.js";

describe("CURATED_SKILLS", () => {
  it("has at least 15 skills", () => {
    expect(CURATED_SKILLS.length).toBeGreaterThanOrEqual(15);
  });

  it("every skill has required fields", () => {
    for (const skill of CURATED_SKILLS) {
      expect(skill.id).toBeTruthy();
      expect(skill.name).toBeTruthy();
      expect(skill.description).toBeTruthy();
      expect(skill.category).toBeTruthy();
      expect(skill.instruction.length).toBeGreaterThan(100);
      expect(skill.tags.length).toBeGreaterThan(0);
    }
  });

  it("skill IDs are unique", () => {
    const ids = CURATED_SKILLS.map((s) => s.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("instructions are substantial (> 500 chars each)", () => {
    for (const skill of CURATED_SKILLS) {
      expect(skill.instruction.length).toBeGreaterThan(500);
    }
  });
});

describe("getSkillsByCategory", () => {
  it("returns auth skills", () => {
    const skills = getSkillsByCategory("auth");
    expect(skills.length).toBeGreaterThanOrEqual(1);
    expect(skills.every((s) => s.category === "auth")).toBe(true);
  });

  it("returns database skills", () => {
    const skills = getSkillsByCategory("database");
    expect(skills.length).toBeGreaterThanOrEqual(1);
  });

  it("returns payments skills", () => {
    const skills = getSkillsByCategory("payments");
    expect(skills.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty for unknown category", () => {
    expect(getSkillsByCategory("nonexistent")).toEqual([]);
  });
});

describe("getSkillsForCategories", () => {
  it("returns skills for multiple categories", () => {
    const skills = getSkillsForCategories(["auth", "database", "payments"]);
    expect(skills.length).toBeGreaterThanOrEqual(3);

    const categories = new Set(skills.map((s) => s.category));
    expect(categories.has("auth")).toBe(true);
    expect(categories.has("database")).toBe(true);
    expect(categories.has("payments")).toBe(true);
  });

  it("returns skills for a typical plan (9 categories)", () => {
    const planCategories = [
      "auth", "database", "ai", "analytics", "design",
      "deploy", "review", "security", "docs",
    ];
    const skills = getSkillsForCategories(planCategories);
    // Should have at least one skill per covered category
    expect(skills.length).toBeGreaterThanOrEqual(6);
  });

  it("handles empty array", () => {
    expect(getSkillsForCategories([])).toEqual([]);
  });
});

describe("searchSkills", () => {
  it("finds skills by tag", () => {
    const results = searchSkills("payments");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].category).toBe("payments");
  });

  it("finds skills by name", () => {
    const results = searchSkills("Authentication");
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("finds skills by description keyword", () => {
    const results = searchSkills("webhook");
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty for non-matching query", () => {
    expect(searchSkills("xyznonexistent123")).toEqual([]);
  });
});

// ─── Coverage: key categories have skills ───

const categoriesWithSkills = [
  "auth", "database", "payments", "ai", "design",
  "marketing", "deploy", "email", "analytics",
  "security", "review", "monitoring", "testing",
  "cache", "search", "cms",
];

for (const cat of categoriesWithSkills) {
  it(`has at least 1 skill for "${cat}"`, () => {
    const skills = getSkillsByCategory(cat);
    expect(skills.length).toBeGreaterThanOrEqual(1);
  });
}
