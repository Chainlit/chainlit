import { execSync } from 'child_process';
import { join } from 'path';

const ROOT = process.cwd();
export const E2E_DIR = join(ROOT, 'cypress/e2e');
export const BACKEND_DIR = join(ROOT, 'backend');
export const CHAINLIT_PORT = 8000;

export enum ExecutionMode {
  Async = 'async',
  Sync = 'sync'
}

export async function runTests(matchName: string) {
  // Run Chainlit before running tests to pass the healthcheck
  runCommand(['pnpm', 'exec', 'ts-node', './cypress/support/run.ts', 'action']);

  // Command and arguments are passed as an array to prevent injection
  return runCommand([
    'pnpm', 'exec', 'cypress', 'run', '--record', 'false', '--spec', `cypress/e2e/${matchName}/spec.cy.ts`
  ]);
}

export function runCommand(args: string[], cwd = ROOT) {
  return execFileSync(args[0], args.slice(1), {
    encoding: 'utf-8',
    cwd,
    env: process.env,
    stdio: 'inherit'
  });
}
