/**
 * Skill Fetcher — runtime загрузка скиллов из МНОЖЕСТВА GitHub-источников.
 *
 * Hybrid-стратегия:
 *   1. Индекс забандлен в skills-index.ts (мгновенный маппинг)
 *   2. Полное содержимое подгружается здесь по URL из индекса
 *   3. Кеш 24 часа — повторные запросы не бьют по GitHub API
 *   4. Fallback: если GitHub недоступен — description из индекса
 *
 * Поддерживает форматы: SKILL.md, .cursorrules, .agent.md, .instructions.md, README.md
 */

import { getSkillUrl, type SkillEntry } from "./skills-index.js";

/* ── Cache (24 hours, in-memory) ───────────────── */

interface CacheEntry {
  content: string;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

/* ── Fetch single skill ────────────────────────── */

/**
 * Fetches the full content for a skill entry from its source.
 * Handles different file formats (SKILL.md, .cursorrules, etc.)
 * Falls back to description if fetch fails.
 */
export async function fetchSkillContent(skill: SkillEntry): Promise<string> {
  const cacheKey = `${skill.sourceId}::${skill.id}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.content;
  }

  try {
    const url = getSkillUrl(skill);
    const res = await fetch(url, {
      headers: { "User-Agent": "skillpilot-mcp/0.3.0" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return fallback(skill);
    }

    const raw = await res.text();

    // Process based on file type
    const content = processContent(raw, skill.path);

    // Cache it
    cache.set(cacheKey, { content, expires: Date.now() + CACHE_TTL });

    return content;
  } catch {
    return fallback(skill);
  }
}

/**
 * Fetches skills in parallel with concurrency limit.
 */
export async function fetchSkillsBatch(
  skills: SkillEntry[],
  concurrency = 5,
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (let i = 0; i < skills.length; i += concurrency) {
    const batch = skills.slice(i, i + concurrency);
    const contents = await Promise.all(
      batch.map(async (s) => {
        const content = await fetchSkillContent(s);
        return { id: s.id, content };
      }),
    );
    for (const { id, content } of contents) {
      results.set(id, content);
    }
  }

  return results;
}

/* ── Content Processing ──────────────────────── */

function processContent(raw: string, path: string): string {
  // SKILL.md — strip YAML frontmatter
  if (path.endsWith("SKILL.md")) {
    return stripFrontmatter(raw);
  }

  // .cursorrules — use as-is (plain text prompts)
  if (path.includes(".cursorrules")) {
    return raw.trim();
  }

  // .agent.md / .instructions.md — strip any frontmatter
  if (path.endsWith(".agent.md") || path.endsWith(".instructions.md")) {
    return stripFrontmatter(raw);
  }

  // .md / .mdc — strip frontmatter
  if (path.endsWith(".md") || path.endsWith(".mdc")) {
    return stripFrontmatter(raw);
  }

  // Default: return as-is
  return raw.trim();
}

function stripFrontmatter(markdown: string): string {
  const match = markdown.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return match ? match[1].trim() : markdown.trim();
}

function fallback(skill: SkillEntry): string {
  const qualityBadge = skill.quality === "A" ? "Official" : skill.quality === "B" ? "Verified" : "Community";
  return `## ${skill.name} [${qualityBadge}]\n\n${skill.description}\n\n*Full content unavailable — using description as fallback.*`;
}
