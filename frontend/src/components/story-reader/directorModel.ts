/**
 * Shared types, constants, and API helpers for the Director mode panel
 * and the GamePanel's Director tab. Kept in a separate file so React
 * Fast Refresh works cleanly on the .tsx component.
 */

export type Tone = 'serious' | 'balanced' | 'whimsical';
export type Pacing = 'slow' | 'normal' | 'fast';

export interface DirectorSettings {
  tone: Tone;
  danger: number;
  romance: number;
  comedy: number;
  pacing: Pacing;
}

export const DEFAULT_DIRECTOR: DirectorSettings = {
  tone: 'balanced',
  danger: 50,
  romance: 30,
  comedy: 40,
  pacing: 'normal',
};

export const DIRECTOR_API = '/api/v1/playthroughs';

export async function fetchDirector(playthroughId: string): Promise<DirectorSettings> {
  const res = await fetch(`${DIRECTOR_API}/${playthroughId}/director`, { credentials: 'include' });
  const body = await res.json();
  if (body?.status === 'success' && body.data?.director) return body.data.director;
  return DEFAULT_DIRECTOR;
}

export async function putDirector(
  playthroughId: string,
  partial: Partial<DirectorSettings>,
): Promise<DirectorSettings | null> {
  const res = await fetch(`${DIRECTOR_API}/${playthroughId}/director`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial),
  });
  const body = await res.json();
  if (body?.status === 'success' && body.data?.director) return body.data.director;
  return null;
}
