import * as crypto from 'crypto';

function generateJWTSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

console.log('Generated JWT Secret:');
console.log(generateJWTSecret());
console.log('\nAdd this to your .env.local file as JWT_SECRET')
