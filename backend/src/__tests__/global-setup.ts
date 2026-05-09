import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export async function setup(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
}

export async function teardown(): Promise<void> {
  if (mongoServer) {
    await mongoServer.stop();
  }
}
