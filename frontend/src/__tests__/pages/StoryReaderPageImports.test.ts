import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('StoryReaderPage imports', () => {
  it('binds RPGPanel when rendering the desktop RPG sidebar', () => {
    const source = readFileSync(resolve(__dirname, '../../pages/StoryReaderPage.tsx'), 'utf8');

    expect(source).toContain('<RPGPanel');
    expect(source).toMatch(/(?:import\s+RPGPanel\s+from\s+['"]\.\.\/components\/RPGPanel['"]|const\s+RPGPanel\s*=\s*lazy\()/);
  });
});
