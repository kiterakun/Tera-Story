import crypto from 'crypto';
import { encrypt, decrypt } from '../../services/encryption';

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
    // Must contain exactly one colon separator
    expect(encrypted.split(':').length).toBe(2);

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

  it('decrypt throws for malformed input', () => {
    expect(() => decrypt('not-valid')).toThrow();
    expect(() => decrypt(':')).toThrow();
    expect(() => decrypt('abc:def')).toThrow();
  });
});
