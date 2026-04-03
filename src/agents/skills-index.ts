/**
 * Bundled Skills Index — snapshot of top community skills from
 * github.com/sickn33/antigravity-awesome-skills (1,340+ skills).
 *
 * This is the HYBRID approach:
 *   - Index is bundled (fast lookup, offline-ready)
 *   - Full SKILL.md content is fetched at runtime from GitHub
 *
 * Each agent role maps to relevant skill categories + keyword filters.
 * Top 3 skills per role are pre-selected for quality.
 */

export interface SkillEntry {
  id: string;
  /** Path in the antigravity repo: "skills/007" */
  path: string;
  name: string;
  description: string;
  category: string;
}

/**
 * Mapping: our agent role ID → antigravity categories + keyword boost/filter.
 * Keywords help pick the best skills when a category is too broad.
 */
interface RoleSkillMapping {
  categories: string[];
  /** Keywords that BOOST a skill's relevance (in id or description) */
  boostKeywords: string[];
  /** Keywords that EXCLUDE a skill (too niche or wrong domain) */
  excludeKeywords: string[];
}

const ROLE_SKILL_MAP: Record<string, RoleSkillMapping> = {
  backend: {
    categories: ["backend", "api-integration", "architecture", "database", "database-processing"],
    boostKeywords: ["api", "rest", "graphql", "architecture", "backend", "server", "endpoint", "schema", "migration"],
    excludeKeywords: ["alexa", "sms", "voice"],
  },
  auth: {
    categories: ["security", "reliability"],
    boostKeywords: ["auth", "security", "audit", "owasp", "iam", "access", "compliance", "vulnerability", "pentest"],
    excludeKeywords: ["alexa", "cost", "cleanup", "sms"],
  },
  frontend: {
    categories: ["front-end", "frontend", "design", "web-development"],
    boostKeywords: ["ui", "ux", "component", "react", "css", "accessibility", "responsive", "animation", "design"],
    excludeKeywords: ["alexa", "backend", "server"],
  },
  payments: {
    categories: ["api-integration", "business"],
    boostKeywords: ["payment", "stripe", "billing", "invoice", "subscription", "checkout", "financial", "commerce"],
    excludeKeywords: ["alexa", "sms", "discord", "teams"],
  },
  ai: {
    categories: ["ai-ml", "ai-agents", "data-ai"],
    boostKeywords: ["llm", "agent", "prompt", "rag", "embedding", "model", "inference", "ai", "ml", "neural"],
    excludeKeywords: ["image-studio", "imagen"],
  },
  email: {
    categories: ["automation", "api-integration"],
    boostKeywords: ["email", "mail", "notification", "message", "campaign", "template", "smtp"],
    excludeKeywords: ["discord", "alexa", "sms"],
  },
  qa: {
    categories: ["testing", "test-automation", "code-quality"],
    boostKeywords: ["test", "qa", "e2e", "unit", "integration", "playwright", "cypress", "coverage", "assertion"],
    excludeKeywords: [],
  },
  reviewer: {
    categories: ["code-quality", "code", "reliability"],
    boostKeywords: ["review", "lint", "refactor", "clean", "solid", "pattern", "quality", "complexity"],
    excludeKeywords: [],
  },
  performance: {
    categories: ["reliability", "devops", "cloud"],
    boostKeywords: ["performance", "cache", "optimize", "latency", "profil", "monitor", "metric", "benchmark"],
    excludeKeywords: ["alexa", "sms", "cost"],
  },
  devops: {
    categories: ["devops", "cloud", "automation"],
    boostKeywords: ["deploy", "ci", "cd", "pipeline", "docker", "kubernetes", "infrastructure", "terraform"],
    excludeKeywords: ["alexa", "sms", "discord"],
  },
  analytics: {
    categories: ["data", "data-science", "data-ai"],
    boostKeywords: ["analytics", "metric", "dashboard", "tracking", "funnel", "cohort", "report", "visualization"],
    excludeKeywords: [],
  },
  content: {
    categories: ["content", "marketing"],
    boostKeywords: ["cms", "content", "seo", "blog", "article", "copy", "editorial"],
    excludeKeywords: ["discord", "teams"],
  },
  pm: {
    categories: ["project-management", "workflow", "planning"],
    boostKeywords: ["project", "task", "sprint", "agile", "kanban", "roadmap", "planning", "issue"],
    excludeKeywords: [],
  },
};

/**
 * Pre-selected top skills per role.
 * Generated from antigravity-awesome-skills index with scoring:
 *   +3 english description, +2 long desc, +1 community source,
 *   +2 boost keyword match, -5 exclude keyword match.
 */
