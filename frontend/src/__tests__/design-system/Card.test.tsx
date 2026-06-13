import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, CardHeader, CardBody, CardFooter } from '../../design-system/Card';

describe('Card primitive', () => {
  it('renders default panel variant as <div>', () => {
    render(<Card>Body</Card>);
    const card = screen.getByText(/body/i).closest('div');
    expect(card?.tagName).toBe('DIV');
    expect(card).toHaveClass('bg-ink-800');
    expect(card).toHaveClass('border-ink-700');
    expect(card).toHaveClass('rounded-2xl');
  });

  it('renders elevated variant with shadow-lg', () => {
    render(<Card variant="elevated">Body</Card>);
    const card = screen.getByText(/body/i).closest('div');
    expect(card).toHaveClass('shadow-lg');
  });

  it('renders interactive variant with hover affordance', () => {
    render(<Card variant="interactive">Body</Card>);
    const card = screen.getByText(/body/i).closest('div');
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('hover:border-ink-600');
    expect(card).toHaveClass('hover:shadow-md');
  });

  it('interactive variant with onClick renders as <button>', () => {
    render(<Card variant="interactive" onClick={() => {}}>Body</Card>);
    const btn = screen.getByRole('button', { name: /body/i });
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).toHaveClass('cursor-pointer');
  });

  it('fires onClick when interactive card clicked', () => {
    const onClick = vi.fn();
    render(
      <Card variant="interactive" onClick={onClick}>
        Click me
      </Card>,
    );
    fireEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does NOT fire onClick when interactive card is disabled', () => {
    const onClick = vi.fn();
    render(
      <Card variant="interactive" onClick={onClick} disabled>
        Click me
      </Card>,
    );
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('panel variant renders <div> even with onClick (no button role)', () => {
    const onClick = vi.fn();
    render(
      <Card variant="panel" onClick={onClick}>
        Click
      </Card>,
    );
    // panel + onClick → still a div (only interactive becomes a button)
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('CardHeader renders with top border', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass('border-b');
    expect(header).toHaveClass('border-ink-700');
  });

  it('CardBody renders content with default padding', () => {
    const { container } = render(<CardBody>Body</CardBody>);
    const body = container.firstChild as HTMLElement;
    expect(body).toHaveClass('px-card-lg');
    expect(body).toHaveClass('py-card');
  });

  it('CardFooter renders with top border', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    const footer = container.firstChild as HTMLElement;
    expect(footer).toHaveClass('border-t');
    expect(footer).toHaveClass('border-ink-700');
  });

  it('accepts className override', () => {
    render(<Card className="w-full">Body</Card>);
    const card = screen.getByText(/body/i).closest('div');
    expect(card).toHaveClass('w-full');
  });

  it('interactive variant has focus-visible ring for keyboard a11y', () => {
    render(<Card variant="interactive" onClick={() => {}}>Body</Card>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/focus-visible:ring/);
  });
});
