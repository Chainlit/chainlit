import { defineConfig } from 'cypress';
import fkill from 'fkill';

import { runChainlit, stopChainlit } from './cypress/support/run';

export const CHAINLIT_APP_PORT = 8000;

const signals = ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGBREAK'] as const;
type ExitSignal = (typeof signals)[number];

const signalMap: Record<ExitSignal, number> = {
  SIGTERM: 15,
  SIGINT: 2,
  SIGHUP: 1,
  SIGBREAK: 21
};

async function killChainlit() {
  const stoppedTracked = await stopChainlit();

  if (!stoppedTracked) {
    try {
      await fkill(`:${CHAINLIT_APP_PORT}`, { force: true, silent: true });
    } catch {
      // best-effort cleanup only
    }
  }
}

signals.forEach((signal) => {
  process.on(signal, async () => {
    await killChainlit(); // Ensure Chainlit is killed on exit
    process.exit(128 + signalMap[signal]);
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
      await killChainlit(); // Fallback to ensure no previous instance is running
      await runChainlit(); // Start Chainlit before running tests as Cypress requires

      on('before:spec', async (spec) => {
        await killChainlit();
        await runChainlit(spec);
      });

      on('after:spec', async () => {
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
          return killChainlit()
            .then(() => runChainlit(spec))
            .then(() => new Promise((r) => setTimeout(r, 1000)))
            .then(() => null);
        }
      });

      return config;
    }
  }
});
