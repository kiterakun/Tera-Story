import { generateImage } from '../agents/imageAgent';
import { UserSettings } from '../models/UserSettings';
import { createUserProviderRegistry } from '../providers/registry';

interface ImageJob {
  description: string;
  entityType: 'character' | 'item' | 'special-item' | 'world';
  entityId: string;
  userId: string;
}

const queue: ImageJob[] = [];
let processing = false;

/**
 * Queue an image generation job. Non-blocking — returns immediately.
 */
export function queueImageGeneration(
  description: string,
  entityType: 'character' | 'item' | 'special-item' | 'world',
  entityId: string,
  userId: string
): void {
  queue.push({ description, entityType, entityId, userId });
  if (!processing) {
    processQueue();
  }
}

async function processQueue(): Promise<void> {
  processing = true;

  while (queue.length > 0) {
    const job = queue.shift()!;
    try {
      const settings = await UserSettings.findOne({ userId: job.userId });
      if (!settings) {
        console.error(`Image queue: no settings found for user ${job.userId}`);
        continue;
      }

      const registry = createUserProviderRegistry(settings.aiSettings);
      const imageConfig = registry.getImageConfig();

      await generateImage(job.description, job.entityType, job.entityId, imageConfig);
    } catch (e) {
      console.error('Image queue error:', e);
    }
  }

  processing = false;
}
