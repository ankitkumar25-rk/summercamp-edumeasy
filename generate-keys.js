const crypto = require('crypto');

// Generate a 32-byte key for PASETO (64 characters in hex)
const pasetoSecretKey = crypto.randomBytes(32).toString('hex');

// Generate a 32-byte key for Refresh Tokens (64 characters in hex)
const refreshTokenSecret = crypto.randomBytes(32).toString('hex');

console.log('\n🔒 --- Generated Security Keys ---\n');

console.log('1. Add this to your .env file as PASETO_SECRET_KEY:');
console.log(pasetoSecretKey);
console.log('\n----------------------------------\n');

console.log('2. Add this to your .env file as REFRESH_TOKEN_SECRET:');
console.log(refreshTokenSecret);
console.log('\n----------------------------------\n');
console.log('Remember: Never commit your .env file to version control!\n');
