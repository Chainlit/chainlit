import { ChildProcessWithoutNullStreams } from 'child_process';
import { defineConfig } from 'cypress';
import fkill from 'fkill';
import { platform } from 'os';

import { runChainlit } from './cypress/support/run';

export const CHAINLIT_APP_PORT = 8000;

let chainlit: ChildProcessWithoutNullStreams;

function killChainlit() {
  if (chainlit) {
    if (platform() === 'win32') {
      chainlit.stdin.destroy();
      chainlit.stdout.destroy();
      chainlit.stderr.destroy();
    }
    chainlit.kill();
  }
}

['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGBREAK'].forEach((signal) => {
  process.on(signal, () => {
    if (chainlit) {
      killChainlit(); // Ensure Chainlit is killed on exit
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
      await fkill(`:${CHAINLIT_APP_PORT}`, { silent: true }); // Fallback to ensure no previous instance is running

      chainlit = await runChainlit();

      on('before:spec', async (spec) => {
        if (chainlit) {
          killChainlit();
        }
        chainlit = await runChainlit(spec);
      });

      on('after:spec', () => {
        if (chainlit) {
          killChainlit();
        }
      });

      on('after:run', () => {
        if (chainlit) {
          killChainlit();
        }
      });

      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        restartChainlit(spec: Cypress.Spec) {
          if (chainlit) {
            killChainlit();
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
