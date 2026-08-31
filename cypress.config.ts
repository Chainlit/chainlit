import { defineConfig } from 'cypress';
import cypressSplit from 'cypress-split';
import fkill from 'fkill';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

import {
  RetriedTest,
  collectRetriedTests
} from './cypress/support/retryReport';
import { runChainlit } from './cypress/support/run';

export const CHAINLIT_APP_PORT = 8000;

// Per-shard record of tests that failed at least once but passed on retry,
// written after every spec so a killed job still leaves partial data behind.
const RETRY_REPORT_PATH = join(
  process.cwd(),
  'cypress',
  'reports',
  'retries.json'
);

async function killChainlit() {
  await fkill(`:${CHAINLIT_APP_PORT}`, {
    force: true,
    silent: true
  });
}

['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGBREAK'].forEach((signal) => {
  process.on(signal, () => {
    (async () => {
      await killChainlit(); // Ensure Chainlit is killed on exit

      const signalMap = { SIGTERM: 15, SIGINT: 2, SIGHUP: 1, SIGBREAK: 21 };
      process.exit(128 + (signalMap[signal] || 0));
    })();
  });
});

export default defineConfig({
  projectId: 'ij1tyk',

  retries: 3,

  viewportWidth: 1200,

  e2e: {
    defaultCommandTimeout: 30000,
    baseUrl: `http://127.0.0.1:${CHAINLIT_APP_PORT}`,
    experimentalInteractiveRunEvents: true,
    async setupNodeEvents(on, config) {
      cypressSplit(on, config);

      await killChainlit(); // Fallback to ensure no previous instance is running
      await runChainlit(); // Start Chainlit before running tests as Cypress require

      const retriedTests: RetriedTest[] = [];

      on('before:spec', async (spec) => {
        await killChainlit();
        await runChainlit(spec);
      });

      on('after:spec', async (spec, results) => {
        retriedTests.push(...collectRetriedTests(spec.relative, results.tests));
        await mkdir(dirname(RETRY_REPORT_PATH), { recursive: true });
        await writeFile(
          RETRY_REPORT_PATH,
          JSON.stringify(retriedTests, null, 2)
        );

        await killChainlit();
      });

      on('after:run', async () => {
        await killChainlit();
      });

      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        restartChainlit(spec: Cypress.Spec) {
          return new Promise((resolve) => {
            killChainlit().then(() => {
              runChainlit(spec).then(() => {
                setTimeout(() => {
                  resolve(null);
                }, 1000);
              });
            });
          });
        }
      });

      return config;
    }
  }
});
