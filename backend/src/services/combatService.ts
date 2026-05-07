import { streamText } from 'ai';
import type { LanguageModel } from 'ai';
import { extractJson } from '../utils/jsonExtractor';
import { z } from 'zod';
import { CombatEncounter, ICombatEncounterDocument } from '../models/CombatEncounter';
import { Character } from '../models/Character';
import { updateStat } from './characterService';

interface CombatActionResult {
  narrative: string;
  encounter: ICombatEncounterDocument;
  stateChanges: Array<{ characterName: string; stat: string; oldValue: number; newValue: number }>;
}

export async function resolveCombatAction(
  combatId: string,
  playerAction: string,
  userId: string,
  model: LanguageModel,
  language: string
): Promise<CombatActionResult> {
  const encounter = await CombatEncounter.findById(combatId);
  if (!encounter) throw new Error('Combat encounter not found');
  if (encounter.status !== 'active') throw new Error('Combat is not active');

  const playerCombatants = encounter.combatants.filter((c) => c.side === 'player' && !c.defeated);
  const enemyCombatants = encounter.combatants.filter((c) => c.side === 'enemy' && !c.defeated);

  if (playerCombatants.length === 0 || enemyCombatants.length === 0) {
    throw new Error('Combat has already ended');
  }

  // Build combat state for AI
  const combatState = `
Combat Scene: ${encounter.context}
Round: ${encounter.rounds.length + 1}

Player Side:
${playerCombatants.map((c) => `- ${c.name}: HP ${c.currentHp}/${c.maxHp}`).join('\n')}

Enemy Side:
${enemyCombatants.map((c) => `- ${c.name}: HP ${c.currentHp}/${c.maxHp}`).join('\n')}

Previous Rounds:
${encounter.rounds.length > 0 ? encounter.rounds.slice(-3).map((r) => `Round ${r.roundIndex + 1}: ${r.playerAction} → ${r.narrative}`).join('\n') : 'First round'}

Player Action: "${playerAction}"`;

  // Resolve combat using AI
  const result = streamText({
    model,
    system: `You are a combat narrator for an interactive RPG novel. Given the combat state and the player's action, resolve this combat round.

Respond ONLY with valid JSON matching this schema:
{
  "narrative": "string (2-3 vivid paragraphs describing what happens)",
  "damages": [
    { "target": "character name", "amount": number, "type": "damage|heal" }
  ],
  "newAvailableActions": ["action 1", "action 2", "action 3"],
  "combatEnded": false,
  "endReason": null|"victory"|"defeat"|"fled",
  "choicesForNextChapter": [{"text": "choice 1", "type": "continue"}, {"text": "choice 2", "type": "continue"}]
}

RULES:
- Damage should be proportional to combatant strength and action quality
- HP cannot go below 0
- newAvailableActions: provide 3-4 new context-aware actions for the NEXT round (if combatEnded is false)
- Set combatEnded=true if all enemies are defeated (victory), player HP reaches 0 (defeat), or player successfully flees
- endReason: "victory" | "defeat" | "fled" | null
- choicesForNextChapter: MUST provide 3-4 choices IF AND ONLY IF combatEnded is true.
- Write the narrative in ${language}`,
    prompt: combatState,
    temperature: 0.7,
  });

  const text = await result.text;
  const parsedRaw = extractJson(text);

  const combatOutputSchema = z.object({
    narrative: z.string(),
    damages: z.array(z.object({
      target: z.string(),
      amount: z.number(),
      type: z.enum(['damage', 'heal'])
    })).optional(),
    newAvailableActions: z.array(z.string()).optional(),
    combatEnded: z.boolean(),
    endReason: z.enum(['victory', 'defeat', 'fled']).nullable(),
    choicesForNextChapter: z.array(z.object({
      text: z.string(),
      type: z.enum(['continue', 'new_arc', 'custom'])
    })).optional()
  });

  const parsed = combatOutputSchema.parse(parsedRaw);

  // Apply damages
  const stateChanges: Array<{ characterName: string; stat: string; oldValue: number; newValue: number }> = [];
  for (const dmg of parsed.damages || []) {
    const combatant = encounter.combatants.find((c) => c.name === dmg.target);
    if (!combatant) continue;

    const oldHp = combatant.currentHp;
    if (dmg.type === 'damage') {
      combatant.currentHp = Math.max(0, combatant.currentHp - dmg.amount);
    } else if (dmg.type === 'heal') {
      combatant.currentHp = Math.min(combatant.maxHp, combatant.currentHp + dmg.amount);
    }

    if (combatant.currentHp <= 0) {
      combatant.defeated = true;
    }

    stateChanges.push({
      characterName: dmg.target,
      stat: 'HP',
      oldValue: oldHp,
      newValue: combatant.currentHp,
    });
  }

  // Update actions if combat continues
  if (!parsed.combatEnded && parsed.newAvailableActions && parsed.newAvailableActions.length > 0) {
    encounter.availableActions = parsed.newAvailableActions;
  }

  // Add round
  encounter.rounds.push({
    roundIndex: encounter.rounds.length,
    playerAction,
    narrative: parsed.narrative || '',
    stateChanges,
  });

  // Check combat end
  if (parsed.combatEnded) {
    encounter.status = parsed.endReason === 'victory' ? 'victory'
      : parsed.endReason === 'defeat' ? 'defeat'
      : parsed.endReason === 'fled' ? 'fled'
      : 'resolved';

    // Sync HP changes to actual character stats
    for (const combatant of encounter.combatants) {
      if (combatant.side === 'player') {
        const char = await Character.findById(combatant.characterId).lean();
        if (char) {
          const hpStat = char.dynamicStats.find(
            (s) => s.k.toLowerCase().includes('hp') || s.k.toLowerCase().includes('health') || s.k.toLowerCase().includes('生命')
          );
          if (hpStat) {
            try {
              await updateStat(char._id.toString(), hpStat.k, combatant.currentHp, userId);
            } catch { /* non-fatal */ }
          }
        }
      }
    }
  }

  await encounter.save();

  // Append narrative to the latest chapter
  try {
    const { Chapter } = await import('../models/Chapter');
    const latestChapter = await Chapter.findOne({ playthroughId: encounter.playthroughId })
      .sort({ chapterIndex: -1 });
    
    if (latestChapter) {
      const appendedText = `\n\n> **${playerAction}**\n\n${parsed.narrative}`;
      latestChapter.content += appendedText;
      
      // Add choices if combat ended
      if (parsed.combatEnded && parsed.choicesForNextChapter && parsed.choicesForNextChapter.length > 0) {
        latestChapter.choices = parsed.choicesForNextChapter as any;
      }
      
      await latestChapter.save();
    }
  } catch (err) {
    console.error('Failed to append combat narrative to chapter:', err);
  }

  return {
    narrative: parsed.narrative || '',
    encounter,
    stateChanges,
  };
}
