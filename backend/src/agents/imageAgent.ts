import fs from "fs";
import path from "path";
import { decrypt } from "../services/encryption";
import { IAgentConfig } from "../types/user.types";
import { emit } from "../services/sseManager";

export interface ImageErrorPayload {
  entityType: string;
  entityId: string;
  error: string;
  retryCount: number;
  nextRetryAt?: string;
  timestamp: string;
}

const UPLOADS_BASE = path.join(__dirname, "../../uploads/images");

// Ensure upload directories exist
fs.mkdirSync(path.join(UPLOADS_BASE, "character"), { recursive: true });
fs.mkdirSync(path.join(UPLOADS_BASE, "item"), { recursive: true });
fs.mkdirSync(path.join(UPLOADS_BASE, "special-item"), { recursive: true });
fs.mkdirSync(path.join(UPLOADS_BASE, "world"), { recursive: true });
fs.mkdirSync(path.join(UPLOADS_BASE, "organization"), { recursive: true });

type EntityType = "character" | "item" | "special-item" | "world" | "organization";

export interface ImageJobDetails {
  name: string;
  description: string;
  rarity?: string;
  category?: string;
}

export interface WorldContext {
  name: string;
  description: string;
  genre: string;
}

// ── Size per entity type ──────────────────────────────────────────────
// DALL-E 3: 1024x1024 | 1024x1792 | 1792x1024
// DALL-E 2 & many providers: 256x256 | 512x512 | 1024x1024
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getImageSize(_entityType: EntityType, _model: string): string {
  // const isDalle3 = model.includes("dall-e-3") || model.includes("dalle-3");

  // switch (entityType) {
  //   case "world":
  //     return isDalle3 ? "1792x1024" : "1024x1024"; // landscape panorama
  //   case "character":
  //     return "1024x1024"; // square portrait — needs detail
  //   case "item":
  //   case "special-item":
  //     return isDalle3 ? "1024x1024" : "512x512"; // icon — smallest available
  // }
  return "1024x1024"; // Use 1024x1024 for all types to maximize quality and compatibility
}

// ── Genre → visual style mapping ──────────────────────────────────────
const GENRE_STYLE_MAP: Record<string, string> = {
  fantasy:
    "high fantasy art style, medieval magical world, enchanted atmosphere",
  "sci-fi":
    "science fiction concept art, futuristic technology, neon-lit cyberpunk or space-age aesthetic",
  wuxia:
    "Chinese martial arts painting style, xianxia cultivation aesthetic, ink wash and ethereal atmosphere",
  modern:
    "contemporary realistic style, modern urban setting, photorealistic rendering",
  custom: "detailed digital art, rich atmospheric rendering",
};

// ── Centralized prompt builder ────────────────────────────────────────
function buildImagePrompt(
  entityDetails: ImageJobDetails,
  entityType: EntityType,
  worldContext: WorldContext,
): string {
  const genreStyle =
    GENRE_STYLE_MAP[worldContext.genre] || GENRE_STYLE_MAP.custom;
  const worldHint = worldContext.description
    ? `World setting: "${worldContext.name}" — ${worldContext.description.slice(0, 150)}.`
    : `World setting: "${worldContext.name}".`;

  switch (entityType) {
    case "character":
      return [
        `Character portrait, close-up bust shot facing the viewer: ${entityDetails.name}.`,
        entityDetails.description,
        worldHint,
        `Art direction: ${genreStyle}. Highly detailed digital painting, painterly style, dramatic lighting, RPG character illustration.`,
        "No text, no watermark, no frame, no UI elements.",
      ].join(" ");

    case "item":
      return [
        `Single item illustration, centered on dark background: ${entityDetails.name}.`,
        entityDetails.description,
        entityDetails.rarity
          ? `${entityDetails.rarity} tier quality glow.`
          : "",
        worldHint,
        `Art direction: ${genreStyle}. RPG inventory icon, dramatic lighting, detailed rendering.`,
        "No text, no watermark, no hands, no characters.",
      ]
        .filter(Boolean)
        .join(" ");

    case "special-item":
      return [
        `Magical ability icon, centered glowing effect on dark background: ${entityDetails.name}.`,
        entityDetails.description,
        entityDetails.category ? `Category: ${entityDetails.category}.` : "",
        entityDetails.rarity ? `${entityDetails.rarity} tier quality.` : "",
        worldHint,
        `Art direction: ${genreStyle}. Ethereal energy visualization, mystical RPG skill icon.`,
        "No text, no watermark, no characters.",
      ]
        .filter(Boolean)
        .join(" ");

    case "world":
      return [
        `Panoramic landscape vista of "${entityDetails.name}".`,
        entityDetails.description,
        `Genre: ${worldContext.genre}.`,
        `Art direction: ${genreStyle}. Epic scale, sweeping scenery, atmospheric lighting, concept art, cinematic composition.`,
        "No text, no watermark, no UI elements, no characters.",
      ].join(" ");

    case "organization":
      return [
        `Organization emblem, crest, or headquarters illustration: ${entityDetails.name}.`,
        entityDetails.description,
        worldHint,
        `Art direction: ${genreStyle}. Professional RPG banner or crest design, detailed rendering.`,
        "No text, no watermark, no UI elements.",
      ].join(" ");
  }
}

