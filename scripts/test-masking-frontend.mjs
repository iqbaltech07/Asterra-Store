import assert from 'node:assert/strict';
import { maskCustomerName as maskUser, maskEmail as maskEmailUser } from '../frontend-user/src/lib/utils/masking.ts';
import { maskCustomerName as maskSales, maskEmail as maskEmailSales } from '../frontend-sales/src/lib/utils/masking.ts';
import { maskCustomerName as maskAdmin, maskEmail as maskEmailAdmin } from '../frontend-admin/src/lib/utils/masking.ts';

const funcs = [
  { name: 'frontend-user', maskName: maskUser, maskEmail: maskEmailUser },
  { name: 'frontend-sales', maskName: maskSales, maskEmail: maskEmailSales },
  { name: 'frontend-admin', maskName: maskAdmin, maskEmail: maskEmailAdmin },
];

for (const { name, maskName, maskEmail } of funcs) {
  console.log(`Testing ${name}...`);

  // 1. Mandatory examples
  assert.equal(maskName('H. Jaelani'), 'H. J******', `${name}: H. Jaelani failed`);
  assert.equal(maskName('Marchelino Kurniawan'), 'M********* K********', `${name}: Marchelino Kurniawan failed`);
  assert.equal(maskName('Budi'), 'B***', `${name}: Budi failed`);
  assert.equal(maskName('Ahmad Fauzi'), 'A**** F****', `${name}: Ahmad Fauzi failed`);

  // 2. Short and edge words
  assert.equal(maskName('B'), 'B*', `${name}: single letter failed`);
  assert.equal(maskName('Bo'), 'B*', `${name}: two letters failed`);
  assert.equal(maskName('M. Taufik'), 'M. T*****', `${name}: M. Taufik failed`);
  assert.equal(maskName('Siti-Nur'), 'S***-N**', `${name}: hyphenated failed`);

  // 3. Excess whitespace & empty/null
  assert.equal(maskName('   H.    Jaelani   '), 'H. J******', `${name}: excess whitespace failed`);
  assert.equal(maskName(''), '', `${name}: empty string failed`);
  assert.equal(maskName(null), '', `${name}: null failed`);
  assert.equal(maskName(undefined), '', `${name}: undefined failed`);
  assert.equal(maskName(12345), '1****', `${name}: number failed`);

  // 4. Idempotency (prevent double masking)
  assert.equal(maskName('H. J******'), 'H. J******', `${name}: idempotency 1 failed`);
  assert.equal(maskName('M********* K********'), 'M********* K********', `${name}: idempotency 2 failed`);
  assert.equal(maskName('B***'), 'B***', `${name}: idempotency 3 failed`);

  // 5. Email masking
  assert.equal(maskEmail('customer@gmail.com'), 'cu***@gmail.com', `${name}: email 1 failed`);
  assert.equal(maskEmail('a@domain.com'), 'a***@domain.com', `${name}: email 2 failed`);
  assert.equal(maskEmail(''), '', `${name}: empty email failed`);
  assert.equal(maskEmail(null), '', `${name}: null email failed`);

  console.log(`✓ ${name} passed all masking assertions!`);
}

console.log('\n======================================================');
console.log('ALL FRONTEND MASKING TESTS PASSED (100% CANONICAL)');
console.log('======================================================');
