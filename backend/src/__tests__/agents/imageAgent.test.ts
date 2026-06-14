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

vi.mock('../../services/sseManager', () => ({
  emit: vi.fn(),
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

function mockSuccessResponseWithBytes(prompt: string) {
  mockFetch
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [{ url: `https://example.com/generated.png?prompt=${encodeURIComponent(prompt)}` }] }),
    })
    .mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(Buffer.from('fake-png-bytes')),
    });
}

describe('generateImage — prompt building via fetch spy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    mockSuccessResponseWithBytes('Aria portrait');

    await expect(generateImage(
      { ...baseDetails, name: 'Aria' },
      'character',
      '507f1f77bcf86cd799439011',
      baseWorld,
      fakeImageConfig(),
    )).resolves.toBeUndefined();

    const prompt = extractPrompt();
    expect(prompt).toBeDefined();
    expect(prompt).toContain('Character portrait');
    expect(prompt).toContain('Aria');
    expect(prompt).toContain('high fantasy art style');
    expect(prompt).toContain('Eldoria');
    expect(prompt).toContain('No text, no watermark');
  });

  it('includes rarity in item prompt when provided', async () => {
    mockSuccessResponseWithBytes('Excalibur item');

    await expect(generateImage(
      { name: 'Excalibur', description: 'Legendary sword', rarity: 'legendary' },
      'item',
      '507f1f77bcf86cd799439012',
      baseWorld,
      fakeImageConfig(),
    )).resolves.toBeUndefined();

    const prompt = extractPrompt();
    expect(prompt).toContain('Single item illustration');
    expect(prompt).toContain('Excalibur');
    expect(prompt).toContain('legendary tier quality glow');
    expect(prompt).toContain('RPG inventory icon');
  });

  it('omits rarity phrase when rarity is absent in item prompt', async () => {
    mockSuccessResponseWithBytes('Potion item');

    await expect(generateImage(
      { name: 'Potion', description: 'A healing potion' },
      'item',
      '507f1f77bcf86cd799439013',
      baseWorld,
      fakeImageConfig(),
    )).resolves.toBeUndefined();

    const prompt = extractPrompt();
    expect(prompt).not.toContain('tier quality glow');
    expect(prompt).not.toContain('tier quality.');
  });

  it('generates special-item prompt with category and rarity', async () => {
    mockSuccessResponseWithBytes('Fireball special');

    await expect(generateImage(
      {
        name: 'Fireball',
        description: 'Launch a fireball',
        category: 'Spell',
        rarity: 'epic',
      },
      'special-item',
      '507f1f77bcf86cd799439014',
      baseWorld,
      fakeImageConfig(),
    )).resolves.toBeUndefined();

    const prompt = extractPrompt();
    expect(prompt).toContain('Magical ability icon');
    expect(prompt).toContain('Fireball');
    expect(prompt).toContain('Category: Spell');
    expect(prompt).toContain('epic tier quality');
    expect(prompt).toContain('Ethereal energy visualization');
  });

  it('generates world prompt with genre in the prompt', async () => {
    mockSuccessResponseWithBytes('Avalon world');

    await expect(generateImage(
      { name: 'Avalon', description: 'Mystic island' },
      'world',
      '507f1f77bcf86cd799439015',
      baseWorld,
      fakeImageConfig(),
    )).resolves.toBeUndefined();

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
    mockSuccessResponseWithBytes('Cyborg sci-fi');

    await expect(generateImage(
      { name: 'Cyborg', description: 'Half machine' },
      'character',
      '507f1f77bcf86cd799439016',
      sciFiWorld,
      fakeImageConfig(),
    )).resolves.toBeUndefined();

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
    mockSuccessResponseWithBytes('Sword Saint wuxia');

    await expect(generateImage(
      { name: 'Sword Saint', description: 'Master of the blade' },
      'character',
      '507f1f77bcf86cd799439017',
      wuxiaWorld,
      fakeImageConfig(),
    )).resolves.toBeUndefined();

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
    mockSuccessResponseWithBytes('Officer modern');

    await expect(generateImage(
      { name: 'Officer', description: 'City cop' },
      'character',
      '507f1f77bcf86cd799439018',
      modernWorld,
      fakeImageConfig(),
    )).resolves.toBeUndefined();

    const prompt = extractPrompt();
    expect(prompt).toContain('contemporary realistic style');
  });

  it('falls back to custom genre style for unknown genre', async () => {
    const unknownWorld: WorldContext = {
      name: 'Unknown',
      description: '',
      genre: 'custom',
    };
    mockSuccessResponseWithBytes('Mystery custom');

    await expect(generateImage(
      { name: 'Mystery', description: 'Unknown entity' },
      'character',
      '507f1f77bcf86cd799439019',
      unknownWorld,
      fakeImageConfig(),
    )).resolves.toBeUndefined();

    const prompt = extractPrompt();
    expect(prompt).toContain('detailed digital art');
  });

  it('throws error when API returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limit exceeded'),
    });

    await expect(generateImage(
      baseDetails,
      'character',
      '507f1f77bcf86cd79943901a',
      baseWorld,
      fakeImageConfig(),
    )).rejects.toThrow('Image API error (429): Rate limit exceeded');
  });

  it('throws error when download fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [{ url: 'https://example.com/image.png' }] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

    await expect(generateImage(
      baseDetails,
      'character',
      '507f1f77bcf86cd79943901b',
      baseWorld,
      fakeImageConfig(),
    )).rejects.toThrow('Failed to download image: HTTP 404');
  });
});
