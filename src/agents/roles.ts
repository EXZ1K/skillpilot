/**
 * Agent Roles & Weapons Registry
 *
 * Определяет все доступные роли агентов и их оружие.
 * Оружие бывает двух типов:
 *   - MCP: реальный MCP-сервер (npx команда)
 *   - Prompt: экспертная инструкция (промпт)
 *
 * Роли привязаны к категориям из skills/registry.ts,
 * но расширены для покрытия всех аспектов разработки.
 */

import type { Weapon } from "../types.js";

/* ── Weapon Factory ────────────────────────────── */

function mcp(id: string, name: string, command: string, description: string): Weapon {
  return { id, name, type: "mcp", payload: command, description };
}

function prompt(id: string, name: string, instruction: string, description: string): Weapon {
  return { id, name, type: "prompt", payload: instruction, description };
}

/* ── Weapon Arsenal ────────────────────────────── */

export const WEAPONS = {
  // ── MCP Weapons ──
  supabase:    mcp("supabase-mcp",    "Supabase",       "npx -y supabase-mcp-server",        "Database, auth, storage — all-in-one backend"),
  stripe:      mcp("stripe-mcp",      "Stripe",         "npx -y @stripe/mcp",                "Payments, subscriptions, invoices"),
  clerk:       mcp("clerk-mcp",       "Clerk",          "npx -y @anthropic/clerk-mcp",       "Authentication & user management"),
  vercel:      mcp("vercel-mcp",      "Vercel",         "npx -y vercel-mcp",                 "Deploy, domains, serverless functions"),
  sentry:      mcp("sentry-mcp",      "Sentry",         "npx -y @sentry/mcp-server",         "Error tracking & performance monitoring"),
  resend:      mcp("resend-mcp",      "Resend",         "npx -y resend-mcp",                 "Transactional emails"),
  context7:    mcp("context7-mcp",    "Context7",       "npx -y @context7/mcp",              "Live documentation for any library"),
  playwright:  mcp("playwright-mcp",  "Playwright",     "npx -y @anthropic/playwright-mcp",  "Browser automation & E2E testing"),
  github:      mcp("github-mcp",      "GitHub",         "npx -y @anthropic/github-mcp",      "Issues, PRs, code search"),
  figma:       mcp("figma-mcp",       "Figma",          "npx -y @anthropic/figma-mcp",       "Design-to-code, design tokens"),
  posthog:     mcp("posthog-mcp",     "PostHog",        "npx -y posthog-mcp",                "Analytics, feature flags, A/B tests"),
  upstash:     mcp("upstash-mcp",     "Upstash",        "npx -y @upstash/mcp-server",        "Redis cache, rate limiting, queues"),
  neon:        mcp("neon-mcp",        "Neon",           "npx -y @anthropic/neon-mcp",        "Serverless Postgres"),
  semgrep:     mcp("semgrep-mcp",     "Semgrep",        "npx -y semgrep-mcp",                "Static analysis & security scanning"),
  linear:      mcp("linear-mcp",      "Linear",         "npx -y linear-mcp",                 "Issue tracking & project management"),
  slack:       mcp("slack-mcp",       "Slack",          "npx -y @anthropic/slack-mcp",       "Team messaging & notifications"),
  cloudflare:  mcp("cloudflare-mcp",  "Cloudflare",     "npx -y cloudflare-mcp",             "CDN, Workers, R2 storage"),
  sanity:      mcp("sanity-mcp",      "Sanity",         "npx -y sanity-mcp",                 "Headless CMS"),
  firecrawl:   mcp("firecrawl-mcp",   "Firecrawl",      "npx -y firecrawl-mcp",              "Web scraping & crawling"),

  // ── Prompt Weapons (экспертные инструкции) ──
  archPrompt: prompt("arch-prompt", "System Architect",
    "You are a senior system architect. Break every task into components. " +
    "Define interfaces before implementations. Consider scalability, security, and maintainability. " +
    "Always document architectural decisions with ADRs.",
    "Strategic thinking & system design"),

  securityPrompt: prompt("security-prompt", "Security Expert",
    "You are a security specialist. Check every input for injection. " +
    "Validate at system boundaries. Use parameterized queries. Never log secrets. " +
    "Apply OWASP Top 10 mitigations. Review auth flows for privilege escalation.",
    "Security-first mindset & OWASP expertise"),

  reviewPrompt: prompt("review-prompt", "Code Reviewer",
    "You are a senior code reviewer. Check for: correctness, edge cases, " +
    "error handling, naming clarity, DRY violations, SOLID principles, " +
    "performance bottlenecks, and security vulnerabilities. Be specific, not vague.",
    "Thorough code review methodology"),

  testPrompt: prompt("test-prompt", "QA Engineer",
    "You are a QA engineer. Write tests BEFORE implementation (TDD). " +
    "Cover: happy path, edge cases, error scenarios, boundary values. " +
    "Use descriptive test names. Mock external dependencies, test real logic.",
    "Test-driven development & quality assurance"),

  perfPrompt: prompt("perf-prompt", "Performance Engineer",
    "You are a performance engineer. Profile before optimizing. " +
    "Check: N+1 queries, unnecessary re-renders, bundle size, lazy loading, " +
    "caching strategies, database indexes, connection pooling.",
    "Performance optimization & profiling"),

  uiPrompt: prompt("ui-prompt", "UI/UX Expert",
    "You are a UI/UX expert. Design mobile-first, accessible (WCAG 2.1 AA). " +
    "Use consistent spacing, typography hierarchy, color contrast. " +
    "Implement loading states, error states, empty states for every view.",
    "User-centered design & accessibility"),

  dataPrompt: prompt("data-prompt", "Data Engineer",
    "You are a data engineer. Design schemas with normalization in mind. " +
    "Use migrations for all schema changes. Index frequently queried columns. " +
    "Implement soft deletes, audit trails, and proper cascade rules.",
    "Database design & data integrity"),

  businessPrompt: prompt("business-prompt", "Business Analyst",
    "You are a senior business analyst and financial modeler. " +
    "CRITICAL: Before building any financial model, you MUST research the market first. " +
    "Use Firecrawl to scrape competitor websites, pricing pages, and industry reports. " +
    "Search for real data: average prices in the target market, industry benchmarks, government statistics. " +
    "For every number in your model, cite the source or explain the assumption. " +
    "Calculate: TAM/SAM/SOM (with real market data), unit economics, break-even point, NPV, IRR, payback period. " +
    "Build P&L projections for 3-5 years with 3 scenarios (optimistic/base/pessimistic). " +
    "Include startup costs, operational expenses, depreciation of assets (straight-line method), working capital needs. " +
    "Research comparable businesses in the same geography to validate all assumptions. " +
    "Output a complete financial model with monthly granularity for Year 1.",
    "Financial modeling with real market research — never build models blindly"),

  strategyPrompt: prompt("strategy-prompt", "Strategy Consultant",
    "You are a McKinsey-level strategy consultant who ALWAYS grounds analysis in real data. " +
    "CRITICAL: Use web tools to research the actual market before making any recommendations. " +
    "Scrape competitor websites for pricing, features, reviews. Search for industry reports and market sizes. " +
    "Analyze every business using frameworks: Porter's Five Forces, PEST, SWOT, Value Chain. " +
    "Research actual competitor prices, customer reviews, market trends in the target geography. " +
    "Identify competitive advantages, market positioning, and growth vectors based on REAL data. " +
    "Segment customers using actual demographic and behavioral data from the target market. " +
    "Map competitive landscape with real players, not hypothetical ones. " +
    "Present recommendations with data-driven rationale, citations, and clear action items.",
    "Strategy consulting with real competitive intelligence — not theoretical analysis"),

  devopsPrompt: prompt("devops-prompt", "DevOps Engineer",
    "You are a DevOps engineer. Containerize everything. Use environment variables for config. " +
    "Set up CI/CD pipelines with lint → test → build → deploy stages. " +
    "Implement health checks, structured logging, and graceful shutdown.",
    "Infrastructure, CI/CD & deployment"),

  apiPrompt: prompt("api-prompt", "API Designer",
    "You are an API design expert. Use RESTful conventions or GraphQL when appropriate. " +
    "Version APIs from day one. Validate all inputs with schemas. " +
    "Return consistent error formats. Document with OpenAPI/Swagger.",
    "API design, versioning & documentation"),

  frontendPrompt: prompt("frontend-prompt", "Frontend Architect",
    "You are a frontend architect. Use component composition over inheritance. " +
    "Separate smart (container) and dumb (presentational) components. " +
    "Manage state predictably. Optimize for Core Web Vitals.",
    "Component architecture & state management"),
} as const;

