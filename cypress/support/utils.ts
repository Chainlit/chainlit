import { execSync, spawn } from "child_process";
import { join } from "path";
import { readdirSync, existsSync } from "fs";

const ROOT = process.cwd();
const E2E_DIR = join(ROOT, "cypress/e2e");
const CHAINLIT_DIR = join(ROOT, "src");
const FRONTEND_DIR = join(CHAINLIT_DIR, "chainlit", "frontend");

const candidateFiles = ["main.py", "main_sync.py", "main_async.py"];

export async function runTest(test: string) {
  const testDir = join(E2E_DIR, test);
  const variants = candidateFiles.filter((file) =>
    existsSync(join(testDir, file))
  );

  for (const file of variants) {
    let childProcess;
    console.log(`Running spec "${test}" with chainlit file "${file}"`);
    try {
      childProcess = await runChainlit(testDir, file);
      runSpec(test);
    } finally {
      childProcess?.kill();
    }
  }
}

export async function runTests() {
  for (const test of readdirSync(E2E_DIR)) {
    await runTest(test);
  }
}

function runCommand(command: string, cwd = ROOT) {
  return execSync(command, {
    encoding: "utf-8",
    cwd,
    env: process.env,
    stdio: "inherit",
  });
}

export function installChainlit() {
  runCommand("npm run build", FRONTEND_DIR);
  runCommand("pip3 install -e ./src");
}

export function runSpec(test: string) {
  return runCommand(`npx cypress run --spec cypress/e2e/${test}/spec.cy.ts`);
}

export async function runChainlit(dir: string, file: string) {
  return new Promise((resolve, reject) => {
    // Headless + CI mode
    const child = spawn("chainlit", ["run", file, "-h", "-c"], {
      cwd: dir,
      env: process.env,
      stdio: "inherit",
    });

    setTimeout(() => {
      // todo listen for stdout. passing process.env makes stdout silent for some reason.
      resolve(child);
    }, 4000);

    child.stderr?.on("data", (data) => {
      reject(data.toString());
    });

    child.on("error", (error) => {
      reject(error.message);
    });

    child.on("exit", function (code) {
      reject("child process exited with code " + code);
    });
  });
}
