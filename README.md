# SkillPilot

> Describe your project → get a complete AI agent team with MCP servers, curated skills, and step-by-step roadmap.

SkillPilot is an MCP (Model Context Protocol) server that turns a single project description into a full implementation plan. It works inside any IDE that supports MCP — Cursor, Claude Code, Windsurf, Codex, and more.

## What it does

1. **You describe your project** — "veterinary clinic website with booking and payments"
2. **SkillPilot returns a complete plan:**
   - MCP agents to install (from 60+ curated catalog + 37K on GitHub)
   - Ready-to-use AI skills with full instructions (auth, payments, database, design, security...)
   - Open source projects to reference or fork
   - All API keys needed with direct links
   - Step-by-step roadmap for your IDE agent

3. **One command installs everything** — `.mcp.json`, `.env.example`, `.cursorrules`, `CLAUDE.md`, `ROADMAP.md`

## Agent Team System — parallel swarm with 14 roles

Describe your project and get a full team of specialized AI agents:

```
"Use skillpilot_team for an online marketplace with payments and AI search"
```

SkillPilot assembles a team from **14 agent roles**, each with 2 sub-agents and community skills as weapons:

| Priority | Roles | Focus |
|----------|-------|-------|
| 1 — Foundation | Backend Architect, Auth & Security Lead | Server, API, database, auth |
| 2 — Business Logic | Frontend, Payments, AI/ML, Communications, **Business Analyst, Strategy Consultant** | UI, billing, AI, email, business planning |
| 3 — Quality | QA Lead, Code Review Lead, Performance Engineer | Testing, review, optimization |
| 4 — Launch | DevOps, Analytics, Content & CMS, Project Coordinator | Deploy, metrics, content, PM |

Each agent is armed with:
- **MCP weapons** — real MCP servers (Supabase, Stripe, Vercel, Firecrawl...)
- **Prompt weapons** — expert instructions (System Architect, Security Expert, QA Engineer...)
- **Skill weapons** — community skills fetched from 8 GitHub sources (2,300+ skills)

Team sizes: **Squad** (8 agents) → **Platoon** (16) → **Company** (24) → **Battalion** (28)

## ⚔️ Battle Mode — adversarial evaluation

Instead of one plan, generate **3 competing strategies** and let your IDE's AI pick the best:

```
"Use skillpilot_plan in battle mode for an online marketplace"
```

| Team | Priority | Philosophy |
|------|----------|------------|
| 🏎️ **SPEED** | Time-to-market | Managed services, ship in days |
| 🏗️ **SCALE** | Scalability | Open-source, self-hosted, 10x ready |
| 💰 **BUDGET** | Minimize cost | Free tiers, near-zero running costs |

Each team proposes a full stack with agents and skills. Your AI then:
1. Scores each strategy on 6 weighted criteria
2. Identifies strengths and weaknesses
3. Picks the winner with justification
4. Asks you to confirm
5. Implements only the winning plan

## NEW: Business planning agents

v0.5.0 adds **Business Analyst** and **Strategy Consultant** roles. When your project description mentions business plan, investment, ROI, or similar keywords — these agents join the team automatically.

```
"Use skillpilot_team for a car rental service in Batumi, Georgia with business plan"
```

**Business Analyst** builds financial models: P&L projections, NPV/IRR, break-even, unit economics, depreciation, cash flow. **Strategy Consultant** analyzes the market: Porter's Five Forces, PEST, SWOT, customer segmentation, go-to-market.

Both agents use **Firecrawl** (web scraping) to research the actual market before building models — every number must cite a source or explain the assumption.

