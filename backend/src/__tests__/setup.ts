import mongoose from 'mongoose';

beforeAll(async () => {
  // MONGODB_URI was set by global-setup.ts in main process before workers fork
  await mongoose.connect(process.env.MONGODB_URI as string);
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  // Clean all collections between tests for isolation.
  // Files run sequentially (sequence.concurrent=false) so cross-file
  // contamination is not a concern.
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
