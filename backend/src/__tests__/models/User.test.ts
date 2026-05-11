import bcrypt from 'bcryptjs';
import { User } from '../../models/User';

describe('User model', () => {
  const validUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'secret123',
  };

  beforeAll(async () => {
    await User.syncIndexes();
  });

  it('creates user with valid fields', async () => {
    const user = await User.create(validUser);
    expect(user._id).toBeDefined();
    expect(user.username).toBe('testuser');
    expect(user.email).toBe('test@example.com');
    // password should be hashed, not stored as plaintext
    expect(user.password).not.toBe('secret123');
  });

  it('fails when username is missing', async () => {
    await expect(
      User.create({ email: 'a@b.com', password: '123456' }),
    ).rejects.toThrow(/username/);
  });

  it('fails when username is shorter than 3 chars', async () => {
    await expect(
      User.create({ username: 'ab', email: 'ab@c.com', password: '123456' }),
    ).rejects.toThrow(/minimum.*length.*3/i);
  });

  it('fails when password is shorter than 6 chars', async () => {
    await expect(
      User.create({ username: 'validname', email: 'a@b.com', password: '12345' }),
    ).rejects.toThrow(/minimum.*length.*6/i);
  });

  it('fails on duplicate username', async () => {
    await User.create({ username: 'uniqueuser', email: 'a@test.com', password: 'password123' });
    await expect(
      User.create({ username: 'uniqueuser', email: 'b@test.com', password: 'password123' }),
    ).rejects.toThrow(/duplicate key/i);
  });

  it('fails on duplicate email', async () => {
    await User.create({ username: 'userA', email: 'dup@test.com', password: 'password123' });
    await expect(
      User.create({ username: 'userB', email: 'dup@test.com', password: 'password123' }),
    ).rejects.toThrow(/duplicate key/i);
  });

  it('trims username whitespace', async () => {
    const user = await User.create({ username: '  trimmed  ', email: 'trim@test.com', password: 'password123' });
    expect(user.username).toBe('trimmed');
  });

  it('lowercases email', async () => {
    const user = await User.create({ username: 'emailcase', email: 'UPPER@Test.Com', password: 'password123' });
    expect(user.email).toBe('upper@test.com');
  });

  it('hashes password on save', async () => {
    const user = await User.create(validUser);
    const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
    expect(isHashed).toBe(true);
    const valid = await bcrypt.compare('secret123', user.password);
    expect(valid).toBe(true);
  });

  it('does not re-hash password when not modified', async () => {
    const user = await User.create(validUser);
    const hashAfterCreate = user.password;
    user.username = 'newusername';
    await user.save();
    expect(user.password).toBe(hashAfterCreate);
  });

  it('comparePassword returns true for correct password', async () => {
    const user = await User.create(validUser);
    const result = await user.comparePassword('secret123');
    expect(result).toBe(true);
  });

  it('comparePassword returns false for wrong password', async () => {
    const user = await User.create(validUser);
    const result = await user.comparePassword('wrongpassword');
    expect(result).toBe(false);
  });

  it('toPublicJSON excludes password', async () => {
    const user = await User.create(validUser);
    const publicData = user.toPublicJSON();
    expect(publicData).toHaveProperty('id');
    expect(publicData).toHaveProperty('username', 'testuser');
    expect(publicData).toHaveProperty('email', 'test@example.com');
    expect(publicData).toHaveProperty('createdAt');
    expect(publicData).toHaveProperty('updatedAt');
    expect(publicData).not.toHaveProperty('password');
  });

  it('sets timestamps onCreate', async () => {
    const user = await User.create(validUser);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
});
