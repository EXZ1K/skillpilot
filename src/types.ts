/* ── Основные типы SkillForge ────────────────────── */

/** Конфигурация одного MCP-сервера для .mcp.json */
export interface MCPServerConfig {
  command: string;             // "npx" | "uvx" | "node"
  args: string[];
  env?: Record<string, string>; // { "STRIPE_KEY": "${STRIPE_SECRET_KEY}" }
}

/** Переменная окружения, необходимая для работы скилла */
export interface EnvVar {
  name: string;        // STRIPE_SECRET_KEY
  description: string; // "Your Stripe secret key"
  getUrl: string;      // "https://dashboard.stripe.com/apikeys"
  required: boolean;
  testable: boolean;   // Можно ли проверить ключ тестовым API-вызовом
}

/** Один скилл (MCP-сервер) в реестре */
export interface Skill {
  id: string;
  name: string;
  command: string;             // "/auth", "/payments"
  description: string;         // Из GitHub README, человекочитаемое
  mcpServer: MCPServerConfig;
  requiredEnvVars: EnvVar[];
  githubUrl: string;
  stars: number;
  lastUpdated: string;
  source: "github" | "trending";
}

/** Похожий open-source проект с GitHub */
export interface SimilarProject {
  name: string;
  stars: number;
  url: string;
  license: string;
  description: string;
}

/** Итоговый результат — набор скиллов для проекта */
export interface SkillPark {
  projectDescription: string;
  recommendedStack: string;
  skills: Skill[];
  similarProjects: SimilarProject[];
  generatedAt: string;
}

/** Конфиг .skillforge/config.json */
export interface SkillForgeConfig {
  version: string;
  projectDescription: string;
  skills: string[];  // skill IDs
  createdAt: string;
}

/** Формат .mcp.json для Cursor / Claude Code / Windsurf */
export interface McpJsonFile {
  mcpServers: Record<string, {
    command: string;
    args: string[];
    env?: Record<string, string>;
  }>;
}
