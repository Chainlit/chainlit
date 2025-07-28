import { ChildProcessWithoutNullStreams } from 'child_process';
import { defineConfig } from 'cypress';

import { runChainlit } from './cypress/support/run';

let chainlit: ChildProcessWithoutNullStreams;

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
    baseUrl: 'http://127.0.0.1:8000',
    async setupNodeEvents(on, config) {
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
