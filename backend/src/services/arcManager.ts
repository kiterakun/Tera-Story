import { Arc } from '../models/Arc';
import type { IArcDocument } from '../models/Arc';
import { Chapter } from '../models/Chapter';
import { streamText } from 'ai';
import type { LanguageModel } from 'ai';

export async function createNewArc(
  playthroughId: string,
  title?: string
): Promise<IArcDocument> {
  const existingCount = await Arc.countDocuments({ playthroughId });
  const arc = await Arc.create({
    playthroughId,
    title: title || `Arc ${existingCount + 1}`,
    arcIndex: existingCount,
    status: 'active',
  });
  return arc;
}

export async function completeCurrentArc(
  arcId: string,
  model: LanguageModel
): Promise<void> {
  await Arc.findByIdAndUpdate(arcId, { status: 'completed' });
  await generateArcSummary(arcId, model);
}

export async function generateArcSummary(
  arcId: string,
  model: LanguageModel
): Promise<string> {
  const chapters = await Chapter.find({ arcId }).sort({ chapterIndex: 1 });
  if (chapters.length === 0) return '';

  const chapterTexts = chapters
    .map((c, i) => `Chapter ${i + 1}:\n${c.content}`)
    .join('\n\n---\n\n');

  const result = streamText({
    model,
    system:
      'You are a story archivist. Create a concise but comprehensive summary of the story arc described in these chapters. Focus on: key events, character development, plot threads introduced/resolved, and the emotional arc. Keep it under 500 words.',
    prompt: `Summarize this story arc:\n\n${chapterTexts}`,
  });

  const text = await result.text;

  await Arc.findByIdAndUpdate(arcId, { summary: text.trim() });
  return text.trim();
}
