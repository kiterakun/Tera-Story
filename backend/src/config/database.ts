import mongoose from 'mongoose';
import { env } from './env';

let retryCount = 0;
const MAX_RETRIES = 5;

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('MongoDB connected successfully');
    retryCount = 0;
  } catch (error) {
    console.error(`MongoDB connection error (attempt ${retryCount + 1}):`, error);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDatabase();
    }
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});
