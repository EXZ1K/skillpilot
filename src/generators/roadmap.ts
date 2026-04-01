/**
 * Генератор ROADMAP.md — пошаговый план реализации проекта.
 *
 * Создаёт понятный план даже для нетехнического пользователя.
 * Каждый шаг привязан к конкретному агенту (/auth, /payments...).
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Skill } from "../types.js";

/** Порядок этапов — от фундамента к деталям */
const PHASE_ORDER: Record<string, { phase: number; step: string }> = {
  database: { phase: 1, step: "Настроить базу данных и схему" },
  auth:     { phase: 1, step: "Настроить авторизацию и регистрацию" },
  ai:       { phase: 2, step: "Подключить AI-функциональность" },
  payments: { phase: 2, step: "Подключить платежи и подписки" },
  email:    { phase: 3, step: "Настроить отправку email-уведомлений" },
  review:   { phase: 3, step: "Провести AI-ревью кода" },
  security: { phase: 3, step: "Проверить безопасность (OWASP-скан)" },
  deploy:   { phase: 4, step: "Задеплоить на production" },
};

/**
 * Генерирует ROADMAP.md в директории проекта.
 */
export async function generateRoadmap(
  targetDir: string,
  projectDescription: string,
  skills: Skill[],
): Promise<void> {
  const lines: string[] = [
    `# Roadmap: ${projectDescription}`,
    "",
    `> Сгенерировано SkillPilot. Каждый шаг привязан к агенту — используйте команду в IDE.`,
    "",
  ];

  // Группируем скиллы по фазам
  const phases = groupByPhase(skills);

  for (const [phaseNum, phaseSkills] of phases) {
    lines.push(`## Phase ${phaseNum}: ${getPhaseName(phaseNum)}`);
    lines.push("");

    for (const skill of phaseSkills) {
      const info = PHASE_ORDER[skill.command.replace("/", "")] ?? {
        step: `Настроить ${skill.name}`,
      };
      lines.push(`- [ ] **${info.step}**`);
      lines.push(`  - Агент: \`${skill.command}\` (${skill.name})`);
      lines.push(`  - Описание: ${skill.description}`);

      if (skill.requiredEnvVars.length > 0) {
        const keys = skill.requiredEnvVars.map((e) => e.name).join(", ");
        lines.push(`  - Нужны ключи: ${keys}`);
      }

      lines.push("");
    }
  }

  lines.push("---");
  lines.push("*Отмечайте `[x]` по мере прохождения каждого шага.*");
  lines.push("");

  const roadmapPath = join(targetDir, "ROADMAP.md");
  await writeFile(roadmapPath, lines.join("\n"), "utf-8");
}

function groupByPhase(skills: Skill[]): Map<number, Skill[]> {
  const phases = new Map<number, Skill[]>();

  for (const skill of skills) {
    const key = skill.command.replace("/", "");
    const phaseNum = PHASE_ORDER[key]?.phase ?? 3;

    if (!phases.has(phaseNum)) phases.set(phaseNum, []);
    phases.get(phaseNum)!.push(skill);
  }

  // Сортируем по номеру фазы
  return new Map([...phases.entries()].sort(([a], [b]) => a - b));
}

function getPhaseName(phase: number): string {
  switch (phase) {
    case 1: return "Фундамент (база + авторизация)";
    case 2: return "Бизнес-логика (AI, платежи)";
    case 3: return "Качество (email, ревью, безопасность)";
    case 4: return "Запуск (деплой)";
    default: return "Дополнительно";
  }
}
