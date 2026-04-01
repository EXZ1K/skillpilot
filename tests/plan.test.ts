/**
 * Tests for the plan generation logic.
 *
 * Two modes:
 * 1. LLM passes `categories` explicitly → used directly (+ always_include)
 * 2. No categories → fallback to keyword matcher
 */
import { describe, it, expect } from "vitest";
import { matchCategories } from "../src/skills/matcher.js";
import {
  SKILL_CATEGORIES,
  findCategory,
  getRecommended,
  ALWAYS_INCLUDE,
} from "../src/skills/registry.js";

/**
 * Simulates Phase 1 of skillforge_plan with both modes:
 * - If categories provided: use them + always_include
 * - If not: use matchCategories(description)
 */
function simulatePlanPhase1(description: string, categories?: string[], techStack?: string) {
  let matchedCategories: string[];
  if (categories && categories.length > 0) {
    const cats = new Set<string>(categories.map((c) => c.toLowerCase().trim()));
    for (const always of ALWAYS_INCLUDE) cats.add(always);
    matchedCategories = Array.from(cats);
  } else {
    matchedCategories = matchCategories(description);
  }

  // Stack enrichment (mirrors mcp-server.ts logic)
  if (techStack) {
    const stackLower = techStack.toLowerCase();
    const STACK_TO_CATEGORIES: Record<string, string[]> = {
      redis: ["cache"], clickhouse: ["database", "analytics"],
      elasticsearch: ["search"], typesense: ["search"], algolia: ["search"],
      stripe: ["payments"], sentry: ["monitoring"], posthog: ["analytics"],
      resend: ["email"], mux: ["video"], s3: ["storage"],
      playwright: ["testing"], docker: ["deploy"], sanity: ["cms"],
      python: ["ai"], fastapi: ["ai"], pytorch: ["ai"],
      slack: ["communication"], novu: ["notifications"],
    };
    const enriched = new Set(matchedCategories);
    for (const [tech, cats] of Object.entries(STACK_TO_CATEGORIES)) {
      if (stackLower.includes(tech)) {
        for (const cat of cats) enriched.add(cat);
      }
    }
    matchedCategories = Array.from(enriched);
  }

  const catalogAgents: {
    categoryId: string;
    agentId: string;
    agentName: string;
    command: string;
    envVars: string[];
  }[] = [];

  const allEnvVars: { name: string; agent: string }[] = [];

  for (const catId of matchedCategories) {
    const category = findCategory(catId);
    if (!category) continue;

    const recommended = getRecommended(category);
    catalogAgents.push({
      categoryId: catId,
      agentId: recommended.id,
      agentName: recommended.name,
      command: recommended.command,
      envVars: recommended.requiredEnvVars.map((v) => v.name),
    });

    for (const envVar of recommended.requiredEnvVars) {
      allEnvVars.push({ name: envVar.name, agent: recommended.name });
    }
  }

  return { matchedCategories, catalogAgents, allEnvVars };
}

// ═══ Mode 1: LLM passes categories explicitly ═══

