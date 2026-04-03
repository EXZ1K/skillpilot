/* ── Основные типы SkillPilot ────────────────────── */

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

/** Конфиг .skillpilot/config.json */
export interface SkillPilotConfig {
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

/* ── Agent Team System ─────────────────────────── */

/** Оружие агента — MCP-сервер, промпт-инструкция или community-скилл */
export interface Weapon {
  id: string;
  name: string;
  type: "mcp" | "prompt" | "skill";
  /** Для MCP: команда запуска. Для prompt: инструкция. Для skill: путь в репо */
  payload: string;
  /** Краткое описание — что даёт это оружие */
  description: string;
  /** Для skill: полный контент SKILL.md (загружается runtime) */
  skillContent?: string;
}

/** Подагент — помощник основного агента */
export interface SubAgent {
  role: string;
  specialization: string;
  weapons: Weapon[];
  /** Конкретная задача, которую выполняет подагент */
  task: string;
}

/** Агент в команде — имеет роль, оружие и двух подагентов */
export interface Agent {
  role: string;
  /** Человекочитаемое описание: что делает этот агент */
  description: string;
  weapons: Weapon[];
  subAgents: [SubAgent, SubAgent];
  /** Приоритет задач: чем выше, тем раньше запускается (parallel swarm) */
  priority: number;
}

/** Lead Agent — принимает решения и координирует команду */
export interface LeadAgent {
  role: "lead";
  description: string;
  weapons: Weapon[];
  /** Стратегия координации */
  strategy: string;
}

/** Размеры команды */
export type TeamTier = "squad" | "platoon" | "company" | "battalion";

/** Конфигурация тира */
export interface TeamTierConfig {
  id: TeamTier;
  name: string;
  totalAgents: number;
  /** Количество основных агентов (без lead и без sub-agents) */
  coreAgents: number;
  /** Примерный расход токенов */
  estimatedTokens: string;
  /** Описание для пользователя */
  description: string;
}

/** Полная команда агентов */
export interface AgentTeam {
  projectDescription: string;
  tier: TeamTierConfig;
  lead: LeadAgent;
  agents: Agent[];
  /** Общее число агентов: 1 lead + agents + sub-agents */
  totalCount: number;
  generatedAt: string;
}
