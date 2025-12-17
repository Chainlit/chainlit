import {
  type ChildProcessWithoutNullStreams,
  type SpawnOptionsWithoutStdio,
  spawn
} from 'node:child_process';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';

let currentChainlit: ChildProcessWithoutNullStreams | null = null;

/**
 * Kill a process tree on Windows using taskkill /T /F
 */
async function taskkillTree(pid: number): Promise<void> {
  await new Promise<void>((resolve) => {
    const p = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore'
    });

    p.on('exit', () => resolve());
    p.on('error', () => resolve()); // best-effort
  });

  // Give Windows time to release the port
  await sleep(750);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function stopChainlit(): Promise<boolean> {
  const proc = currentChainlit;
  if (!proc?.pid) return false;

  const pid = proc.pid;

  if (process.platform === 'win32') {
    // Windows: kill entire process tree
    await taskkillTree(pid);
  } else {
    // POSIX: kill process group (requires detached: true)
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      // ignore
    }

    await sleep(1500);

    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      // ignore
    }
  }

  currentChainlit = null;

  return true;
}

export const runChainlit = async (
  spec: Cypress.Spec | null = null
): Promise<ChildProcessWithoutNullStreams> => {
  const CHAILIT_DIR = join(process.cwd(), 'backend', 'chainlit');
  const SAMPLE_DIR = join(CHAILIT_DIR, 'sample');

  const testDir = spec ? dirname(spec.absolute) : SAMPLE_DIR;
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
  } catch {
    throw new Error(`Entry point file does not exist: ${entryPointPath}`);
  }

  return new Promise((resolve, reject) => {
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
      },
      detached: true
    };

    const chainlit = spawn(command, args, options);

    currentChainlit = chainlit;

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
      reject(error);
    });

    chainlit.on('exit', (code) => {
      reject(new Error('Chainlit process exited with code ' + code));
    });
  });
};
