#!/usr/bin/env node

/**
 * SkillPilot MCP Server — 7 tools
 *
 * Принцип: человек ставит наш MCP → делает ОДИН запрос → получает ПОЛНЫЙ план.
 * IDE-агент работает по этому плану автономно. Никаких дополнительных поисков.
 *
 * Tools:
 *   1. plan       → ГЛАВНЫЙ: описание проекта → полный план (MCP + Skills + Projects + Roadmap)
 *   2. catalog    → 59 проверенных MCP-агентов в 24 категориях
 *   3. install    → генерирует .mcp.json, .env.example, ROADMAP.md
 *   4. explain    → детали по одному агенту/категории
 *   5. discover   → ищет MCP-серверы на GitHub (37K+)
 *   6. skills     → ищет AI Skills: универсальные, IDE-specific, доменные
 *   7. projects   → ищет готовые open source проекты для форка
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

import {
  SKILL_CATEGORIES,
  findCategory,
  getRecommended,
  ALWAYS_INCLUDE,
  type SkillCategory,
  type SkillAlternative,
} from "./skills/registry.js";
import { matchCategories } from "./skills/matcher.js";
import { getSkillsForCategories, searchSkills, type CuratedSkill } from "./skills/skills-registry.js";

const server = new McpServer({
  name: "skillpilot",
  version: "0.1.0",
});

/* ═══════════════════════════════════════════════════
   Tool 1: CATALOG
   Показывает ВСЕ доступные категории агентов.
   LLM сама решает, что подходит проекту.
   ═══════════════════════════════════════════════════ */

server.registerTool(
  "skillpilot_catalog",
  {
    title: "SkillPilot Catalog",
    description:
      "Returns the full catalog of available MCP agent categories with alternatives. " +
      "Use this to see what agents are available before recommending or installing. " +
      "Each category (auth, payments, database, etc.) has 1-3 alternatives with pros, cons, pricing, and real projects that use them. " +
      "Categories: auth, payments, database, ai, email, deploy, review, security.",
    inputSchema: z.object({
      categories: z
        .array(z.string())
        .optional()
        .describe(
          "Filter by category IDs (e.g. ['auth', 'payments']). " +
          "Omit to get ALL categories.",
        ),
    }),
  },
  async ({ categories }) => {
    const filtered = categories?.length
      ? SKILL_CATEGORIES.filter((c) => categories.includes(c.id))
      : SKILL_CATEGORIES;

    const lines: string[] = [
      "# SkillPilot — Available Agent Categories",
      "",
      `${filtered.length} categories, ${filtered.reduce((n, c) => n + c.alternatives.length, 0)} agents total.`,
      "",
    ];

    for (const cat of filtered) {
      lines.push(`## ${cat.label} — ${cat.description}`);
      lines.push("");

      for (const alt of cat.alternatives) {
        const rec = alt.recommended ? " ⭐ RECOMMENDED" : "";
        lines.push(`### ${alt.name}${rec}`);
        lines.push(`- ID: \`${alt.id}\``);
        lines.push(`- Command: \`${alt.command}\``);
        lines.push(`- Description: ${alt.description}`);
        lines.push(`- Pros: ${alt.pros}`);
        lines.push(`- Cons: ${alt.cons}`);
        lines.push(`- Free tier: ${alt.freeTier}`);
        lines.push(`- Used by: ${alt.usedBy.join(", ")}`);
        lines.push(`- GitHub: ${alt.githubUrl}`);

        if (alt.requiredEnvVars.length > 0) {
          const keys = alt.requiredEnvVars
            .map((e) => `\`${e.name}\` — ${e.description} (${e.getUrl})`)
            .join("\n  - ");
          lines.push(`- API keys needed:\n  - ${keys}`);
        } else {
          lines.push("- API keys: none needed");
        }

        lines.push("");
      }
    }

    lines.push("---");
    lines.push("To install agents, call `skillpilot_install` with the chosen agent IDs.");

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  },
);

/* ═══════════════════════════════════════════════════
   Tool 2: INSTALL
   LLM выбрала агентов → мы генерируем файлы.
   ═══════════════════════════════════════════════════ */

server.registerTool(
  "skillpilot_install",
  {
    title: "SkillPilot Install",
    description:
      "Generates .mcp.json, .env.example, and ROADMAP.md for the chosen agents. " +
      "Call skillpilot_catalog first to see available agents. " +
      "Pass the agent IDs you want to install (e.g. ['clerk-mcp', 'stripe-mcp', 'supabase-mcp']).",
    inputSchema: z.object({
      agentIds: z
        .array(z.string())
        .describe(
          "Agent IDs to install (from catalog). " +
          "Example: ['clerk-mcp', 'stripe-mcp', 'supabase-mcp', 'vercel-mcp', 'semgrep-mcp']",
        ),
      targetDir: z
        .string()
        .describe("Absolute path to the project directory where files will be generated"),
      projectDescription: z
        .string()
        .describe("Short project description for ROADMAP.md header"),
    }),
  },
  async ({ agentIds, targetDir, projectDescription }) => {
    // Найти агентов по ID
    const chosen: SkillAlternative[] = [];
    const notFound: string[] = [];

    for (const id of agentIds) {
      const agent = findAgentById(id);
      if (agent) {
        chosen.push(agent);
      } else {
        notFound.push(id);
      }
    }

    if (chosen.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No valid agents found. Invalid IDs: ${notFound.join(", ")}.\n\nCall skillpilot_catalog to see available agent IDs.`,
        }],
      };
    }

    // Генерируем файлы
    const results: string[] = [];

    try {
      // .mcp.json
      const mcpJson = buildMcpJson(chosen);
      await writeFile(
        join(targetDir, ".mcp.json"),
        JSON.stringify(mcpJson, null, 2),
        "utf-8",
      );
      results.push("✓ .mcp.json — MCP server configs for IDE");

      // .env.example
      const envContent = buildEnvExample(chosen);
      if (envContent) {
        await writeFile(join(targetDir, ".env.example"), envContent, "utf-8");
        results.push("✓ .env.example — API key template");
      }

      // .skillpilot/config.json
      await mkdir(join(targetDir, ".skillpilot"), { recursive: true });
      await writeFile(
        join(targetDir, ".skillpilot", "config.json"),
        JSON.stringify({
          version: "0.1.0",
          projectDescription,
          agents: agentIds,
          createdAt: new Date().toISOString(),
        }, null, 2),
        "utf-8",
      );
      results.push("✓ .skillpilot/config.json — metadata");

      // ROADMAP.md
      const roadmap = buildRoadmap(projectDescription, chosen);
      await writeFile(join(targetDir, "ROADMAP.md"), roadmap, "utf-8");
      results.push("✓ ROADMAP.md — implementation plan");

      // Skills file — curated instructions по категориям установленных агентов
      const installedCategories = chosen.map((a) => {
        for (const cat of SKILL_CATEGORIES) {
          if (cat.alternatives.some((alt) => alt.id === a.id)) return cat.id;
        }
        return null;
      }).filter(Boolean) as string[];

      const skills = getSkillsForCategories(installedCategories);
      if (skills.length > 0) {
        // Один лучший skill на категорию
        const seenCats = new Set<string>();
        const selectedSkills: CuratedSkill[] = [];
        for (const skill of skills) {
          if (!seenCats.has(skill.category)) {
            seenCats.add(skill.category);
            selectedSkills.push(skill);
          }
        }

        const skillContent = [
          `# SkillPilot Project Skills`,
          `# Generated for: ${projectDescription}`,
          `# These instructions help your AI assistant write better code.`,
          `# Apply them during implementation to save tokens and prevent mistakes.`,
          ``,
          ...selectedSkills.flatMap((s) => [
            `${"=".repeat(60)}`,
            `# ${s.name}`,
            `# ${s.description}`,
            `${"=".repeat(60)}`,
            ``,
            s.instruction,
            ``,
          ]),
        ].join("\n");

        // Write as .cursorrules (works in Cursor, also readable by other IDEs)
        await writeFile(join(targetDir, ".cursorrules"), skillContent, "utf-8");
        results.push(`✓ .cursorrules — ${selectedSkills.length} curated skills for your IDE`);

        // Also write CLAUDE.md for Claude Code users
        await writeFile(join(targetDir, "CLAUDE.md"), skillContent, "utf-8");
        results.push("✓ CLAUDE.md — same skills for Claude Code");
      }

    } catch (err) {
      return {
        content: [{
          type: "text",
          text: `Error writing files to ${targetDir}: ${err instanceof Error ? err.message : String(err)}`,
        }],
      };
    }

    // Итог
    const summary = [
      `# SkillPilot — Installed ${chosen.length} agents`,
      "",
      ...results,
      "",
      "## Agents installed:",
      ...chosen.map((a) => `- ${a.command} → ${a.name}: ${a.description}`),
      "",
    ];

    if (notFound.length > 0) {
      summary.push(`⚠ Not found: ${notFound.join(", ")}`);
    }

    const envVars = chosen.flatMap((a) => a.requiredEnvVars);
    if (envVars.length > 0) {
      summary.push("");
      summary.push("## API keys needed:");
      const seen = new Set<string>();
      for (const v of envVars) {
        if (seen.has(v.name)) continue;
        seen.add(v.name);
        summary.push(`- \`${v.name}\` — ${v.description}`);
        summary.push(`  Get it: ${v.getUrl}`);
      }
    }

    summary.push("");
    summary.push("**Restart IDE to load new MCP servers from .mcp.json**");

    return {
      content: [{ type: "text", text: summary.join("\n") }],
    };
  },
);

