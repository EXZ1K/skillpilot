/**
 * Multi-Source Skills Index
 *
 * 7 источников скиллов, ранжированных по качеству:
 *   Tier A — эталонные (Anthropic, GitHub, PatrickJS, steipete)
 *   Tier B — отличные (alirezarezvani, Jeffallan, instructa)
 *   Tier C — массовые (antigravity)
 *
 * Hybrid approach:
 *   - Бандлённый индекс: лучшие скиллы pre-selected по ролям
 *   - Runtime fetch: полное содержимое подгружается с GitHub
 *   - Каждый скилл знает свой source, URL и формат файла
 */

/* ── Types ─────────────────────────────────────── */

export type SkillQuality = "A" | "B" | "C";

export interface SkillSource {
  id: string;
  name: string;
  repo: string;
  stars: string;
  quality: SkillQuality;
  /** Base URL for raw file fetching */
  baseUrl: string;
  /** Total skills in this source */
  totalSkills: number;
}

export interface SkillEntry {
  id: string;
  /** Relative path to fetch (appended to source's baseUrl) */
  path: string;
  name: string;
  description: string;
  category: string;
  /** Which source this skill comes from */
  sourceId: string;
  /** Quality tier inherited from source */
  quality: SkillQuality;
}

/* ── Sources Registry ──────────────────────────── */

export const SKILL_SOURCES: Record<string, SkillSource> = {
  anthropic: {
    id: "anthropic",
    name: "Anthropic Official",
    repo: "anthropics/skills",
    stars: "109K",
    quality: "A",
    baseUrl: "https://raw.githubusercontent.com/anthropics/skills/main",
    totalSkills: 17,
  },
  copilot: {
    id: "copilot",
    name: "GitHub Copilot",
    repo: "github/awesome-copilot",
    stars: "28K",
    quality: "A",
    baseUrl: "https://raw.githubusercontent.com/github/awesome-copilot/main",
    totalSkills: 362,
  },
  cursorrules: {
    id: "cursorrules",
    name: "Awesome CursorRules",
    repo: "PatrickJS/awesome-cursorrules",
    stars: "39K",
    quality: "A",
    baseUrl: "https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main",
    totalSkills: 178,
  },
  steipete: {
    id: "steipete",
    name: "Peter Steinberger Rules",
    repo: "steipete/agent-rules",
    stars: "5.7K",
    quality: "A",
    baseUrl: "https://raw.githubusercontent.com/steipete/agent-rules/main",
    totalSkills: 15,
  },
  alireza: {
    id: "alireza",
    name: "Claude Skills Multi-Platform",
    repo: "alirezarezvani/claude-skills",
    stars: "9K",
    quality: "B",
    baseUrl: "https://raw.githubusercontent.com/alirezarezvani/claude-skills/main",
    totalSkills: 278,
  },
  jeffallan: {
    id: "jeffallan",
    name: "Workflow Skills",
    repo: "Jeffallan/claude-skills",
    stars: "7.6K",
    quality: "B",
    baseUrl: "https://raw.githubusercontent.com/Jeffallan/claude-skills/main",
    totalSkills: 66,
  },
  instructa: {
    id: "instructa",
    name: "Framework Prompts",
    repo: "instructa/ai-prompts",
    stars: "1K",
    quality: "B",
    baseUrl: "https://raw.githubusercontent.com/instructa/ai-prompts/main",
    totalSkills: 97,
  },
  antigravity: {
    id: "antigravity",
    name: "Antigravity Skills",
    repo: "sickn33/antigravity-awesome-skills",
    stars: "30K",
    quality: "C",
    baseUrl: "https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main",
    totalSkills: 1340,
  },
};

/* ── Pre-selected skills per role (multi-source) ── */

/**
 * Лучшие скиллы для каждой роли, отобранные из ВСЕХ источников.
 * Приоритет: Tier A → Tier B → Tier C.
 * Каждая роль получает 5 скиллов (был 3, теперь больше источников).
 */
