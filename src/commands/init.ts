/**
 * Команда `skillforge init` — главный flow продукта.
 *
 * 1. Принимает описание проекта
 * 2. Определяет нужные категории скиллов
 * 3. Показывает агентов с альтернативами на выбор
 * 4. Обогащает данные из GitHub (stars, similar projects)
 * 5. Генерирует .mcp.json, .env.example, ROADMAP.md
 * 6. Запускает API Wizard для настройки ключей
 */

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { resolve } from "node:path";
import chalk from "chalk";

import { matchCategories } from "../skills/matcher.js";
import {
  SKILL_CATEGORIES,
  findCategory,
  getRecommended,
  type SkillAlternative,
  type SkillCategory,
} from "../skills/registry.js";
import { enrichWithGitHubData, findSimilarProjects } from "../agents/github.js";
import { generateSkillPark } from "../generators/mcp-json.js";
import { generateRoadmap } from "../generators/roadmap.js";
import { runApiWizard } from "../lib/api-wizard.js";
import {
  spinner,
  printBanner,
  printHeader,
  printRecommendedStack,
  printSkillCategory,
  printAlternativesDetail,
  printSimilarProjects,
  printApiKeysNeeded,
  printSuccess,
  printReady,
  printError,
  printSeparator,
} from "../lib/display.js";
import type { Skill } from "../types.js";

interface InitOptions {
  dir?: string;
  githubToken?: string;
  yes?: boolean; // Пропустить подтверждения, взять все recommended
}

export async function runInit(
  description: string,
  options: InitOptions,
): Promise<void> {
  const targetDir = resolve(options.dir ?? ".");

  printBanner();

  // ── Шаг 1: Определяем нужные категории ───────────
  const spin = spinner("Analyzing your project...");
  spin.start();

  const categoryIds = matchCategories(description);
  const categories: SkillCategory[] = categoryIds
    .map(findCategory)
    .filter((c): c is SkillCategory => c !== undefined);

  spin.succeed("Project analyzed");

  // ── Шаг 2: Показываем агентов + альтернативы ─────
  printHeader("Your AI Agent Team:");

  // Для каждой категории — выбор агента
  const chosenSkills: Skill[] = [];

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];

    if (options.yes || category.alternatives.length === 1) {
      // Автоматический выбор — берём recommended
      const chosen = getRecommended(category);
      printSkillCategory(i + 1, category, chosen);
      chosenSkills.push(chosen);
    } else {
      // Интерактивный выбор — показываем альтернативы
      const chosen = await askUserChoice(category);
      chosenSkills.push(chosen);
    }
  }

  // Рекомендованный стек
  const stackParts = chosenSkills
    .filter((s) => !["review", "security", "deploy"].includes(s.command.replace("/", "")))
    .map((s) => s.name.replace(" MCP", ""));
  printRecommendedStack(stackParts.join(" + "));

  // ── Шаг 3: Обогащаем данные из GitHub ────────────
  const ghSpin = spinner("Fetching GitHub data...");
  ghSpin.start();

  const [enrichedSkills, similarProjects] = await Promise.all([
    enrichWithGitHubData(chosenSkills, options.githubToken),
    findSimilarProjects(description, options.githubToken),
  ]);

  ghSpin.succeed("GitHub data loaded");

  printSimilarProjects(similarProjects);

  // Список нужных API-ключей
  const allEnvNames = enrichedSkills
    .flatMap((s) => s.requiredEnvVars)
    .filter((v, i, arr) => arr.findIndex((a) => a.name === v.name) === i)
    .map((v) => v.name);
  printApiKeysNeeded(allEnvNames);

  // ── Шаг 4: Подтверждение ─────────────────────────
  if (!options.yes) {
    const rl = createInterface({ input: stdin, output: stdout });
    const answer = await rl.question(
      chalk.cyan("  Install agents + configure APIs? [Y/n] "),
    );
    rl.close();

    if (answer.toLowerCase() === "n") {
      console.log(chalk.gray("  Cancelled."));
      return;
    }
  }

  // ── Шаг 5: Генерируем файлы ──────────────────────
  const genSpin = spinner("Generating skill park...");
  genSpin.start();

  const { files } = await generateSkillPark(targetDir, description, enrichedSkills);
  await generateRoadmap(targetDir, description, enrichedSkills);
  files.push("ROADMAP.md");

  genSpin.succeed("Files generated");

  printSuccess(files);

  // ── Шаг 6: API Wizard ────────────────────────────
  const hasEnvVars = enrichedSkills.some((s) => s.requiredEnvVars.length > 0);

  if (hasEnvVars && !options.yes) {
    await runApiWizard(targetDir, enrichedSkills);
  }

  // ── Готово ────────────────────────────────────────
  printSeparator();
  const commands = enrichedSkills.map((s) => s.command);
  printReady(commands);
}

/**
 * Интерактивный выбор альтернативного скилла.
 * Показывает детальное сравнение и спрашивает номер.
 */
async function askUserChoice(category: SkillCategory): Promise<SkillAlternative> {
  printAlternativesDetail(category);

  const rl = createInterface({ input: stdin, output: stdout });

  const choices = category.alternatives
    .map((a, i) => `${i + 1}`)
    .join("/");

  const defaultIdx = category.alternatives.findIndex((a) => a.recommended);
  const defaultNum = defaultIdx >= 0 ? defaultIdx + 1 : 1;

  const answer = await rl.question(
    chalk.cyan(`  Choose [${choices}] (default: ${defaultNum}): `),
  );
  rl.close();

  const num = parseInt(answer.trim(), 10);

  if (num >= 1 && num <= category.alternatives.length) {
    return category.alternatives[num - 1];
  }

  // По умолчанию — recommended
  return getRecommended(category);
}
