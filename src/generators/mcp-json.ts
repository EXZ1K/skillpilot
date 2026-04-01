/**
 * Генератор .mcp.json — файл конфигурации MCP-серверов
 * для Cursor, Claude Code и Windsurf.
 *
 * Формат: { mcpServers: { "name": { command, args, env } } }
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Skill, McpJsonFile, SkillForgeConfig } from "../types.js";

/**
 * Создаёт .skillforge/ директорию со всеми конфигами.
 *
 * Структура:
 *   .skillforge/
 *     config.json     — метаданные проекта
 *   .mcp.json         — конфиг MCP-серверов для IDE
 *   .env.example      — шаблон переменных окружения
 */
export async function generateSkillPark(
  targetDir: string,
  projectDescription: string,
  skills: Skill[],
): Promise<{ files: string[] }> {
  const createdFiles: string[] = [];
  const skillforgeDir = join(targetDir, ".skillforge");

  // Создаём .skillforge/
  await mkdir(skillforgeDir, { recursive: true });

  // 1. .mcp.json — главный файл для IDE
  const mcpJson = buildMcpJson(skills);
  const mcpJsonPath = join(targetDir, ".mcp.json");
  await writeFile(mcpJsonPath, JSON.stringify(mcpJson, null, 2), "utf-8");
  createdFiles.push(".mcp.json");

  // 2. .env.example — шаблон переменных окружения (без реальных ключей!)
  const envExample = buildEnvExample(skills);
  if (envExample.length > 0) {
    const envPath = join(targetDir, ".env.example");
    await writeFile(envPath, envExample, "utf-8");
    createdFiles.push(".env.example");
  }

  // 3. .skillforge/config.json — метаданные
  const config: SkillForgeConfig = {
    version: "0.1.0",
    projectDescription,
    skills: skills.map((s) => s.id),
    createdAt: new Date().toISOString(),
  };
  const configPath = join(skillforgeDir, "config.json");
  await writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
  createdFiles.push(".skillforge/config.json");

  return { files: createdFiles };
}

/** Собирает объект .mcp.json из списка скиллов */
function buildMcpJson(skills: Skill[]): McpJsonFile {
  const mcpServers: McpJsonFile["mcpServers"] = {};

  for (const skill of skills) {
    // Имя сервера — без слэша, только буквы: "/auth" → "auth"
    const serverName = skill.command.replace("/", "");

    mcpServers[serverName] = {
      command: skill.mcpServer.command,
      args: skill.mcpServer.args,
      ...(skill.mcpServer.env && Object.keys(skill.mcpServer.env).length > 0
        ? { env: skill.mcpServer.env }
        : {}),
    };
  }

  return { mcpServers };
}

/**
 * Генерирует .env.example с плейсхолдерами.
 * Никогда не записывает реальные ключи — только шаблон.
 */
function buildEnvExample(skills: Skill[]): string {
  const lines: string[] = [
    "# SkillForge — Environment Variables",
    "# Fill in your API keys below. See .skillforge/config.json for details.",
    "",
  ];

  const seen = new Set<string>();

  for (const skill of skills) {
    for (const envVar of skill.requiredEnvVars) {
      if (seen.has(envVar.name)) continue;
      seen.add(envVar.name);

      lines.push(`# ${envVar.description}`);
      lines.push(`# Get it here: ${envVar.getUrl}`);
      lines.push(`${envVar.name}=`);
      lines.push("");
    }
  }

  // Если нет env-переменных — не создаём файл
  return seen.size > 0 ? lines.join("\n") : "";
}
