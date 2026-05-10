import { tool } from 'ai';
import { z } from 'zod';
import { CombatEncounter } from '../models/CombatEncounter';
import { Character } from '../models/Character';
import { initiateCombatOutput, validateToolOutput } from './schemas';

export function makeInitiateCombatTool(playthroughId: string, chapterId: string) {
  return tool({
    description:
      'Initiate an interactive combat encounter when the story reaches a fight scene. Provide the combatants with their stats. The player will choose actions each round.',
    inputSchema: z.object({
      context: z.string().describe('Description of the combat scene and circumstances'),
      enemies: z
        .array(
          z.object({
            characterName: z.string().describe('Name of the enemy character (must exist in the story)'),
            maxHp: z.number().describe('Maximum HP for this enemy based on their strength'),
          })
        )
        .describe('List of enemy combatants'),
      availableActions: z
        .array(z.string())
        .min(3)
        .max(6)
        .describe('Available combat actions for the player, e.g. ["Attack", "Defend", "Use special ability", "Flee"]'),
    }),
    execute: async ({ context, enemies, availableActions }) => {
      // Resolve protagonist
      const protagonist = await Character.findOne({ playthroughId, role: 'protagonist' }).lean();
      if (!protagonist) return validateToolOutput({ initiated: false, error: 'No protagonist found' }, initiateCombatOutput, 'initiateCombat');

      // Get protagonist HP from dynamic stats
      const hpStat = protagonist.dynamicStats.find(
        (s) => s.k.toLowerCase().includes('hp') || s.k.toLowerCase().includes('health') || s.k.toLowerCase().includes('生命')
      );
      const protagonistHp = hpStat ? Number(hpStat.v) || 100 : 100;

      // Build combatants
      const combatants: Array<{
        characterId: typeof protagonist._id;
        name: string;
        side: 'player' | 'enemy';
        currentHp: number;
        maxHp: number;
        defeated: boolean;
      }> = [
        {
          characterId: protagonist._id,
          name: protagonist.name,
          side: 'player',
          currentHp: protagonistHp,
          maxHp: protagonistHp,
          defeated: false,
        },
      ];

      // Add enemies
      for (const enemy of enemies) {
        const char = await Character.findOne({ playthroughId, name: enemy.characterName }).lean();
        if (char) {
          combatants.push({
            characterId: char._id,
            name: char.name,
            side: 'enemy',
            currentHp: enemy.maxHp,
            maxHp: enemy.maxHp,
            defeated: false,
          });
        }
      }

      if (combatants.length < 2) {
        return validateToolOutput({ initiated: false, error: 'Need at least one enemy combatant' }, initiateCombatOutput, 'initiateCombat');
      }

      const encounter = await CombatEncounter.create({
        playthroughId,
        chapterId,
        combatants,
        context,
        availableActions,
        status: 'active',
      });

      return validateToolOutput({
        initiated: true,
        combatId: encounter._id.toString(),
        combatants: combatants.map((c) => ({ name: c.name, side: c.side, hp: c.currentHp })),
        availableActions,
      }, initiateCombatOutput, 'initiateCombat');
    },
  });
}
