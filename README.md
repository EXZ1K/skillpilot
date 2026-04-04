# SkillPilot

> Describe your project → get a complete AI agent team with MCP servers, curated skills, and step-by-step roadmap.

SkillPilot is an MCP (Model Context Protocol) server that turns a single project description into a full implementation plan. It works inside any IDE that supports MCP — Cursor, Claude Code, Windsurf, Codex, and more.

## What it does

1. **You describe your project** — "car rental service in Tbilisi with a business plan"
2. **SkillPilot returns a complete plan:**
   - MCP agents to install (from 60+ curated catalog + 37K on GitHub)
   - Ready-to-use AI skills with full instructions (auth, payments, database, design, security...)
   - **Business Analyst & Strategy Consultant** agents for financial modeling and market research
   - Open source projects to reference or fork
   - All API keys needed with direct links
   - Step-by-step roadmap for your IDE agent

3. **One command installs everything** — `.mcp.json`, `.env.example`, `.cursorrules`, `CLAUDE.md`, `ROADMAP.md`

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

This produces higher quality results through adversarial evaluation — instead of one opinion, you get a competition of ideas.

## Business Intelligence — real market research, not guesswork

SkillPilot now includes **Business Analyst** and **Strategy Consultant** agents that build data-driven business plans:

```
"Use skillpilot_plan for a car rental service in Batumi, Georgia with business plan"
```

### What the agents deliver

| Agent | What it does |
|-------|-------------|
| **Business Analyst** | P&L projections, NPV/IRR, break-even, unit economics, depreciation, cash flow |
| **Strategy Consultant** | Porter's Five Forces, PEST, SWOT, customer segmentation, go-to-market |
| **Financial Modeler** (sub-agent) | Monthly financial models with 3 scenarios (optimistic/base/pessimistic) |
| **Market Researcher** (sub-agent) | TAM/SAM/SOM, competitor pricing, industry benchmarks |
| **Competitive Analyst** (sub-agent) | Real competitor data from web scraping, market positioning |
| **Growth Strategist** (sub-agent) | Customer segments, acquisition channels, growth vectors |

### Key: research first, model second

Business agents use **Firecrawl** (web scraping MCP) to research the actual market before building any financial model. Every number in the business plan must cite a source or explain the assumption. No blind guessing.

### 50 business skills from 8 sources

Powered by [linuszz/business-strategy-planning-skills](https://github.com/linuszz/business-strategy-planning-skills) — 50 SKILL.md files covering:

- **Financial Analysis** (15): free cash flow, market sizing, DuPont analysis, forecasting, sensitivity analysis...
- **Business Modeling** (8): SWOT, RACI, business definition, strategy articulation...
- **Strategy Design** (13): Porter's Five Forces, PEST, customer segmentation, value chain...
- **Strategic Decisions** (6): risk matrix, scenario development, growth-share matrix...
- **Visualization** (8): executive dashboards, marimekko charts, traffic lights...

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
| `skillpilot_catalog` | Browse 60+ curated MCP agents across 24 categories |
| `skillpilot_install` | Generate `.mcp.json`, `.env.example`, `.cursorrules`, `CLAUDE.md`, `ROADMAP.md` |
| `skillpilot_explain` | Detailed info about any agent or category |
| `skillpilot_discover` | Search 37K+ MCP servers on GitHub |
| `skillpilot_skills` | Find AI skills: universal prompts, IDE-specific, domain expert |
| `skillpilot_projects` | Find open source projects to fork or reference |

## 27 Agent Categories

auth, payments, database, ai, email, deploy, review, security, video, storage, analytics, monitoring, cms, search, cache, notifications, testing, communication, project-management, documents, browser, marketing, design, docs, **business-plan, financial-analysis, market-research**

## Built-in Skills

21 curated skills with ready-to-use instructions across all categories:

- **Auth** — providers, sessions, protected routes, OAuth, roles
- **Database** — schema design, naming, indexes, migrations, RLS
- **Payments** — checkout flow, subscriptions, webhooks, error handling
- **AI** — streaming chat, context management, token optimization, RAG
- **Design** — component architecture, responsive, dark mode, accessibility
- **Marketing** — SEO, meta tags, landing page structure, schema.org
- **Deploy** — CI/CD pipeline, env vars, preview deployments, checklist
- **Security** — OWASP top 10, input validation, SQL injection, secrets
- **Business Plan** — TAM/SAM/SOM, unit economics, P&L projections, NPV/IRR, break-even, depreciation
- **Market Research** — competitive intelligence, customer segmentation, industry analysis frameworks
- **And more:** email, analytics, monitoring, testing, cache, search, CMS, video, storage, notifications

Skills are universal — they describe patterns and principles, not vendor-specific code. Your AI picks the right tools for your stack.

## How Skills Save Tokens

Without skills, your AI spends thousands of tokens figuring out how to implement auth, structure a database, or set up payments. With SkillPilot skills, it follows proven instructions — faster, cheaper, better.

## Smart Features

- **Business Intelligence** — Business Analyst & Strategy Consultant agents with real market research via web scraping
- **Battle Mode** — 3 competing strategies evaluated by your AI for higher quality plans
- **8 skill sources** — 2,300+ community skills from Anthropic, GitHub Copilot, CursorRules, and 5 more providers
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
