import * as dotenv from "dotenv";
dotenv.config();
import { installChainlit, runTests } from "./utils";

async function main() {
  const matchName = process.env.SINGLE_TEST || "*";
  const skipBuild = process.env.SKIP_BUILD;

  if (!skipBuild) {
    await installChainlit();
  }
  await runTests(matchName);
}

main()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
