import crypto from 'crypto';
import { encrypt, decrypt } from '../../services/encryption';
import { env } from '../../config/env';

function legacyEncrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(env.ENCRYPTION_KEY.slice(0, 32));
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

describe('encryption service', () => {
  const plaintexts = [
    'hello',
    'ąćęłńóśźż 中文',
    'a'.repeat(1000),
    JSON.stringify({ secret: 'value', nested: { key: 1 } }),
    '',
  ];

  it.each(plaintexts)('encrypt then decrypt returns original: %s', (text) => {
    const encrypted = encrypt(text);
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toBe(text);
    // Versioned AES-GCM envelope: v2:<iv>:<tag>:<ciphertext>
    expect(encrypted.split(':').length).toBe(4);
    expect(encrypted.startsWith('v2:')).toBe(true);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  it('produces different ciphertext for same plaintext (random IV)', () => {
    const text = 'same plaintext';
    const c1 = encrypt(text);
    const c2 = encrypt(text);
    expect(c1).not.toBe(c2);
    expect(decrypt(c1)).toBe(text);
    expect(decrypt(c2)).toBe(text);
  });

  it('decrypt returns plaintext for backward compatibility if no colon present', () => {
    expect(decrypt('not-valid')).toBe('not-valid');
  });

  it('decrypt reads legacy AES-CBC ciphertext for migration compatibility', () => {
    const text = 'legacy secret';
    const legacyCiphertext = legacyEncrypt(text);

    expect(legacyCiphertext).not.toBe(text);
    expect(legacyCiphertext.startsWith('v2:')).toBe(false);
    expect(decrypt(legacyCiphertext)).toBe(text);
  });

  it('decrypt rejects tampered AES-GCM ciphertext', () => {
    const encrypted = encrypt('tamper me');
    const parts = encrypted.split(':');
    parts[3] = `${parts[3]?.slice(0, -2)}00`;

    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  it('decrypt throws for malformed encrypted input', () => {
    expect(() => decrypt(':')).toThrow();
    expect(() => decrypt('abc:def')).toThrow();
    expect(() => decrypt('v2:abc:def')).toThrow();
  });
});
