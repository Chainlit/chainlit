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

export async function runTests(matchName) {
  // Cypress requires a healthcheck on the server at startup so let's run
  // Chainlit before running tests to pass the healthcheck
  runCommand('pnpm exec ts-node ./cypress/support/run.ts action');

  // Recording the cypress run is time consuming. Disabled by default.
  // const recordOptions = ` --record --key ${process.env.CYPRESS_RECORD_KEY} `;
  return runCommand(
    `pnpm exec cypress run --record false ${
      process.env.CYPRESS_OPTIONS || ''
    } --spec "cypress/e2e/${matchName}/spec.cy.ts"`
  );
}

export function runCommand(command: string, cwd = ROOT) {
  return execSync(command, {
    encoding: 'utf-8',
    cwd,
    env: process.env,
    stdio: 'inherit'
  });
}
