/**
 * Team Builder — собирает команду агентов на основе:
 *   1. Описания проекта → определяет нужные роли
 *   2. Бюджета токенов (tier) → определяет размер команды
 *   3. Community skills (antigravity) → вооружает агентов реальными скиллами
 *
 * Алгоритм:
 *   1. matchCategories(description) → категории проекта
 *   2. matchRoles(categories) → подходящие роли (отсортированы по приоритету)
 *   3. Обрезаем до coreAgents из tier
 *   4. Каждому агенту назначаем 2 sub-агентов + community skills
 *   5. Lead Agent получает стратегию координации
 *   6. Runtime: подгружаем полные SKILL.md для каждого скилла
 */

import type {
  Agent,
  AgentTeam,
  LeadAgent,
  SubAgent,
  TeamTier,
  TeamTierConfig,
  Weapon,
} from "../types.js";
import { matchCategories } from "../skills/matcher.js";
import { matchRoles, AGENT_ROLES, WEAPONS, type RoleDef } from "./roles.js";
import { getSkillsForRole, getSkillSource, getActiveSources, type SkillEntry } from "./skills-index.js";
import { fetchSkillsBatch } from "./skill-fetcher.js";

/* ── Tier Configs ──────────────────────────────── */

export const TEAM_TIERS: Record<TeamTier, TeamTierConfig> = {
  squad: {
    id: "squad",
    name: "Squad",
    totalAgents: 8,
    coreAgents: 2,
    estimatedTokens: "~50K tokens",
    description: "Small focused team for a single feature or microservice",
  },
  platoon: {
    id: "platoon",
    name: "Platoon",
    totalAgents: 16,
    coreAgents: 5,
    estimatedTokens: "~120K tokens",
    description: "Mid-size team for a full application with auth, payments, deploy",
  },
  company: {
    id: "company",
    name: "Company",
    totalAgents: 24,
    coreAgents: 7,
    estimatedTokens: "~200K tokens",
    description: "Large team for complex SaaS with AI, analytics, monitoring",
  },
  battalion: {
    id: "battalion",
    name: "Battalion",
    totalAgents: 28,
    coreAgents: 9,
    estimatedTokens: "~300K tokens",
    description: "Full enterprise team covering all aspects of development",
  },
};

/* ── Skill → Weapon converter ──────────────────── */

function skillToWeapon(skill: SkillEntry, content?: string): Weapon {
  const source = getSkillSource(skill);
  return {
    id: `skill-${skill.id}`,
    name: `${skill.name} [${skill.quality}]`,
    type: "skill",
    payload: skill.path,
    description: `${skill.description} (from ${source.name}, ${source.stars}★)`,
    skillContent: content,
  };
}

/* ── Lead Agent Builder ────────────────────────── */

function buildLead(projectDescription: string, agents: Agent[]): LeadAgent {
  const agentList = agents
    .map((a) => `- ${a.role} [priority ${a.priority}]`)
    .join("\n");

  return {
    role: "lead",
    description: "Lead Strategist — coordinates all agents, resolves conflicts, makes final decisions",
    weapons: [
      WEAPONS.archPrompt,
      WEAPONS.github,
      WEAPONS.context7,
    ],
    strategy:
      `## Parallel Swarm Strategy\n\n` +
      `Project: ${projectDescription}\n\n` +
      `### Execution Order\n` +
      `1. ALL agents launch in parallel (swarm mode)\n` +
      `2. Each agent works independently with their sub-agents\n` +
      `3. Lead collects results and resolves integration conflicts\n` +
      `4. Lead produces final merged result\n\n` +
      `### Team Structure\n${agentList}\n\n` +
      `### Conflict Resolution\n` +
      `- If two agents modify the same file → Lead merges based on priority\n` +
      `- If sub-agents disagree → parent agent decides\n` +
      `- If architecture conflict → Lead applies system design principles`,
  };
}

/* ── Agent Builder ─────────────────────────────── */