export const ROLE_SKILLS: Record<string, SkillEntry[]> = {
  backend: [
    { id: "api-design-principles", path: "skills/api-design-principles", name: "API Design Principles", description: "Master REST and GraphQL API design principles to build intuitive, scalable, and maintainable APIs.", category: "backend" },
    { id: "api-endpoint-builder", path: "skills/api-endpoint-builder", name: "API Endpoint Builder", description: "Builds production-ready REST API endpoints with validation, error handling, authentication, and documentation.", category: "development" },
    { id: "architecture", path: "skills/architecture", name: "System Architecture", description: "Architectural decision-making framework. Requirements analysis, trade-off evaluation, ADR documentation.", category: "architecture" },
  ],
  auth: [
    { id: "007", path: "skills/007", name: "Security Auditor 007", description: "Security audit, hardening, threat modeling (STRIDE/PASTA), Red/Blue Team, OWASP checks, code review, incident response.", category: "security" },
    { id: "audit-skills", path: "skills/audit-skills", name: "Skills Auditor", description: "Expert security auditor. Performs non-intrusive static analysis to identify malicious patterns, data leaks, and system stability risks.", category: "security" },
    { id: "aws-iam-best-practices", path: "skills/aws-iam-best-practices", name: "IAM Best Practices", description: "IAM policy review, hardening, and least privilege implementation.", category: "security" },
  ],
  frontend: [
    { id: "accessibility-compliance-accessibility-audit", path: "skills/accessibility-compliance-accessibility-audit", name: "Accessibility Auditor", description: "WCAG compliance expert. Conducts audits, identifies barriers, and provides remediation guidance for inclusive design.", category: "design" },
    { id: "antigravity-design-expert", path: "skills/antigravity-design-expert", name: "UI/UX Engineer", description: "Core UI/UX engineering for highly interactive, spatial, glassmorphism-based web interfaces using GSAP and 3D CSS.", category: "design" },
    { id: "wcag-audit-patterns", path: "skills/wcag-audit-patterns", name: "WCAG Audit Patterns", description: "Comprehensive guide to auditing web content against WCAG 2.2 guidelines with actionable fix patterns.", category: "design" },
  ],
  payments: [
    { id: "pakistan-payments-stack", path: "skills/pakistan-payments-stack", name: "Payments Integration", description: "Design and implement production-grade payment integrations with proper error handling and reconciliation.", category: "api-integration" },
    { id: "billing-automation", path: "skills/billing-automation", name: "Billing Automation", description: "Master automated billing systems including recurring billing, invoice generation, and payment processing.", category: "uncategorized" },
    { id: "market-sizing-analysis", path: "skills/market-sizing-analysis", name: "Market & Revenue Analysis", description: "Frameworks for analyzing market size, revenue models, and financial projections for digital products.", category: "business" },
  ],
  ai: [
    { id: "prompt-engineer", path: "skills/prompt-engineer", name: "Prompt Engineer", description: "Transforms user prompts into optimized prompts using frameworks (RTF, RISEN, Chain-of-Thought).", category: "automation" },
    { id: "ai-engineering-toolkit", path: "skills/ai-engineering-toolkit", name: "AI Engineering Toolkit", description: "6 production-ready AI engineering workflows: prompt evaluation, RAG pipeline, fine-tuning, agent orchestration.", category: "data-ai" },
    { id: "agent-orchestrator", path: "skills/agent-orchestrator", name: "Agent Orchestrator", description: "Meta-skill for orchestrating AI agents ecosystem. Automatic skill scanning, routing, and coordination.", category: "ai-ml" },
  ],
  email: [
    { id: "klaviyo-automation", path: "skills/klaviyo-automation", name: "Email Automation", description: "Automate email/SMS campaigns, inspect flows, manage lists, and run A/B tests.", category: "marketing" },
    { id: "agentmail", path: "skills/agentmail", name: "Agent Email", description: "Email infrastructure for AI agents. Create accounts, send/receive emails, manage threads.", category: "ai-ml" },
    { id: "marketing-ideas", path: "skills/marketing-ideas", name: "Marketing Strategies", description: "Proven marketing strategies and growth ideas for SaaS and software products.", category: "marketing" },
  ],
  qa: [
    { id: "e2e-testing", path: "skills/e2e-testing", name: "E2E Testing", description: "End-to-end testing workflow with Playwright for browser automation, visual regression, and CI integration.", category: "granular-workflow-bundle" },
    { id: "test-engineer", path: "skills/test-engineer", name: "Test Engineer", description: "Comprehensive testing strategies: unit, integration, E2E, performance. TDD/BDD methodologies.", category: "testing" },
    { id: "acceptance-gate", path: "skills/acceptance-gate", name: "Acceptance Gate", description: "Quality gate that validates code against acceptance criteria before merge.", category: "code-quality" },
  ],
  reviewer: [
    { id: "code-review", path: "skills/code-review", name: "Code Review Expert", description: "Thorough code review covering correctness, edge cases, security, performance, and maintainability.", category: "code-quality" },
    { id: "refactoring-patterns", path: "skills/refactoring-patterns", name: "Refactoring Patterns", description: "Systematic refactoring using established patterns. Identifies code smells and applies safe transformations.", category: "code" },
    { id: "clean-code", path: "skills/clean-code", name: "Clean Code", description: "Clean code principles: meaningful names, small functions, SOLID, DRY, proper error handling.", category: "code-quality" },
  ],
  performance: [
    { id: "deployment-validation-config-validate", path: "skills/deployment-validation-config-validate", name: "Config Validator", description: "Configuration management expert specializing in validating, testing, and securing deployment configurations.", category: "devops" },
    { id: "devops-troubleshooter", path: "skills/devops-troubleshooter", name: "DevOps Troubleshooter", description: "Expert troubleshooter specializing in rapid incident response, advanced debugging, and performance analysis.", category: "devops" },
    { id: "aws-cost-optimizer", path: "skills/aws-cost-optimizer", name: "Cost Optimizer", description: "Comprehensive cost analysis and optimization recommendations for cloud infrastructure.", category: "cloud" },
  ],
  devops: [
    { id: "deployment-engineer", path: "skills/deployment-engineer", name: "Deployment Engineer", description: "Expert in modern CI/CD pipelines, GitOps workflows, blue-green deployments, and infrastructure as code.", category: "devops" },
    { id: "deployment-pipeline-design", path: "skills/deployment-pipeline-design", name: "Pipeline Architect", description: "Architecture patterns for multi-stage CI/CD pipelines with approval gates and deployment strategies.", category: "devops" },
    { id: "deployment-procedures", path: "skills/deployment-procedures", name: "Deployment Procedures", description: "Production deployment principles. Safe deployment workflows, rollback strategies, and verification.", category: "devops" },
  ],
  analytics: [
    { id: "analytics-tracking", path: "skills/analytics-tracking", name: "Analytics Tracking", description: "Design, audit, and improve analytics tracking systems that produce reliable, decision-quality data.", category: "data" },
    { id: "ab-test-setup", path: "skills/ab-test-setup", name: "A/B Test Setup", description: "Structured guide for setting up A/B tests with mandatory gates for hypothesis, metrics, and sample size.", category: "marketing" },
    { id: "dbt-transformation-patterns", path: "skills/dbt-transformation-patterns", name: "Data Transformations", description: "Production-ready patterns for dbt including model organization, testing strategies, and incremental processing.", category: "data" },
  ],
  content: [
    { id: "content-strategy", path: "skills/content-strategy", name: "Content Strategy", description: "Content planning, editorial calendars, SEO optimization, and multi-channel content distribution.", category: "content" },
    { id: "growth-engine", path: "skills/growth-engine", name: "Growth Engine", description: "Growth hacking, SEO, ASO, viral loops, and conversion optimization for digital products.", category: "marketing" },
    { id: "marketing-ideas", path: "skills/marketing-ideas", name: "Marketing Ideas", description: "Proven marketing strategies and growth ideas for SaaS and software products.", category: "marketing" },
  ],
  pm: [
    { id: "acceptance-orchestrator", path: "skills/acceptance-orchestrator", name: "Task Orchestrator", description: "Drives coding tasks end-to-end from issue intake through implementation, review, and deployment.", category: "workflow" },
    { id: "closed-loop-delivery", path: "skills/closed-loop-delivery", name: "Closed Loop Delivery", description: "Ensures coding tasks are completed against explicit acceptance criteria with verification at each stage.", category: "workflow" },
    { id: "create-issue-gate", path: "skills/create-issue-gate", name: "Issue Gate", description: "Starting new implementation tasks with proper issue creation, requirements, and acceptance criteria.", category: "workflow" },
  ],
};

/** GitHub raw content base URL */
export const SKILLS_REPO_BASE = "https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main";

/** Get skills for a given role ID */
export function getSkillsForRole(roleId: string): SkillEntry[] {
  return ROLE_SKILLS[roleId] ?? [];
}

/** Get the mapping config for a role (for dynamic search) */
export function getRoleMapping(roleId: string): RoleSkillMapping | undefined {
  return ROLE_SKILL_MAP[roleId];
}
