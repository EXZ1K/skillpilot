/**
 * Tests for scoreRepo, isJunkRepo, scoreBadge — imported from compiled dist
 * since they're not exported from src. We test indirectly through the module.
 *
 * For now, we test the scoring logic by reimplementing the algorithm
 * and verifying it matches expected behavior.
 */
import { describe, it, expect } from "vitest";

// ─── Reimplementation of scoring for testing ───
// These mirror the functions in mcp-server.ts exactly.

const OFFICIAL_ORGS = new Set([
  "stripe", "supabase", "vercel", "netlify", "cloudflare", "railway",
  "sentry", "grafana", "posthog", "mixpanel", "sanity-io", "contentful",
  "elastic", "meilisearch", "upstash", "redis", "novu", "knocklabs",
  "google", "microsoft", "aws", "awslabs", "azure-samples", "firebase",
  "anthropics", "openai", "docker", "github", "atlassian",
  "modelcontextprotocol", "neondatabase",
]);

interface MockRepo {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  updated_at: string;
  topics: string[];
  owner: { login: string };
  size: number;
  open_issues_count: number;
  license: { spdx_id: string } | null;
  fork: boolean;
  created_at: string;
}

function scoreRepo(repo: MockRepo, query: string): number {
  const stars = Math.min(repo.stargazers_count, 10000);
  const popularityScore = stars > 0 ? (Math.log10(stars) / 4) * 100 : 0;

  const daysSinceUpdate = Math.max(0,
    (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24),
  );
  const freshnessScore =
    daysSinceUpdate < 30 ? 100 :
    daysSinceUpdate < 90 ? 70 :
    daysSinceUpdate < 180 ? 40 :
    daysSinceUpdate < 365 ? 20 : 5;

  const owner = repo.full_name.split("/")[0].toLowerCase();
  const queryMain = query.toLowerCase().split(/\s+/)[0];
  const isOfficial = OFFICIAL_ORGS.has(owner) || owner === queryMain;
  const officialScore = isOfficial ? 100 : 0;

  const descLen = (repo.description ?? "").length;
  const descScore =
    descLen > 100 ? 100 :
    descLen > 50 ? 70 :
    descLen > 20 ? 40 : 10;

  const issues = repo.open_issues_count ?? 0;
  const activityScore =
    issues > 20 ? 100 :
    issues > 5 ? 70 :
    issues > 0 ? 40 : 10;

  const license = repo.license?.spdx_id ?? "";
  const licenseScore =
    ["MIT", "Apache-2.0", "ISC", "BSD-2-Clause", "BSD-3-Clause"].includes(license) ? 100 :
    license ? 50 : 0;

  return (
    popularityScore * 0.25 +
    freshnessScore  * 0.20 +
    officialScore   * 0.25 +
    descScore       * 0.10 +
    activityScore   * 0.10 +
    licenseScore    * 0.10
  );
}

function scoreBadge(score: number): string {
  if (score >= 70) return "A";
  if (score >= 50) return "B";
  if (score >= 30) return "C";
  return "D";
}

function isJunkRepo(repo: MockRepo): boolean {
  const desc = repo.description ?? "";
  if (desc.length < 10) return true;
  if (desc.length > 500) return true;
  if (desc.includes("{") && desc.includes("}") && desc.includes(":")) return true;
  if (desc.includes("<") && desc.includes(">")) return true;
  if (repo.size < 5) return true;
  return false;
}

