/**
 * /api/v1 router — versioned alias for the existing /api/* routes.
 *
 * This is a thin re-mount of the same Express router objects. The
 * handler chain (auth, validation, controllers) is identical; only
 * the URL prefix changes. The responseEnvelope middleware wraps
 * res.json() so all v1 responses emit the standard envelope shape
 * { status, data, requestId }.
 *
 * Once the frontend fully migrates to /api/v1/* and v1 routes use the
 * typed ok()/fail() helpers directly, the envelope wrapper can be
 * removed.
 */

import { Router } from 'express';

import { responseEnvelope } from '../middleware/responseEnvelope';

import authRouter from '../routes/auth';
import worldsRouter from '../routes/worlds';
import playthroughsRouter from '../routes/playthroughs';
import charactersRouter from '../routes/characters';

const v1Router = Router();

// Wrap all res.json() calls under /api/v1/* to emit the v1 envelope.
v1Router.use(responseEnvelope);

// /api/v1/auth → mirrors /api/auth
v1Router.use('/auth', authRouter);
// /api/v1/worlds → mirrors /api/worlds
v1Router.use('/worlds', worldsRouter);
// /api/v1/playthroughs → mirrors /api/playthroughs
v1Router.use('/playthroughs', playthroughsRouter);
// Director + memory sub-routes (GET/PUT director, GET memory).
import playthroughExtrasRouter from './playthroughs';
v1Router.use('/playthroughs', playthroughExtrasRouter);
// /api/v1/characters → mirrors /api/characters
v1Router.use('/characters', charactersRouter);

// Share + export sub-routes (mounted on /playthroughs and /share).
import shareRouter from './share';
v1Router.use('/playthroughs', shareRouter);
v1Router.use('/share', shareRouter);

// Health check parity (envelope-wrapped)
v1Router.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: 'v1', timestamp: new Date().toISOString() });
});

export default v1Router;