/* ═══════════════════════════════════════════════════
   Tool 3: EXPLAIN
   Подробная информация об одном агенте.
   ═══════════════════════════════════════════════════ */

server.registerTool(
  "skillpilot_explain",
  {
    title: "Explain Agent",
    description:
      "Get detailed info about a specific agent category or agent ID. " +
      "Pass a category name like 'auth' or 'payments', or a specific agent ID like 'clerk-mcp'.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("Category name ('auth', 'payments') or agent ID ('clerk-mcp', 'stripe-mcp')"),
    }),
  },
  async ({ query }) => {
    const clean = query.replace("/", "").toLowerCase();

    // Попробуем как категорию
    const category = findCategory(clean);
    if (category) {
      return {
        content: [{
          type: "text",
          text: formatCategory(category),
        }],
      };
    }

    // Попробуем как agent ID
    const agent = findAgentById(clean);
    if (agent) {
      return {
        content: [{
          type: "text",
          text: formatAgent(agent),
        }],
      };
    }

    return {
      content: [{
        type: "text",
        text: `Unknown: "${query}". Available categories: ${SKILL_CATEGORIES.map((c) => c.id).join(", ")}`,
      }],
    };
  },
);

/* ═══════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════ */

function findAgentById(id: string): SkillAlternative | undefined {
  for (const cat of SKILL_CATEGORIES) {
    const found = cat.alternatives.find((a) => a.id === id);
    if (found) return found;
  }
  return undefined;
}

function buildMcpJson(agents: SkillAlternative[]) {
  const mcpServers: Record<string, { command: string; args: string[]; env?: Record<string, string> }> = {};

  for (const agent of agents) {
    const name = agent.command.replace("/", "");
    mcpServers[name] = {
      command: agent.mcpServer.command,
      args: agent.mcpServer.args,
      ...(agent.mcpServer.env && Object.keys(agent.mcpServer.env).length > 0
        ? { env: agent.mcpServer.env }
        : {}),
    };
  }

  return { mcpServers };
}

function buildEnvExample(agents: SkillAlternative[]): string {
  const lines: string[] = ["# SkillPilot — API Keys", ""];
  const seen = new Set<string>();

  for (const agent of agents) {
    for (const v of agent.requiredEnvVars) {
      if (seen.has(v.name)) continue;
      seen.add(v.name);
      lines.push(`# ${v.description}`);
      lines.push(`# Get it: ${v.getUrl}`);
      lines.push(`${v.name}=`);
      lines.push("");
    }
  }

  return seen.size > 0 ? lines.join("\n") : "";
}

