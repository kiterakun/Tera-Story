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
