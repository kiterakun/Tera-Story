import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { ResourceTemplateEditor } from '../../../components/world-create/ResourceTemplateEditor';

describe('ResourceTemplateEditor a11y', () => {
  it('has no axe violations with a single resource', async () => {
    const { container } = render(
      <ResourceTemplateEditor
        resources={[{ key: 'HP', type: 'progress', min: 0, max: 100, defaultValue: 100 }]}
        onChange={() => undefined}
        title="Resource Templates"
        addLabel="Add"
        nameLabel="Key"
        namePlaceholder="e.g. HP"
      />,
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