function buildRoadmap(description: string, agents: SkillAlternative[]): string {
  const lines = [
    `# Roadmap: ${description}`,
    "",
    "> Generated by SkillPilot",
    "",
  ];

  const phaseMap: Record<string, number> = {
    database: 1, auth: 1,
    ai: 2, payments: 2,
    email: 3, review: 3, security: 3,
    deploy: 4,
  };

  const phaseNames: Record<number, string> = {
    1: "Foundation (database + auth)",
    2: "Business logic (AI, payments)",
    3: "Quality (email, review, security)",
    4: "Launch (deploy)",
  };

  const grouped = new Map<number, SkillAlternative[]>();
  for (const agent of agents) {
    const key = agent.command.replace("/", "");
    const phase = phaseMap[key] ?? 3;
    if (!grouped.has(phase)) grouped.set(phase, []);
    grouped.get(phase)!.push(agent);
  }

  for (const [num, group] of [...grouped.entries()].sort(([a], [b]) => a - b)) {
    lines.push(`## Phase ${num}: ${phaseNames[num] ?? "Other"}`);
    lines.push("");
    for (const agent of group) {
      lines.push(`- [ ] **${agent.name}** (\`${agent.command}\`)`);
      lines.push(`  ${agent.description}`);
      if (agent.requiredEnvVars.length > 0) {
        lines.push(`  Keys: ${agent.requiredEnvVars.map((v) => v.name).join(", ")}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

function formatCategory(cat: SkillCategory): string {
  const lines = [`## ${cat.label}\n${cat.description}\n`];
  for (const alt of cat.alternatives) {
    const rec = alt.recommended ? " ⭐" : "";
    lines.push(`**${alt.name}**${rec}`);
    lines.push(`- ${alt.description}`);
    lines.push(`- Pros: ${alt.pros}`);
    lines.push(`- Cons: ${alt.cons}`);
    lines.push(`- Free: ${alt.freeTier}`);
    lines.push(`- Used by: ${alt.usedBy.join(", ")}`);
    lines.push("");
  }
  return lines.join("\n");
}

function formatAgent(agent: SkillAlternative): string {
  return [
    `## ${agent.name}`,
    `Command: \`${agent.command}\``,
    `${agent.description}`,
    "",
    `- Pros: ${agent.pros}`,
    `- Cons: ${agent.cons}`,
    `- Free tier: ${agent.freeTier}`,
    `- Used by: ${agent.usedBy.join(", ")}`,
    `- GitHub: ${agent.githubUrl}`,
    agent.requiredEnvVars.length > 0
      ? `- Keys: ${agent.requiredEnvVars.map((v) => `${v.name} (${v.getUrl})`).join(", ")}`
      : "- Keys: none needed",
  ].join("\n");
}

/* ═══════════════════════════════════════════════════
   Tool 4: DISCOVER
   Ищет MCP-серверы на GitHub с multi-step стратегией.
   Покрывает 37,000+ серверов за пределами каталога.
   ═══════════════════════════════════════════════════ */

/** Один результат из GitHub Search API */
interface GitHubRepo {
  full_name: string;
  html_url: string;
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

/* ── Scoring Algorithm ───────────────────────────
   Ранжирование результатов по 6 факторам.
   Каждый фактор: 0-100 баллов, с весом.
   ─────────────────────────────────────────────── */

/** Известные official-организации — их MCP-серверы в приоритете */
const OFFICIAL_ORGS = new Set([
  // Платформы
  "stripe", "supabase", "vercel", "netlify", "cloudflare", "railway",
  "sentry", "grafana", "posthog", "mixpanel", "sanity-io", "contentful",
  "elastic", "meilisearch", "upstash", "redis", "novu", "knocklabs",
  // Cloud/Big tech
  "google", "microsoft", "aws", "awslabs", "azure-samples", "firebase",
  "googleanalytics", "google-marketing-solutions",
  // Dev tools
  "anthropics", "openai", "docker", "github", "atlassian",
  "hubspot", "mailgun", "twilio", "sendgrid",
  // Orgs с нестандартными именами
  "makenotion", "getsentry", "koush", "blakeblackshear",
  "peakmojo", "gomarble-ai", "kerberos-io",
  // Media
  "muxinc", "cloudinary",
  // Ecosystem
  "modelcontextprotocol", "neondatabase", "roboflow",
]);

/**
 * Вычисляет score для ранжирования результатов.
 *
 * Факторы и веса:
 *   1. Популярность (stars)         — 25%  (логарифмическая шкала)
 *   2. Свежесть (last update)       — 20%  (коммит < 30 дней = макс)
 *   3. Official (известная орг)     — 25%  (official = +100, community = 0)
 *   4. Описание (README качество)   — 10%  (длина description как прокси)
 *   5. Активность (open issues)     — 10%  (есть issues = живой проект)
 *   6. Лицензия (MIT/Apache)        — 10%  (open license = +100)
 */
function scoreRepo(repo: GitHubRepo, query: string): number {
  // 1. Популярность: log scale, cap at 10000 stars = 100
  const stars = Math.min(repo.stargazers_count, 10000);
  const popularityScore = stars > 0 ? (Math.log10(stars) / 4) * 100 : 0;

  // 2. Свежесть: дни с последнего обновления
  const daysSinceUpdate = Math.max(0,
    (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24),
  );
  const freshnessScore =
    daysSinceUpdate < 30 ? 100 :
    daysSinceUpdate < 90 ? 70 :
    daysSinceUpdate < 180 ? 40 :
    daysSinceUpdate < 365 ? 20 : 5;

  // 3. Official: owner в списке известных организаций
  const owner = repo.full_name.split("/")[0].toLowerCase();
  const queryMain = query.toLowerCase().split(/\s+/)[0];
  const isOfficial = OFFICIAL_ORGS.has(owner) || owner === queryMain;
  const officialScore = isOfficial ? 100 : 0;

  // 4. Описание: длина как прокси качества README
  const descLen = (repo.description ?? "").length;
  const descScore =
    descLen > 100 ? 100 :
    descLen > 50 ? 70 :
    descLen > 20 ? 40 : 10;

  // 5. Активность: есть ли open issues (= люди пользуются)
  const issues = repo.open_issues_count ?? 0;
  const activityScore =
    issues > 20 ? 100 :
    issues > 5 ? 70 :
    issues > 0 ? 40 : 10;

  // 6. Лицензия: MIT/Apache = friendly
  const license = repo.license?.spdx_id ?? "";
  const licenseScore =
    ["MIT", "Apache-2.0", "ISC", "BSD-2-Clause", "BSD-3-Clause"].includes(license) ? 100 :
    license ? 50 : 0;

  // Взвешенная сумма
  return (
    popularityScore * 0.25 +
    freshnessScore  * 0.20 +
    officialScore   * 0.25 +
    descScore       * 0.10 +
    activityScore   * 0.10 +
    licenseScore    * 0.10
  );
}

/** Форматирует score-бейдж для вывода */
function scoreBadge(score: number): string {
  if (score >= 70) return "A";
  if (score >= 50) return "B";
  if (score >= 30) return "C";
  return "D";
}

/* ── In-memory кеш (24 часа) ──────────────────── */

interface CacheEntry {
  data: { total: number; items: GitHubRepo[] };
  expires: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

/** Поиск на GitHub с кешем и rate limit handling */
async function searchGitHub(
  query: string,
  perPage: number,
): Promise<{ total: number; items: GitHubRepo[] }> {
  // Проверяем кеш
  const cacheKey = `${query}::${perPage}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "skillpilot-mcp/0.1.0",
  };

  // GITHUB_TOKEN: 5000 req/hour вместо 60
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });

  if (res.status === 403 || res.status === 429) {
    throw new Error("RATE_LIMIT");
  }
  if (!res.ok) {
    throw new Error(`GitHub API: ${res.status} ${res.statusText}`);
  }

  const data = await res.json() as { total_count: number; items: GitHubRepo[] };
  const result = { total: data.total_count, items: data.items };

  // Сохраняем в кеш
  searchCache.set(cacheKey, { data: result, expires: Date.now() + CACHE_TTL });

  return result;
}

/**
 * Фильтр мусора — отсекает нерелевантные результаты.
 * CSS-дампы, форки без описания, спам-репозитории.
 */
function isJunkRepo(repo: GitHubRepo): boolean {
  const desc = repo.description ?? "";

  // Нет описания или слишком короткое
  if (desc.length < 10) return true;

  // Описание подозрительно длинное (CSS дампы, SEO спам)
  if (desc.length > 500) return true;

  // Описание содержит CSS/HTML артефакты
  if (desc.includes("{") && desc.includes("}") && desc.includes(":")) return true;
  if (desc.includes("<") && desc.includes(">")) return true;

  // Репозиторий слишком маленький (пустой) или огромный (не MCP-сервер)
  if (repo.size < 5) return true;

  return false;
}

server.registerTool(
  "skillpilot_discover",
  {
    title: "Discover MCP Servers on GitHub",
    description:
      "Searches 37,000+ MCP servers on GitHub using smart multi-step search. " +
      "Use this for ANY tool or service not in the built-in catalog: " +
      "databases (MySQL, MongoDB, DynamoDB), messaging (Slack, Discord, Telegram), " +
      "productivity (Notion, Linear, Jira), cloud (AWS, GCP, Azure), " +
      "niche domains (poker, CAD, music, IoT), or anything else. " +
      "Pass a short keyword — the tool runs 3 different search strategies.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "What to search for. Keep it short: 'slack', 'notion', 'mysql', 'poker', 'discord'. " +
          "1-3 words work best.",
        ),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Max results to return (default: 10)"),
    }),
  },
  async ({ query, limit }) => {
    const maxResults = limit ?? 10;

    // Multi-step search: от точного к широкому.
    // Останавливаемся как только набрали достаточно результатов.
    const strategies = [
      // 1. Точный: keyword в названии + mcp topic
      `${query} mcp-server in:name,description`,
      // 2. По topic (если #1 мало дал)
      `${query} topic:mcp-server`,
      // 3. Широкий fallback (если #1 и #2 пусты)
      `${query} mcp in:name,description`,
    ];

    const seen = new Set<string>();
    const allResults: GitHubRepo[] = [];

    try {
      for (let i = 0; i < strategies.length; i++) {
        // Ранний выход: достаточно результатов или экономим API-запросы
        if (allResults.length >= maxResults) break;
        // После первой стратегии: если нашли >= половины — не тратим ещё запрос
        if (i > 0 && allResults.length >= Math.ceil(maxResults / 2)) break;

        try {
          const { items } = await searchGitHub(strategies[i], maxResults);
          for (const repo of items) {
            if (seen.has(repo.full_name)) continue;
            seen.add(repo.full_name);

            // Фильтруем мусор + проверяем MCP-related
            if (isJunkRepo(repo)) continue;

            const name = repo.full_name.toLowerCase();
            const desc = (repo.description ?? "").toLowerCase();
            const topics = (repo.topics ?? []).join(" ");
            const isMcp =
              name.includes("mcp") ||
              desc.includes("mcp") ||
              desc.includes("model context protocol") ||
              topics.includes("mcp");

            if (isMcp) {
              allResults.push(repo);
            }
          }
        } catch (err) {
          if (err instanceof Error && err.message === "RATE_LIMIT") {
            return {
              content: [{
                type: "text" as const,
                text: "GitHub API rate limit reached (60 req/hour unauthenticated). " +
                  "Set GITHUB_TOKEN env var for 5000 req/hour.\n\n" +
                  (allResults.length > 0
                    ? `Partial results (${allResults.length} found before limit):\n` +
                      allResults.map((r) => `- ${r.full_name} (*${r.stargazers_count}) — ${r.description?.slice(0, 80)}`).join("\n")
                    : "No results yet. Try again in a few minutes."),
              }],
            };
          }
          // Продолжаем со следующей стратегией
        }
      }

      // Сортируем по звёздам и обрезаем
      allResults.sort((a, b) => scoreRepo(b, query) - scoreRepo(a, query));
      const top = allResults.slice(0, maxResults);

      if (top.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: `No MCP servers found for "${query}".\n\n` +
              "Tips:\n" +
              "- Try shorter keywords: 'mysql' instead of 'mysql database connector'\n" +
              "- Try the service name: 'notion', 'linear', 'jira'\n" +
              "- Try the tool name: 'prisma', 'drizzle', 'puppeteer'\n" +
              `- Browse all 37K+ MCP servers: https://github.com/topics/mcp-server`,
          }],
        };
      }

      const lines: string[] = [
        `# Discovered MCP Servers: "${query}"`,
        "",
        `Found ${top.length} servers (from ${allResults.length} total matches):`,
        "",
      ];

      for (const repo of top) {
        const score = scoreRepo(repo, query);
        const grade = scoreBadge(score);
        const owner = repo.full_name.split("/")[0].toLowerCase();
        const queryMain = query.toLowerCase().split(/\s+/)[0];
        const isOfficial = OFFICIAL_ORGS.has(owner) || owner === queryMain;
        const officialTag = isOfficial ? " [OFFICIAL]" : "";
        const stars = repo.stargazers_count;
        const updated = repo.updated_at.slice(0, 10);
        const repoName = repo.full_name.split("/")[1];
        const license = repo.license?.spdx_id ?? "unknown";

        lines.push(`### [${grade}] ${repo.full_name}${officialTag} (*${stars})`);
        lines.push(`${repo.description ?? "No description"}`);
        lines.push(`- Score: ${Math.round(score)}/100 | Stars: ${stars} | Updated: ${updated} | License: ${license}`);
        lines.push(`- GitHub: ${repo.html_url}`);
        if (repo.topics?.length) {
          lines.push(`- Topics: ${repo.topics.join(", ")}`);
        }
        lines.push(`- Install: \`npx -y ${repoName}\` (check README to confirm)`);
        lines.push("");
      }

      lines.push("---");
      lines.push("Score: A (70+) = recommended, B (50+) = good, C (30+) = usable, D = risky.");
      lines.push("Factors: popularity (25%), freshness (20%), official (25%), docs (10%), activity (10%), license (10%).");

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (err) {
      return {
        content: [{
          type: "text" as const,
          text: `Error: ${err instanceof Error ? err.message : String(err)}`,
        }],
      };
    }
  },
);

/* ═══════════════════════════════════════════════════
   Tool 5: SKILLS (Universal — ВСЕ типы)

   3 уровня скиллов:

   1. UNIVERSAL — работают с ЛЮБОЙ моделью/IDE
      Это просто хорошие промпты/инструкции от практиков:
      "senior react developer", "code review checklist",
      "python best practices", "fintech coding standards"
      На GitHub: system prompts, coding guidelines, AI instructions

   2. IDE-SPECIFIC — привязаны к конкретной IDE
      Claude: SKILL.md | Cursor: .cursorrules | Windsurf: .windsurfrules
      Codex: AGENTS.md | Gemini: GEMINI.md | Cline: .clinerules

   3. DOMAIN — экспертные скиллы для конкретных областей
      Финтех, медицина, gamedev, DevOps, data science...
      Написаны специалистами, не AI — в этом их ценность.

   Community skills >>> platform defaults.
   ═══════════════════════════════════════════════════ */

/** IDE skill format definitions for search and display */
const IDE_SKILL_FORMATS = [
  { id: "claude",    name: "Claude Code",   files: ["SKILL.md", ".claude/skills"],   topics: ["claude-skills", "claude-code-skill", "claude-skill"], searchTerms: ["claude skill", "claude code skill", "SKILL.md"] },
  { id: "cursor",    name: "Cursor",        files: [".cursorrules", ".cursor/rules"], topics: ["cursor-rules", "cursorrules"],                        searchTerms: ["cursorrules", "cursor rules", ".cursorrules"] },
  { id: "windsurf",  name: "Windsurf",      files: [".windsurfrules"],               topics: ["windsurf-rules", "windsurfrules"],                    searchTerms: ["windsurfrules", "windsurf rules"] },
  { id: "codex",     name: "Codex CLI",     files: ["AGENTS.md"],                    topics: ["codex-agents", "codex-cli"],                          searchTerms: ["AGENTS.md codex", "codex agents"] },
  { id: "gemini",    name: "Gemini CLI",    files: ["GEMINI.md"],                    topics: ["gemini-rules", "gemini-cli"],                         searchTerms: ["GEMINI.md", "gemini cli rules"] },
  { id: "cline",     name: "Cline",         files: [".clinerules"],                  topics: ["cline-rules", "clinerules"],                          searchTerms: ["clinerules", "cline rules"] },
  { id: "continue",  name: "Continue.dev",  files: [".continuerules"],               topics: ["continue-rules"],                                     searchTerms: ["continuerules", "continue rules"] },
  { id: "aider",     name: "Aider",         files: [".aider.conf.yml"],              topics: ["aider-rules"],                                        searchTerms: ["aider conventions", "aider rules"] },
  { id: "zed",       name: "Zed",           files: [".zed/prompt.md"],               topics: ["zed-rules"],                                          searchTerms: ["zed prompt rules"] },
] as const;

server.registerTool(
  "skillpilot_skills",
  {
    title: "Find AI Skills — Universal, IDE-specific & Domain Expert",
    description:
      "Searches GitHub for AI coding skills written by the community. " +
      "3 types of skills:\n" +
      "1. UNIVERSAL — prompts/instructions that work with ANY AI model (ChatGPT, Claude, Gemini, Copilot, local LLMs). " +
      "These are the most valuable: system prompts, coding standards, best practices, expert guidelines written by practitioners.\n" +
      "2. IDE-SPECIFIC — for Claude Code (SKILL.md), Cursor (.cursorrules), Windsurf, Codex, Gemini CLI, Cline, etc.\n" +
      "3. DOMAIN — expert skills for fintech, healthcare, gamedev, DevOps, data science, etc.\n\n" +
      "Community-written skills are often BETTER than built-in defaults because they come from real experience.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "What kind of skill to find: 'react best practices', 'code review', 'python senior', " +
          "'fintech compliance', 'nextjs', 'security audit', 'system design', or any keyword.",
        ),
      type: z
        .enum(["all", "universal", "ide", "domain"])
        .optional()
        .default("all")
        .describe(
          "Skill type: 'universal' for model-agnostic skills, 'ide' for IDE-specific, " +
          "'domain' for expert domain skills. Default: 'all'.",
        ),
      ide: z
        .enum(["all", "claude", "cursor", "windsurf", "codex", "gemini", "cline", "continue", "aider", "zed"])
        .optional()
        .default("all")
        .describe(
          "Filter by IDE (only when type='ide'): 'cursor', 'claude', 'codex', etc. Default: 'all'.",
        ),
      limit: z
        .number()
        .optional()
        .default(15)
        .describe("Max results (default: 15)"),
    }),
  },
  async ({ query, type, ide, limit }) => {
    const maxResults = limit ?? 15;
    const skillType = type ?? "all";
    const targetIde = ide ?? "all";

    // ─── Генерируем стратегии поиска по типу скилла ────────

    const strategies: { search: string; tag: string }[] = [];

    // UNIVERSAL: промпты/инструкции для любой модели (самые ценные!)
    // Короткие запросы — GitHub API лучше ищет с 2-4 словами
    if (skillType === "all" || skillType === "universal") {
      strategies.push(
        { search: `${query} best practices`, tag: "universal" },
        { search: `${query} coding guidelines`, tag: "universal" },
        { search: `awesome ${query}`, tag: "universal" },
        { search: `${query} system prompt`, tag: "universal" },
        { search: `${query} cheatsheet patterns`, tag: "universal" },
      );
    }

    // IDE-SPECIFIC: конкретные файлы для конкретных IDE
    if (skillType === "all" || skillType === "ide") {
      const targetFormats = targetIde === "all"
        ? IDE_SKILL_FORMATS
        : IDE_SKILL_FORMATS.filter((f) => f.id === targetIde);

      for (const fmt of targetFormats) {
        strategies.push({
          search: `${query} ${fmt.searchTerms[0]}`,
          tag: fmt.id,
        });
      }
    }

    // DOMAIN: экспертные скиллы для конкретных областей
    if (skillType === "all" || skillType === "domain") {
      strategies.push(
        { search: `${query} coding standards`, tag: "domain" },
        { search: `${query} style guide`, tag: "domain" },
      );
    }

    const seen = new Set<string>();
    const allResults: (GitHubRepo & { skillTag: string })[] = [];

    try {
      for (let i = 0; i < strategies.length; i++) {
        if (allResults.length >= maxResults * 2) break;
        if (i > 5 && allResults.length >= maxResults) break;

        try {
          const { items } = await searchGitHub(strategies[i].search, maxResults);
          for (const repo of items) {
            if (seen.has(repo.full_name)) continue;
            seen.add(repo.full_name);

            if (isJunkRepo(repo)) continue;

            const name = repo.full_name.toLowerCase();
            const desc = (repo.description ?? "").toLowerCase();
            const topics = (repo.topics ?? []).join(" ").toLowerCase();
            const combined = `${name} ${desc} ${topics}`;

            // Определяем тип скилла
            let tag = strategies[i].tag;

            // Детектим IDE если tag — generic
            if (tag === "universal" || tag === "domain") {
              for (const fmt of IDE_SKILL_FORMATS) {
                const isIdeSpecific =
                  fmt.files.some((f) => combined.includes(f.toLowerCase().replace(".", ""))) ||
                  fmt.topics.some((t) => topics.includes(t));
                if (isIdeSpecific) {
                  tag = fmt.id;
                  break;
                }
              }
            }

            // Фильтр релевантности: это действительно скилл/промпт/инструкция?
            const isRelevant =
              // Прямые маркеры скиллов
              combined.includes("skill") ||
              combined.includes("prompt") ||
              combined.includes("rules") ||
              combined.includes("guidelines") ||
              combined.includes("conventions") ||
              combined.includes("instructions") ||
              combined.includes("best practices") ||
              combined.includes("standards") ||
              combined.includes("template") ||
              combined.includes("boilerplate") ||
              // Универсальные маркеры (guides, handbooks, cheatsheets)
              combined.includes("guide") ||
              combined.includes("handbook") ||
              combined.includes("cheatsheet") ||
              combined.includes("cheat-sheet") ||
              combined.includes("cookbook") ||
              combined.includes("patterns") ||
              combined.includes("architecture") ||
              combined.includes("style guide") ||
              combined.includes("styleguide") ||
              combined.includes("coding") ||
              combined.includes("practices") ||
              // IDE-специфичные файлы
              combined.includes("cursorrules") ||
              combined.includes("windsurfrules") ||
              combined.includes("clinerules") ||
              combined.includes("agents.md") ||
              combined.includes("gemini.md") ||
              // Topic маркеры
              topics.includes("prompt") ||
              topics.includes("skill") ||
              topics.includes("rules") ||
              topics.includes("guidelines") ||
              topics.includes("coding-standards") ||
              topics.includes("best-practices") ||
              topics.includes("ai-prompts") ||
              topics.includes("system-prompt") ||
              topics.includes("awesome") ||
              topics.includes("guide") ||
              topics.includes("handbook") ||
              topics.includes("patterns") ||
              topics.includes("cheatsheet");

            // Для MCP-серверов — это НЕ скилл, это инструмент (для них есть discover)
            const isMcp =
              combined.includes("mcp-server") ||
              combined.includes("mcp_server") ||
              topics.includes("mcp-server");

            if (isRelevant && !isMcp) {
              allResults.push({ ...repo, skillTag: tag });
            }
          }
        } catch (err) {
          if (err instanceof Error && err.message === "RATE_LIMIT") {
            break;
          }
        }
      }

      allResults.sort((a, b) => scoreRepo(b, query) - scoreRepo(a, query));
      const top = allResults.slice(0, maxResults);

      const typeLabel =
        skillType === "universal" ? "Universal (any model)" :
        skillType === "ide" ? "IDE-specific" :
        skillType === "domain" ? "Domain expert" :
        "All types";

      const lines: string[] = [
        `# AI Skills: "${query}" — ${typeLabel}`,
        "",
      ];

      // Curated collections
      lines.push("## Curated Collections");
      lines.push("");
      lines.push("| Collection | Type | Stars | Description |");
      lines.push("|---|---|---|---|");
      lines.push("| [awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts) | Universal | 120K+ | System prompts for any model — coding, writing, analysis |");
      lines.push("| [awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | Universal | 11K+ | 1000+ skills from Anthropic, Google, Vercel, Stripe |");
      lines.push("| [anthropics/skills](https://github.com/anthropics/skills) | Claude | 107K | Official Claude skills: PDF, DOCX, design |");
      lines.push("| [cursor.directory](https://github.com/pontusab/cursor.directory) | Cursor | 10K+ | 500+ .cursorrules by framework/language |");
      lines.push("| [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) | Cursor | 15K+ | Curated .cursorrules for every stack |");
      lines.push("| [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | Claude | 28K+ | Skills, hooks, commands, MCP configs |");
      lines.push("| [claude-skills](https://github.com/alirezarezvani/claude-skills) | Multi | 5K+ | 220+ for engineering, marketing, compliance |");
      lines.push("| [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) | Multi | — | 1340+ installable skills with CLI |");
      lines.push("");

      if (top.length > 0) {
        lines.push(`## Search Results (${top.length} found)`);
        lines.push("");

        for (const repo of top) {
          const score = scoreRepo(repo, query);
          const grade = scoreBadge(score);
          const stars = repo.stargazers_count;
          const updated = repo.updated_at.slice(0, 10);

          // Tag badge
          const ideFmt = IDE_SKILL_FORMATS.find((f) => f.id === repo.skillTag);
          const badge =
            ideFmt ? ideFmt.name :
            repo.skillTag === "universal" ? "Universal" :
            repo.skillTag === "domain" ? "Domain" :
            "Multi";

          lines.push(`### [${grade}] [${badge}] ${repo.full_name} (★${stars})`);
          lines.push(`${repo.description ?? "No description"}`);
          lines.push(`- Score: ${Math.round(score)}/100 | Updated: ${updated}`);
          lines.push(`- GitHub: ${repo.html_url}`);
          if (repo.topics?.length) {
            lines.push(`- Topics: ${repo.topics.slice(0, 8).join(", ")}`);
          }
          lines.push("");
        }
      } else {
        lines.push(`No specific skills found for "${query}". Check the curated collections above.`);
      }

      // How to use
      lines.push("---");
      lines.push("## How to use skills");
      lines.push("");
      lines.push("**Universal skills (any model):** Copy the system prompt into your AI chat settings, project config, or CLAUDE.md / .cursorrules / AGENTS.md");
      lines.push("**Claude Code:** `mkdir -p .claude/skills/name && cp SKILL.md .claude/skills/name/`");
      lines.push("**Cursor:** Copy `.cursorrules` to project root, or `.cursor/rules/name.mdc`");
      lines.push("**Windsurf:** Copy to `.windsurfrules` in project root");
      lines.push("**Codex CLI:** Copy `AGENTS.md` to project root or subdirectory");
      lines.push("**Gemini CLI:** Copy `GEMINI.md` to project root");
      lines.push("**Cline:** Copy to `.clinerules` | **Continue:** `.continuerules` | **Aider:** `.aider.conf.yml` | **Zed:** `.zed/prompt.md`");

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (err) {
      return {
        content: [{
          type: "text" as const,
          text: `Error: ${err instanceof Error ? err.message : String(err)}`,
        }],
      };
    }
  },
);

