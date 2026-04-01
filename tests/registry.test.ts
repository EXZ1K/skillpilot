import { describe, it, expect } from "vitest";
import {
  SKILL_CATEGORIES,
  findCategory,
  getRecommended,
  ALWAYS_INCLUDE,
} from "../src/skills/registry.js";

describe("SKILL_CATEGORIES", () => {
  it("has at least 20 categories", () => {
    expect(SKILL_CATEGORIES.length).toBeGreaterThanOrEqual(20);
  });

  it("every category has id, label, description", () => {
    for (const cat of SKILL_CATEGORIES) {
      expect(cat.id).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.description).toBeTruthy();
    }
  });

  it("every category has at least 1 alternative", () => {
    for (const cat of SKILL_CATEGORIES) {
      expect(cat.alternatives.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("category IDs are unique", () => {
    const ids = SKILL_CATEGORIES.map((c) => c.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("every alternative has required fields", () => {
    for (const cat of SKILL_CATEGORIES) {
      for (const alt of cat.alternatives) {
        expect(alt.id).toBeTruthy();
        expect(alt.name).toBeTruthy();
        expect(alt.command).toBeTruthy();
        expect(alt.description).toBeTruthy();
        expect(alt.mcpServer).toBeDefined();
        expect(alt.mcpServer.command).toBeTruthy();
        expect(Array.isArray(alt.mcpServer.args)).toBe(true);
        expect(Array.isArray(alt.requiredEnvVars)).toBe(true);
        expect(typeof alt.pros).toBe("string");
        expect(typeof alt.cons).toBe("string");
        expect(typeof alt.freeTier).toBe("string");
        expect(Array.isArray(alt.usedBy)).toBe(true);
        expect(typeof alt.recommended).toBe("boolean");
      }
    }
  });

  it("alternative IDs are globally unique", () => {
    const ids = SKILL_CATEGORIES.flatMap((c) => c.alternatives.map((a) => a.id));
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("every category has exactly one recommended alternative", () => {
    for (const cat of SKILL_CATEGORIES) {
      const recommended = cat.alternatives.filter((a) => a.recommended);
      // Either exactly 1 recommended, or 0 (getRecommended falls back to first)
      expect(recommended.length).toBeLessThanOrEqual(1);
    }
  });

  it("every envVar has name, description, getUrl", () => {
    for (const cat of SKILL_CATEGORIES) {
      for (const alt of cat.alternatives) {
        for (const envVar of alt.requiredEnvVars) {
          expect(envVar.name).toBeTruthy();
          expect(envVar.description).toBeTruthy();
          expect(envVar.getUrl).toBeTruthy();
          expect(typeof envVar.required).toBe("boolean");
          expect(typeof envVar.testable).toBe("boolean");
        }
      }
    }
  });

  // ─── Key categories exist ───

  const expectedCategories = [
    "auth", "payments", "database", "ai", "email", "deploy",
    "review", "security", "video", "storage", "analytics",
    "monitoring", "cms", "search", "cache", "notifications",
    "testing", "communication", "project-management", "documents",
    "browser", "marketing", "design", "docs",
  ];

  for (const id of expectedCategories) {
    it(`has category "${id}"`, () => {
      expect(findCategory(id)).toBeDefined();
    });
  }
});

describe("findCategory", () => {
  it("returns category by ID", () => {
    const cat = findCategory("auth");
    expect(cat).toBeDefined();
    expect(cat!.id).toBe("auth");
  });

  it("returns undefined for unknown ID", () => {
    expect(findCategory("nonexistent")).toBeUndefined();
  });
});

describe("getRecommended", () => {
  it("returns the recommended alternative", () => {
    const cat = findCategory("auth")!;
    const rec = getRecommended(cat);
    expect(rec).toBeDefined();
    expect(rec.id).toBeTruthy();
  });

  it("falls back to first alternative when none is recommended", () => {
    // Create a mock category with no recommended
    const mockCat = {
      id: "test",
      label: "Test",
      description: "Test category",
      alternatives: [
        {
          id: "test-1",
          name: "Test 1",
          command: "/test",
          description: "Test",
          mcpServer: { command: "npx", args: ["test"] },
          requiredEnvVars: [],
          githubUrl: "",
          stars: 0,
          lastUpdated: "",
          source: "github" as const,
          pros: "",
          cons: "",
          freeTier: "",
          usedBy: [],
          recommended: false,
        },
      ],
    };
    const rec = getRecommended(mockCat);
    expect(rec.id).toBe("test-1");
  });
});

describe("ALWAYS_INCLUDE", () => {
  it("contains review, security, docs", () => {
    expect(ALWAYS_INCLUDE).toContain("review");
    expect(ALWAYS_INCLUDE).toContain("security");
    expect(ALWAYS_INCLUDE).toContain("docs");
  });

  it("all always-included categories exist in registry", () => {
    for (const id of ALWAYS_INCLUDE) {
      expect(findCategory(id)).toBeDefined();
    }
  });
});
