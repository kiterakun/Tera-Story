import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * useDraftStore — local autosave/draft for long forms and freeform
 * choices. Persists to localStorage with key 'tera-story-draft'. The
 * store is intentionally small and string-typed so it survives schema
 * changes (consumer code is responsible for graceful migration).
 *
 * Drafts are versioned by `kind`:
 *   - 'world':  { form: WorldDraft,  updatedAt: ISO string }
 *   - 'character': { form: CharacterDraft, updatedAt: ISO string }
 *   - 'choice':  { playthroughId, choice, updatedAt }
 *
 * New draft kinds can be added without bumping a version because the
 * store only consumes the shape it knows about. The listAll() helper
 * returns every persisted draft as a generic record so future UI
 * (the /drafts page) can show them all.
 */

export interface WorldDraft {
  name: string;
  description: string;
  genre: string;
  resourceTemplates: unknown[];
  organizationTemplates: unknown[];
  step: number;
}

export interface CharacterDraft {
  name: string;
  description: string;
  archetype: string;
  background: string;
  personality: string;
  appearance: string;
  step: number;
}

export interface ChoiceDraft {
  playthroughId: string;
  choice: string;
}

export type DraftKind = 'world' | 'character' | 'choice';
export type Draft = WorldDraft | CharacterDraft | ChoiceDraft;

export interface DraftEntry {
  kind: DraftKind;
  data: Draft;
  updatedAt: string;
}

export interface DraftStore {
  // World form draft
  world?: DraftEntry;
  // Character form draft (per playthrough creation; current implementation
  // uses a single slot per browser since WorldCreate groups multiple
  // characters at once).
  character?: DraftEntry;
  // Choice drafts keyed by playthroughId.
  choices: Record<string, DraftEntry>;
  // Mutators
  setWorld: (data: WorldDraft) => void;
  clearWorld: () => void;
  setCharacter: (data: CharacterDraft) => void;
  clearCharacter: () => void;
  setChoice: (playthroughId: string, choice: string) => void;
  clearChoice: (playthroughId: string) => void;
  // Returns all drafts (used by /drafts page).
  listAll: () => Array<DraftEntry & { id: string }>;
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      choices: {},
      setWorld: (data) =>
        set({ world: { kind: 'world', data, updatedAt: new Date().toISOString() } }),
      clearWorld: () => set({ world: undefined }),
      setCharacter: (data) =>
        set({ character: { kind: 'character', data, updatedAt: new Date().toISOString() } }),
      clearCharacter: () => set({ character: undefined }),
      setChoice: (playthroughId, choice) =>
        set((state) => ({
          choices: {
            ...state.choices,
            [playthroughId]: {
              kind: 'choice',
              data: { playthroughId, choice },
              updatedAt: new Date().toISOString(),
            },
          },
        })),
      clearChoice: (playthroughId) =>
        set((state) => {
          const next = { ...state.choices };
          delete next[playthroughId];
          return { choices: next };
        }),
      listAll: () => {
        const { world, character, choices } = get();
        const out: Array<DraftEntry & { id: string }> = [];
        if (world) out.push({ id: 'world', ...world });
        if (character) out.push({ id: 'character', ...character });
        for (const [id, entry] of Object.entries(choices)) {
          out.push({ id, ...entry });
        }
        return out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
      },
    }),
    {
      name: 'tera-story-draft',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
