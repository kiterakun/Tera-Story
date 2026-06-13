import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResourceTemplatesStep } from '../../../components/world-create/ResourceTemplatesStep';

describe('ResourceTemplatesStep', () => {
  it('renders both resource and location resource sections', () => {
    render(
      <ResourceTemplatesStep
        resources={[{ key: 'HP', type: 'progress', min: 0, max: 100, defaultValue: 100 }]}
        setResources={() => undefined}
        locationResources={[{ key: 'danger', type: 'number', min: 0, max: 10, defaultValue: 1 }]}
        setLocationResources={() => undefined}
      />,
    );
    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('danger')).toBeInTheDocument();
  });
});