export const ROLE_SKILLS: Record<string, SkillEntry[]> = {

  backend: [
    // Tier A: Anthropic
    { id: "anthropic-claude-api", path: "skills/claude-api/SKILL.md", name: "Claude API Expert", description: "Official Anthropic skill for building with Claude API — tool use, streaming, prompt caching, batch processing.", category: "api", sourceId: "anthropic", quality: "A" },
    // Tier A: CursorRules
    { id: "cursor-nodejs-express", path: "rules/nodejs-express-cursorrules-prompt-file/.cursorrules", name: "Node.js + Express Rules", description: "Production-ready Node.js/Express patterns: middleware, error handling, validation, async flows.", category: "backend", sourceId: "cursorrules", quality: "A" },
    // Tier B: instructa
    { id: "instructa-hono-node", path: "prompts/hono-node/cursorrules.md", name: "Hono API Framework", description: "Modern Hono framework patterns for fast API servers with TypeScript.", category: "backend", sourceId: "instructa", quality: "B" },
    // Tier B: Jeffallan workflow
    { id: "jeffallan-api-design", path: "commands/project/execution/README.md", name: "API Execution Workflow", description: "Structured workflow for API implementation with validation, testing, and documentation steps.", category: "backend", sourceId: "jeffallan", quality: "B" },
    // Tier C: Antigravity
    { id: "ag-api-design-principles", path: "skills/api-design-principles/SKILL.md", name: "API Design Principles", description: "Master REST and GraphQL API design principles to build intuitive, scalable, and maintainable APIs.", category: "backend", sourceId: "antigravity", quality: "C" },
  ],

  auth: [
    // Tier A: CursorRules
    { id: "cursor-auth-supabase", path: "rules/supabase-cursorrules-prompt-file/.cursorrules", name: "Supabase Auth Rules", description: "Supabase auth patterns: RLS policies, JWT handling, OAuth providers, session management.", category: "auth", sourceId: "cursorrules", quality: "A" },
    // Tier A: steipete
    { id: "steipete-security", path: "global-rules/security.md", name: "Security Rules (Steinberger)", description: "Battle-tested security rules from a top practitioner: input validation, secrets handling, auth flows.", category: "security", sourceId: "steipete", quality: "A" },
    // Tier B: instructa
    { id: "instructa-better-auth", path: "prompts/better-auth-react/cursorrules.md", name: "Auth + React Patterns", description: "Authentication patterns with React: protected routes, session management, OAuth flows.", category: "auth", sourceId: "instructa", quality: "B" },
    // Tier B: alireza
    { id: "alireza-security-audit", path: ".claude/commands/security-audit.md", name: "Security Audit", description: "Comprehensive security audit methodology: OWASP top 10, dependency scanning, secret detection.", category: "security", sourceId: "alireza", quality: "B" },
    // Tier C: Antigravity
    { id: "ag-007", path: "skills/007/SKILL.md", name: "Security Auditor 007", description: "Threat modeling (STRIDE/PASTA), Red/Blue Team, OWASP checks, code review, incident response.", category: "security", sourceId: "antigravity", quality: "C" },
  ],

  frontend: [
    // Tier A: Anthropic
    { id: "anthropic-frontend-design", path: "skills/frontend-design/SKILL.md", name: "Frontend Design (Anthropic)", description: "Official Anthropic skill for creating production-grade, distinctive frontend interfaces.", category: "design", sourceId: "anthropic", quality: "A" },
    // Tier A: CursorRules
    { id: "cursor-nextjs-react", path: "rules/nextjs-react-tailwind-cursorrules-prompt-file/.cursorrules", name: "Next.js + React + Tailwind", description: "Next.js App Router, React Server Components, Tailwind CSS best practices.", category: "frontend", sourceId: "cursorrules", quality: "A" },
    // Tier A: steipete
    { id: "steipete-coding", path: "global-rules/coding.md", name: "Coding Rules (Steinberger)", description: "Opinionated coding rules: naming, structure, error handling refined through daily heavy use.", category: "code-quality", sourceId: "steipete", quality: "A" },
    // Tier B: instructa
    { id: "instructa-shadcn-nextjs", path: "prompts/shadcn-nextjs/cursorrules.md", name: "shadcn/ui + Next.js", description: "Component patterns with shadcn/ui: theming, composition, accessibility, responsive design.", category: "frontend", sourceId: "instructa", quality: "B" },
    // Tier C: Antigravity
    { id: "ag-wcag-audit", path: "skills/wcag-audit-patterns/SKILL.md", name: "WCAG Audit Patterns", description: "Comprehensive guide to auditing web content against WCAG 2.2 with actionable fix patterns.", category: "design", sourceId: "antigravity", quality: "C" },
  ],

  payments: [
    // Tier A: Copilot
    { id: "copilot-stripe-agent", path: "agents/stripe-integration.agent.md", name: "Stripe Integration Agent", description: "GitHub Copilot agent for Stripe: checkout, subscriptions, webhooks, refunds, PCI compliance.", category: "payments", sourceId: "copilot", quality: "A" },
    // Tier A: CursorRules
    { id: "cursor-stripe", path: "rules/stripe-cursorrules-prompt-file/.cursorrules", name: "Stripe Rules", description: "Stripe integration patterns: payment intents, webhook verification, idempotency, error handling.", category: "payments", sourceId: "cursorrules", quality: "A" },
    // Tier B: alireza
    { id: "alireza-fintech", path: ".claude/commands/fintech-compliance.md", name: "Fintech Compliance", description: "Financial compliance patterns: PCI DSS, SOX, KYC/AML requirements for payment systems.", category: "payments", sourceId: "alireza", quality: "B" },
    // Tier C: Antigravity
    { id: "ag-billing-automation", path: "skills/billing-automation/SKILL.md", name: "Billing Automation", description: "Automated billing systems: recurring billing, invoice generation, payment processing.", category: "business", sourceId: "antigravity", quality: "C" },
    // Tier C: Antigravity
    { id: "ag-payments-stack", path: "skills/pakistan-payments-stack/SKILL.md", name: "Payments Stack", description: "Production-grade payment integrations with error handling and reconciliation.", category: "api-integration", sourceId: "antigravity", quality: "C" },
  ],

  ai: [
    // Tier A: Anthropic
    { id: "anthropic-mcp-builder", path: "skills/mcp-builder/SKILL.md", name: "MCP Builder (Anthropic)", description: "Official skill for building MCP servers — tools, resources, prompts, transport layers.", category: "ai", sourceId: "anthropic", quality: "A" },
    // Tier A: Copilot
    { id: "copilot-ai-agent", path: "agents/ai-ml-engineer.agent.md", name: "AI/ML Engineer Agent", description: "GitHub Copilot agent for AI/ML: model selection, fine-tuning, RAG pipelines, evaluation.", category: "ai", sourceId: "copilot", quality: "A" },
    // Tier B: alireza
    { id: "alireza-prompt-eng", path: ".claude/commands/prompt-engineering.md", name: "Prompt Engineering", description: "Advanced prompt engineering: chain-of-thought, few-shot, structured output, evaluation frameworks.", category: "ai", sourceId: "alireza", quality: "B" },
    // Tier C: Antigravity
    { id: "ag-ai-toolkit", path: "skills/ai-engineering-toolkit/SKILL.md", name: "AI Engineering Toolkit", description: "6 production-ready AI workflows: prompt evaluation, RAG pipeline, fine-tuning, agent orchestration.", category: "data-ai", sourceId: "antigravity", quality: "C" },
    // Tier C: Antigravity
    { id: "ag-prompt-engineer", path: "skills/prompt-engineer/SKILL.md", name: "Prompt Engineer", description: "Transforms prompts into optimized versions using frameworks (RTF, RISEN, Chain-of-Thought).", category: "automation", sourceId: "antigravity", quality: "C" },
  ],

  email: [
    // Tier A: Copilot
    { id: "copilot-email-agent", path: "agents/email-automation.agent.md", name: "Email Automation Agent", description: "GitHub Copilot agent for email: templates, transactional emails, campaign flows, deliverability.", category: "email", sourceId: "copilot", quality: "A" },
    // Tier B: alireza
    { id: "alireza-notifications", path: ".claude/commands/notification-system.md", name: "Notification System", description: "Multi-channel notification architecture: email, push, SMS, in-app with templates and preferences.", category: "notifications", sourceId: "alireza", quality: "B" },
    // Tier C: Antigravity
    { id: "ag-klaviyo", path: "skills/klaviyo-automation/SKILL.md", name: "Email Campaigns", description: "Email/SMS campaign automation: flows, lists, A/B tests, segmentation.", category: "marketing", sourceId: "antigravity", quality: "C" },
    // Tier C: Antigravity
    { id: "ag-agentmail", path: "skills/agentmail/SKILL.md", name: "Agent Email", description: "Email infrastructure for AI agents. Create accounts, send/receive emails, manage threads.", category: "ai-ml", sourceId: "antigravity", quality: "C" },
    // Tier C: Antigravity
    { id: "ag-marketing-ideas", path: "skills/marketing-ideas/SKILL.md", name: "Marketing Strategies", description: "Proven marketing strategies and growth ideas for SaaS and software products.", category: "marketing", sourceId: "antigravity", quality: "C" },
  ],

  qa: [
    // Tier A: Anthropic
    { id: "anthropic-webapp-testing", path: "skills/webapp-testing/SKILL.md", name: "Webapp Testing (Anthropic)", description: "Official Anthropic skill for comprehensive web application testing with Playwright.", category: "testing", sourceId: "anthropic", quality: "A" },
    // Tier A: Copilot
    { id: "copilot-test-agent", path: "agents/test-engineer.agent.md", name: "Test Engineer Agent", description: "GitHub Copilot agent for testing: unit, integration, E2E strategies, coverage analysis, TDD.", category: "testing", sourceId: "copilot", quality: "A" },
    // Tier B: Jeffallan
    { id: "jeffallan-qa", path: "commands/project/execution/README.md", name: "QA Workflow", description: "Structured QA workflow: acceptance criteria, test plans, regression testing, bug triage.", category: "testing", sourceId: "jeffallan", quality: "B" },
    // Tier C: Antigravity
    { id: "ag-e2e-testing", path: "skills/e2e-testing/SKILL.md", name: "E2E Testing", description: "End-to-end testing with Playwright: browser automation, visual regression, CI integration.", category: "testing", sourceId: "antigravity", quality: "C" },
    // Tier C: Antigravity
    { id: "ag-test-engineer", path: "skills/test-engineer/SKILL.md", name: "Test Engineer", description: "Comprehensive testing strategies: unit, integration, E2E, performance. TDD/BDD methodologies.", category: "testing", sourceId: "antigravity", quality: "C" },
  ],

  reviewer: [
    // Tier A: steipete
    { id: "steipete-review", path: "global-rules/coding.md", name: "Code Review (Steinberger)", description: "Expert code review methodology from a veteran practitioner: correctness, clarity, performance.", category: "review", sourceId: "steipete", quality: "A" },
    // Tier A: Copilot
    { id: "copilot-reviewer", path: "agents/code-reviewer.agent.md", name: "Code Reviewer Agent", description: "GitHub Copilot agent for code review: bugs, security, performance, style, maintainability.", category: "review", sourceId: "copilot", quality: "A" },
    // Tier B: Jeffallan
    { id: "jeffallan-review", path: "commands/common-ground/README.md", name: "Review Standards", description: "Shared review standards: coding conventions, PR templates, merge criteria.", category: "review", sourceId: "jeffallan", quality: "B" },
    // Tier C: Antigravity
    { id: "ag-code-review", path: "skills/code-review/SKILL.md", name: "Code Review Expert", description: "Thorough code review: correctness, edge cases, security, performance, maintainability.", category: "code-quality", sourceId: "antigravity", quality: "C" },
    // Tier C: Antigravity
    { id: "ag-clean-code", path: "skills/clean-code/SKILL.md", name: "Clean Code", description: "Clean code principles: meaningful names, small functions, SOLID, DRY, proper error handling.", category: "code-quality", sourceId: "antigravity", quality: "C" },
  ],

  performance: [
    // Tier A: Copilot
    { id: "copilot-perf-agent", path: "agents/performance-engineer.agent.md", name: "Performance Agent", description: "GitHub Copilot agent for performance: profiling, caching, query optimization, Core Web Vitals.", category: "performance", sourceId: "copilot", quality: "A" },
    // Tier A: CursorRules
    { id: "cursor-performance", path: "rules/performance-optimization-cursorrules-prompt-file/.cursorrules", name: "Performance Rules", description: "Performance optimization patterns: lazy loading, code splitting, caching, database indexing.", category: "performance", sourceId: "cursorrules", quality: "A" },
    // Tier C: Antigravity
    { id: "ag-devops-troubleshooter", path: "skills/devops-troubleshooter/SKILL.md", name: "DevOps Troubleshooter", description: "Rapid incident response, advanced debugging, and performance analysis.", category: "devops", sourceId: "antigravity", quality: "C" },
    // Tier C: Antigravity
    { id: "ag-cost-optimizer", path: "skills/aws-cost-optimizer/SKILL.md", name: "Cost Optimizer", description: "Cost analysis and optimization recommendations for cloud infrastructure.", category: "cloud", sourceId: "antigravity", quality: "C" },
    // Tier C: Antigravity
    { id: "ag-config-validate", path: "skills/deployment-validation-config-validate/SKILL.md", name: "Config Validator", description: "Validating, testing, and securing deployment configurations.", category: "devops", sourceId: "antigravity", quality: "C" },
  ],

  devops: [
    // Tier A: Copilot
    { id: "copilot-devops-agent", path: "agents/devops-engineer.agent.md", name: "DevOps Agent", description: "GitHub Copilot agent for DevOps: CI/CD, containers, infrastructure as code, monitoring.", category: "devops", sourceId: "copilot", quality: "A" },
    // Tier A: CursorRules
    { id: "cursor-docker", path: "rules/docker-cursorrules-prompt-file/.cursorrules", name: "Docker Rules", description: "Docker best practices: multi-stage builds, security scanning, compose patterns, health checks.", category: "devops", sourceId: "cursorrules", quality: "A" },
    // Tier B: instructa
    { id: "instructa-vercel", path: "prompts/vercel-ai-nextjs/cursorrules.md", name: "Vercel Deployment", description: "Vercel deployment patterns: serverless functions, edge runtime, environment configuration.", category: "deploy", sourceId: "instructa", quality: "B" },
    // Tier C: Antigravity
    { id: "ag-deployment-engineer", path: "skills/deployment-engineer/SKILL.md", name: "Deployment Engineer", description: "Modern CI/CD pipelines, GitOps workflows, blue-green deployments, infrastructure as code.", category: "devops", sourceId: "antigravity", quality: "C" },
    // Tier C: Antigravity
    { id: "ag-pipeline-design", path: "skills/deployment-pipeline-design/SKILL.md", name: "Pipeline Architect", description: "Multi-stage CI/CD pipelines with approval gates and deployment strategies.", category: "devops", sourceId: "antigravity", quality: "C" },
  ],

  analytics: [
    // Tier A: Copilot
    { id: "copilot-data-agent", path: "agents/data-analyst.agent.md", name: "Data Analyst Agent", description: "GitHub Copilot agent for analytics: dashboards, metrics, funnels, cohort analysis, reporting.", category: "analytics", sourceId: "copilot", quality: "A" },
    // Tier B: alireza
    { id: "alireza-analytics", path: ".claude/commands/analytics-setup.md", name: "Analytics Architecture", description: "Analytics system design: event taxonomy, data pipelines, dashboards, privacy compliance.", category: "analytics", sourceId: "alireza", quality: "B" },
    // Tier C: Antigravity
    { id: "ag-analytics-tracking", path: "skills/analytics-tracking/SKILL.md", name: "Analytics Tracking", description: "Design and improve analytics tracking systems that produce reliable, decision-quality data.", category: "data", sourceId: "antigravity", quality: "C" },
    // Tier C: Antigravity
    { id: "ag-ab-test", path: "skills/ab-test-setup/SKILL.md", name: "A/B Test Setup", description: "Structured A/B tests with mandatory gates for hypothesis, metrics, and sample size.", category: "marketing", sourceId: "antigravity", quality: "C" },
    // Tier C: Antigravity
    { id: "ag-dbt", path: "skills/dbt-transformation-patterns/SKILL.md", name: "Data Transformations", description: "Production-ready dbt patterns: model organization, testing, incremental processing.", category: "data", sourceId: "antigravity", quality: "C" },
  ],

  content: [
    // Tier A: Anthropic
    { id: "anthropic-doc-coauthoring", path: "skills/doc-coauthoring/SKILL.md", name: "Doc Co-Authoring (Anthropic)", description: "Official Anthropic skill for collaborative document writing and editing.", category: "content", sourceId: "anthropic", quality: "A" },
    // Tier A: Copilot
    { id: "copilot-content-agent", path: "agents/technical-writer.agent.md", name: "Technical Writer Agent", description: "GitHub Copilot agent for content: documentation, blog posts, API docs, changelogs.", category: "content", sourceId: "copilot", quality: "A" },
    // Tier C: Antigravity
    { id: "ag-content-strategy", path: "skills/content-strategy/SKILL.md", name: "Content Strategy", description: "Content planning, editorial calendars, SEO optimization, multi-channel distribution.", category: "content", sourceId: "antigravity", quality: "C" },
    // Tier C: Antigravity
    { id: "ag-growth-engine", path: "skills/growth-engine/SKILL.md", name: "Growth Engine", description: "Growth hacking, SEO, ASO, viral loops, conversion optimization.", category: "marketing", sourceId: "antigravity", quality: "C" },
    // Tier C: Antigravity
    { id: "ag-marketing", path: "skills/marketing-ideas/SKILL.md", name: "Marketing Ideas", description: "Proven marketing strategies and growth ideas for SaaS products.", category: "marketing", sourceId: "antigravity", quality: "C" },
  ],

  pm: [
    // Tier A: Copilot
    { id: "copilot-pm-agent", path: "agents/project-manager.agent.md", name: "Project Manager Agent", description: "GitHub Copilot agent for PM: sprint planning, issue tracking, retrospectives, roadmaps.", category: "pm", sourceId: "copilot", quality: "A" },
    // Tier B: Jeffallan
    { id: "jeffallan-intake", path: "commands/intake/README.md", name: "Project Intake", description: "Structured project intake: requirements gathering, scope definition, stakeholder alignment.", category: "pm", sourceId: "jeffallan", quality: "B" },
    // Tier B: Jeffallan
    { id: "jeffallan-planning", path: "commands/project/planning/README.md", name: "Project Planning", description: "Project planning workflow: milestones, dependencies, risk assessment, resource allocation.", category: "pm", sourceId: "jeffallan", quality: "B" },
    // Tier C: Antigravity
    { id: "ag-orchestrator", path: "skills/acceptance-orchestrator/SKILL.md", name: "Task Orchestrator", description: "Drives tasks end-to-end: issue intake → implementation → review → deployment.", category: "workflow", sourceId: "antigravity", quality: "C" },
    // Tier C: Antigravity
    { id: "ag-issue-gate", path: "skills/create-issue-gate/SKILL.md", name: "Issue Gate", description: "Proper issue creation with requirements and acceptance criteria.", category: "workflow", sourceId: "antigravity", quality: "C" },
  ],
};

/* ── Helpers ──────────────────────────────────── */

/** Get skills for a given role ID */
export function getSkillsForRole(roleId: string): SkillEntry[] {
  return ROLE_SKILLS[roleId] ?? [];
}

/** Get the source info for a skill */
export function getSkillSource(skill: SkillEntry): SkillSource {
  return SKILL_SOURCES[skill.sourceId];
}

/** Build the full raw URL for fetching a skill's content */
export function getSkillUrl(skill: SkillEntry): string {
  const source = SKILL_SOURCES[skill.sourceId];
  return `${source.baseUrl}/${skill.path}`;
}

/** Get all unique sources used across all roles */
export function getActiveSources(): SkillSource[] {
  const ids = new Set<string>();
  for (const skills of Object.values(ROLE_SKILLS)) {
    for (const s of skills) {
      ids.add(s.sourceId);
    }
  }
  return Array.from(ids).map((id) => SKILL_SOURCES[id]);
}
