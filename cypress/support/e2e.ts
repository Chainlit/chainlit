import * as dotenv from "dotenv";
dotenv.config();
import { installChainlit, runTests, runTest } from "./utils";

async function main() {
  const singleTest = process.env.SINGLE_TEST;
  const skipBuild = process.env.SKIP_BUILD;

  if (!skipBuild) {
    await installChainlit();
  }

  if (singleTest) {
    await runTest(singleTest);
  } else {
    await runTests();
  }
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
