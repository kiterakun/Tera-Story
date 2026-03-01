import fs from 'fs';
import path from 'path';
import { decrypt } from '../services/encryption';
import { IAgentConfig } from '../types/user.types';

const UPLOADS_BASE = path.join(__dirname, '../../uploads/images');

// Ensure upload directories exist
fs.mkdirSync(path.join(UPLOADS_BASE, 'character'), { recursive: true });
fs.mkdirSync(path.join(UPLOADS_BASE, 'item'), { recursive: true });
fs.mkdirSync(path.join(UPLOADS_BASE, 'special-item'), { recursive: true });

/**
 * Generate an image via DALL-E compatible API (fire-and-forget).
 * Caller does NOT await — errors are logged, not thrown.
 */
export async function generateImage(
  description: string,
  entityType: 'character' | 'item' | 'special-item',
  entityId: string,
  imageConfig: IAgentConfig
): Promise<void> {
  try {
    const apiKey = imageConfig.apiKey ? decrypt(imageConfig.apiKey) : '';
    const baseUrl = imageConfig.baseUrl || 'https://api.openai.com/v1';
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/images/generations`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: imageConfig.model,
        prompt: description,
        n: 1,
        size: '1024x1024',
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Image generation API error (${response.status}):`, errorBody);
      return;
    }

    const result = (await response.json()) as {
      data: Array<{ url: string }>;
    };

    const imageUrl = result.data?.[0]?.url;
    if (!imageUrl) {
      console.error('Image generation returned no URL');
      return;
    }

    // Download image bytes
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageResponse.status}`);
      return;
    }

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const filePath = path.join(UPLOADS_BASE, entityType, `${entityId}.png`);
    fs.writeFileSync(filePath, buffer);

    // Update entity document imageUrl field
    const relativeUrl = `/uploads/images/${entityType}/${entityId}.png`;

    if (entityType === 'character') {
      const { Character } = await import('../models/Character');
      await Character.findByIdAndUpdate(entityId, { imageUrl: relativeUrl });
    } else if (entityType === 'item') {
      const { Item } = await import('../models/Item');
      await Item.findByIdAndUpdate(entityId, { imageUrl: relativeUrl });
    } else if (entityType === 'special-item') {
      const { SpecialItem } = await import('../models/SpecialItem');
      await SpecialItem.findByIdAndUpdate(entityId, { imageUrl: relativeUrl });
    }

    console.log(`Image generated for ${entityType}/${entityId}: ${relativeUrl}`);
  } catch (error) {
    console.error(`Image generation failed for ${entityType}/${entityId}:`, error);
    // Don't rethrow — fire-and-forget
  }
}
