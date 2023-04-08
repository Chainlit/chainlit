import { execSync, spawn } from "child_process";
import { join } from "path";

const ROOT = process.cwd();
const EXAMPLES_DIR = join(ROOT, "examples");
const CHAINLIT_DIR = join(ROOT, "src");
const FRONTEND_DIR = join(CHAINLIT_DIR, "chainlit", "frontend");

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

export function runCypressSpec(example: string) {
  return runCommand(`npx cypress run --spec cypress/e2e/${example}.cy.ts`);
}

export async function runChainlit(example: string) {
  return new Promise((resolve, reject) => {
    const example_dir = join(EXAMPLES_DIR, example);
    const example_file = "main.py";

    const child = spawn("chainlit", ["run", example_file, "-h"], {
      cwd: example_dir,
      env: process.env,
    });

    setTimeout(() => {
      resolve(child);
    }, 3000);

    child.stderr.on("data", (data) => {
      reject(data.toString());
    });

    child.on("exit", function (code?: number) {
      reject("child process exited with code " + code?.toString());
    });
  });
}
