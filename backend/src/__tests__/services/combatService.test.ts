import mongoose from 'mongoose';
import { CombatEncounter } from '../../models/CombatEncounter';
import { User } from '../../models/User';
import { World } from '../../models/World';
import { Playthrough } from '../../models/Playthrough';
import { Character } from '../../models/Character';
import { Chapter } from '../../models/Chapter';
import { Arc } from '../../models/Arc';

// We test the error-branch logic only (validation, early returns) because
// the full AI resolution requires mocking streamText + extractJson + db models
// which is essentially an integration test.

describe('resolveCombatAction — validation & early returns', () => {
  let userId: string;
  let playthroughId: string;
  let chapterId: string;
  let activeCombatId: string;
  let finishedCombatId: string;
  let nonExistentId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    // Sync indexes so unique constraints are enforced in test MongoDB
    await User.syncIndexes();
    await Arc.syncIndexes();
    await Chapter.syncIndexes();
  });

  beforeEach(async () => {
    const user = await User.create({
      username: 'combatuser',
      email: 'combat@test.com',
      password: 'password123',
    });
    userId = String(user._id);

    const world = await World.create({
      name: 'BattleWorld',
      genre: 'fantasy',
      userId: user._id,
    });

    const playthrough = await Playthrough.create({
      name: 'BattleRun',
      worldId: world._id,
      userId: user._id,
    });
    playthroughId = String(playthrough._id);

    const arc = await Arc.create({
      title: 'Arc1',
      playthroughId: playthrough._id,
      arcIndex: 0,
    });

    const chapter = await Chapter.create({
      content: 'pre-battle',
      arcId: arc._id,
      playthroughId: playthrough._id,
      chapterIndex: 0,
      status: 'completed',
      toolsStatus: 'completed',
    });
    chapterId = String(chapter._id);

    // Create an active combat encounter
    const activeCombat = await CombatEncounter.create({
      playthroughId: playthrough._id,
      chapterId: chapter._id,
      context: 'A dark forest',
      status: 'active',
      combatants: [
        {
          characterId: new mongoose.Types.ObjectId(),
          name: 'Hero',
          side: 'player',
          currentHp: 100,
          maxHp: 100,
          defeated: false,
        },
        {
          characterId: new mongoose.Types.ObjectId(),
          name: 'Goblin',
          side: 'enemy',
          currentHp: 30,
          maxHp: 30,
          defeated: false,
        },
      ],
      availableActions: ['Attack', 'Defend'],
    });
    activeCombatId = String(activeCombat._id);

    // Create a finished combat
    const finishedCombat = await CombatEncounter.create({
      playthroughId: playthrough._id,
      chapterId: chapter._id,
      context: 'A quiet glade',
      status: 'victory',
      combatants: [],
    });
    finishedCombatId = String(finishedCombat._id);
  });

  // The resolveCombatAction function does not export a pure-function version,
  // so we import it dynamically to avoid module-level side-effects.
  // We test the validation logic by invoking it with controlled inputs,
  // relying on the fact that the function will throw early before calling AI.
  let resolveCombatAction: Function;

  beforeAll(async () => {
    const mod = await import('../../services/combatService');
    resolveCombatAction = mod.resolveCombatAction;
  });

  it('throws when combat not found', async () => {
    await expect(
      resolveCombatAction(
        nonExistentId,
        'slash',
        userId,
        {} as any, // model not needed for early throws
        'en',
      ),
    ).rejects.toThrow('Combat encounter not found');
  });

  it('throws when combat is not active', async () => {
    await expect(
      resolveCombatAction(
        finishedCombatId,
        'slash',
        userId,
        {} as any,
        'en',
      ),
    ).rejects.toThrow('Combat is not active');
  });

  it('throws when all combatants are defeated', async () => {
    // Create an active combat where both sides have defeated combatants
    const allDead = await CombatEncounter.create({
      playthroughId: new mongoose.Types.ObjectId(playthroughId),
      chapterId: new mongoose.Types.ObjectId(chapterId),
      context: 'graveyard',
      status: 'active',
      combatants: [
        {
          characterId: new mongoose.Types.ObjectId(),
          name: 'DeadHero',
          side: 'player',
          currentHp: 0,
          maxHp: 100,
          defeated: true,
        },
        {
          characterId: new mongoose.Types.ObjectId(),
          name: 'DeadEnemy',
          side: 'enemy',
          currentHp: 0,
          maxHp: 30,
          defeated: true,
        },
      ],
    });

    await expect(
      resolveCombatAction(
        String(allDead._id),
        'attack',
        userId,
        {} as any,
        'en',
      ),
    ).rejects.toThrow('Combat has already ended');
  });
});
