import * as dotenv from "dotenv";
dotenv.config();
import { installChainlit, runTests, runTest } from "./utils";

async function main() {
  const singleTest = process.env.SINGLE_TEST;
  await installChainlit();

  if (singleTest) {
    await runTest(singleTest);
  } else {
    await runTests();
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
