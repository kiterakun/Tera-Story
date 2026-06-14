import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

function ThrowingChild() {
  throw new Error('sensitive provider stack details');
}

describe('ErrorBoundary', () => {
  it('shows a generic message instead of raw error details', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: /Something went wrong|Đã xảy ra lỗi$/ })).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred|Đã xảy ra lỗi không xác định/)).toBeInTheDocument();
    expect(screen.queryByText('sensitive provider stack details')).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
