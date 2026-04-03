/**
 * Skill Fetcher — runtime загрузка полных SKILL.md из GitHub.
 *
 * Hybrid-стратегия:
 *   1. Индекс скиллов забандлен в skills-index.ts (мгновенный маппинг)
 *   2. Полные SKILL.md подгружаются здесь по требованию
 *   3. Кеш 24 часа — повторные запросы не бьют по GitHub API
 *   4. Fallback: если GitHub недоступен — description из индекса
 */

import { SKILLS_REPO_BASE, type SkillEntry } from "./skills-index.js";

/* ── Cache (24 hours, in-memory) ───────────────── */

interface CacheEntry {
  content: string;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

/* ── Fetch single SKILL.md ─────────────────────── */

/**
 * Fetches the full SKILL.md content for a skill entry.
 * Returns the markdown body (without YAML frontmatter).
 * Falls back to description if fetch fails.
 */
export async function fetchSkillContent(skill: SkillEntry): Promise<string> {
  const cacheKey = skill.id;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.content;
  }

  try {
    const url = `${SKILLS_REPO_BASE}/${skill.path}/SKILL.md`;
    const res = await fetch(url, {
      headers: { "User-Agent": "skillpilot-mcp/0.2.0" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return fallback(skill);
    }

    const raw = await res.text();

    // Strip YAML frontmatter (--- ... ---)
    const content = stripFrontmatter(raw);

    // Cache it
    cache.set(cacheKey, { content, expires: Date.now() + CACHE_TTL });

    return content;
  } catch {
    return fallback(skill);
  }
}

/**
 * Fetches SKILL.md for multiple skills in parallel.
 * Respects a concurrency limit to avoid hammering GitHub.
 */
export async function fetchSkillsBatch(
  skills: SkillEntry[],
  concurrency = 3,
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Process in batches
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

/* ── Helpers ──────────────────────────────────── */

function stripFrontmatter(markdown: string): string {
  // Match --- at the very start, then content, then ---
  const match = markdown.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return match ? match[1].trim() : markdown.trim();
}

function fallback(skill: SkillEntry): string {
  return `## ${skill.name}\n\n${skill.description}\n\n*Full skill content unavailable — using description as fallback.*`;
}
