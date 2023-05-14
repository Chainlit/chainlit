import { execSync, spawn } from "child_process";
import { join } from "path";
import { readdirSync } from "fs";

const ROOT = process.cwd();
const E2E_DIR = join(ROOT, "cypress/e2e");
const CHAINLIT_DIR = join(ROOT, "src");
const FRONTEND_DIR = join(CHAINLIT_DIR, "chainlit", "frontend");

export async function runTest(test: string) {
  let childProcess;
  try {
    console.log("Running:", test);
    childProcess = await runChainlit(test);
    runSpec(test);
  } finally {
    childProcess?.kill();
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
  runCommand("pip3 install ./src");
}

export function runSpec(test: string) {
  return runCommand(`npx cypress run --spec cypress/e2e/${test}/spec.cy.ts`);
}

export async function runChainlit(test: string) {
  return new Promise((resolve, reject) => {
    const testDir = join(E2E_DIR, test);
    const file = "main.py";

    // Headless + CI mode
    const child = spawn("chainlit", ["run", file, "-h", "-c"], {
      cwd: testDir,
      env: process.env,
      stdio: "inherit",
    });

    setTimeout(() => {
      // todo listen for stdout. passing process.env makes stdout silent for some reason.
      resolve(child);
    }, 3000);

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
