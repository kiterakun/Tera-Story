import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { startDailyResetJob } from './jobs/dailyReset';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import settingsRouter from './routes/settings';
import worldsRouter from './routes/worlds';
import playthroughsRouter from './routes/playthroughs';
import charactersRouter from './routes/characters';
import chaptersRouter from './routes/chapters';
import supportRouter from './routes/support';
import storyRouter from './routes/story';
import itemsRouter from './routes/items';
import specialItemsRouter from './routes/specialItems';
import imagesRouter from './routes/images';
import specialItemTemplatesRouter from './routes/specialItemTemplates';
import relationshipsRouter from './routes/relationships';
import combatRouter from './routes/combat';
import eventsRouter from './routes/events';
import progressionRouter from './routes/progression';
import echoesRouter from './routes/echoes';
import whispersRouter from './routes/whispers';
import galleryRouter from './routes/gallery';
import achievementsRouter from './routes/achievements';
import chronicleRouter from './routes/chronicle';
import fateThreadsRouter from './routes/fateThreads';
import dailyRouter from './routes/daily';
import friendsRouter from './routes/friends';
import leaderboardRouter from './routes/leaderboard';
import mapRouter from './routes/map';
import privacyRouter from './routes/privacy';
import shareRouter from './routes/share';
import archiveRouter from './routes/archive';
import organizationsRouter from './routes/organizations';
import { authMiddleware } from './middleware/auth';
import v1Router from './v1/router';
import { logger } from './utils/logger';
import * as Sentry from '@sentry/node';

export const app: Express = express();

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));

// Parsers
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// Assign a UUID to every request and echo it in the X-Request-Id response
// header for client-side debugging. Runs before rate limiting and routes.
import { requestId } from './middleware/requestId';
app.use(requestId);

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 1000 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 150 : 1500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/', authLimiter);

// Story generation rate limit (stricter — costs LLM tokens)
const storyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 50 : 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/story/', storyLimiter);

// Static Files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString() 
  });
});

// Auth Routes
app.use('/api/auth', authRouter);

// Settings Routes
app.use('/api/settings', authMiddleware, settingsRouter);

// Privacy Routes
app.use('/api/user/privacy', authMiddleware, privacyRouter);

// Progression Routes
app.use('/api/user', progressionRouter);

// SSE Events Route (auth handled inside route for EventSource query/cookie support)
app.use('/api/events', eventsRouter);

// World Routes
app.use('/api/worlds', authMiddleware, worldsRouter);

// Playthrough Routes (standalone)
app.use('/api/playthroughs', authMiddleware, playthroughsRouter);

// Echoes Routes (nested under playthroughs)
app.use('/api/playthroughs/:playthroughId/echoes', authMiddleware, echoesRouter);

// Whispers Routes (nested under playthroughs)
app.use('/api/playthroughs/:playthroughId/whispers', authMiddleware, whispersRouter);

// Gallery Routes
app.use('/api/gallery', authMiddleware, galleryRouter);

// Map Routes
app.use('/api/map', mapRouter);

// Achievements Routes
app.use('/api/achievements', authMiddleware, achievementsRouter);

// Chronicle Routes (nested under playthroughs)
app.use('/api/playthroughs/:playthroughId/chronicle', authMiddleware, chronicleRouter);

// Fate Threads Routes (nested under playthroughs)
app.use('/api/playthroughs/:playthroughId/threads', authMiddleware, fateThreadsRouter);

// Daily Engagement Routes
app.use('/api/daily', authMiddleware, dailyRouter);

// Friends Routes
app.use('/api/friends', authMiddleware, friendsRouter);

// Leaderboard Routes
app.use('/api/leaderboard', authMiddleware, leaderboardRouter);

// Share Routes (public — no auth)
app.use('/api/share', shareRouter);

// Archive Routes
app.use('/api/archive', authMiddleware, archiveRouter);

// Organization Routes
app.use('/api/worlds/:worldId/playthroughs/:playthroughId/organizations', authMiddleware, organizationsRouter);
app.use('/api/organizations', authMiddleware, organizationsRouter);

// Public Chronicle Share (no auth)
app.get('/api/share/chronicle/:shareId', async (req, res) => {
  try {
    const { Playthrough } = await import('./models/Playthrough');
    const { shareId } = req.params;
    const playthrough = await Playthrough.findOne({ shareId }).lean();
    if (!playthrough) {
      res.status(404).json({ status: 'error', message: 'Chronicle not found' });
      return;
    }
    res.json({
      status: 'success',
      data: {
        chronicle: playthrough.chronicleCache ?? null,
        worldId: playthrough.worldId,
        ownerId: playthrough.userId,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Public chronicle error');
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// /api/v1/* — auth is applied per-route in the v1 router so public
// endpoints such as share/token remain readable without credentials.
app.use('/api/v1', v1Router);

// Character Routes (nested under playthroughs + standalone)
app.use('/api', authMiddleware, charactersRouter);

// Chapter/Arc Routes (nested under playthroughs, arcs, chapters)
app.use('/api', authMiddleware, chaptersRouter);

// Sentry — initialized only when SENTRY_DSN is set. Captures uncaught
// exceptions and request-scoped errors with requestId as a tag.
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV ?? 'development',
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0,
  });
  Sentry.setTag('service', 'tera-story-api');
  app.use((req, _res, next) => {
    if (req.requestId) Sentry.setTag('requestId', req.requestId);
    next();
  });
  logger.info('Sentry initialized');
}

// Item Routes (nested under playthroughs + standalone)
app.use('/api', authMiddleware, itemsRouter);

// Special Item Routes (nested under playthroughs + standalone)
app.use('/api', authMiddleware, specialItemsRouter);

// Special Item Template Routes (CRUD for world templates)
app.use('/api', authMiddleware, specialItemTemplatesRouter);

// Image Routes (regeneration)
app.use('/api/images', authMiddleware, imagesRouter);
// Support Routes (AI-assisted enrichment)
app.use('/api/support', authMiddleware, supportRouter);

// Story Routes (generation + state)
app.use('/api', authMiddleware, storyRouter);

// Relationship & Consequence Routes
app.use('/api', authMiddleware, relationshipsRouter);

// Combat Routes
app.use('/api', authMiddleware, combatRouter);

// Error handler (must be last middleware)
app.use(errorHandler);

// Start logic separated for testing
if (require.main === module) {
  const PORT = parseInt(env.PORT, 10);
  
  connectDatabase().then(() => {
    app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
    startDailyResetJob();
  }).catch(err => {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await disconnectDatabase();
  process.exit(0);
});
