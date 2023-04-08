import * as dotenv from "dotenv";
dotenv.config();
import { installChainlit, runChainlit, runCypressSpec } from "./utils";

const examples = ["lc_qa"];

async function runTest(example: string) {
  let childProcess;
  try {
    childProcess = await runChainlit(example);
    runCypressSpec(example);
  } finally {
    childProcess?.kill();
  }
}

async function main() {
  await installChainlit();
  for (const example of examples) {
    console.log("Running example:", example);
    await runTest(example);
  }
}

main();
