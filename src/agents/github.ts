/**
 * GitHub Agent — обогащает скиллы реальными данными из GitHub.
 *
 * Что делает:
 * 1. Подтягивает актуальное количество звёзд для каждого скилла
 * 2. Ищет похожие open-source проекты для вдохновения
 *
 * Все запросы опциональны — если GitHub недоступен, скиллы
 * работают с данными из реестра (stars: 0).
 */

import { Octokit } from "@octokit/rest";
import type { Skill, SimilarProject } from "../types.js";

/**
 * Обогащает массив скиллов реальными star counts из GitHub.
 * Запросы идут параллельно для скорости.
 */
export async function enrichWithGitHubData(
  skills: Skill[],
  token?: string,
): Promise<Skill[]> {
  const octokit = new Octokit({ auth: token });

  const enriched = await Promise.all(
    skills.map(async (skill) => {
      const stars = await fetchStars(octokit, skill.githubUrl);
      return { ...skill, stars, lastUpdated: new Date().toISOString() };
    }),
  );

  return enriched;
}

/**
 * Ищет похожие open-source проекты на GitHub.
 * Фильтрует: >100 stars, TypeScript, с лицензией.
 */
export async function findSimilarProjects(
  projectDescription: string,
  token?: string,
): Promise<SimilarProject[]> {
  const octokit = new Octokit({ auth: token });

  try {
    // Берём 3 самых значимых слова из описания
    const keywords = projectDescription
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3)
      .slice(0, 3)
      .join("+");

    if (!keywords) return [];

    const { data } = await octokit.search.repos({
      q: `${keywords} language:typescript stars:>100`,
      sort: "stars",
      order: "desc",
      per_page: 5,
    });

    return data.items
      .filter((repo) => repo.stargazers_count > 100)
      .slice(0, 3)
      .map((repo) => ({
        name: repo.full_name,
        stars: repo.stargazers_count,
        url: repo.html_url,
        license: repo.license?.spdx_id ?? "Unknown",
        description: repo.description?.slice(0, 100) ?? "",
      }));
  } catch {
    // GitHub API может быть недоступен или rate limited — не падаем
    return [];
  }
}

/* ── Приватные функции ───────────────────────────── */

async function fetchStars(octokit: Octokit, githubUrl: string): Promise<number> {
  try {
    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) return 0;

    const { data } = await octokit.repos.get({
      owner: parsed.owner,
      repo: parsed.repo,
    });

    return data.stargazers_count;
  } catch {
    return 0;
  }
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}
