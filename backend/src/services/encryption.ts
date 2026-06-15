import crypto from 'crypto';
import { env } from '../config/env';

const LEGACY_ALGO = 'aes-256-cbc';
const GCM_ALGO = 'aes-256-gcm';
const VERSION = 'v2';
const LEGACY_KEY = Buffer.from(env.ENCRYPTION_KEY.slice(0, 32));
const GCM_KEY = crypto.createHash('sha256').update(env.ENCRYPTION_KEY, 'utf8').digest();
const GCM_IV_BYTES = 12;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(GCM_IV_BYTES);
  const cipher = crypto.createCipheriv(GCM_ALGO, GCM_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

function decryptV2(parts: string[]): string {
  const [, ivHex, tagHex, dataHex] = parts;
  if (!ivHex || !tagHex || dataHex === undefined) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(GCM_ALGO, GCM_KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

function decryptLegacy(encryptedText: string): string {
  const [ivHex, dataHex] = encryptedText.split(':');
  if (!ivHex || !dataHex) {
    throw new Error('Invalid encrypted text format');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(LEGACY_ALGO, LEGACY_KEY, iv);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

export function decrypt(encryptedText: string): string {
  // If not in a versioned or legacy "iv:data" format, treat as plaintext (backward compat)
  if (!encryptedText.includes(':')) {
    return encryptedText;
  }

  const parts = encryptedText.split(':');
  if (parts[0] === VERSION) {
    return decryptV2(parts);
  }

  return decryptLegacy(encryptedText);
}
