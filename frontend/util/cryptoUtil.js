import crypto from 'crypto';
import 'dotenv/config';

const algorithm = 'aes-256-cbc';
const secret = process.env.CRYPTO_KEY;
if (!secret) {
  throw new Error('CRYPTO_KEY is not defined. Please set it in your environment or .env file.');
}
const key = crypto.createHash('sha256').update(secret).digest();

// Encrypts text and returns a string containing the IV and encrypted data.
export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  // Store IV with the encrypted data so that you can decrypt later.
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Decrypts text that was encrypted with the above function.
export function decrypt(encryptedText) {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