function buildAgent(
  role: RoleDef,
  communitySkills: Weapon[],
): Agent {
  // Community skills распределяем: первый → агенту, остальные → подагентам
  const [agentSkill, sub1Skill, sub2Skill] = communitySkills;

  const agentWeapons = [...role.primaryWeapons];
  if (agentSkill) agentWeapons.push(agentSkill);

  const sub1Weapons = [...role.subRoles[0].weapons];
  if (sub1Skill) sub1Weapons.push(sub1Skill);

  const sub2Weapons = [...role.subRoles[1].weapons];
  if (sub2Skill) sub2Weapons.push(sub2Skill);

  const subAgents: [SubAgent, SubAgent] = [
    {
      role: role.subRoles[0].role,
      specialization: role.subRoles[0].specialization,
      weapons: sub1Weapons,
      task: `Assist ${role.name}: focus on ${role.subRoles[0].specialization}`,
    },
    {
      role: role.subRoles[1].role,
      specialization: role.subRoles[1].specialization,
      weapons: sub2Weapons,
      task: `Assist ${role.name}: focus on ${role.subRoles[1].specialization}`,
    },
  ];

  return {
    role: role.name,
    description: role.description,
    weapons: agentWeapons,
    subAgents,
    priority: role.priority,
  };
}

/* ── Main: Build Team (async — fetches skills) ─── */

export async function buildTeam(
  projectDescription: string,
  tier: TeamTier,
): Promise<AgentTeam> {
  const tierConfig = TEAM_TIERS[tier];
  const categories = matchCategories(projectDescription);
  const matchedRoles = matchRoles(categories);

  // Берём столько ролей, сколько позволяет tier
  const selectedRoles = matchedRoles.slice(0, tierConfig.coreAgents);

  // Если ролей не хватает — добавляем универсальные
  const fallbackOrder = ["backend", "frontend", "business-analyst", "strategy", "qa", "devops", "reviewer", "performance", "pm", "analytics", "content"];
  const usedIds = new Set(selectedRoles.map((r) => r.id));

  for (const fbId of fallbackOrder) {
    if (selectedRoles.length >= tierConfig.coreAgents) break;
    if (usedIds.has(fbId)) continue;
    const role = matchedRoles.find((r) => r.id === fbId)
      ?? AGENT_ROLES.find((r) => r.id === fbId);
    if (role) {
      selectedRoles.push(role);
      usedIds.add(fbId);
    }
  }

  // Собираем все community skills для выбранных ролей
  const allSkillEntries: SkillEntry[] = [];
  const roleSkillMap = new Map<string, SkillEntry[]>();

  for (const role of selectedRoles) {
    const skills = getSkillsForRole(role.id);
    roleSkillMap.set(role.id, skills);
    allSkillEntries.push(...skills);
  }

  // Runtime fetch: подгружаем полные SKILL.md параллельно
  const skillContents = await fetchSkillsBatch(allSkillEntries);

  // Строим агентов с community skills как оружием
  const agents = selectedRoles.map((role) => {
    const skills = roleSkillMap.get(role.id) ?? [];
    const communityWeapons = skills.map((s) =>
      skillToWeapon(s, skillContents.get(s.id)),
    );
    return buildAgent(role, communityWeapons);
  });

  // Строим Lead
  const lead = buildLead(projectDescription, agents);

  // Итог: 1 lead + agents + (agents × 2 subs)
  const totalCount = 1 + agents.length + agents.length * 2;

  return {
    projectDescription,
    tier: tierConfig,
    lead,
    agents,
    totalCount,
    generatedAt: new Date().toISOString(),
  };
}

/* ── Estimate (синхронный, без fetch) ──────────── */

export function estimateTeam(projectDescription: string): {
  categories: string[];
  matchedRoles: string[];
  tiers: TeamTierConfig[];
  /** Preview: какие community skills получит каждая роль */
  roleSkills: { role: string; skills: string[] }[];
} {
  const categories = matchCategories(projectDescription);
  const roles = matchRoles(categories);

  const roleSkills = roles.map((r) => ({
    role: r.name,
    skills: getSkillsForRole(r.id).map((s) => {
      const source = getSkillSource(s);
      return `[${s.quality}] ${s.name} — ${s.description.slice(0, 60)} (${source.name})`;
    }),
  }));

  return {
    categories,
    matchedRoles: roles.map((r) => `${r.name} (${r.categories.join(", ")})`),
    tiers: Object.values(TEAM_TIERS),
    roleSkills,
  };
}

/* ── Format Team (для вывода в MCP) ────────────── */

