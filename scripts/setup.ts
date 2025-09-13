#!/usr/bin/env bun
import { readFileSync, writeFileSync, existsSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';

// Skip setup in CI environments
if (process.env.CI || process.env.GITHUB_ACTIONS) {
  console.log('Skipping setup in CI environment');
  process.exit(0);
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

async function prompt(question: string): Promise<string> {
  const answer = globalThis.prompt(`${colors.cyan}? ${colors.reset}${question}`);
  return answer?.trim() || '';
}

async function confirm(question: string, defaultValue = false): Promise<boolean> {
  const suffix = defaultValue ? '(Y/n)' : '(y/N)';
  const answer = await prompt(`${question} ${suffix}`);
  if (!answer) return defaultValue;
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

async function main() {
  console.log(`\n${colors.bright}🚀 Welcome to Library Template Setup!${colors.reset}\n`);

  // Get package name
  const packageName = await prompt(
    'What should your package be called? (will be @lasercat/<name>)',
  );
  if (!packageName) {
    console.error(`${colors.yellow}Package name is required. Exiting...${colors.reset}`);
    process.exit(1);
  }

  // Get author name
  const authorName = await prompt("What's your name? (for author field)");
  if (!authorName) {
    console.error(`${colors.yellow}Author name is required. Exiting...${colors.reset}`);
    process.exit(1);
  }

  // Ask about npm publishing
  const publishToNpm = await confirm('Will this be published to npm?', false);

  console.log(`\n${colors.bright}Configuring your library...${colors.reset}\n`);

  // Update package.json
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  packageJson.name = `@lasercat/${packageName}`;
  packageJson.author = authorName;
  packageJson.version = '1.0.0';

  // Remove postinstall script
  if (packageJson.scripts?.postinstall) {
    delete packageJson.scripts.postinstall;
  }

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`${colors.green}✅${colors.reset} Updated package.json`);

  // Modify existing GitHub Actions workflow based on npm publishing choice
  const workflowPath = join(process.cwd(), '.github', 'workflows', 'ci-publish.yml');
  if (existsSync(workflowPath)) {
    let workflowContent = readFileSync(workflowPath, 'utf-8');

    if (!publishToNpm) {
      // Remove the npm publish step
      const lines = workflowContent.split('\n');
      const modifiedLines: string[] = [];
      let skipNextLines = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        if (skipNextLines > 0) {
          skipNextLines--;
          continue;
        }

        // Skip the publish step and its associated lines
        if (line.includes('- name: Publish to npm')) {
          // Skip this line and the next 4 lines (if, env, run)
          skipNextLines = 4;
          continue;
        }

        modifiedLines.push(line);
      }

      workflowContent = modifiedLines.join('\n');
      writeFileSync(workflowPath, workflowContent);
      console.log(`${colors.green}✅${colors.reset} Removed npm publishing from CI workflow`);
    } else {
      console.log(`${colors.green}✅${colors.reset} Kept npm publishing in CI workflow`);
      console.log(
        `${colors.yellow}⚠${colors.reset}  Remember to add NPM_TOKEN secret to your GitHub repository`,
      );
    }
  }

  // Clean up setup files
  console.log(`\n${colors.bright}Cleaning up...${colors.reset}\n`);

  // Remove this setup script
  rmSync(__filename, { force: true });
  console.log(`${colors.green}✅${colors.reset} Removed setup script`);

  // Remove scripts directory if empty
  const scriptsDir = join(process.cwd(), 'scripts');
  try {
    const files = readdirSync(scriptsDir);
    if (files.length === 0) {
      rmSync(scriptsDir, { recursive: true, force: true });
      console.log(`${colors.green}✅${colors.reset} Removed empty scripts directory`);
    }
  } catch {
    // Directory might not exist or might have other files
  }

  console.log(`\n${colors.green}${colors.bright}✨ Setup complete!${colors.reset}`);
  console.log(
    `\nYour library "${colors.cyan}@lasercat/${packageName}${colors.reset}" is ready for development.`,
  );
  console.log(`\nNext steps:`);
  console.log(`  1. Run ${colors.cyan}bun install${colors.reset} to install dependencies`);
  console.log(`  2. Start coding in ${colors.cyan}src/index.ts${colors.reset}`);
  console.log(`  3. Run ${colors.cyan}bun test${colors.reset} to run tests`);
  console.log(`  4. Run ${colors.cyan}bun run build${colors.reset} to build your library\n`);
}

main().catch(console.error);
