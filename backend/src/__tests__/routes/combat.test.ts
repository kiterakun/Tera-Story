import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../index';
import { registerAndGetAgent } from '../helpers';
import { User } from '../../models/User';
import { World } from '../../models/World';
import { Playthrough } from '../../models/Playthrough';
import { Character } from '../../models/Character';
import { Chapter } from '../../models/Chapter';
import { CombatEncounter } from '../../models/CombatEncounter';

describe('Combat routes', () => {
  beforeAll(async () => {
    await User.syncIndexes();
    await Chapter.syncIndexes();
  });

  async function createScenario(email = 'combat@test.com') {
    const agent = await registerAndGetAgent({ username: email.split('@')[0], email });
    const user = await User.findOne({ email }).orFail();
    const world = await World.create({ name: 'Arena', description: 'Battle world', genre: 'fantasy', userId: user._id });
    const playthrough = await Playthrough.create({ name: 'Run', worldId: world._id, userId: user._id });
    const hero = await Character.create({ name: 'Hero', role: 'protagonist', playthroughId: playthrough._id, worldId: world._id, userId: user._id });
    const enemy = await Character.create({ name: 'Goblin', role: 'npc', playthroughId: playthrough._id, worldId: world._id, userId: user._id });
    const chapter = await Chapter.create({ arcId: new mongoose.Types.ObjectId(), playthroughId: playthrough._id, chapterIndex: 1 });
    const combat = await CombatEncounter.create({
      playthroughId: playthrough._id,
      chapterId: chapter._id,
      status: 'active',
      context: 'Goblin ambush',
      combatants: [
        { characterId: hero._id, name: 'Hero', side: 'player', currentHp: 10, maxHp: 10, defeated: false },
        { characterId: enemy._id, name: 'Goblin', side: 'enemy', currentHp: 6, maxHp: 6, defeated: false },
      ],
      availableActions: ['attack'],
    });
    return { agent, user, world, playthrough, combat };
  }

  beforeEach(() => {});

  it('GET /api/playthroughs/:playthroughId/combat returns active combat', async () => {
    const { agent, playthrough, combat } = await createScenario();

    const res = await agent.get(`/api/playthroughs/${playthrough._id}/combat`);

    expect(res.status).toBe(200);
    expect(res.body.combat._id).toBe(String(combat._id));
  });

  it('GET /api/playthroughs/:playthroughId/combat requires auth', async () => {
    const res = await request(app).get(`/api/playthroughs/${new mongoose.Types.ObjectId()}/combat`);

    expect(res.status).toBe(401);
  });

  it('GET /api/playthroughs/:playthroughId/combat returns 403 for another user playthrough', async () => {
    const { playthrough } = await createScenario('owner-combat@test.com');
    const otherAgent = await registerAndGetAgent({ username: 'othercombat', email: 'other-combat@test.com' });

    const res = await otherAgent.get(`/api/playthroughs/${playthrough._id}/combat`);

    expect(res.status).toBe(403);
  });

  it('GET /api/playthroughs/:playthroughId/combat returns 404 for missing playthrough', async () => {
    const { agent } = await createScenario();

    const res = await agent.get(`/api/playthroughs/${new mongoose.Types.ObjectId()}/combat`);

    expect(res.status).toBe(404);
  });

  it('POST /api/combat/:combatId/action validates action', async () => {
    const { agent, combat } = await createScenario();

    const res = await agent.post(`/api/combat/${combat._id}/action`).send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('action is required');
  });
});
