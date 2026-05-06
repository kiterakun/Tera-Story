import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { CombatEncounter } from '../models/CombatEncounter';
import { resolveCombatAction } from '../services/combatService';
import { createUserProviderRegistry } from '../providers/registry';
import { UserSettings } from '../models/UserSettings';

const router = Router();

function getPlaythroughModel() {
  return (
    mongoose.models['Playthrough'] ||
    mongoose.model('Playthrough', new mongoose.Schema({}, { strict: false }))
  );
}

// GET /api/playthroughs/:playthroughId/combat — get active combat
router.get(
  '/playthroughs/:playthroughId/combat',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { playthroughId } = req.params;

      const Playthrough = getPlaythroughModel();
      const playthrough = await Playthrough.findById(playthroughId).lean();
      if (!playthrough) { res.status(404).json({ error: 'Playthrough not found' }); return; }
      if ((playthrough as Record<string, unknown>).userId?.toString() !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }

      const combat = await CombatEncounter.findOne({ playthroughId, status: 'active' }).lean();
      res.json({ combat: combat || null });
    } catch (err) {
      console.error('Get combat error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/combat/:combatId/action — player performs a combat action
router.post(
  '/combat/:combatId/action',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const combatId = req.params.combatId as string;
      const { action } = req.body;

      if (!action || typeof action !== 'string') {
        res.status(400).json({ error: 'action is required' });
        return;
      }

      // Get user's AI settings for combat narration model
      const settings = await UserSettings.findOne({ userId }).lean();
      if (!settings || !settings.aiSettings) {
        res.status(400).json({ error: 'AI settings not configured' });
        return;
      }

      const registry = createUserProviderRegistry(settings.aiSettings);
      const model = registry.getWriterModel();

      // Get playthrough & validate ownership
      const combat = await CombatEncounter.findById(combatId).lean();
      if (!combat) { res.status(404).json({ error: 'Combat not found' }); return; }

      const Playthrough = getPlaythroughModel();
      const playthrough = await Playthrough.findById(combat.playthroughId).lean();
      if (!playthrough) { res.status(404).json({ error: 'Playthrough not found' }); return; }
      if ((playthrough as Record<string, unknown>).userId?.toString() !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }

      const language: string = String(settings.language || 'en');

      const result = await resolveCombatAction(combatId, action, userId, model, language);

      res.json({
        success: true,
        narrative: result.narrative,
        combat: result.encounter,
        stateChanges: result.stateChanges,
      });
    } catch (err: any) {
      console.error('Combat action error:', err);
      res.status(500).json({ error: err.message || 'Combat action failed' });
    }
  }
);

export default router;
