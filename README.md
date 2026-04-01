# SkillForge

> Describe your project → get a complete AI agent team with MCP servers, curated skills, and step-by-step roadmap.

SkillForge is an MCP (Model Context Protocol) server that turns a single project description into a full implementation plan. It works inside any IDE that supports MCP — Cursor, Claude Code, Windsurf, Codex, and more.

## What it does

1. **You describe your project** — "veterinary clinic website with booking and payments"
2. **SkillForge returns a complete plan:**
   - MCP agents to install (from 60+ curated catalog + 37K on GitHub)
   - Ready-to-use AI skills with full instructions (auth, payments, database, design, security...)
   - Open source projects to reference or fork
   - All API keys needed with direct links
   - Step-by-step roadmap for your IDE agent

3. **One command installs everything** — `.mcp.json`, `.env.example`, `.cursorrules`, `CLAUDE.md`, `ROADMAP.md`

## Quick Start

### In Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "skillforge": {
      "command": "node",
      "args": ["path/to/skillforge/dist/index.js", "--mcp"],
      "env": {
        "GITHUB_TOKEN": "your_github_token"
      }
    }
  }
}
```

### In Claude Code

Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "skillforge": {
      "command": "node",
      "args": ["path/to/skillforge/dist/index.js", "--mcp"],
      "env": {
        "GITHUB_TOKEN": "your_github_token"
      }
    }
  }
}
```

Then ask your AI: **"Use skillforge_plan for [your project description]"**

## MCP Tools

| Tool | Description |
|------|-------------|
| `skillforge_plan` | **Main tool.** One request → complete plan with agents, skills, projects, API keys, roadmap |
| `skillforge_catalog` | Browse 60+ curated MCP agents across 24 categories |
| `skillforge_install` | Generate `.mcp.json`, `.env.example`, `.cursorrules`, `CLAUDE.md`, `ROADMAP.md` |
| `skillforge_explain` | Detailed info about any agent or category |
| `skillforge_discover` | Search 37K+ MCP servers on GitHub |
| `skillforge_skills` | Find AI skills: universal prompts, IDE-specific, domain expert |
| `skillforge_projects` | Find open source projects to fork or reference |

## 24 Agent Categories

auth, payments, database, ai, email, deploy, review, security, video, storage, analytics, monitoring, cms, search, cache, notifications, testing, communication, project-management, documents, browser, marketing, design, docs

## Built-in Skills

SkillForge includes 18+ curated skills with ready-to-use instructions:

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

Without skills, your AI spends thousands of tokens figuring out how to implement auth, structure a database, or set up Stripe. With SkillForge skills, it follows proven instructions — faster, cheaper, better.

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

MIT