async function derivePlaythroughId(entityType: EntityType, entityId: string): Promise<string | undefined> {
  if (entityType === "character") {
    const { Character } = await import("../models/Character");
    const character = await Character.findById(entityId).select("playthroughId").lean();
    return character?.playthroughId?.toString();
  }

  if (entityType === "item") {
    const { Item } = await import("../models/Item");
    const item = await Item.findById(entityId).select("playthroughId").lean();
    return item?.playthroughId?.toString();
  }

  if (entityType === "special-item") {
    const { SpecialItem } = await import("../models/SpecialItem");
    const specialItem = await SpecialItem.findById(entityId).select("playthroughId").lean();
    return specialItem?.playthroughId?.toString();
  }

  if (entityType === "organization") {
    const { Organization } = await import("../models/Organization");
    const organization = await Organization.findById(entityId).select("playthroughId").lean();
    return organization?.playthroughId?.toString();
  }

  return undefined;
}

/**
 * Generate an image via DALL-E compatible API (fire-and-forget).
 * Prompt is built internally from entity details + world context.
 * Caller does NOT await — errors are logged, not thrown.
 */
export async function generateImage(
  entityDetails: ImageJobDetails,
  entityType: EntityType,
  entityId: string,
  worldContext: WorldContext,
  imageConfig: IAgentConfig,
): Promise<void> {
  try {
    const apiKey = imageConfig.apiKey ? decrypt(imageConfig.apiKey) : "";
    const baseUrl = imageConfig.baseUrl || "https://api.openai.com/v1";
    const endpoint = `${baseUrl.replace(/\/+$/, "")}/images/generations`;
    const model = imageConfig.model || "dall-e-3";

    const prompt = buildImagePrompt(entityDetails, entityType, worldContext);
    const size = getImageSize(entityType, model);

    console.log(
      `[Image] Generating entity=${entityType}/${entityId} size=${size} model=${model}`,
    );

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size,
        num_inference_steps: 4, // Mid-level steps for good quality without long wait
        response_format: "url",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const errorMsg = `Image API error (${response.status}): ${errorBody.slice(0, 200)}`;
      console.error(`[Image] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const result = (await response.json()) as {
      data: Array<{ url?: string; b64_json?: string }>;
    };

    const imageUrl = result.data?.[0]?.url;
    const b64Json = result.data?.[0]?.b64_json;
    
    let buffer: Buffer;

    if (imageUrl) {
      // Download image bytes with optional auth fallback
      // Some providers (OpenRouter, Azure) return URLs that require the API token
      // OpenAI DALL-E returns pre-signed URLs that don't need auth
      let imageResponse = await fetch(imageUrl);

      // If 401, retry with Bearer token
      if (imageResponse.status === 401) {
        console.log(`[Image] URL returned 401, retrying with auth token...`);
        imageResponse = await fetch(imageUrl, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
      }

      if (!imageResponse.ok) {
        const errorMsg = `Failed to download image: HTTP ${imageResponse.status}`;
        console.error(`[Image] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      buffer = Buffer.from(await imageResponse.arrayBuffer());
    } else if (b64Json) {
      // Some providers might return a data URI prefix, remove it if present
      const base64Data = b64Json.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    } else {
      const errorMsg = "Image generation returned no URL and no b64_json";
      console.error(`[Image] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const filePath = path.join(UPLOADS_BASE, entityType, `${entityId}.png`);
    fs.writeFileSync(filePath, buffer);

    // Update entity document imageUrl field
    const relativeUrl = `/uploads/images/${entityType}/${entityId}.png`;

    if (entityType === "character") {
      const { Character } = await import("../models/Character");
      await Character.findByIdAndUpdate(entityId, { imageUrl: relativeUrl });
    } else if (entityType === "item") {
      const { Item } = await import("../models/Item");
      await Item.findByIdAndUpdate(entityId, { imageUrl: relativeUrl });
    } else if (entityType === "special-item") {
      const { SpecialItem } = await import("../models/SpecialItem");
      await SpecialItem.findByIdAndUpdate(entityId, { imageUrl: relativeUrl });
    } else if (entityType === "world") {
      const { World } = await import("../models/World");
      await World.findByIdAndUpdate(entityId, { imageUrl: relativeUrl });
    } else if (entityType === "organization") {
      const { Organization } = await import("../models/Organization");
      await Organization.findByIdAndUpdate(entityId, { imageUrl: relativeUrl });
    }

    console.log(`[Image] Generated entity=${entityType}/${entityId} url=${relativeUrl} size=${size}`);

    // Derive playthroughId from entity lookup for SSE
    const derivedPlaythroughId = await derivePlaythroughId(entityType, entityId);
    if (derivedPlaythroughId) {
      emit(derivedPlaythroughId, 'image:completed', { entityType, entityId, imageUrl: relativeUrl });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Image] Generation failed for ${entityType}/${entityId}: ${errorMsg}`);

    const payload: ImageErrorPayload = {
      entityType,
      entityId,
      error: errorMsg,
      retryCount: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      const derivedPlaythroughId = await derivePlaythroughId(entityType, entityId);
      if (derivedPlaythroughId) {
        emit(derivedPlaythroughId, 'image:failed', payload);
      }
    } catch {
      // Entity not found or invalid ID — skip SSE notification
    }

    throw error;
  }
}
