import { spawn } from 'child_process';
import * as kill from 'kill-port';
import { join } from 'path';
import sh from 'shell-exec';

import { BACKEND_DIR, CHAINLIT_PORT, E2E_DIR, ExecutionMode } from './utils';

interface CmdResult {
  stdout: string;
  stderr: string;
}

const killPort = async (port: number): Promise<CmdResult> => {
  if (process.platform === 'win32') return kill(port);

  return sh(`lsof -nPi :${port}`).then((res) => {
    const { stdout } = res;
    if (!stdout) return Promise.reject(`No process running on port ${port}`);
    return sh(
      `lsof -nPi :${port} | grep 'LISTEN' | awk '{print $2}' | xargs kill -9`
    );
  });
};

export const runChainlitForTest = async (
  testName: string,
  mode: ExecutionMode
) => {
  try {
    await killPort(CHAINLIT_PORT);
    console.log(`Process on port ${CHAINLIT_PORT} killed`);
  } catch (error) {
    console.log(`Could not kill process on port ${CHAINLIT_PORT}. ${error}.`);
  }
  return new Promise((resolve, reject) => {
    const dir = join(E2E_DIR, testName);
    let file = 'main.py';
    if (mode === ExecutionMode.Async) file = 'main_async.py';
    if (mode === ExecutionMode.Sync) file = 'main_sync.py';

    // Headless + CI mode
    const options = [
      'run',
      '-C',
      BACKEND_DIR,
      'chainlit',
      'run',
      file,
      '-h',
      '-c'
    ];

    const server = spawn('poetry', options, {
      cwd: dir
    });

    server.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      if (data.toString().includes('Your app is available at')) {
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    server.on('error', (error) => {
      reject(error.message);
    });

    server.on('exit', function (code) {
      reject('child process exited with code ' + code);
    });
  });
};

runChainlitForTest(process.argv[2], process.argv[3] as ExecutionMode)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