describe("Plan with explicit categories (LLM-driven)", () => {
  it("uses provided categories + always_include", () => {
    const plan = simulatePlanPhase1("any description", ["auth", "payments", "design"]);
    expect(plan.matchedCategories).toContain("auth");
    expect(plan.matchedCategories).toContain("payments");
    expect(plan.matchedCategories).toContain("design");
    // always_include added automatically
    expect(plan.matchedCategories).toContain("review");
    expect(plan.matchedCategories).toContain("security");
    expect(plan.matchedCategories).toContain("docs");
  });

  it("works with any language description when categories are explicit", () => {
    const plan = simulatePlanPhase1(
      "сайт ветклиники с записью на приём и оплатой",
      ["auth", "payments", "database", "marketing", "design", "deploy"],
    );
    expect(plan.matchedCategories.length).toBe(9); // 6 + 3 always
    expect(plan.matchedCategories).toContain("marketing");
    expect(plan.matchedCategories).toContain("design");
    expect(plan.matchedCategories).toContain("payments");
  });

  it("deduplicates categories", () => {
    const plan = simulatePlanPhase1("test", ["auth", "auth", "review", "security"]);
    const unique = [...new Set(plan.matchedCategories)];
    expect(plan.matchedCategories.length).toBe(unique.length);
  });

  it("normalizes case", () => {
    const plan = simulatePlanPhase1("test", ["Auth", "PAYMENTS", "Design"]);
    expect(plan.matchedCategories).toContain("auth");
    expect(plan.matchedCategories).toContain("payments");
    expect(plan.matchedCategories).toContain("design");
  });

  it("ignores unknown categories gracefully", () => {
    const plan = simulatePlanPhase1("test", ["auth", "nonexistent-category"]);
    // auth → agent found, nonexistent → no agent
    const authAgent = plan.catalogAgents.find((a) => a.categoryId === "auth");
    expect(authAgent).toBeDefined();
    const unknownAgent = plan.catalogAgents.find((a) => a.categoryId === "nonexistent-category");
    expect(unknownAgent).toBeUndefined();
  });

  it("returns agents for each valid category", () => {
    const plan = simulatePlanPhase1("test", ["auth", "payments", "database", "ai"]);
    // 4 explicit + 3 always = 7, all should have agents
    const validCats = plan.matchedCategories.filter((c) => findCategory(c));
    expect(plan.catalogAgents.length).toBe(validCats.length);
  });
});

// ═══ Mode 2: Keyword matcher fallback ═══

describe("Plan with keyword matching (fallback)", () => {
  it("SaaS → core categories", () => {
    const plan = simulatePlanPhase1("B2B SaaS for invoice management with payments and email");
    expect(plan.matchedCategories).toContain("auth");
    expect(plan.matchedCategories).toContain("payments");
    expect(plan.matchedCategories).toContain("database");
    expect(plan.matchedCategories).toContain("email");
  });

  it("includes always-included categories", () => {
    const plan = simulatePlanPhase1("simple app");
    for (const cat of ALWAYS_INCLUDE) {
      expect(plan.matchedCategories).toContain(cat);
    }
  });

  it("vet clinic in English → 9 categories", () => {
    const plan = simulatePlanPhase1(
      "veterinary clinic website with appointment booking online payments and user portal",
    );
    expect(plan.matchedCategories.length).toBe(9);
    expect(plan.matchedCategories).toContain("marketing");
    expect(plan.matchedCategories).toContain("design");
    expect(plan.matchedCategories).toContain("payments");
    expect(plan.matchedCategories).toContain("deploy");
  });

  it("non-English without categories → fallback defaults", () => {
    const plan = simulatePlanPhase1("сайт ветклиники с оплатой");
    // No English keywords → fallback
    expect(plan.matchedCategories).toContain("auth");
    expect(plan.matchedCategories).toContain("database");
    expect(plan.matchedCategories).toContain("docs");
  });
});

// ═══ Scenario tests ═══

describe("Plan: Simple portfolio", () => {
  const plan = simulatePlanPhase1("portfolio website");

  it("includes design + deploy + marketing", () => {
    expect(plan.matchedCategories).toContain("design");
    expect(plan.matchedCategories).toContain("deploy");
    expect(plan.matchedCategories).toContain("marketing");
  });
});

describe("Plan: AI chatbot", () => {
  const plan = simulatePlanPhase1("AI chatbot for customer support");

  it("includes ai category", () => {
    expect(plan.matchedCategories).toContain("ai");
  });

  it("AI agent has command /ai", () => {
    const aiAgent = plan.catalogAgents.find((a) => a.categoryId === "ai");
    expect(aiAgent).toBeDefined();
    expect(aiAgent!.command).toBe("/ai");
  });
});

