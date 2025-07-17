import { ChildProcess, spawn } from 'child_process';
import * as dotenv from 'dotenv';
import * as kill from 'kill-port';

import { runTests } from './utils';
import { CHAINLIT_PORT } from './utils';

dotenv.config();

async function main() {
  const matchName = process.env.SINGLE_TEST || '*';

  // Start the Chainlit server
  const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const server: ChildProcess = spawn(
    pnpmCmd,
    ['exec', 'ts-node', './cypress/support/run.ts', 'action'],
    { stdio: 'inherit' }
  );

  // Wait for the server to start
  await new Promise((resolve) => setTimeout(resolve, 5000));

  try {
    await runTests(matchName);
  } finally {
    if (server && server.kill) {
      server.kill('SIGKILL');
    }
    try {
      await kill(CHAINLIT_PORT);
    } catch (err) {
      console.log(`Could not kill port ${CHAINLIT_PORT}: ${err}`);
    }
  }
}

main()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