/* ═══════════════════════════════════════════════════
   Tool 6: PROJECTS
   Ищет готовые open source проекты для форка.
   Не MCP, не Skills — полноценные приложения.
   ═══════════════════════════════════════════════════ */

server.registerTool(
  "skillpilot_projects",
  {
    title: "Find Similar Open Source Projects to Fork",
    description:
      "Searches GitHub for ready-made open source projects similar to what the user wants to build. " +
      "These are full applications (not MCP servers or skills) that can be forked or used as reference. " +
      "Use this for: 'video surveillance dashboard', 'invoice SaaS', 'AI chatbot platform', " +
      "'poker game engine', 'e-commerce store', etc. Returns repos with stars, tech stack, license.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "Project description: 'video analytics surveillance dashboard', " +
          "'invoice management SaaS', 'poker game engine', 'AI chatbot'. " +
          "2-5 words describing what you want to build.",
        ),
      techStack: z
        .string()
        .optional()
        .describe(
          "Preferred tech stack filter: 'nextjs', 'python', 'react', 'typescript'. " +
          "Omit for any stack.",
        ),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Max results (default: 10)"),
    }),
  },
  async ({ query, techStack, limit }) => {
    const maxResults = limit ?? 10;
    const stackFilter = techStack ? ` ${techStack}` : "";

    // Search strategies: от точного к широкому
    const strategies = [
      // 1. Direct project search with stack
      `${query}${stackFilter} open source`,
      // 2. Just the query (broader)
      `${query}${stackFilter}`,
    ];

    const seen = new Set<string>();
    const allResults: GitHubRepo[] = [];

    try {
      for (let i = 0; i < strategies.length; i++) {
        if (allResults.length >= maxResults) break;
        if (i > 0 && allResults.length >= Math.ceil(maxResults / 2)) break;

        try {
          const { items } = await searchGitHub(strategies[i], maxResults);
          for (const repo of items) {
            if (seen.has(repo.full_name)) continue;
            seen.add(repo.full_name);

            // Фильтр мусора + исключаем чистые MCP-серверы (нужны проекты)
            if (isJunkRepo(repo)) continue;

            const name = repo.full_name.toLowerCase();
            const desc = (repo.description ?? "").toLowerCase();
            const isMcpOnly =
              (name.includes("mcp-server") || name.includes("mcp_server")) &&
              !desc.includes("application") &&
              !desc.includes("dashboard") &&
              !desc.includes("platform");

            if (!isMcpOnly && repo.stargazers_count >= 5) {
              allResults.push(repo);
            }
          }
        } catch (err) {
          if (err instanceof Error && err.message === "RATE_LIMIT") {
            return {
              content: [{
                type: "text" as const,
                text: "GitHub API rate limit. Set GITHUB_TOKEN for 5000 req/hour.\n\n" +
                  (allResults.length > 0
                    ? `Partial results:\n${allResults.map((r) => `- ${r.full_name} (*${r.stargazers_count}) — ${r.description?.slice(0, 80)}`).join("\n")}`
                    : "Try again in a few minutes."),
              }],
            };
          }
        }
      }

      allResults.sort((a, b) => scoreRepo(b, query) - scoreRepo(a, query));
      const top = allResults.slice(0, maxResults);

      if (top.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: `No open source projects found for "${query}".\n\n` +
              "Tips: try more generic terms ('surveillance system' instead of 'business process camera monitoring').",
          }],
        };
      }

      const lines: string[] = [
        `# Open Source Projects: "${query}"`,
        "",
        `Found ${top.length} projects to fork or reference:`,
        "",
      ];

      for (const repo of top) {
        const score = scoreRepo(repo, query);
        const grade = scoreBadge(score);
        const stars = repo.stargazers_count;
        const updated = repo.updated_at.slice(0, 10);
        const topics = repo.topics?.slice(0, 8).join(", ") || "—";
        const license = repo.license?.spdx_id ?? "unknown";

        lines.push(`### [${grade}] ${repo.full_name} (*${stars})`);
        lines.push(`${repo.description ?? "No description"}`);
        lines.push(`- Score: ${Math.round(score)}/100 | Updated: ${updated} | License: ${license}`);
        lines.push(`- Topics: ${topics}`);
        lines.push(`- GitHub: ${repo.html_url}`);
        lines.push(`- Fork: \`git clone ${repo.html_url}.git\``);
        lines.push("");
      }

      lines.push("---");
      lines.push("Score: A (70+) = recommended, B (50+) = good, C (30+) = usable, D = risky.");

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    } catch (err) {
      return {
        content: [{
          type: "text" as const,
          text: `Error: ${err instanceof Error ? err.message : String(err)}`,
        }],
      };
    }
  },
);