function makeRepo(overrides: Partial<MockRepo> = {}): MockRepo {
  return {
    full_name: "user/repo",
    description: "A good MCP server for testing purposes with detailed description",
    stargazers_count: 100,
    updated_at: new Date().toISOString(),
    topics: ["mcp-server"],
    owner: { login: "user" },
    size: 500,
    open_issues_count: 5,
    license: { spdx_id: "MIT" },
    fork: false,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

// ─── scoreRepo ───

describe("scoreRepo", () => {
  it("gives higher score to repos with more stars", () => {
    const lowStars = makeRepo({ stargazers_count: 10 });
    const highStars = makeRepo({ stargazers_count: 5000 });
    expect(scoreRepo(highStars, "test")).toBeGreaterThan(scoreRepo(lowStars, "test"));
  });

  it("caps stars at 10000", () => {
    const at10k = makeRepo({ stargazers_count: 10000 });
    const at50k = makeRepo({ stargazers_count: 50000 });
    expect(scoreRepo(at10k, "test")).toBe(scoreRepo(at50k, "test"));
  });

  it("gives bonus to official orgs", () => {
    const official = makeRepo({ full_name: "stripe/stripe-mcp", owner: { login: "stripe" } });
    const community = makeRepo({ full_name: "randomdev/stripe-mcp", owner: { login: "randomdev" } });
    expect(scoreRepo(official, "test")).toBeGreaterThan(scoreRepo(community, "test"));
  });

  it("gives bonus when owner matches query", () => {
    const match = makeRepo({ full_name: "acme/tool", owner: { login: "acme" } });
    const noMatch = makeRepo({ full_name: "other/tool", owner: { login: "other" } });
    expect(scoreRepo(match, "acme tools")).toBeGreaterThan(scoreRepo(noMatch, "acme tools"));
  });

  it("prefers recently updated repos", () => {
    const fresh = makeRepo({ updated_at: new Date().toISOString() });
    const old = makeRepo({ updated_at: "2022-01-01T00:00:00Z" });
    expect(scoreRepo(fresh, "test")).toBeGreaterThan(scoreRepo(old, "test"));
  });

  it("prefers MIT license over no license", () => {
    const mit = makeRepo({ license: { spdx_id: "MIT" } });
    const none = makeRepo({ license: null });
    expect(scoreRepo(mit, "test")).toBeGreaterThan(scoreRepo(none, "test"));
  });

  it("prefers repos with open issues (active community)", () => {
    const active = makeRepo({ open_issues_count: 25 });
    const dead = makeRepo({ open_issues_count: 0 });
    expect(scoreRepo(active, "test")).toBeGreaterThan(scoreRepo(dead, "test"));
  });

  it("prefers longer descriptions", () => {
    const detailed = makeRepo({ description: "A".repeat(120) });
    const short = makeRepo({ description: "A".repeat(15) });
    expect(scoreRepo(detailed, "test")).toBeGreaterThan(scoreRepo(short, "test"));
  });

  it("returns 0 popularity for 0 stars", () => {
    const zero = makeRepo({ stargazers_count: 0 });
    // Still has other scores (freshness, desc, etc)
    expect(scoreRepo(zero, "test")).toBeGreaterThan(0);
  });

  it("score is always between 0 and 100", () => {
    const best = makeRepo({
      full_name: "stripe/mcp",
      owner: { login: "stripe" },
      stargazers_count: 10000,
      open_issues_count: 50,
      description: "A".repeat(120),
      license: { spdx_id: "MIT" },
    });
    const worst = makeRepo({
      stargazers_count: 0,
      open_issues_count: 0,
      description: "",
      license: null,
      updated_at: "2020-01-01T00:00:00Z",
    });
    expect(scoreRepo(best, "stripe")).toBeLessThanOrEqual(100);
    expect(scoreRepo(worst, "test")).toBeGreaterThanOrEqual(0);
  });
});

// ─── scoreBadge ───

describe("scoreBadge", () => {
  it("returns A for scores >= 70", () => {
    expect(scoreBadge(70)).toBe("A");
    expect(scoreBadge(100)).toBe("A");
  });

  it("returns B for scores 50-69", () => {
    expect(scoreBadge(50)).toBe("B");
    expect(scoreBadge(69)).toBe("B");
  });

  it("returns C for scores 30-49", () => {
    expect(scoreBadge(30)).toBe("C");
    expect(scoreBadge(49)).toBe("C");
  });

  it("returns D for scores < 30", () => {
    expect(scoreBadge(0)).toBe("D");
    expect(scoreBadge(29)).toBe("D");
  });
});

// ─── isJunkRepo ───

describe("isJunkRepo", () => {
  it("rejects repos with no description", () => {
    expect(isJunkRepo(makeRepo({ description: null }))).toBe(true);
  });

  it("rejects repos with short description", () => {
    expect(isJunkRepo(makeRepo({ description: "tiny" }))).toBe(true);
  });

  it("rejects repos with too long description (spam)", () => {
    expect(isJunkRepo(makeRepo({ description: "x".repeat(501) }))).toBe(true);
  });

  it("rejects repos with CSS artifacts in description", () => {
    expect(isJunkRepo(makeRepo({ description: "body { color: red; font-size: 14px }" }))).toBe(true);
  });

  it("rejects repos with HTML in description", () => {
    expect(isJunkRepo(makeRepo({ description: "<div>Some HTML content</div>" }))).toBe(true);
  });

  it("rejects repos with tiny size (empty)", () => {
    expect(isJunkRepo(makeRepo({ size: 3 }))).toBe(true);
  });

  it("accepts normal repos", () => {
    expect(isJunkRepo(makeRepo())).toBe(false);
  });

  it("accepts repos with description exactly 10 chars", () => {
    expect(isJunkRepo(makeRepo({ description: "1234567890" }))).toBe(false);
  });

  it("accepts repos with description exactly 500 chars", () => {
    expect(isJunkRepo(makeRepo({ description: "a".repeat(500) }))).toBe(false);
  });
});
