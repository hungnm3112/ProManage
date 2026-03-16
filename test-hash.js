/**
 * Test Password Hashing
 * 
 * Kiểm tra logic hash HMAC-SHA512 + Salt
 */

const crypto = require('crypto');

function hashPassword(password, salt) {
  const hash = crypto.createHmac('sha512', salt);
  hash.update(password);
  return hash.digest('hex');
}

// Test cases
console.log('=== PASSWORD HASH TEST ===\n');

const password = 'hethong24hfs123';
const salt = '18900519';
const expectedHash = '20b479dd366e1174ea7cc040373a2592c602c62b49287a8fda9998b7c5a70c1917fcb37c231cbda987d9252e12fb8e985dabbc1e70833e272f19472e2ffe129f';

console.log('Password:', password);
console.log('Salt:', salt);
console.log('Expected hash from DB:', expectedHash);
console.log('Expected hash length:', expectedHash.length, 'chars\n');

// Compute hash
const computed = hashPassword(password, salt);
console.log('Computed hash:', computed);
console.log('Match:', computed === expectedHash ? '✅ YES!' : '❌ No');
console.log('');

// Allow custom testing from command line
if (process.argv[2] && process.argv[3]) {
  const customPassword = process.argv[2];
  const customSalt = process.argv[3];
  console.log('\n=== CUSTOM TEST ===');
  console.log('Password:', customPassword);
  console.log('Salt:', customSalt);
  const hash = hashPassword(customPassword, customSalt);
  console.log('Hash:', hash);
  console.log('');
}

console.log('Usage: node test-hash.js [password] [salt]');
console.log('Example: node test-hash.js "mypassword" "12345678"');

