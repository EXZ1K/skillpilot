#!/usr/bin/env node

/**
 * SkillPilot CLI — точка входа.
 *
 * Использование:
 *   skillpilot init "B2B SaaS for invoice management"
 *   skillpilot init "ecommerce with AI chat" --yes
 *   skillpilot init "portfolio site" --dir ./my-project
 */

import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { printError } from "./lib/display.js";

// Если запущен с --mcp — работаем как MCP-сервер (без CLI)
if (process.argv.includes("--mcp")) {
  import("./mcp-server.js");
} else {

const program = new Command();

program
  .name("skillpilot")
  .description("Describe your project → get a full AI agent team")
  .version("0.1.0");

program
  .command("init")
  .description("Create an AI agent team for your project")
  .argument("<description>", "What are you building? (in quotes)")
  .option("-d, --dir <path>", "Target directory (default: current)")
  .option("-t, --github-token <token>", "GitHub token for higher API limits")
  .option("-y, --yes", "Accept all defaults without prompts")
  .action(async (description: string, options) => {
    try {
      await runInit(description, {
        dir: options.dir,
        githubToken: options.githubToken ?? process.env.GITHUB_TOKEN,
        yes: options.yes,
      });
    } catch (error) {
      printError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();

} // end of CLI mode
