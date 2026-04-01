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

### 2. Connect to your IDE

#### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "skillpilot": {
      "command": "node",
      "args": ["C:/path/to/skillpilot/dist/index.js", "--mcp"],
      "env": {
        "GITHUB_TOKEN": "your_github_token"
      }
    }
  }
}
```

#### Claude Code

```bash
claude mcp add skillpilot node /path/to/skillpilot/dist/index.js --mcp
```

Or add to `.mcp.json`:

```json
{
  "mcpServers": {
    "skillpilot": {
      "command": "node",
      "args": ["/path/to/skillpilot/dist/index.js", "--mcp"],
      "env": {
        "GITHUB_TOKEN": "your_github_token"
      }
    }
  }
}
```

#### Windsurf / Codex / any MCP-compatible IDE

Same pattern — point `command` to `node` and `args` to `dist/index.js --mcp`.

### 3. Use it

Ask your AI: **"Use skillpilot_plan for [your project description]"**

> **Note:** `GITHUB_TOKEN` is optional but recommended — without it GitHub API limits you to 60 requests/hour. [Create a token here](https://github.com/settings/tokens) (no scopes needed).

## MCP Tools

| Tool | Description |
|------|-------------|
| `skillpilot_plan` | **Main tool.** One request → complete plan with agents, skills, projects, API keys, roadmap |
| `skillpilot_catalog` | Browse 60+ curated MCP agents across 24 categories |
| `skillpilot_install` | Generate `.mcp.json`, `.env.example`, `.cursorrules`, `CLAUDE.md`, `ROADMAP.md` |
| `skillpilot_explain` | Detailed info about any agent or category |
| `skillpilot_discover` | Search 37K+ MCP servers on GitHub |
| `skillpilot_skills` | Find AI skills: universal prompts, IDE-specific, domain expert |
| `skillpilot_projects` | Find open source projects to fork or reference |

## 24 Agent Categories

auth, payments, database, ai, email, deploy, review, security, video, storage, analytics, monitoring, cms, search, cache, notifications, testing, communication, project-management, documents, browser, marketing, design, docs

## Built-in Skills

SkillPilot includes 18+ curated skills with ready-to-use instructions:

- **Auth** — Clerk setup, Supabase Auth, protected routes, OAuth
- **Database** — Schema design, naming, indexes, migrations, RLS
- **Payments** — Stripe Checkout, subscriptions, webhooks
- **AI** — Vercel AI SDK, streaming, context management, token optimization
- **Design** — Tailwind + shadcn/ui, responsive, dark mode, accessibility
- **Marketing** — SEO, meta tags, landing page structure, schema.org
- **Deploy** — Vercel, env vars, preview deployments, pre-deploy checklist
- **Security** — OWASP top 10, input validation, SQL injection, secrets
- **And more:** email, analytics, monitoring, testing, cache, search, CMS, video, storage, notifications

These skills are included directly in the plan output and written to `.cursorrules`/`CLAUDE.md` on install.

## How Skills Save Tokens

Without skills, your AI spends thousands of tokens figuring out how to implement auth, structure a database, or set up Stripe. With SkillPilot skills, it follows proven instructions — faster, cheaper, better.

## Smart Features

- **LLM-driven categories** — Your IDE's AI picks the right categories, no keyword guessing
- **Stack enrichment** — Redis in your stack? Cache skill auto-included. Python + FastAPI? AI skill added.
- **GitHub discovery** — Finds relevant MCP servers, skills, and projects beyond the built-in catalog
- **Scoring algorithm** — Ranks GitHub results by popularity, freshness, official status, license, activity

## Development

```bash
npm install
npm run build
npm test          # 157 tests
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