describe("Plan: E-commerce", () => {
  const plan = simulatePlanPhase1("ecommerce shop with search and payments");

  it("includes search + payments + analytics + design", () => {
    expect(plan.matchedCategories).toContain("search");
    expect(plan.matchedCategories).toContain("payments");
    expect(plan.matchedCategories).toContain("analytics");
    expect(plan.matchedCategories).toContain("design");
  });
});

describe("Plan: Multiplayer game", () => {
  const plan = simulatePlanPhase1("multiplayer game with leaderboards and realtime");

  it("includes cache + database + auth", () => {
    expect(plan.matchedCategories).toContain("cache");
    expect(plan.matchedCategories).toContain("database");
    expect(plan.matchedCategories).toContain("auth");
  });
});

describe("Plan: each agent has a command", () => {
  const plan = simulatePlanPhase1("full saas platform");

  it("every agent command starts with /", () => {
    for (const agent of plan.catalogAgents) {
      expect(agent.command.startsWith("/")).toBe(true);
    }
  });
});

// ─── Roadmap build order ───

describe("Plan: build order correctness", () => {
  const buildOrder = [
    "marketing", "design", "auth", "database", "ai",
    "payments", "email", "cms", "search", "cache",
    "notifications", "analytics", "monitoring", "video",
    "storage", "testing", "communication", "project-management",
    "documents", "browser", "review", "security", "deploy", "docs",
  ];

  it("marketing → auth → payments → security → deploy (correct sequence)", () => {
    const indices = ["marketing", "auth", "payments", "security", "deploy"]
      .map((c) => buildOrder.indexOf(c));
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });

  it("deploy is second to last", () => {
    expect(buildOrder.indexOf("deploy")).toBe(buildOrder.length - 2);
  });
});

// ═══ Stack enrichment ═══

describe("Plan: techStack auto-enriches categories", () => {
  it("redis in stack → adds cache", () => {
    const plan = simulatePlanPhase1("any project", ["auth", "database"], "nextjs redis");
    expect(plan.matchedCategories).toContain("cache");
  });

  it("clickhouse in stack → adds database + analytics", () => {
    const plan = simulatePlanPhase1("analytics", ["auth"], "python clickhouse");
    expect(plan.matchedCategories).toContain("database");
    expect(plan.matchedCategories).toContain("analytics");
  });

  it("stripe in stack → adds payments", () => {
    const plan = simulatePlanPhase1("app", ["auth", "database"], "nextjs stripe");
    expect(plan.matchedCategories).toContain("payments");
  });

  it("sentry in stack → adds monitoring", () => {
    const plan = simulatePlanPhase1("app", ["auth"], "nextjs sentry");
    expect(plan.matchedCategories).toContain("monitoring");
  });

  it("python/fastapi in stack → adds ai", () => {
    const plan = simulatePlanPhase1("data pipeline", ["database"], "python fastapi");
    expect(plan.matchedCategories).toContain("ai");
  });

  it("docker in stack → adds deploy", () => {
    const plan = simulatePlanPhase1("service", ["auth", "database"], "python docker");
    expect(plan.matchedCategories).toContain("deploy");
  });

  it("full anti-fraud stack → all categories covered", () => {
    const plan = simulatePlanPhase1(
      "poker bot detection",
      ["auth", "database", "ai", "search", "analytics", "monitoring", "deploy"],
      "nextjs typescript python fastapi postgres clickhouse redis docker",
    );
    expect(plan.matchedCategories).toContain("cache");     // from redis
    expect(plan.matchedCategories).toContain("ai");        // from python/fastapi + explicit
    expect(plan.matchedCategories).toContain("analytics"); // from clickhouse + explicit
    expect(plan.matchedCategories).toContain("deploy");    // from docker + explicit
  });

  it("no stack → no enrichment", () => {
    const plan = simulatePlanPhase1("simple app", ["auth"]);
    // Only auth + always_include, no extra categories
    expect(plan.matchedCategories).not.toContain("cache");
    expect(plan.matchedCategories).not.toContain("monitoring");
  });
});
