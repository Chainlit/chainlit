import { ChildProcessWithoutNullStreams } from 'child_process';
import { defineConfig } from 'cypress';
import fkill from 'fkill';

import { runChainlit } from './cypress/support/run';

export const CHAINLIT_APP_PORT = 8000;

let chainlit: ChildProcessWithoutNullStreams;

['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGBREAK'].forEach((signal) => {
  process.on(signal, () => {
    if (chainlit) {
      chainlit.kill();
    }

    const signalMap = { SIGTERM: 15, SIGINT: 2, SIGHUP: 1, SIGBREAK: 21 };
    process.exit(128 + (signalMap[signal] || 0));
  });
});

export default defineConfig({
  projectId: 'ij1tyk',

  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    }
  },

  retries: 3,

  viewportWidth: 1200,

  e2e: {
    defaultCommandTimeout: 30000,
    baseUrl: `http://127.0.0.1:${CHAINLIT_APP_PORT}`,
    async setupNodeEvents(on, config) {
      await fkill(`:${CHAINLIT_APP_PORT}`, { silent: true });

      chainlit = await runChainlit();

      on('before:spec', async (spec) => {
        if (chainlit) {
          chainlit.kill();
        }
        chainlit = await runChainlit(spec);
      });

      on('after:spec', () => {
        if (chainlit) {
          chainlit.kill();
        }
      });

      on('after:run', () => {
        if (chainlit) {
          chainlit.kill();
        }
      });

      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        restartChainlit(spec: Cypress.Spec) {
          if (chainlit) {
            chainlit.kill();
          }
          return new Promise((resolve) => {
            runChainlit(spec).then((newChainlit) => {
              chainlit = newChainlit;
              resolve(null);
            });
          });
        }
      });

      return config;
    }
  }
});
