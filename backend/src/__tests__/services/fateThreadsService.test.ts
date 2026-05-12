import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Playthrough } from '../../models/Playthrough';
import { Arc } from '../../models/Arc';
import { Chapter } from '../../models/Chapter';
import { User } from '../../models/User';
import { World } from '../../models/World';
import { buildFateThreadsGraph } from '../../services/fateThreadsService';

describe('fateThreadsService', () => {
  let userId: string;
  let playthroughId: string;

  beforeAll(async () => {
    await User.syncIndexes();
    await World.syncIndexes();
    await Playthrough.syncIndexes();
    await Arc.syncIndexes();
    await Chapter.syncIndexes();
  });

  beforeEach(async () => {
    const user = await User.create({
      username: 'fate-threads-user',
      email: 'fate-threads@test.com',
      password: 'password123',
    });
    userId = String(user._id);

    const world = await World.create({
      name: 'Fate World',
      description: 'Test world for fate threads',
      genre: 'fantasy',
      userId: user._id,
    });

    const pt = await Playthrough.create({
      name: 'Fate Threads Run',
      worldId: world._id,
      userId: user._id,
      status: 'active',
      currentArcIndex: 0,
    });
    playthroughId = String(pt._id);

    const arc = await Arc.create({
      playthroughId: pt._id,
      arcIndex: 0,
      status: 'completed',
      title: 'A test arc',
    });

    await Chapter.create([
      {
        playthroughId: pt._id,
        arcId: arc._id,
        chapterIndex: 0,
        status: 'completed',
        content: 'First chapter content here is more than sixty characters for title test purposes.',
        choices: [
          { text: 'Go left', type: 'continue' as const },
          { text: 'Go right', type: 'new_arc' as const },
        ],
        playerChoice: 'Go left',
      },
      {
        playthroughId: pt._id,
        arcId: arc._id,
        chapterIndex: 1,
        status: 'completed',
        content: 'Second chapter',
        choices: [{ text: 'Continue ahead', type: 'continue' as const }],
        playerChoice: 'Continue ahead',
      },
      {
        playthroughId: pt._id,
        arcId: arc._id,
        chapterIndex: 2,
        status: 'generating',
        content: 'Third chapter not yet generated',
        choices: [],
      },
    ]);
  });

  it('should build a graph with nodes and edges', async () => {
    const graph = await buildFateThreadsGraph(playthroughId, userId);

    expect(graph.nodes).toBeDefined();
    expect(graph.edges).toBeDefined();
    expect(graph.metadata).toBeDefined();
  });

  it('should have correct number of nodes', async () => {
    const graph = await buildFateThreadsGraph(playthroughId, userId);

    expect(graph.nodes).toHaveLength(3);
  });

  it('should mark completed chapters as current path', async () => {
    const graph = await buildFateThreadsGraph(playthroughId, userId);

    const completedNodes = graph.nodes.filter((n) => n.isCurrentPath);
    expect(completedNodes).toHaveLength(2);
  });

  it('should create edges between consecutive completed chapters', async () => {
    const graph = await buildFateThreadsGraph(playthroughId, userId);

    const chosenEdges = graph.edges.filter((e) => e.isChosen);
    expect(chosenEdges.length).toBeGreaterThan(0);
    expect(chosenEdges[0]!.choiceText).toBe('Go left');
  });

  it('should create ghost edges for unselected choices', async () => {
    const graph = await buildFateThreadsGraph(playthroughId, userId);

    const ghostEdges = graph.edges.filter((e) => !e.isChosen);
    expect(ghostEdges.length).toBeGreaterThan(0);
    expect(graph.metadata.totalGhostBranches).toBeGreaterThan(0);
  });

  it('should use chapter content for node title', async () => {
    const graph = await buildFateThreadsGraph(playthroughId, userId);

    const firstNode = graph.nodes.find((n) => n.chapterIndex === 0);
    expect(firstNode).toBeDefined();
    expect(firstNode!.title).toContain('First chapter');
  });

  it('should throw for non-existent playthrough', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(buildFateThreadsGraph(fakeId, userId)).rejects.toThrow('Playthrough not found');
  });

  it('should throw for wrong user', async () => {
    const otherUser = await User.create({
      username: 'other-fate-user',
      email: 'other-fate@test.com',
      password: 'password123',
    });
    await expect(buildFateThreadsGraph(playthroughId, String(otherUser._id))).rejects.toThrow('Access denied');
  });
});