/* ═══════════════════════════════════════════════════
   Tool 7: PLAN (ГЛАВНЫЙ ИНСТРУМЕНТ)
   Один запрос → полный готовый план.
   Объединяет: catalog + discover + skills + projects.
   IDE-агент получает roadmap и работает автономно.
   ═══════════════════════════════════════════════════ */

server.registerTool(
  "skillpilot_plan",
  {
    title: "SkillPilot — Full Project Plan (one request → complete roadmap)",
    description:
      "THE MAIN TOOL. Describe what you want to build → get a complete plan with everything needed:\n" +
      "- MCP servers to install (from 59-agent catalog + 37K on GitHub)\n" +
      "- AI Skills to apply (universal prompts, IDE-specific, domain expert)\n" +
      "- Open source projects to reference or fork\n" +
      "- Step-by-step roadmap for the IDE agent\n" +
      "- All API keys needed with links where to get them\n\n" +
      "IMPORTANT: After calling this tool, you MUST present the full plan to the user and ask for approval BEFORE starting any implementation.\n" +
      "Examples: 'SaaS for invoice management', 'poker game with multiplayer', " +
      "'veterinary clinic app', 'AI chatbot for customer support', 'portfolio website'.",
    inputSchema: z.object({
      description: z
        .string()
        .describe(
          "Project description in any language, 1-3 sentences. What are you building? " +
          "Example: 'veterinary clinic website with online booking, payments, user portal'",
        ),
      categories: z
        .array(z.string())
        .optional()
        .describe(
          "RECOMMENDED: Explicitly select which agent categories this project needs. " +
          "YOU (the LLM) should analyze the user's request and pick the right categories. " +
          "This is much more reliable than keyword matching. " +
          "Available: auth, payments, database, ai, email, deploy, review, security, " +
          "video, storage, analytics, monitoring, cms, search, cache, notifications, " +
          "testing, communication, project-management, documents, browser, marketing, design, docs. " +
          "Always include: review, security, docs. " +
          "Example for vet clinic: ['auth', 'payments', 'database', 'marketing', 'design', 'deploy', 'review', 'security', 'docs']",
        ),
      techStack: z
        .string()
        .optional()
        .describe(
          "Preferred tech stack. Example: 'nextjs typescript tailwind'. " +
          "Omit for auto-detection based on project type.",
        ),
      ide: z
        .enum(["claude", "cursor", "windsurf", "codex", "gemini", "cline", "other"])
        .optional()
        .default("claude")
        .describe("Your IDE — affects which skill formats to recommend. Default: claude."),
      mode: z
        .enum(["standard", "battle"])
        .optional()
        .default("standard")
        .describe(
          "Plan generation mode.\n" +
          "- 'standard': one recommended plan (default)\n" +
          "- 'battle': generates 3 competing strategies (Speed, Scale, Budget). " +
          "YOU (the LLM) must then evaluate each strategy, find weaknesses, pick the winner, " +
          "and implement the winning plan. This produces higher quality results through adversarial evaluation.",
        ),
    }),
  },
  async ({ description, categories, techStack, ide, mode }) => {
    const userIde = ide ?? "claude";
    const stack = techStack ?? "";
    const planMode = mode ?? "standard";

    // ═══ PHASE 1: Определяем нужные категории ═══
    // 1) LLM передала categories → используем их (+ always_include).
    // 2) Fallback: keyword matching по описанию.
    // 3) Всегда: обогащаем из techStack (redis → cache, postgres → database, etc.)
    let matchedCategories: string[];
    if (categories && categories.length > 0) {
      const cats = new Set<string>(categories.map((c) => c.toLowerCase().trim()));
      for (const always of ALWAYS_INCLUDE) cats.add(always);
      matchedCategories = Array.from(cats);
    } else {
      matchedCategories = matchCategories(description);
    }

    // Обогащение из techStack — автоматически добавляем категории по технологиям
    if (stack) {
      const stackLower = stack.toLowerCase();
      const STACK_TO_CATEGORIES: Record<string, string[]> = {
        redis: ["cache"],
        upstash: ["cache"],
        clickhouse: ["database", "analytics"],
        elasticsearch: ["search"],
        typesense: ["search"],
        algolia: ["search"],
        meilisearch: ["search"],
        stripe: ["payments"],
        sentry: ["monitoring"],
        grafana: ["monitoring"],
        datadog: ["monitoring"],
        posthog: ["analytics"],
        mixpanel: ["analytics"],
        resend: ["email"],
        sendgrid: ["email"],
        mux: ["video"],
        cloudinary: ["video", "storage"],
        s3: ["storage"],
        r2: ["storage"],
        playwright: ["testing"],
        cypress: ["testing"],
        docker: ["deploy"],
        kubernetes: ["deploy"],
        sanity: ["cms"],
        contentful: ["cms"],
        strapi: ["cms"],
        novu: ["notifications"],
        twilio: ["notifications"],
        slack: ["communication"],
        discord: ["communication"],
        python: ["ai"],
        fastapi: ["ai"],
        pytorch: ["ai"],
        tensorflow: ["ai"],
        sklearn: ["ai"],
        pandas: ["ai"],
      };

      const enriched = new Set(matchedCategories);
      for (const [tech, cats] of Object.entries(STACK_TO_CATEGORIES)) {
        if (stackLower.includes(tech)) {
          for (const cat of cats) enriched.add(cat);
        }
      }
      matchedCategories = Array.from(enriched);
    }

    // Собираем рекомендованных агентов из каталога
    const catalogAgents: { category: SkillCategory; agent: SkillAlternative; alternatives: SkillAlternative[] }[] = [];
    const allEnvVars: { name: string; description: string; getUrl: string; agent: string }[] = [];

    for (const catId of matchedCategories) {
      const category = findCategory(catId);
      if (!category) continue;

      const recommended = getRecommended(category);
      const alternatives = category.alternatives.filter((a) => a.id !== recommended.id);
      catalogAgents.push({ category, agent: recommended, alternatives });

      for (const envVar of recommended.requiredEnvVars) {
        allEnvVars.push({
          name: envVar.name,
          description: envVar.description,
          getUrl: envVar.getUrl,
          agent: recommended.name,
        });
      }
    }

    // ═══ PHASE 2: Ищем дополнительные MCP на GitHub ═══
    // Извлекаем ключевые слова из описания для поиска
    const keywords = description
      .toLowerCase()
      .replace(/[^a-z0-9а-яё\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !["the", "and", "for", "with", "that", "this", "from", "want", "need", "build", "create", "make"].includes(w))
      .slice(0, 5);

    const discoveredMcps: GitHubRepo[] = [];
    const discoveredSkills: GitHubRepo[] = [];
    const discoveredProjects: GitHubRepo[] = [];

    // Берём только 1-2 самых значимых слова для поиска
    const coreKeyword = keywords[0] ?? "app";
    const secondKeyword = keywords[1] ?? "";

    // ── Параллельный поиск: MCP + Skills (по категориям!) + Projects ──
    // Skills ищем по КАЖДОЙ категории отдельно — это даёт релевантные результаты.
    // Например для покерного проекта: "database best practices", "auth rules", "analytics guide"

    // Skills: ищем по нескольким стратегиям параллельно
    const stackFirst = (stack || "nextjs").split(/\s+/)[0];
    const skillSearches = [
      // 1. Cursorrules / IDE rules по стеку — самое ценное для IDE
      searchGitHub(`${stackFirst} cursorrules`, 5)
        .catch(() => ({ items: [] as GitHubRepo[], total: 0 })),
      // 2. По домену проекта
      searchGitHub(`${coreKeyword} ${secondKeyword}`.trim(), 5)
        .catch(() => ({ items: [] as GitHubRepo[], total: 0 })),
      // 3. Awesome-список по домену (кураторские коллекции)
      searchGitHub(`awesome ${coreKeyword}`, 3)
        .catch(() => ({ items: [] as GitHubRepo[], total: 0 })),
      // 4. AI rules / coding guidelines по стеку
      searchGitHub(`${stackFirst} ai rules guidelines`, 5)
        .catch(() => ({ items: [] as GitHubRepo[], total: 0 })),
    ];

    try {
      const [mcpResults, projectResults1, projectResults2, ...skillResultsArray] = await Promise.all([
        // MCP серверы
        searchGitHub(`${coreKeyword} mcp-server`, 5).catch(() => ({ items: [] as GitHubRepo[], total: 0 })),
        // Проекты — стратегия 1: домен + первое слово стека (короткий запрос!)
        searchGitHub(`${coreKeyword} ${(stack || "nextjs").split(/\s+/)[0]}`, 10).catch(() => ({ items: [] as GitHubRepo[], total: 0 })),
        // Проекты — стратегия 2: просто домен (без фильтров)
        searchGitHub(`${coreKeyword} ${secondKeyword}`.trim(), 10).catch(() => ({ items: [] as GitHubRepo[], total: 0 })),
        // Skills
        ...skillSearches,
      ]);

      // Фильтруем MCP
      for (const repo of mcpResults.items) {
        if (isJunkRepo(repo)) continue;
        const name = repo.full_name.toLowerCase();
        const alreadyInCatalog = catalogAgents.some((a) =>
          a.agent.githubUrl.toLowerCase().includes(name) ||
          name.includes(a.agent.id.replace("-mcp", "")),
        );
        if (!alreadyInCatalog && repo.stargazers_count >= 10) {
          discoveredMcps.push(repo);
        }
      }
      discoveredMcps.sort((a, b) => scoreRepo(b, coreKeyword) - scoreRepo(a, coreKeyword));

      // Фильтруем Skills — собираем из всех параллельных запросов
      const seenSkillIds = new Set<string>();
      for (const skillResults of skillResultsArray) {
        for (const repo of skillResults.items) {
          if (seenSkillIds.has(repo.full_name)) continue;
          seenSkillIds.add(repo.full_name);
          if (isJunkRepo(repo)) continue;
          const combined = `${repo.full_name} ${repo.description ?? ""} ${(repo.topics ?? []).join(" ")}`.toLowerCase();
          const isMcp = combined.includes("mcp-server") || combined.includes("mcp_server");
          if (!isMcp && repo.stargazers_count >= 5) {
            discoveredSkills.push(repo);
          }
        }
      }
      discoveredSkills.sort((a, b) => scoreRepo(b, coreKeyword) - scoreRepo(a, coreKeyword));

      // Фильтруем Projects (из обеих стратегий)
      const seenProjectIds = new Set<string>();
      for (const projectResults of [projectResults1, projectResults2]) {
        for (const repo of projectResults.items) {
          if (seenProjectIds.has(repo.full_name)) continue;
          seenProjectIds.add(repo.full_name);
          if (isJunkRepo(repo)) continue;
          const combined = `${repo.full_name} ${repo.description ?? ""}`.toLowerCase();
          const isMcp = combined.includes("mcp-server") || combined.includes("mcp_server");
          const isSkill = combined.includes("skill") || combined.includes("cursorrules") || combined.includes("rules");
          if (!isMcp && !isSkill && repo.stargazers_count >= 10) {
            discoveredProjects.push(repo);
          }
        }
      }
      discoveredProjects.sort((a, b) => scoreRepo(b, coreKeyword) - scoreRepo(a, coreKeyword));
    } catch {
      // GitHub API failed — proceed with catalog only
    }

    // ═══ PHASE 3: Генерируем полный план ═══

    const lines: string[] = [];

    // Context for LLM plan mode
    lines.push("<!-- SkillPilot Plan: use this as your implementation blueprint. -->");
    lines.push("<!-- Install the listed MCP agents, apply skills, and follow the roadmap. -->");
    lines.push("");
    lines.push(`# SkillPilot Project Plan`);
    lines.push("");
    lines.push(`> ${description}`);
    lines.push("");
    if (stack) {
      lines.push(`**Tech Stack:** ${stack}`);
      lines.push("");
    }

    // ─── Section 1: MCP Agents (инструменты) ───
    lines.push("## 1. MCP Agents to Install");
    lines.push("");
    lines.push("These tools will be available as commands in your IDE:");
    lines.push("");

    for (const { category, agent, alternatives } of catalogAgents) {
      const isAuto = ALWAYS_INCLUDE.includes(category.id);
      const autoTag = isAuto ? " (auto-included)" : "";
      lines.push(`### ${agent.command} — ${agent.name}${autoTag}`);
      lines.push(`${agent.description}`);
      lines.push(`- Install: \`${agent.mcpServer.command} ${agent.mcpServer.args?.join(" ") ?? ""}\``);
      if (agent.requiredEnvVars.length > 0) {
        lines.push(`- Keys: ${agent.requiredEnvVars.map((v) => `\`${v.name}\``).join(", ")}`);
      }
      if (alternatives.length > 0) {
        lines.push(`- Alternatives: ${alternatives.map((a) => `${a.name} (${a.pros.split(",")[0]})`).join(", ")}`);
      }
      lines.push("");
    }

    // Дополнительные MCP из GitHub
    if (discoveredMcps.length > 0) {
      lines.push("### Additional MCP servers found on GitHub:");
      lines.push("");
      for (const repo of discoveredMcps.slice(0, 3)) {
        const grade = scoreBadge(scoreRepo(repo, coreKeyword));
        lines.push(`- [${grade}] **${repo.full_name}** (★${repo.stargazers_count}) — ${repo.description?.slice(0, 100) ?? "No description"}`);
        lines.push(`  ${repo.html_url}`);
      }
      lines.push("");
    }

    // ─── Section 2: AI Skills (знания/промпты) ───
    lines.push("## 2. AI Skills (ready-to-use instructions)");
    lines.push("");
    lines.push("Apply these skills during implementation — they save tokens and prevent common mistakes:");
    lines.push("");

    // Curated skills по категориям проекта — один лучший skill на категорию
    const allCuratedSkills = getSkillsForCategories(matchedCategories);
    const seenCats = new Set<string>();
    const selectedSkills: CuratedSkill[] = [];
    for (const skill of allCuratedSkills) {
      if (!seenCats.has(skill.category)) {
        seenCats.add(skill.category);
        selectedSkills.push(skill);
      }
    }

    for (const skill of selectedSkills) {
      lines.push(`### ${skill.name}`);
      lines.push(`*${skill.description}*`);
      lines.push("");
      lines.push(skill.instruction);
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    // GitHub skills — дополнительные ресурсы
    if (discoveredSkills.length > 0) {
      lines.push("### Additional resources from GitHub");
      lines.push("");
      for (const repo of discoveredSkills.slice(0, 5)) {
        const grade = scoreBadge(scoreRepo(repo, coreKeyword));
        lines.push(`- [${grade}] **${repo.full_name}** (★${repo.stargazers_count}) — ${repo.description?.slice(0, 120) ?? ""}`);
        lines.push(`  ${repo.html_url}`);
      }
      lines.push("");
    }

    // ─── Section 3: Reference Projects ───
    lines.push("## 3. Reference Projects (fork or study)");
    lines.push("");

    if (discoveredProjects.length > 0) {
      for (const repo of discoveredProjects.slice(0, 5)) {
        const grade = scoreBadge(scoreRepo(repo, coreKeyword));
        const license = repo.license?.spdx_id ?? "unknown";
        lines.push(`- [${grade}] **${repo.full_name}** (★${repo.stargazers_count}, ${license})`);
        lines.push(`  ${repo.description?.slice(0, 120) ?? "No description"}`);
        lines.push(`  Fork: \`git clone ${repo.html_url}.git\``);
      }
    } else {
      lines.push(`No exact matches found. Search manually:`);
      lines.push(`- \`skillpilot_projects("${coreKeyword} ${stack || "template"}")\``);
      lines.push(`- GitHub: https://github.com/search?q=${encodeURIComponent(coreKeyword + " " + (stack || "template"))}&type=repositories`);
    }
    lines.push("");

    // ─── Section 4: API Keys ───
    if (allEnvVars.length > 0) {
      lines.push("## 4. API Keys Needed");
      lines.push("");
      lines.push("| # | Key | For Agent | Where to get |");
      lines.push("|---|-----|-----------|-------------|");
      const uniqueKeys = new Map<string, typeof allEnvVars[0]>();
      for (const v of allEnvVars) {
        if (!uniqueKeys.has(v.name)) uniqueKeys.set(v.name, v);
      }
      let idx = 1;
      for (const [, v] of uniqueKeys) {
        lines.push(`| ${idx++} | \`${v.name}\` | ${v.agent} | ${v.getUrl} |`);
      }
      lines.push("");
      lines.push("Save all keys in `.env` — the install tool will configure `.mcp.json` automatically.");
      lines.push("");
    }

    // ─── Section 5: Roadmap ───
    lines.push("## 5. Step-by-Step Roadmap");
    lines.push("");
    lines.push("Follow this order. Each step builds on the previous:");
    lines.push("");

    let step = 1;

    // Шаг 1 всегда: setup
    lines.push(`### Step ${step++}: Project Setup`);
    lines.push("- Initialize project with your framework");
    if (stack) lines.push(`- Tech stack: ${stack}`);
    lines.push("- Install MCP agents: `skillpilot_install` with chosen agent IDs");
    lines.push("- Configure API keys via `.env`");
    lines.push("");

    // Шаги по категориям (в правильном порядке)
    const buildOrder = ["marketing", "design", "auth", "database", "ai", "payments", "email", "cms", "search",
      "cache", "notifications", "video", "storage", "communication", "project-management",
      "documents", "browser", "analytics", "monitoring"];

    for (const catId of buildOrder) {
      if (!matchedCategories.includes(catId)) continue;
      if (ALWAYS_INCLUDE.includes(catId)) continue;

      const cat = findCategory(catId);
      if (!cat) continue;
      const agent = getRecommended(cat);

      lines.push(`### Step ${step++}: ${cat.label}`);
      lines.push(`Use \`${agent.command}\` (${agent.name}) to:`);

      // Генерируем конкретные задачи в зависимости от категории
      const tasks = getStepTasks(catId, description);
      for (const task of tasks) {
        lines.push(`- ${task}`);
      }
      lines.push("");
    }

    // Предпоследний шаг: testing
    if (matchedCategories.includes("testing")) {
      lines.push(`### Step ${step++}: Testing`);
      lines.push("- Write E2E tests for critical user flows");
      lines.push("- Test payment flows in Stripe test mode");
      lines.push("- Test auth flows (signup, login, password reset)");
      lines.push("");
    }

    // Всегда: review + security
    lines.push(`### Step ${step++}: Review & Security (mandatory)`);
    lines.push("- `/review` — AI code review for bugs and logic errors");
    lines.push("- `/security` — OWASP scan, dependency vulnerabilities, secret detection");
    lines.push("- Fix all Critical and High issues before deploy");
    lines.push("");

    // Всегда последний: deploy
    if (matchedCategories.includes("deploy") || true) {
      lines.push(`### Step ${step++}: Deploy`);
      lines.push("- Choose deploy target (Vercel, Netlify, Railway, or VPS)");
      lines.push("- Set environment variables in production");
      lines.push("- Deploy and verify all integrations work");
      lines.push("");
    }

    // ═══ BATTLE MODE: wrap everything in adversarial debate structure ═══
    if (planMode === "battle") {
      const battleLines: string[] = [];

      battleLines.push("<!-- SkillPilot BATTLE MODE: You MUST follow the debate protocol below. -->");
      battleLines.push("");
      battleLines.push("# ⚔️ SkillPilot Battle Mode");
      battleLines.push("");
      battleLines.push(`> ${description}`);
      battleLines.push("");
      battleLines.push("## Debate Protocol");
      battleLines.push("");
      battleLines.push("You are now running an **adversarial evaluation**. This produces better results than a single plan.");
      battleLines.push("Follow these steps EXACTLY:");
      battleLines.push("");
      battleLines.push("### Rules");
      battleLines.push("1. Present 3 competing strategies to the user");
      battleLines.push("2. For each strategy: list its strengths AND weaknesses honestly");
      battleLines.push("3. Score each strategy on the criteria below (1-10)");
      battleLines.push("4. Recommend a winner with clear justification");
      battleLines.push("5. Ask user to confirm or pick a different strategy");
      battleLines.push("6. Implement ONLY the winning strategy");
      battleLines.push("");

      // Generate 3 strategies from catalog data
      battleLines.push("---");
      battleLines.push("");
      battleLines.push("## 🏎️ Team SPEED — Ship Fast");
      battleLines.push("*Priority: time-to-market, simplicity, managed services*");
      battleLines.push("");
      battleLines.push("**Philosophy:** Use hosted/managed services for everything. Minimize custom code. Ship in days, not weeks.");
      battleLines.push("");
      battleLines.push("**Stack:**");
      for (const { category, agent } of catalogAgents.slice(0, Math.min(catalogAgents.length, 8))) {
        battleLines.push(`- ${category.label}: **${agent.name}** — ${agent.pros.split(",")[0]}`);
      }
      battleLines.push("");
      battleLines.push("**Strengths:** Fastest to launch, least code to write, managed infrastructure");
      battleLines.push("**Weaknesses:** Vendor lock-in, monthly costs add up, less control");
      battleLines.push("");

      battleLines.push("---");
      battleLines.push("");
      battleLines.push("## 🏗️ Team SCALE — Build to Last");
      battleLines.push("*Priority: scalability, performance, control*");
      battleLines.push("");
      battleLines.push("**Philosophy:** Own your infrastructure. Use open-source alternatives. Design for 10x growth from day one.");
      battleLines.push("");
      battleLines.push("**Stack:**");
      for (const { category, alternatives, agent } of catalogAgents.slice(0, Math.min(catalogAgents.length, 8))) {
        const pick = alternatives.length > 0 ? alternatives[0] : agent;
        battleLines.push(`- ${category.label}: **${pick.name}** — ${pick.pros.split(",")[0]}`);
      }
      battleLines.push("");
      battleLines.push("**Strengths:** No vendor lock-in, lower long-term costs, full control, self-hostable");
      battleLines.push("**Weaknesses:** More setup time, more DevOps needed, steeper learning curve");
      battleLines.push("");

      battleLines.push("---");
      battleLines.push("");
      battleLines.push("## 💰 Team BUDGET — Minimize Cost");
      battleLines.push("*Priority: free tiers, open source, minimal infrastructure*");
      battleLines.push("");
      battleLines.push("**Philosophy:** Use free tiers of everything. Open source where possible. Keep running costs near $0 until revenue.");
      battleLines.push("");
      battleLines.push("**Stack:**");
      for (const { category, alternatives, agent } of catalogAgents.slice(0, Math.min(catalogAgents.length, 8))) {
        // Prefer alternative with "free" or "open" in description, otherwise use recommended
        const freePick = alternatives.find(a =>
          a.pros.toLowerCase().includes("free") ||
          a.pros.toLowerCase().includes("open") ||
          a.pros.toLowerCase().includes("self-host")
        ) ?? agent;
        battleLines.push(`- ${category.label}: **${freePick.name}** — ${freePick.pros.split(",")[0]}`);
      }
      battleLines.push("");
      battleLines.push("**Strengths:** Near-zero costs, no surprise bills, good for MVPs and side projects");
      battleLines.push("**Weaknesses:** Free tier limits, may need migration when scaling, less support");
      battleLines.push("");

      // Scoring criteria
      battleLines.push("---");
      battleLines.push("");
      battleLines.push("## Evaluation Criteria");
      battleLines.push("");
      battleLines.push("Score each team 1-10 on these criteria, then calculate total:");
      battleLines.push("");
      battleLines.push("| Criteria | Weight | Description |");
      battleLines.push("|----------|--------|-------------|");
      battleLines.push("| Time to MVP | 25% | How fast can we ship a working version? |");
      battleLines.push("| Monthly Cost | 20% | Estimated running cost at launch |");
      battleLines.push("| Scalability | 20% | Can it handle 10x-100x growth? |");
      battleLines.push("| Developer Experience | 15% | How easy to develop and debug? |");
      battleLines.push("| Vendor Independence | 10% | How easy to migrate away? |");
      battleLines.push("| Community & Docs | 10% | Quality of docs, community size |");
      battleLines.push("");
      battleLines.push("## Your Task");
      battleLines.push("");
      battleLines.push("**NOW you must:**");
      battleLines.push("1. Fill in the scoring table for all 3 teams");
      battleLines.push("2. Calculate weighted totals");
      battleLines.push("3. Identify the winner and explain WHY");
      battleLines.push("4. List the top risk for the winning strategy and how to mitigate it");
      battleLines.push("5. Present to the user and ask: **\"Which strategy do you prefer? I recommend Team [X] because [reason].\"**");
      battleLines.push("6. After user confirms — implement using the skills and roadmap below");
      battleLines.push("");

      // Append the full plan as reference material
      battleLines.push("---");
      battleLines.push("");
      battleLines.push("## Reference: Full Skills & Roadmap");
      battleLines.push("");
      battleLines.push("Use these for implementation after the winner is chosen:");
      battleLines.push("");
      battleLines.push(...lines.slice(lines.indexOf("## 2. AI Skills (ready-to-use instructions)")));

      return {
        content: [{ type: "text" as const, text: battleLines.join("\n") }],
      };
    }

    // ─── Footer (standard mode) ───
    lines.push("---");
    lines.push(`**Total: ${catalogAgents.length} MCP agents, ${matchedCategories.length} categories, ${allEnvVars.length} API keys needed**`);
    lines.push("");
    lines.push("To install all agents: `skillpilot_install` with IDs:");
    lines.push(`\`[${catalogAgents.map((a) => `"${a.agent.id}"`).join(", ")}]\``);
    lines.push("");
    lines.push("---");
    lines.push("*Plan generated by SkillPilot. Review the agents and roadmap above, then proceed with implementation.*");

    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  },
);

/** Генерирует конкретные задачи для шага roadmap */
function getStepTasks(categoryId: string, description: string): string[] {
  const desc = description.toLowerCase();

  switch (categoryId) {
    case "marketing":
      return [
        "Plan site structure for SEO (pages, URLs, headings hierarchy)",
        "Write meta tags, Open Graph, and schema.org markup",
        "Create conversion-optimized landing page layout (hero, CTA, social proof, pricing)",
        "Write compelling copy: headlines, descriptions, calls-to-action",
        "Set up Google Search Console and sitemap.xml",
      ];
    case "design":
      return [
        "Generate UI components and page layouts from description",
        "Set up design system (colors, typography, spacing)",
        "Create responsive layouts for mobile and desktop",
        "Add animations and micro-interactions",
      ];
    case "auth":
      return [
        "Set up user registration and login pages",
        desc.includes("oauth") || desc.includes("google") ? "Configure OAuth providers (Google, GitHub)" : "Configure email/password authentication",
        "Add protected routes and middleware",
        "Set up user roles if needed (admin, user)",
      ];
    case "database":
      return [
        "Design database schema (tables, relations)",
        "Create initial migration",
        "Set up Row Level Security policies",
        "Create API endpoints for CRUD operations",
      ];
    case "payments":
      return [
        "Set up Stripe products and pricing",
        desc.includes("subscription") ? "Create subscription plans with billing portal" : "Create checkout flow for one-time payments",
        "Add webhook handlers for payment events",
        "Test in Stripe test mode before going live",
      ];
    case "ai":
      return [
        "Set up AI model connection (API key, model selection)",
        "Create chat/completion API routes",
        "Add streaming responses for real-time output",
        "Implement context management and token limits",
      ];
    case "email":
      return [
        "Set up transactional email templates",
        "Configure email sending for key events (welcome, reset, notifications)",
        "Add email verification flow",
      ];
    case "cms":
      return [
        "Set up content schema (types, fields)",
        "Create content management interface",
        "Connect CMS to frontend pages",
      ];
    case "search":
      return [
        "Index content for full-text search",
        "Add search UI with autocomplete",
        "Configure search relevance and filters",
      ];
    case "analytics":
      return [
        "Set up event tracking for key user actions",
        "Create conversion funnels",
        "Add dashboard for monitoring metrics",
      ];
    case "monitoring":
      return [
        "Set up error tracking and alerting",
        "Add performance monitoring",
        "Configure log aggregation",
      ];
    case "video":
      return [
        "Set up video upload and processing pipeline",
        "Add video player component",
        "Configure transcoding and thumbnails",
      ];
    case "storage":
      return [
        "Set up file upload with drag-and-drop",
        "Configure CDN for asset delivery",
        "Add image optimization",
      ];
    case "cache":
      return [
        "Set up caching for frequently accessed data",
        "Add session storage",
        "Configure cache invalidation",
      ];
    case "notifications":
      return [
        "Set up notification channels (in-app, email, push)",
        "Create notification templates",
        "Add user notification preferences",
      ];
    case "communication":
      return [
        "Set up messaging integration",
        "Configure webhooks for incoming messages",
        "Add notification routing",
      ];
    case "browser":
      return [
        "Set up browser automation scripts",
        "Configure headless mode for production",
        "Add error handling and retry logic",
      ];
    default:
      return [
        `Implement ${categoryId} functionality`,
        "Add tests for critical paths",
      ];
  }
}

/* ═══════════════════════════════════════════════════
   Start
   ═══════════════════════════════════════════════════ */

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
