import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Arc } from '../models/Arc';
import { Chapter } from '../models/Chapter';

const router = Router();

// Safe model access for Playthrough
function getPlaythroughModel() {
  return (
    mongoose.models['Playthrough'] ||
    mongoose.model('Playthrough', new mongoose.Schema({}, { strict: false }))
  );
}

// GET /api/playthroughs/:playthroughId/arcs — list arcs in playthrough with chapter counts
router.get(
  '/playthroughs/:playthroughId/arcs',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { playthroughId } = req.params;

      // Verify user owns the playthrough
      const Playthrough = getPlaythroughModel();
      const playthrough = await Playthrough.findById(playthroughId).lean();

      if (!playthrough) {
        res.status(404).json({ error: 'Playthrough not found' });
        return;
      }

      if ((playthrough as Record<string, unknown>).userId?.toString() !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;
      const filter = { playthroughId };

      const [arcs, total] = await Promise.all([
        Arc.find(filter).sort({ arcIndex: 1 }).skip(skip).limit(limit).lean(),
        Arc.countDocuments(filter),
      ]);

      // Get chapter counts per arc (only for current page)
      const arcIds = arcs.map((a) => a._id);
      const chapterCounts = await Chapter.aggregate([
        { $match: { arcId: { $in: arcIds } } },
        { $group: { _id: '$arcId', count: { $sum: 1 } } },
      ]);

      const countMap = new Map(
        chapterCounts.map((c: { _id: mongoose.Types.ObjectId; count: number }) => [
          c._id.toString(),
          c.count,
        ])
      );

      const arcsWithCounts = arcs.map((arc) => ({
        ...arc,
        chapterCount: countMap.get(arc._id.toString()) || 0,
      }));

      res.json({ arcs: arcsWithCounts, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      console.error('List arcs error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/arcs/:arcId/chapters — list chapters in arc ordered by chapterIndex
router.get(
  '/arcs/:arcId/chapters',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { arcId } = req.params;

      // Verify arc exists
      const arc = await Arc.findById(arcId).lean();

      if (!arc) {
        res.status(404).json({ error: 'Arc not found' });
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;
      const filter = { arcId };

      const [chapters, total] = await Promise.all([
        Chapter.find(filter).sort({ chapterIndex: 1 }).skip(skip).limit(limit).lean(),
        Chapter.countDocuments(filter),
      ]);

      res.json({ chapters, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      console.error('List chapters error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/chapters/:id — get single chapter detail
router.get(
  '/chapters/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const chapter = await Chapter.findById(id).lean();

      if (!chapter) {
        res.status(404).json({ error: 'Chapter not found' });
        return;
      }

      res.json({ chapter });
    } catch (err) {
      console.error('Get chapter error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
