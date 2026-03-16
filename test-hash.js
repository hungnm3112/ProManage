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
const expectedHash = '20b479dd366e1174ea7cc040373a2592c602c62b49287a8fda9998b7c5a70c1917fcb37c231cbda987d9252e12fb8e985dabbc1e70833e272f19472e2ffe129f';

console.log('Password:', password);
console.log('Expected hash:', expectedHash);
console.log('Expected hash length:', expectedHash.length, 'chars\n');

// Test với các Salt khác nhau để tìm ra Salt đúng
const possibleSalts = [
  '',           // No salt
  '24h',
  'suachualaptop24h',
  '24hfs',
  'hethong',
  '18900519',   // Example salt from code
];

console.log('Testing different salts:\n');
possibleSalts.forEach(salt => {
  const hash = hashPassword(password, salt);
  const match = hash === expectedHash;
  console.log(`Salt: "${salt}"`);
  console.log(`Hash: ${hash}`);
  console.log(`Match: ${match ? '✅ YES!' : '❌ No'}\n`);
});

// Reverse test - nếu không có salt nào match, có thể salt được lưu trong DB
console.log('\n=== INSTRUCTIONS ===');
console.log('Nếu không có salt nào match ở trên:');
console.log('1. Kiểm tra cột "Salt" trong Navicat cho employee Phone = 0392029548');
console.log('2. Chạy: node test-hash.js <salt-value>');
console.log('3. VD: node test-hash.js "abc12345"\n');

// Allow salt from command line
if (process.argv[2]) {
  const customSalt = process.argv[2];
  console.log('\n=== CUSTOM SALT TEST ===');
  console.log('Password:', password);
  console.log('Salt:', customSalt);
  const hash = hashPassword(password, customSalt);
  console.log('Hash:', hash);
  console.log('Match:', hash === expectedHash ? '✅ YES!' : '❌ No');
}
