#!/usr/bin/env node
// Smoke test: run a single DTI search.
//
//   node src/test-dti.js "MOOST BRAND"

import { dtiSearch } from './lib/dti.js';
import { closeBrowser } from './lib/browser.js';
import { balance } from './lib/captcha.js';

const query = process.argv[2];
if (!query) {
  console.error('usage: test-dti.js "<exact business name>"');
  process.exit(2);
}

(async () => {
  const bal = await balance();
  console.log(`2Captcha balance: $${bal}`);
  console.log(`\n=== DTI search: "${query}" ===`);
  const r = await dtiSearch(query);
  console.log('\nResult:');
  console.log(JSON.stringify(r, null, 2));
  await closeBrowser();
})();