Powered by 50 business SKILL.md files from [linuszz/business-strategy-planning-skills](https://github.com/linuszz/business-strategy-planning-skills).

## How it works

SkillPilot is a **local MCP server** — no cloud, no hosting, no deployment needed. Your IDE launches it as a local process and communicates via stdin/stdout. All data stays on your machine.

## Quick Start

### Option A: Install from npm

```bash
npm install -g @exz1k/skill-pilot
```

### Option B: Clone and build

```bash
git clone https://github.com/EXZ1K/skillpilot.git
cd skillpilot
npm install
npm run build
```

### Connect to your IDE

#### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "skillpilot": {
      "command": "npx",
      "args": ["-y", "@exz1k/skill-pilot", "--mcp"],
      "env": {
        "GITHUB_TOKEN": "your_github_token"
      }
    }
  }
}
```

#### Claude Code

```bash
claude mcp add skillpilot -- npx -y @exz1k/skill-pilot --mcp
```

#### Windsurf / Codex / any MCP-compatible IDE

Same pattern — use `npx -y @exz1k/skill-pilot --mcp` as the command.

### Use it

```
"Use skillpilot_plan for [your project description]"
```

For battle mode:

```
"Use skillpilot_plan in battle mode for [your project description]"
```

> **Note:** `GITHUB_TOKEN` is optional but recommended — without it GitHub API limits you to 60 requests/hour. [Create a token here](https://github.com/settings/tokens) (no scopes needed).

## MCP Tools

| Tool | Description |
|------|-------------|
| `skillpilot_plan` | **Main tool.** One request → complete plan with agents, skills, projects, API keys, roadmap. Supports `mode: "battle"` for adversarial evaluation. |
| `skillpilot_team` | Create full agent team with weapons and community skills |
| `skillpilot_team_estimate` | Preview team size, roles, and skills before committing |
| `skillpilot_catalog` | Browse 60+ curated MCP agents across 24 categories |
| `skillpilot_install` | Generate `.mcp.json`, `.env.example`, `.cursorrules`, `CLAUDE.md`, `ROADMAP.md` |
| `skillpilot_explain` | Detailed info about any agent or category |
| `skillpilot_discover` | Search 37K+ MCP servers on GitHub |
| `skillpilot_skills` | Find AI skills: universal prompts, IDE-specific, domain expert |
| `skillpilot_projects` | Find open source projects to fork or reference |

## 14 Agent Roles

| Role | Weapons | Skills |
|------|---------|--------|
| Backend Architect | Supabase, Neon, System Architect, API Designer | Claude API, Node.js/Express, Hono, API Design |
| Auth & Security Lead | Clerk, Semgrep, Security Expert | Supabase Auth, Better Auth, Security Audit, 007 |
| Frontend Architect | Figma, Frontend Architect, UI/UX Expert | Next.js/React, shadcn/ui, WCAG Audit |
| Payments Engineer | Stripe, Security Expert | Stripe Agent, Fintech Compliance, Billing |
| AI/ML Engineer | Context7, System Architect | MCP Builder, Prompt Engineering, AI Toolkit |
| Communications Engineer | Resend, Slack | Email Automation, Klaviyo, Marketing |
| **Business Analyst** | Firecrawl, Business Analyst, System Architect | Market Sizing, Free Cash Flow, SWOT, Forecasting |
| **Strategy Consultant** | Firecrawl, PostHog, Strategy Consultant | Porter's Five Forces, PEST, Customer Segmentation |
| QA Lead | Playwright, QA Engineer | Webapp Testing, E2E Testing |
| Code Review Lead | GitHub, Code Reviewer | Code Review Expert, Clean Code |
| Performance Engineer | Upstash, Sentry, Performance Engineer | DevOps Troubleshooter, Cost Optimizer |
| DevOps Lead | Vercel, Cloudflare, DevOps Engineer | Docker, Deployment Engineer, Pipeline Architect |
| Analytics Engineer | PostHog, Data Engineer | Data Analyst, A/B Tests, dbt |
| Content & CMS | Sanity, Firecrawl | Doc Co-Authoring, Content Strategy, Growth Engine |

## 8 Skill Sources (2,300+ community skills)

| Tier | Source | Skills |
|------|--------|--------|
| A | [Anthropic Official](https://github.com/anthropics/skills) | 17 |
| A | [GitHub Copilot](https://github.com/github/awesome-copilot) | 362 |
| A | [Awesome CursorRules](https://github.com/PatrickJS/awesome-cursorrules) | 178 |
| A | [Peter Steinberger Rules](https://github.com/steipete/agent-rules) | 15 |
| B | [Claude Skills Multi-Platform](https://github.com/alirezarezvani/claude-skills) | 278 |
| B | [Workflow Skills](https://github.com/Jeffallan/claude-skills) | 66 |
| B | [Framework Prompts](https://github.com/instructa/ai-prompts) | 97 |
| B | [Business Strategy Planning](https://github.com/linuszz/business-strategy-planning-skills) | 50 |
| C | [Antigravity Skills](https://github.com/sickn33/antigravity-awesome-skills) | 1,340 |

## 21 Built-in Skills

Ready-to-use instructions across all categories:

- **Auth** — providers, sessions, protected routes, OAuth, roles
- **Database** — schema design, naming, indexes, migrations, RLS
- **Payments** — checkout flow, subscriptions, webhooks, error handling
- **AI** — streaming chat, context management, token optimization, RAG
- **Design** — component architecture, responsive, dark mode, accessibility
- **Marketing** — SEO, meta tags, landing page structure, schema.org
- **Deploy** — CI/CD pipeline, env vars, preview deployments, checklist
- **Security** — OWASP top 10, input validation, SQL injection, secrets
- **Business Plan** — TAM/SAM/SOM, unit economics, P&L projections, NPV/IRR, break-even
- **Market Research** — competitive intelligence, customer segmentation, industry analysis
- **And more:** email, analytics, monitoring, testing, cache, search, CMS, video, storage, notifications

## Smart Features

- **Agent Team System** — parallel swarm of specialized agents with sub-agents and community skills
- **Battle Mode** — 3 competing strategies evaluated by your AI for higher quality plans
- **8 skill sources** — 2,300+ community skills from Anthropic, GitHub Copilot, CursorRules, and more
- **Business planning** — financial modeling and market research agents with real web scraping
- **LLM-driven categories** — Your IDE's AI picks the right categories, no keyword guessing
- **Stack enrichment** — Redis in your stack? Cache skill auto-included. Python + FastAPI? AI skill added.
- **GitHub discovery** — Finds relevant MCP servers, skills, and projects beyond the built-in catalog
- **Scoring algorithm** — Ranks GitHub results by popularity, freshness, official status, license, activity

## Development

```bash
npm install
npm run build
npm test          # 160 tests
npm run dev       # development mode
```

## Tech Stack

- TypeScript + Node.js
- `@modelcontextprotocol/sdk` for MCP protocol
- GitHub API for discovery (37K+ MCP servers)
- Zod for input validation
- Vitest for testing

## License

AGPL-3.0
