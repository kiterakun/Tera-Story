import { emitToUser } from "./sseManager";
import {
  generateImage,
  ImageJobDetails,
  WorldContext,
} from "../agents/imageAgent";
import { ImageTask } from "../models/ImageTask";
import { UserSettings } from "../models/UserSettings";
import { World } from "../models/World";
import { createUserProviderRegistry } from "../providers/registry";

type EntityType = "character" | "item" | "special-item" | "world" | "organization";

const MAX_RETRIES = 3;

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
  ImageTask.create({
    entityDetails,
    entityType,
    entityId,
    worldId,
    userId,
    status: "pending",
  })
    .then(() => processQueue())
    .catch((error: unknown) => {
      console.error("Image queue: failed to create task:", error);
    });
}

async function processQueue(): Promise<void> {
  const job = await claimNextPendingJob();
  if (!job) {
    return;
  }

  try {
    const settings = await UserSettings.findOne({ userId: job.userId });
    if (!settings) {
      throw new Error(`No settings found for user ${String(job.userId)}`);
    }

    const registry = createUserProviderRegistry(settings.aiSettings);
    const imageConfig = registry.getImageConfig();
    const worldContext = await buildWorldContext(job);

    await generateImage(
      job.entityDetails,
      job.entityType,
      job.entityId,
      worldContext,
      imageConfig,
    );

    await ImageTask.findByIdAndUpdate(job._id, {
      $set: { status: "completed" },
      $unset: { error: "" },
    });
  } catch (error) {
    await handleJobFailure(
      job._id,
      job.retryCount,
      getErrorMessage(error),
      String(job.userId),
      job.entityType,
      job.entityId,
    );
  }

  await processQueue();
}

async function claimNextPendingJob() {
  const now = new Date();

  return ImageTask.findOneAndUpdate(
    {
      status: "pending",
      $or: [{ nextRetryAt: null }, { nextRetryAt: { $lte: now } }],
    },
    { $set: { status: "processing" } },
    { sort: { createdAt: 1 }, returnDocument: "after" },
  );
}

async function buildWorldContext(job: {
  entityDetails: ImageJobDetails;
  entityType: EntityType;
  worldId: string;
}): Promise<WorldContext> {
  const world = await World.findById(job.worldId).lean();
  if (world) {
    return {
      name: world.name,
      description: world.description || "",
      genre: world.genre,
    };
  }

  if (job.entityType === "world") {
    return {
      name: job.entityDetails.name,
      description: job.entityDetails.description,
      genre: "custom",
    };
  }

  return {
    name: "Unknown World",
    description: "",
    genre: "custom",
  };
}

async function handleJobFailure(
  jobId: unknown,
  currentRetryCount: number,
  errorMessage: string,
  userId: string,
  entityType: string,
  entityId: string,
): Promise<void> {
  const nextRetryCount = currentRetryCount + 1;
  const timestamp = new Date().toISOString();

  // Idempotent guard: skip if another process already advanced this job
  const snapshot = await ImageTask.findById(jobId)
    .select("retryCount status")
    .lean();
  if (!snapshot || snapshot.retryCount > currentRetryCount) {
    return;
  }

  const basePayload = {
    entityType,
    entityId,
    error: errorMessage,
    retryCount: nextRetryCount,
    timestamp,
  };

  if (nextRetryCount < MAX_RETRIES) {
    const delayMs = Math.pow(2, currentRetryCount) * 1000;
    const nextRetryAt = new Date(Date.now() + delayMs);

    await ImageTask.findByIdAndUpdate(jobId, {
      $set: {
        status: "pending",
        error: errorMessage,
        retryCount: nextRetryCount,
        nextRetryAt,
      },
    });

    emitToUser(userId, "image:retry", {
      ...basePayload,
      nextRetryAt: nextRetryAt.toISOString(),
    });

    setTimeout(() => {
      processQueue().catch((error: unknown) => {
        console.error("Image queue retry error:", error);
      });
    }, delayMs);

    return;
  }

  await ImageTask.findByIdAndUpdate(jobId, {
    $set: {
      status: "failed",
      error: errorMessage,
      retryCount: nextRetryCount,
    },
  });

  emitToUser(userId, "image:failed", basePayload);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
