import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
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

  // AI resolves combat round
  const { text } = await generateText({
    model,
    system: `You are a combat narrator for an interactive RPG novel. Given the combat state and the player's action, resolve this combat round.

Respond ONLY with valid JSON:
{
  "narrative": "string (2-3 vivid paragraphs describing what happens)",
  "damages": [
    { "target": "character name", "amount": number, "type": "damage|heal" }
  ],
  "combatEnded": false,
  "endReason": null
}

RULES:
- Damage should be proportional to combatant strength and action quality
- HP cannot go below 0
- Set combatEnded=true if all enemies are defeated (victory), player HP reaches 0 (defeat), or player successfully flees
- endReason: "victory" | "defeat" | "fled" | null
- Write the narrative in ${language}`,
    prompt: combatState,
    temperature: 0.7,
  });

  // Parse AI response
  let parsed: any;
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  } catch {
    throw new Error('Failed to parse combat resolution');
  }

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

  return {
    narrative: parsed.narrative || '',
    encounter,
    stateChanges,
  };
}
