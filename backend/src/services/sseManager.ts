import { Response } from 'express';

const clients = new Map<string, Set<Response>>();

export function addClient(playthroughId: string, res: Response): void {
  const playthroughClients = clients.get(playthroughId) ?? new Set<Response>();
  playthroughClients.add(res);
  clients.set(playthroughId, playthroughClients);

  res.on('close', () => {
    removeClient(playthroughId, res);
  });
}

export function removeClient(playthroughId: string, res: Response): void {
  const playthroughClients = clients.get(playthroughId);
  if (!playthroughClients) return;

  playthroughClients.delete(res);

  if (playthroughClients.size === 0) {
    clients.delete(playthroughId);
  }
}

export function emit(playthroughId: string, event: string, data: object): void {
  const playthroughClients = clients.get(playthroughId);
  if (!playthroughClients) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const res of playthroughClients) {
    try {
      res.write(payload);
    } catch {
      removeClient(playthroughId, res);
    }
  }
}

// Per-user SSE support
const userClients = new Map<string, Set<Response>>();

export function addUserClient(userId: string, res: Response): void {
  const userSet = userClients.get(userId) ?? new Set<Response>();
  userSet.add(res);
  userClients.set(userId, userSet);

  res.on('close', () => {
    removeUserClient(userId, res);
  });
}

export function removeUserClient(userId: string, res: Response): void {
  const userSet = userClients.get(userId);
  if (!userSet) return;

  userSet.delete(res);

  if (userSet.size === 0) {
    userClients.delete(userId);
  }
}

export function emitToUser(userId: string, event: string, data: object): void {
  const userSet = userClients.get(userId);
  if (!userSet) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const res of userSet) {
    try {
      res.write(payload);
    } catch {
      removeUserClient(userId, res);
    }
  }
}