/* ── Agent Role Definitions ────────────────────── */

export interface RoleDef {
  id: string;
  name: string;
  description: string;
  /** Основное оружие этой роли */
  primaryWeapons: Weapon[];
  /** Роли для двух подагентов */
  subRoles: [SubRoleDef, SubRoleDef];
  /** К каким категориям проекта относится */
  categories: string[];
  /** Приоритет: 1 = фундамент, 2 = бизнес-логика, 3 = качество, 4 = запуск */
  priority: number;
}

export interface SubRoleDef {
  role: string;
  specialization: string;
  weapons: Weapon[];
}

export const AGENT_ROLES: RoleDef[] = [
  // ── Priority 1: Foundation ──
  {
    id: "backend",
    name: "Backend Architect",
    description: "Проектирует серверную архитектуру, API, базы данных",
    primaryWeapons: [WEAPONS.supabase, WEAPONS.neon, WEAPONS.archPrompt, WEAPONS.apiPrompt],
    subRoles: [
      { role: "Database Specialist", specialization: "Схемы, миграции, оптимизация запросов", weapons: [WEAPONS.supabase, WEAPONS.dataPrompt] },
      { role: "API Developer", specialization: "Эндпоинты, валидация, документация", weapons: [WEAPONS.context7, WEAPONS.apiPrompt] },
    ],
    categories: ["database", "api", "backend"],
    priority: 1,
  },
  {
    id: "auth",
    name: "Auth & Security Lead",
    description: "Аутентификация, авторизация, защита данных",
    primaryWeapons: [WEAPONS.clerk, WEAPONS.securityPrompt],
    subRoles: [
      { role: "Auth Implementer", specialization: "OAuth, JWT, session management", weapons: [WEAPONS.clerk, WEAPONS.context7] },
      { role: "Security Auditor", specialization: "Penetration testing, OWASP compliance", weapons: [WEAPONS.semgrep, WEAPONS.securityPrompt] },
    ],
    categories: ["auth", "security"],
    priority: 1,
  },

  // ── Priority 2: Business Logic ──
  {
    id: "frontend",
    name: "Frontend Architect",
    description: "UI-компоненты, стейт-менеджмент, UX",
    primaryWeapons: [WEAPONS.figma, WEAPONS.frontendPrompt, WEAPONS.uiPrompt],
    subRoles: [
      { role: "Component Developer", specialization: "UI-компоненты, дизайн-система", weapons: [WEAPONS.figma, WEAPONS.uiPrompt] },
      { role: "State & Integration", specialization: "Стейт, API-интеграция, роутинг", weapons: [WEAPONS.context7, WEAPONS.frontendPrompt] },
    ],
    categories: ["design", "ui", "frontend"],
    priority: 2,
  },
  {
    id: "payments",
    name: "Payments Engineer",
    description: "Платежи, подписки, биллинг",
    primaryWeapons: [WEAPONS.stripe, WEAPONS.securityPrompt],
    subRoles: [
      { role: "Payment Flow Dev", specialization: "Checkout, webhooks, refunds", weapons: [WEAPONS.stripe, WEAPONS.context7] },
      { role: "Billing & Compliance", specialization: "Подписки, инвойсы, PCI compliance", weapons: [WEAPONS.stripe, WEAPONS.securityPrompt] },
    ],
    categories: ["payments", "billing"],
    priority: 2,
  },
  {
    id: "ai",
    name: "AI/ML Engineer",
    description: "Интеграция AI-моделей, промпты, RAG-пайплайны",
    primaryWeapons: [WEAPONS.context7, WEAPONS.archPrompt],
    subRoles: [
      { role: "Prompt Engineer", specialization: "Системные промпты, chain-of-thought, output parsing", weapons: [WEAPONS.context7] },
      { role: "RAG & Pipeline Dev", specialization: "Embeddings, vector DB, retrieval", weapons: [WEAPONS.supabase, WEAPONS.context7] },
    ],
    categories: ["ai", "llm", "chatbot"],
    priority: 2,
  },
  {
    id: "email",
    name: "Communications Engineer",
    description: "Email, нотификации, real-time сообщения",
    primaryWeapons: [WEAPONS.resend, WEAPONS.slack],
    subRoles: [
      { role: "Email Developer", specialization: "Шаблоны, transactional, campaigns", weapons: [WEAPONS.resend] },
      { role: "Notification Hub", specialization: "Push, SMS, in-app уведомления", weapons: [WEAPONS.slack, WEAPONS.upstash] },
    ],
    categories: ["email", "notifications", "communication"],
    priority: 2,
  },

  // ── Priority 2: Business Intelligence ──
  {
    id: "business-analyst",
    name: "Business Analyst",
    description: "Бизнес-план, финансовая модель, unit-экономика, ROI, точка безубыточности",
    primaryWeapons: [WEAPONS.businessPrompt, WEAPONS.archPrompt],
    subRoles: [
      { role: "Financial Modeler", specialization: "P&L, cash flow, NPV/IRR, амортизация, break-even", weapons: [WEAPONS.businessPrompt, WEAPONS.dataPrompt] },
      { role: "Market Researcher", specialization: "TAM/SAM/SOM, ценообразование, конкурентный ана��из", weapons: [WEAPONS.firecrawl, WEAPONS.businessPrompt] },
    ],
    categories: ["business-plan", "financial-analysis", "market-research"],
    priority: 2,
  },
  {
    id: "strategy",
    name: "Strategy Consultant",
    description: "Стратегическое планирование, анализ рынка, конкурентная разведка, go-to-market",
    primaryWeapons: [WEAPONS.strategyPrompt, WEAPONS.firecrawl],
    subRoles: [
      { role: "Competitive Analyst", specialization: "Porter's Five Forces, PEST, позиционирование", weapons: [WEAPONS.strategyPrompt, WEAPONS.firecrawl] },
      { role: "Growth Strategist", specialization: "Сегментация клиентов, каналы роста, value chain", weapons: [WEAPONS.strategyPrompt, WEAPONS.posthog] },
    ],
    categories: ["business-plan", "strategy", "market-research"],
    priority: 2,
  },

  // ── Priority 3: Quality ──
  {
    id: "qa",
    name: "QA Lead",
    description: "Тестирование, автоматизация, quality gates",
    primaryWeapons: [WEAPONS.playwright, WEAPONS.testPrompt],
    subRoles: [
      { role: "E2E Test Engineer", specialization: "Browser tests, visual regression", weapons: [WEAPONS.playwright, WEAPONS.testPrompt] },
      { role: "Unit Test Engineer", specialization: "Unit tests, integration tests, mocking", weapons: [WEAPONS.context7, WEAPONS.testPrompt] },
    ],
    categories: ["testing", "qa"],
    priority: 3,
  },
  {
    id: "reviewer",
    name: "Code Review Lead",
    description: "Ревью кода, рефакторинг, стандарты",
    primaryWeapons: [WEAPONS.github, WEAPONS.reviewPrompt],
    subRoles: [
      { role: "Code Quality Analyst", specialization: "Lint, complexity, duplication", weapons: [WEAPONS.semgrep, WEAPONS.reviewPrompt] },
      { role: "Performance Reviewer", specialization: "Bottlenecks, memory leaks, profiling", weapons: [WEAPONS.sentry, WEAPONS.perfPrompt] },
    ],
    categories: ["review", "quality"],
    priority: 3,
  },
  {
    id: "performance",
    name: "Performance Engineer",
    description: "Оптимизация, кеширование, мониторинг",
    primaryWeapons: [WEAPONS.upstash, WEAPONS.sentry, WEAPONS.perfPrompt],
    subRoles: [
      { role: "Cache Strategist", specialization: "Redis, CDN, invalidation strategies", weapons: [WEAPONS.upstash, WEAPONS.cloudflare] },
      { role: "Monitoring Engineer", specialization: "APM, alerts, dashboards", weapons: [WEAPONS.sentry, WEAPONS.posthog] },
    ],
    categories: ["cache", "monitoring", "performance"],
    priority: 3,
  },

  // ── Priority 4: Launch ──
  {
    id: "devops",
    name: "DevOps Lead",
    description: "CI/CD, деплой, инфраструктура",
    primaryWeapons: [WEAPONS.vercel, WEAPONS.cloudflare, WEAPONS.devopsPrompt],
    subRoles: [
      { role: "CI/CD Engineer", specialization: "Pipelines, builds, environments", weapons: [WEAPONS.github, WEAPONS.devopsPrompt] },
      { role: "Infrastructure Engineer", specialization: "Containers, CDN, DNS, scaling", weapons: [WEAPONS.vercel, WEAPONS.cloudflare] },
    ],
    categories: ["deploy", "infrastructure"],
    priority: 4,
  },
  {
    id: "analytics",
    name: "Analytics Engineer",
    description: "Аналитика, метрики, A/B тесты",
    primaryWeapons: [WEAPONS.posthog, WEAPONS.dataPrompt],
    subRoles: [
      { role: "Event Tracker", specialization: "Event taxonomy, funnels, cohorts", weapons: [WEAPONS.posthog] },
      { role: "Data Analyst", specialization: "Dashboards, reports, insights", weapons: [WEAPONS.posthog, WEAPONS.dataPrompt] },
    ],
    categories: ["analytics", "marketing"],
    priority: 4,
  },
  {
    id: "content",
    name: "Content & CMS Engineer",
    description: "CMS, контент-менеджмент, SEO",
    primaryWeapons: [WEAPONS.sanity, WEAPONS.firecrawl],
    subRoles: [
      { role: "CMS Developer", specialization: "Схемы контента, редакторский опыт", weapons: [WEAPONS.sanity, WEAPONS.context7] },
      { role: "SEO & Crawler", specialization: "Метаданные, sitemap, structured data", weapons: [WEAPONS.firecrawl] },
    ],
    categories: ["cms", "search", "marketing"],
    priority: 4,
  },
  {
    id: "pm",
    name: "Project Coordinator",
    description: "Управление задачами, трекинг прогресса",
    primaryWeapons: [WEAPONS.linear, WEAPONS.github],
    subRoles: [
      { role: "Task Manager", specialization: "Тикеты, спринты, приоритизация", weapons: [WEAPONS.linear] },
      { role: "Documentation Writer", specialization: "README, API docs, changelogs", weapons: [WEAPONS.github, WEAPONS.context7] },
    ],
    categories: ["project-management", "documents"],
    priority: 4,
  },
];

/* ── Helpers ──────────────────────────────────── */

/** Найти роли по категориям проекта */
export function matchRoles(categories: string[]): RoleDef[] {
  const catSet = new Set(categories);
  return AGENT_ROLES
    .filter((role) => role.categories.some((c) => catSet.has(c)))
    .sort((a, b) => a.priority - b.priority);
}

/** Найти роль по ID */
export function findRole(id: string): RoleDef | undefined {
  return AGENT_ROLES.find((r) => r.id === id);
}
