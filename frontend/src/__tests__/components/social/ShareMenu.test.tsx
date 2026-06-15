import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { ShareMenu } from '../../../components/social/ShareMenu';

describe('ShareMenu', () => {
  const baseProps = {
    shareType: 'story' as const,
    shareId: 'abc123',
  };

  it('renders the trigger button with the share title', () => {
    render(<ShareMenu {...baseProps} />);
    expect(screen.getByRole('button', { name: /Chia sẻ|Share/ })).toBeInTheDocument();
  });

  it('shows the live share URL preview when opened', async () => {
    render(<ShareMenu {...baseProps} />);
    const trigger = screen.getByRole('button', { name: /Chia sẻ|Share/ });
    await userEvent.click(trigger);

    expect(screen.getByRole('textbox', { name: /Share URL preview|Xem trước URL chia sẻ/ })).toHaveValue(
      `${window.location.origin}/share/${baseProps.shareId}`
    );
  });

  it('has no axe violations when closed', async () => {
    const { container } = render(<ShareMenu {...baseProps} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
