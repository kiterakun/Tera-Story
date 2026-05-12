import { Playthrough } from '../models/Playthrough';
import { Chapter } from '../models/Chapter';
import { Arc } from '../models/Arc';
import { UserSettings } from '../models/UserSettings';
import { createUserProviderRegistry } from '../providers/registry';
import { runContextAgent } from '../agents/contextAgent';
import type {
  FateThreadsGraph,
  ThreadNode,
  ThreadEdge,
  PeekRequest,
  PeekResponse,
} from '../types/fateThreads.types';

/**
 * Verify the playthrough exists and belongs to the given user.
 * Throws on not-found or access denial.
 */
async function verifyPlaythroughOwnership(
  playthroughId: string,
  userId: string
): Promise<void> {
  const playthrough = await Playthrough.findById(playthroughId).lean();
  if (!playthrough) {
    throw new Error('Playthrough not found');
  }
  if (playthrough.userId.toString() !== userId) {
    throw new Error('Access denied');
  }
}

/**
 * Build the fate-threads graph for a playthrough.
 * - Nodes: every chapter, with isCurrentPath = true for completed ones.
 * - Edges: chosen edge connects consecutive completed chapters;
 *   ghost edges connect to virtual nodes for unselected choices.
 */
export async function buildFateThreadsGraph(
  playthroughId: string,
  userId: string
): Promise<FateThreadsGraph> {
  await verifyPlaythroughOwnership(playthroughId, userId);

  // Fetch all chapters sorted by chapterIndex
  const chapters = await Chapter.find({ playthroughId })
    .sort({ chapterIndex: 1 })
    .lean();

  // Fetch all arcs and build a lookup for arcIndex
  const arcs = await Arc.find({ playthroughId }).lean();
  const arcIndexMap = new Map<string, number>();
  for (const arc of arcs) {
    arcIndexMap.set(arc._id.toString(), arc.arcIndex);
  }

  // Build nodes
  const nodes: ThreadNode[] = chapters.map((ch) => {
    const arcIndex = arcIndexMap.get(ch.arcId.toString()) ?? 0;
    return {
      id: ch._id.toString(),
      chapterId: ch._id.toString(),
      chapterIndex: ch.chapterIndex,
      arcId: ch.arcId.toString(),
      arcIndex,
      title: (ch.content ?? '').slice(0, 60).replace(/\n/g, ' ') || `Scene ${ch.chapterIndex}`,
      summary: (ch.content ?? '').slice(0, 150),
      isCurrentPath: ch.status === 'completed',
      depth: ch.chapterIndex,
      isCompleted: ch.status === 'completed',
    };
  });

  // Determine the latest completed chapter for metadata
  const completedChapters = chapters.filter((ch) => ch.status === 'completed');
  const lastCompleted =
    completedChapters.length > 0
      ? completedChapters[completedChapters.length - 1]
      : null;

  // Build edges: only between completed chapters
  const edges: ThreadEdge[] = [];
  const completedSorted = [...completedChapters].sort(
    (a, b) => a.chapterIndex - b.chapterIndex
  );

  for (let i = 0; i < completedSorted.length; i++) {
    const curr = completedSorted[i]!;
    const next = completedSorted[i + 1] ?? null;
    const arcIndex = arcIndexMap.get(curr.arcId.toString()) ?? 0;

    // Chosen edge to the next chapter
    if (curr.playerChoice && next) {
      edges.push({
        from: curr._id.toString(),
        to: next._id.toString(),
        choiceText: curr.playerChoice,
        choiceType: 'continue',
        isChosen: true,
        arcIndex,
      });
    }

    // Ghost edges for unselected choices
    if (Array.isArray(curr.choices)) {
      curr.choices.forEach((choice, idx) => {
        if (choice.text === curr.playerChoice) return;
        edges.push({
          from: curr._id.toString(),
          to: `ghost-${curr._id.toString()}-${idx}`,
          choiceText: choice.text,
          choiceType: choice.type,
          isChosen: false,
          arcIndex,
        });
      });
    }
  }

  const totalGhostBranches = edges.filter((e) => !e.isChosen).length;

  return {
    nodes,
    edges,
    metadata: {
      playthroughId,
      totalChapters: chapters.length,
      totalArcs: arcs.length,
      currentChapterId: lastCompleted?._id.toString() ?? '',
      totalGhostBranches,
      totalPeekedGhosts: 0, // peek tracking not implemented yet
    },
  };
}

/**
 * Peek at a ghost branch — what would have happened if a different choice was made.
 * Uses contextAgent to generate an alternate timeline description.
 */
export async function peekGhostThread(
  req: PeekRequest & { userId: string }
): Promise<PeekResponse> {
  const { playthroughId, currentChapterId, choiceIndex, language, userId } = req;

  await verifyPlaythroughOwnership(playthroughId, userId);

  // Get the chapter and its choices
  const chapter = await Chapter.findById(currentChapterId).lean();
  if (!chapter) {
    throw new Error('Chapter not found');
  }

  const choices = chapter.choices ?? [];
  const choice = choices[choiceIndex];
  if (!choice) {
    throw new Error('Invalid choice index');
  }

  if (choice.text === chapter.playerChoice) {
    throw new Error('Cannot peek the chosen path');
  }

  // Fetch user settings for the AI model
  const settings = await UserSettings.findOne({ userId }).lean();
  if (!settings) {
    throw new Error('User settings not found');
  }

  const registry = createUserProviderRegistry(settings.aiSettings);
  const model = registry.getContextModel();

  // Build a prompt that tricks contextAgent into describing the alternate path.
  // contextAgent normally analyses the story state; here we ask about a what-if
  // scenario so it returns an outline that serves as the alternate description.
  const whatIfChoice = `What if the player had chosen "${choice.text}" instead of "${chapter.playerChoice}" at chapter ${chapter.chapterIndex}? Describe the alternate immediate outcome in 2-3 sentences, in ${language}.`;

  const contextOutput = await runContextAgent({
    playthroughId,
    currentArcId: chapter.arcId.toString(),
    playerChoice: whatIfChoice,
    userId,
    model,
    language,
  });

  return {
    alternateDescription: contextOutput.outline,
    choiceText: choice.text,
    newDepth: chapter.chapterIndex + 1,
  };
}
