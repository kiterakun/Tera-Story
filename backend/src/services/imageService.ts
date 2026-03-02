import {
  generateImage,
  ImageJobDetails,
  WorldContext,
} from "../agents/imageAgent";
import { UserSettings } from "../models/UserSettings";
import { World } from "../models/World";
import { createUserProviderRegistry } from "../providers/registry";

type EntityType = "character" | "item" | "special-item" | "world";

interface ImageJob {
  entityDetails: ImageJobDetails;
  entityType: EntityType;
  entityId: string;
  worldId: string;
  userId: string;
}

const queue: ImageJob[] = [];
let processing = false;

/**
 * Queue an image generation job. Non-blocking — returns immediately.
 * Prompt is built internally by imageAgent from entity details + world context.
 */
export function queueImageGeneration(
  entityDetails: ImageJobDetails,
  entityType: EntityType,
  entityId: string,
  worldId: string,
  userId: string,
): void {
  queue.push({ entityDetails, entityType, entityId, worldId, userId });
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
        console.error(
          `Image queue: no settings found for user ${job.userId}`,
        );
        continue;
      }

      const registry = createUserProviderRegistry(settings.aiSettings);
      const imageConfig = registry.getImageConfig();

      // Load world context for genre/style matching
      let worldContext: WorldContext = {
        name: "Unknown World",
        description: "",
        genre: "custom",
      };

      const world = await World.findById(job.worldId).lean();
      if (world) {
        worldContext = {
          name: world.name,
          description: world.description || "",
          genre: world.genre,
        };
      } else if (job.entityType === "world") {
        // For world images where we can't find the World doc yet, use entity details
        worldContext = {
          name: job.entityDetails.name,
          description: job.entityDetails.description,
          genre: "custom",
        };
      }

      await generateImage(
        job.entityDetails,
        job.entityType,
        job.entityId,
        worldContext,
        imageConfig,
      );
    } catch (e) {
      console.error("Image queue error:", e);
    }
  }

  processing = false;
}
