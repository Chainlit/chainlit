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

  return new Promise((resolve, reject) => {
    (async () => {
      const testDir = spec ? dirname(spec.absolute) : CHAILIT_DIR;
      const entryPointFileName = spec
        ? spec.name.startsWith('async')
          ? 'main_async.py'
          : spec.name.startsWith('sync')
          ? 'main_sync.py'
          : 'main.py'
        : 'hello.py';

      const entryPointPath = join(testDir, entryPointFileName);

      try {
        await access(entryPointPath);
      } catch (_err) {
        reject(new Error(`Entry point file does not exist: ${entryPointPath}`));
        return;
      }

      // Prefer system uv and allow overrides via UV_PATH; ensure pipx path is in PATH
      const command = process.env.UV_PATH || 'uv';

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
          PATH: `${process.env.PATH}:${process.env.HOME}/.local/bin`,
          CHAINLIT_APP_ROOT: testDir,
          CHAINLIT_PORT: process.env.CHAINLIT_PORT || '8000'
        }
      };

      try {
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
      } catch (_err) {
        reject(_err instanceof Error ? _err : new Error(String(_err)));
      }
    })();
  });
};
