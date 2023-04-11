import * as dotenv from "dotenv";
dotenv.config();
import { installChainlit, runChainlit, runCypressSpec } from "./utils";

const examples = ["ask_user", "openai_sql", "lc_mrkl", "lc_qa"];

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

main()
  .then(() => {
    console.log("Done!");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
