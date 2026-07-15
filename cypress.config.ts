import { ChildProcessWithoutNullStreams } from 'child_process';
import { defineConfig } from 'cypress';
import cypressSplit from 'cypress-split';
import fkill from 'fkill';
import { createServer } from 'net';

import { runChainlit } from './cypress/support/run';

export const CHAINLIT_APP_PORT = 8000;

// Track the running Chainlit process so we can kill the entire process group
// (uv → chainlit → uvicorn) rather than just the uvicorn socket owner.
let chainlitProcess: ChildProcessWithoutNullStreams | null = null;

/**
 * Poll until the given port is free (no process listening).
 * Prevents EADDRINUSE / [Errno 48] when the OS has not yet released
 * the socket after killing the process.
 */
async function waitForPortFree(port: number, timeoutMs = 10000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const free = await new Promise<boolean>((resolve) => {
      const server = createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      server.listen(port, '127.0.0.1');
    });
    if (free) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Port ${port} not free after ${timeoutMs}ms`);
}

async function killChainlit() {
  // Kill the entire process group (uv + chainlit + uvicorn workers).
  // Requires spawn() to use detached: true in run.ts.
  if (chainlitProcess?.pid) {
    try {
      process.kill(-chainlitProcess.pid, 'SIGKILL');
    } catch {
      // Process may have already exited — ignore
    }
    chainlitProcess = null;
  }
  // Fallback: catch any orphan that slipped through
  await fkill(`:${CHAINLIT_APP_PORT}`, {
    force: true,
    silent: true
  });
  await waitForPortFree(CHAINLIT_APP_PORT);
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
      chainlitProcess = await runChainlit(); // Start Chainlit before running tests as Cypress require

      on('before:spec', async (spec) => {
        await killChainlit();
        chainlitProcess = await runChainlit(spec);
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
              runChainlit(spec).then((proc) => {
                chainlitProcess = proc;
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
