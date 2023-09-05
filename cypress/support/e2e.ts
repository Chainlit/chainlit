import * as dotenv from 'dotenv';

import { runTests } from './utils';

dotenv.config();

async function main() {
  const matchName = process.env.SINGLE_TEST || '*';

  await runTests(matchName);
}

main()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
