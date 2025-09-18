import { defineConfig } from 'cypress';
import fkill from 'fkill';

import { runChainlit } from './cypress/support/run';

export const CHAINLIT_APP_PORT = 8000;

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
      // Ensure the spawned Chainlit uses a known free port
      process.env.CHAINLIT_PORT = String(CHAINLIT_APP_PORT);
      await killChainlit(); // Fallback to ensure no previous instance is running
      await runChainlit(); // Start Chainlit before running tests as Cypress require

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
