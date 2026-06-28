import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    globalSetup: ['./src/__tests__/global-setup.ts'],
    setupFiles: ['./src/__tests__/setup.ts'],
    // Run test files one at a time — all files share the same in-memory MongoDB
    sequence: { concurrent: false },
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long!!',
      ENCRYPTION_KEY: 'test-encryption-key-at-least-32-chars-long!!',
      FRONTEND_URL: 'http://localhost:5173',
      // Tests use the local disk fallback for image storage; never hit real Cloudinary.
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
    },
    // Timeout for integration tests (mongo, network)
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
