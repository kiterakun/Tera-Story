import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserSettings } from '../models/UserSettings';
import { encrypt, decrypt } from '../services/encryption';
import { IAgentConfig, IAISettings } from '../types/user.types';

const router = Router();

const AGENT_KEYS = ['contextAgent', 'writerAgent', 'supportAgent', 'imageAgent'] as const;

const DEFAULT_AI_SETTINGS: IAISettings = {
  contextAgent: { provider: 'openai', model: 'gpt-4o' },
  writerAgent: { provider: 'openai', model: 'gpt-4o' },
  supportAgent: { provider: 'openai', model: 'gpt-4o' },
  imageAgent: { provider: 'openai', model: 'dall-e-3' },
};

function maskApiKey(key: string): string {
  if (key.length <= 4) return '****';
  return `sk-****${key.slice(-4)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function maskSettingsResponse(settings: any): Record<string, unknown> {
  const result = { ...settings };
  const ai = result.aiSettings as Record<string, Record<string, unknown>> | undefined;
  if (ai) {
    const maskedAI: Record<string, unknown> = {};
    for (const key of AGENT_KEYS) {
      const agent = ai[key];
      if (agent) {
        const maskedAgent = { ...agent };
        if (typeof maskedAgent.apiKey === 'string' && maskedAgent.apiKey) {
          try {
            const decrypted = decrypt(maskedAgent.apiKey);
            maskedAgent.apiKey = maskApiKey(decrypted);
          } catch {
            maskedAgent.apiKey = '****';
          }
        }
        maskedAI[key] = maskedAgent;
      }
    }
    result.aiSettings = maskedAI;
  }
  return result;
}

// GET /api/settings
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    let doc = await UserSettings.findOne({ userId });

    if (!doc) {
      doc = await UserSettings.create({
        userId,
        language: 'en',
        theme: 'dark',
        aiSettings: DEFAULT_AI_SETTINGS,
      });
    }

    const settings = doc.toObject();
    res.json({ settings: maskSettingsResponse(settings) });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/settings
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { language, theme } = req.body;

    const update: Record<string, unknown> = {};
    if (language !== undefined) update.language = language;
    if (theme !== undefined) update.theme = theme;

    const doc = await UserSettings.findOneAndUpdate(
      { userId },
      {
        $set: update,
        $setOnInsert: { aiSettings: DEFAULT_AI_SETTINGS },
      },
      { new: true, upsert: true }
    );

    if (!doc) {
      res.status(500).json({ error: 'Failed to update settings' });
      return;
    }

    const settings = doc.toObject();
    res.json({ settings: maskSettingsResponse(settings) });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/settings/ai
router.put('/ai', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get current settings to preserve existing encrypted keys
    const current = await UserSettings.findOne({ userId });
    const currentAI = current?.aiSettings;

    const updatedAI: Record<string, IAgentConfig> = {};

    for (const key of AGENT_KEYS) {
      const incoming = req.body[key] as IAgentConfig | undefined;
      const existing = currentAI?.[key];

      if (incoming) {
        const merged: IAgentConfig = {
          provider: incoming.provider ?? existing?.provider ?? 'openai',
          model: incoming.model ?? existing?.model ?? 'gpt-4o',
        };

        if (incoming.baseUrl !== undefined) {
          merged.baseUrl = incoming.baseUrl;
        } else if (existing?.baseUrl) {
          merged.baseUrl = existing.baseUrl;
        }

        if (incoming.apiKey) {
          merged.apiKey = encrypt(incoming.apiKey);
        } else if (existing?.apiKey) {
          merged.apiKey = existing.apiKey;
        }

        updatedAI[key] = merged;
      } else if (existing) {
        updatedAI[key] = {
          provider: existing.provider,
          model: existing.model,
          ...(existing.baseUrl && { baseUrl: existing.baseUrl }),
          ...(existing.apiKey && { apiKey: existing.apiKey }),
        };
      } else {
        updatedAI[key] =
          key === 'imageAgent'
            ? { provider: 'openai', model: 'dall-e-3' }
            : { provider: 'openai', model: 'gpt-4o' };
      }
    }

    const doc = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: { aiSettings: updatedAI } },
      { new: true, upsert: true }
    );

    if (!doc) {
      res.status(500).json({ error: 'Failed to update AI settings' });
      return;
    }

    const settings = doc.toObject();
    res.json({ settings: maskSettingsResponse(settings) });
  } catch (err) {
    console.error('Update AI settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
