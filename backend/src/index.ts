import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
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
import { authMiddleware } from './middleware/auth';

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

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 100 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 20 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/', authLimiter);

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

// World Routes
app.use('/api/worlds', authMiddleware, worldsRouter);

// Playthrough Routes (standalone)
app.use('/api/playthroughs', authMiddleware, playthroughsRouter);

// Character Routes (nested under playthroughs + standalone)
app.use('/api', authMiddleware, charactersRouter);

// Chapter/Arc Routes (nested under playthroughs, arcs, chapters)
app.use('/api', authMiddleware, chaptersRouter);

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
      console.log(`Server listening on port ${PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await disconnectDatabase();
  process.exit(0);
});
