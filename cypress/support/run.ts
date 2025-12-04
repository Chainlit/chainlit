import {
  ChildProcessWithoutNullStreams,
  SpawnOptionsWithoutStdio,
  spawn
} from 'child_process';
import { access } from 'fs/promises';
import { dirname, join } from 'path';

export const runChainlit = async (
  spec: Cypress.Spec | null = null
): Promise<ChildProcessWithoutNullStreams> => {
  const CHAILIT_DIR = join(process.cwd(), 'backend', 'chainlit');
  const SAMPLE_DIR = join(CHAILIT_DIR, 'sample');

  return new Promise((resolve, reject) => {
    const testDir = spec ? dirname(spec.absolute) : SAMPLE_DIR;
    const entryPointFileName = spec
      ? spec.name.startsWith('async')
        ? 'main_async.py'
        : spec.name.startsWith('sync')
        ? 'main_sync.py'
        : 'main.py'
      : 'hello.py';

    const entryPointPath = join(testDir, entryPointFileName);

    if (!access(entryPointPath)) {
      return reject(
        new Error(`Entry point file does not exist: ${entryPointPath}`)
      );
    }

    const command = 'uv';

    const args = [
      '--project',
      CHAILIT_DIR,
      'run',
      'chainlit',
      'run',
      entryPointPath,
      '-h',
      '--ci'
    ];

    const options: SpawnOptionsWithoutStdio = {
      env: {
        ...process.env,
        CHAINLIT_APP_ROOT: testDir
      }
    };

    const chainlit = spawn(command, args, options);

    chainlit.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Your app is available at')) {
        resolve(chainlit);
      }
    });

    chainlit.stderr.on('data', (data) => {
      console.error(`[Chainlit stderr] ${data}`);
    });

    chainlit.on('error', (error) => {
      reject(error.message);
    });

    chainlit.on('exit', function (code) {
      reject('Chainlit process exited with code ' + code);
    });
  });
};
