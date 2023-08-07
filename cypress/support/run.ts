import { join } from "path";
import { spawn } from "child_process";
import sh from "shell-exec";
import { existsSync, unlinkSync } from "fs";
import * as kill from "kill-port";
import { CHAINLIT_DIR, CHAINLIT_PORT, E2E_DIR, ExecutionMode, runCommand } from "./utils";

interface CmdResult {
  stdout: string;
  stderr: string;
}

const killPort = async (port: number): Promise<CmdResult> => {
  if (process.platform === 'win32') return kill(port)
  
  return sh(`lsof -nPi :${port}`)
    .then(res => {
      const { stdout } = res
      if (!stdout) return Promise.reject(`No process running on port ${port}`)
      return sh(
        `lsof -nPi :${port} | grep 'LISTEN' | awk '{print $2}' | xargs kill -9`
      )
    })
}

function cleanLocalData(testDir: string) {
  if (existsSync(join(testDir, ".chainlit/chat_files"))) {
    runCommand("rm -rf .chainlit/chat_files", testDir)
  }
  if (existsSync(join(testDir, ".chainlit/chat.db"))) {
    unlinkSync(join(testDir, ".chainlit/chat.db"));
  }
}

export const runChainlitForTest =  async (testName: string, mode: ExecutionMode) => {
  try {
    await killPort(CHAINLIT_PORT)
    console.log(`Process on port ${CHAINLIT_PORT} killed`)
  } catch (error) {
    console.log(`Could not kill process on port ${CHAINLIT_PORT}. ${error}.`)
  }
  return new Promise((resolve, reject) => {

    const dir = join(E2E_DIR, testName);
    let file = "main.py"
    if (mode === ExecutionMode.Async) file = "main_async.py"
    if (mode === ExecutionMode.Sync) file = "main_sync.py"

    cleanLocalData(dir);

    // Headless + CI mode
    const options = [
      "run",
      "-C",
      CHAINLIT_DIR,
      "chainlit",
      "run",
      file,
      "-h",
      "-c",
    ];

    const server = spawn("poetry", options, {
      cwd: dir,
    });

    server.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
      if (data.toString().includes("Your app is available at")) {
        resolve(server);
      }
    });

    server.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    server.on("error", (error) => {
      reject(error.message);
    });

    server.on("exit", function (code) {
      reject("child process exited with code " + code);
    });
  });
}

runChainlitForTest(process.argv[2], process.argv[3] as ExecutionMode)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
