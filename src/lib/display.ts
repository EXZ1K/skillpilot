/**
 * Display — форматированный вывод в терминал.
 *
 * Использует chalk для цветов и ora для спиннеров.
 * Весь пользовательский вывод проходит через этот модуль.
 */

import chalk from "chalk";
import ora, { type Ora } from "ora";
import type { SkillCategory } from "../skills/registry.js";
import type { SkillAlternative } from "../skills/registry.js";
import type { SimilarProject } from "../types.js";

/* ── Спиннер ─────────────────────────────────────── */

export function spinner(text: string): Ora {
  return ora({ text, spinner: "dots" });
}

/* ── Заголовки ───────────────────────────────────── */

export function printBanner(): void {
  console.log("");
  console.log(chalk.bold.cyan("  SkillForge") + chalk.gray(" — AI Agent Team Builder"));
  console.log(chalk.gray("  Describe your project. Get your agents."));
  console.log("");
}

export function printSeparator(): void {
  console.log(chalk.gray("─".repeat(52)));
}

export function printHeader(text: string): void {
  console.log("");
  console.log(chalk.bold.white(text));
  printSeparator();
}

/* ── Результаты поиска ───────────────────────────── */

export function printRecommendedStack(stack: string): void {
  console.log("");
  console.log(
    chalk.gray("  RECOMMENDED STACK: ") + chalk.bold.white(stack),
  );
}

/**
 * Выводит одну категорию скиллов с альтернативами.
 * Рекомендованный отмечен ▸, остальные — ○
 */
export function printSkillCategory(
  index: number,
  category: SkillCategory,
  chosen: SkillAlternative,
): void {
  const num = chalk.gray(`${index}.`);
  const cmd = chalk.cyan(chosen.command.padEnd(12));
  const name = chalk.bold.white(chosen.name);
  const stars = chosen.stars > 0 ? chalk.yellow(` ★${formatStars(chosen.stars)}`) : "";

  console.log(`  ${num} ${cmd} ${name}${stars}`);
  console.log(chalk.gray(`               "${chosen.description}"`));

  // Показываем альтернативы, если их больше одной
  if (category.alternatives.length > 1) {
    const others = category.alternatives
      .filter((a) => a.id !== chosen.id)
      .map((a) => a.name)
      .join(", ");
    console.log(chalk.gray(`               Also: ${others}`));
  }

  console.log("");
}

/** Показывает детальное сравнение альтернатив для интерактивного выбора */
export function printAlternativesDetail(category: SkillCategory): void {
  console.log("");
  console.log(
    chalk.bold.white(`  ${category.label}`) +
    chalk.gray(` — ${category.description}`),
  );
  console.log("");

  for (const alt of category.alternatives) {
    const marker = alt.recommended
      ? chalk.green("  ▸ ")
      : chalk.gray("  ○ ");

    const rec = alt.recommended ? chalk.green(" (recommended)") : "";
    console.log(marker + chalk.bold.white(alt.name) + rec);
    console.log(chalk.gray(`      "${alt.description}"`));
    console.log(chalk.green(`      + ${alt.pros}`));
    console.log(chalk.red(`      - ${alt.cons}`));
    console.log(chalk.gray(`      Free: ${alt.freeTier}`));

    if (alt.usedBy.length > 0) {
      console.log(chalk.gray(`      Used by: ${alt.usedBy.join(", ")}`));
    }

    console.log("");
  }
}

/* ── Похожие проекты ─────────────────────────────── */

export function printSimilarProjects(projects: SimilarProject[]): void {
  if (projects.length === 0) return;

  console.log(chalk.gray("  SIMILAR OPEN SOURCE PROJECTS:"));

  for (const p of projects) {
    console.log(
      chalk.gray("    ") +
      chalk.yellow(`★${formatStars(p.stars)}`) +
      chalk.white(` ${p.name}`) +
      chalk.gray(` (${p.license})`),
    );
  }

  console.log("");
}

/* ── API Keys ────────────────────────────────────── */

export function printApiKeysNeeded(keyNames: string[]): void {
  if (keyNames.length === 0) return;
  console.log(
    chalk.yellow(`  API SETUP NEEDED: `) + chalk.white(keyNames.join(", ")),
  );
  console.log("");
}

/* ── Итоговый вывод ──────────────────────────────── */

export function printSuccess(files: string[]): void {
  console.log("");
  for (const f of files) {
    console.log(chalk.green(`  ✓ ${f}`));
  }
  console.log("");
}

export function printReady(commands: string[]): void {
  console.log(
    chalk.bold.green("  Ready! ") +
    chalk.white("Your agents in IDE: ") +
    chalk.cyan(commands.join("  ")),
  );
  console.log("");
}

export function printError(msg: string): void {
  console.error(chalk.red(`  ✗ Error: ${msg}`));
}

/* ── Утилиты ─────────────────────────────────────── */

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
