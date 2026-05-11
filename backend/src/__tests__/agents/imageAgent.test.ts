import { generateImage, ImageJobDetails, WorldContext } from '../../agents/imageAgent';
import type { IAgentConfig } from '../../types/user.types';

vi.mock('fs', () => ({
  default: { mkdirSync: vi.fn(), writeFileSync: vi.fn() },
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('../../services/encryption', () => ({
  decrypt: vi.fn((s: string) => s),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function fakeImageConfig(overrides?: Partial<IAgentConfig>): IAgentConfig {
  return {
    provider: 'openai',
    model: 'dall-e-3',
    apiKey: 'fake-key',
    ...overrides,
  };
}

describe('generateImage — prompt building via fetch spy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockRejectedValue(new Error('stop'));
  });

  function extractPrompt(): string | undefined {
    const call = mockFetch.mock.calls[0];
    if (!call || !call[1]?.body) return undefined;
    const body = JSON.parse(call[1].body as string);
    return body?.prompt;
  }

  const baseDetails: ImageJobDetails = {
    name: 'TestEntity',
    description: 'A test entity description',
  };

  const baseWorld: WorldContext = {
    name: 'Eldoria',
    description: 'A land of ancient magic.',
    genre: 'fantasy',
  };

  it('generates character prompt with fantasy genre style keywords', async () => {
    await generateImage(
      { ...baseDetails, name: 'Aria' },
      'character',
      'char-1',
      baseWorld,
      fakeImageConfig(),
    );

    const prompt = extractPrompt();
    expect(prompt).toBeDefined();
    expect(prompt).toContain('Character portrait');
    expect(prompt).toContain('Aria');
    expect(prompt).toContain('high fantasy art style');
    expect(prompt).toContain('Eldoria');
    expect(prompt).toContain('No text, no watermark');
  });

  it('includes rarity in item prompt when provided', async () => {
    await generateImage(
      { name: 'Excalibur', description: 'Legendary sword', rarity: 'legendary' },
      'item',
      'item-1',
      baseWorld,
      fakeImageConfig(),
    );

    const prompt = extractPrompt();
    expect(prompt).toContain('Single item illustration');
    expect(prompt).toContain('Excalibur');
    expect(prompt).toContain('legendary tier quality glow');
    expect(prompt).toContain('RPG inventory icon');
  });

  it('omits rarity phrase when rarity is absent in item prompt', async () => {
    await generateImage(
      { name: 'Potion', description: 'A healing potion' },
      'item',
      'item-2',
      baseWorld,
      fakeImageConfig(),
    );

    const prompt = extractPrompt();
    expect(prompt).not.toContain('tier quality glow');
    expect(prompt).not.toContain('tier quality.');
  });

  it('generates special-item prompt with category and rarity', async () => {
    await generateImage(
      {
        name: 'Fireball',
        description: 'Launch a fireball',
        category: 'Spell',
        rarity: 'epic',
      },
      'special-item',
      'si-1',
      baseWorld,
      fakeImageConfig(),
    );

    const prompt = extractPrompt();
    expect(prompt).toContain('Magical ability icon');
    expect(prompt).toContain('Fireball');
    expect(prompt).toContain('Category: Spell');
    expect(prompt).toContain('epic tier quality');
    expect(prompt).toContain('Ethereal energy visualization');
  });

  it('generates world prompt with genre in the prompt', async () => {
    await generateImage(
      { name: 'Avalon', description: 'Mystic island' },
      'world',
      'w-1',
      baseWorld,
      fakeImageConfig(),
    );

    const prompt = extractPrompt();
    expect(prompt).toContain('Panoramic landscape vista');
    expect(prompt).toContain('Avalon');
    expect(prompt).toContain('Genre: fantasy');
    expect(prompt).toContain('Epic scale');
    expect(prompt).toContain('cinematic composition');
    expect(prompt).toContain('no characters');
  });

  it('uses sci-fi style for sci-fi genre', async () => {
    const sciFiWorld: WorldContext = {
      name: 'Neo Tokyo',
      description: 'A neon-lit metropolis.',
      genre: 'sci-fi',
    };
    await generateImage(
      { name: 'Cyborg', description: 'Half machine' },
      'character',
      'char-sf',
      sciFiWorld,
      fakeImageConfig(),
    );

    const prompt = extractPrompt();
    expect(prompt).toContain('science fiction concept art');
    expect(prompt).toContain('Neo Tokyo');
  });

  it('uses wuxia style for wuxia genre', async () => {
    const wuxiaWorld: WorldContext = {
      name: 'Jianghu',
      description: 'Martial world',
      genre: 'wuxia',
    };
    await generateImage(
      { name: 'Sword Saint', description: 'Master of the blade' },
      'character',
      'char-wx',
      wuxiaWorld,
      fakeImageConfig(),
    );

    const prompt = extractPrompt();
    expect(prompt).toContain('Chinese martial arts painting style');
    expect(prompt).toContain('Jianghu');
  });

  it('uses modern realistic style for modern genre', async () => {
    const modernWorld: WorldContext = {
      name: 'City 17',
      description: 'Urban sprawl.',
      genre: 'modern',
    };
    await generateImage(
      { name: 'Officer', description: 'City cop' },
      'character',
      'char-md',
      modernWorld,
      fakeImageConfig(),
    );

    const prompt = extractPrompt();
    expect(prompt).toContain('contemporary realistic style');
  });

  it('falls back to custom genre style for unknown genre', async () => {
    const unknownWorld: WorldContext = {
      name: 'Unknown',
      description: '',
      genre: 'custom',
    };
    await generateImage(
      { name: 'Mystery', description: 'Unknown entity' },
      'character',
      'char-unk',
      unknownWorld,
      fakeImageConfig(),
    );

    const prompt = extractPrompt();
    expect(prompt).toContain('detailed digital art');
  });
});
