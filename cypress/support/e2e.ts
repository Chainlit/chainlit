import * as dotenv from "dotenv";
dotenv.config();
import { installChainlit, runTests, runTest } from "./utils";

async function main() {
  const args = process.argv.slice(2);

  const singleTestArg = args.find((arg) => arg.startsWith("--test="));
  const singleTest = singleTestArg.split("=")[1];

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
