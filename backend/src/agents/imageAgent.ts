import fs from "fs";
import path from "path";
import { decrypt } from "../services/encryption";
import { IAgentConfig } from "../types/user.types";

const UPLOADS_BASE = path.join(__dirname, "../../uploads/images");

// Ensure upload directories exist
fs.mkdirSync(path.join(UPLOADS_BASE, "character"), { recursive: true });
fs.mkdirSync(path.join(UPLOADS_BASE, "item"), { recursive: true });
fs.mkdirSync(path.join(UPLOADS_BASE, "special-item"), { recursive: true });
fs.mkdirSync(path.join(UPLOADS_BASE, "world"), { recursive: true });

type EntityType = "character" | "item" | "special-item" | "world";

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
function getImageSize(entityType: EntityType, model: string): string {
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
  }
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
      `[Image] Generating ${entityType}/${entityId}: size=${size}, model=${model}`,
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
        response_format: "url",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Image generation API error (${response.status}):`,
        errorBody,
      );
      return;
    }

    const result = (await response.json()) as {
      data: Array<{ url: string }>;
    };

    const imageUrl = result.data?.[0]?.url;
    if (!imageUrl) {
      console.error("Image generation returned no URL");
      return;
    }

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
      console.error(`Failed to download image: ${imageResponse.status}`);
      return;
    }

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
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
    }

    console.log(
      `[Image] Generated ${entityType}/${entityId}: ${relativeUrl} (${size})`,
    );
  } catch (error) {
    console.error(
      `Image generation failed for ${entityType}/${entityId}:`,
      error,
    );
    // Don't rethrow — fire-and-forget
  }
}