export function formatTeam(team: AgentTeam): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Agent Team: ${team.projectDescription}`);
  lines.push("");
  lines.push(`**Tier:** ${team.tier.name} | **Agents:** ${team.totalCount} | **Budget:** ${team.tier.estimatedTokens}`);
  lines.push(`**Mode:** Parallel Swarm — all agents work simultaneously`);

  // Source attribution
  const sources = getActiveSources();
  const sourceList = sources.map((s) => `[${s.name}](https://github.com/${s.repo}) (${s.stars}★)`).join(" · ");
  lines.push(`**Skill Sources:** ${sourceList}`);
  lines.push("");

  // Lead
  lines.push("---");
  lines.push(`## Lead: ${team.lead.description}`);
  lines.push(`**Weapons:** ${formatWeapons(team.lead.weapons)}`);
  lines.push("");
  lines.push(team.lead.strategy);
  lines.push("");

  // Agents
  lines.push("---");
  lines.push("## Team Agents");
  lines.push("");

  for (let i = 0; i < team.agents.length; i++) {
    const agent = team.agents[i];
    lines.push(`### ${i + 1}. ${agent.role} [P${agent.priority}]`);
    lines.push(`${agent.description}`);
    lines.push(`**Weapons:** ${formatWeapons(agent.weapons)}`);
    lines.push("");

    // Show skill content if loaded
    const skillWeapons = agent.weapons.filter((w) => w.type === "skill");
    if (skillWeapons.length > 0) {
      lines.push(`<details><summary>Community Skills (${skillWeapons.length})</summary>`);
      lines.push("");
      for (const sw of skillWeapons) {
        lines.push(`#### ${sw.name}`);
        if (sw.skillContent) {
          // Truncate to first 500 chars for readability
          const preview = sw.skillContent.length > 500
            ? sw.skillContent.slice(0, 500) + "\n\n*... [truncated — full skill loaded]*"
            : sw.skillContent;
          lines.push(preview);
        } else {
          lines.push(`*${sw.description}*`);
        }
        lines.push("");
      }
      lines.push("</details>");
      lines.push("");
    }

    for (let j = 0; j < agent.subAgents.length; j++) {
      const sub = agent.subAgents[j];
      lines.push(`  **${i + 1}.${j + 1} ${sub.role}** — ${sub.specialization}`);
      lines.push(`  Weapons: ${formatWeapons(sub.weapons)}`);
      lines.push(`  Task: ${sub.task}`);
      lines.push("");
    }
  }

  // Weapon Summary
  const allWeapons = collectAllWeapons(team);
  const mcpWeapons = allWeapons.filter((w) => w.type === "mcp");
  const promptWeapons = allWeapons.filter((w) => w.type === "prompt");
  const skillWeapons = allWeapons.filter((w) => w.type === "skill");

  lines.push("---");
  lines.push("## Weapon Summary");
  lines.push("");
  lines.push(`**MCP Servers (${mcpWeapons.length}):** ${mcpWeapons.map((w) => w.name).join(", ")}`);
  lines.push(`**Expert Prompts (${promptWeapons.length}):** ${promptWeapons.map((w) => w.name).join(", ")}`);
  lines.push(`**Community Skills (${skillWeapons.length}):** ${skillWeapons.map((w) => w.name).join(", ")}`);
  lines.push("");

  // MCP Install hint
  if (mcpWeapons.length > 0) {
    lines.push("## Quick Install");
    lines.push("Add to `.mcp.json`:");
    lines.push("```json");
    const mcpJson: Record<string, { command: string; args: string[] }> = {};
    for (const w of mcpWeapons) {
      const parts = w.payload.split(/\s+/);
      mcpJson[w.id] = { command: parts[0], args: parts.slice(1) };
    }
    lines.push(JSON.stringify({ mcpServers: mcpJson }, null, 2));
    lines.push("```");
  }

  return lines.join("\n");
}

function formatWeapons(weapons: Weapon[]): string {
  return weapons
    .map((w) => {
      const icon = w.type === "mcp" ? "\u{1F52B}" : w.type === "skill" ? "\u{2694}\u{FE0F}" : "\u{1F4DC}";
      return `${icon} ${w.name}`;
    })
    .join(" | ");
}

function collectAllWeapons(team: AgentTeam): Weapon[] {
  const seen = new Set<string>();
  const result: Weapon[] = [];

  function add(weapons: Weapon[]) {
    for (const w of weapons) {
      if (seen.has(w.id)) continue;
      seen.add(w.id);
      result.push(w);
    }
  }

  add(team.lead.weapons);
  for (const agent of team.agents) {
    add(agent.weapons);
    for (const sub of agent.subAgents) {
      add(sub.weapons);
    }
  }

  return result;
}
