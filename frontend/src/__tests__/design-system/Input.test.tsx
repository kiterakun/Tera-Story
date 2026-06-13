import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input, Textarea } from '../../design-system/Input';

describe('Input primitive — a11y contract', () => {
  it('renders label with htmlFor pointing to the input id', () => {
    render(<Input label="Email" />);
    const label = screen.getByText(/email/i);
    const input = screen.getByRole('textbox');
    expect(label).toHaveAttribute('for', input.id);
  });

  it('renders a default min-height of 44px for touch target compliance', () => {
    render(<Input label="Email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('min-h-[44px]');
  });

  it('renders focus-visible ring class for keyboard accessibility', () => {
    render(<Input label="Email" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toMatch(/focus-visible:ring/);
  });

  it('renders required asterisk and aria-required', () => {
    render(<Input label="Email" required />);
    expect(screen.getByText(/\*/)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
  });

  it('error state: sets aria-invalid and links to error via aria-describedby', () => {
    render(<Input label="Email" error="Invalid email address" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const errorEl = screen.getByRole('alert');
    expect(errorEl).toHaveTextContent(/invalid email/i);
    expect(input.getAttribute('aria-describedby')).toBe(errorEl.id);
  });

  it('helper text: links to helper via aria-describedby when no error', () => {
    render(<Input label="Username" helperText="Letters and numbers only" />);
    const input = screen.getByRole('textbox');
    const helperEl = screen.getByText(/letters and numbers only/i);
    expect(input.getAttribute('aria-describedby')).toBe(helperEl.id);
  });

  it('error overrides helper text (only error is announced)', () => {
    render(
      <Input
        label="Username"
        helperText="Letters and numbers only"
        error="Already taken"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/already taken/i);
    expect(screen.queryByText(/letters and numbers only/i)).not.toBeInTheDocument();
  });

  it('fires onChange when typed into', () => {
    const onChange = vi.fn();
    render(<Input label="Email" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a@b.c' } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('allows consumer to provide their own id', () => {
    render(<Input label="Email" id="my-input" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'my-input');
    expect(screen.getByText(/email/i)).toHaveAttribute('for', 'my-input');
  });

  it('honors disabled prop', () => {
    render(<Input label="Email" disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('applies custom className to input element', () => {
    render(<Input label="Email" className="font-mono" />);
    expect(screen.getByRole('textbox')).toHaveClass('font-mono');
  });
});

describe('Textarea primitive — a11y contract', () => {
  it('renders label with htmlFor pointing to the textarea id', () => {
    render(<Textarea label="Description" />);
    const label = screen.getByText(/description/i);
    const ta = screen.getByRole('textbox');
    expect(label).toHaveAttribute('for', ta.id);
  });

  it('default rows is 4', () => {
    render(<Textarea label="Description" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4');
  });

  it('honors custom rows prop', () => {
    render(<Textarea label="Description" rows={8} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '8');
  });

  it('renders required + aria-required', () => {
    render(<Textarea label="Description" required />);
    expect(screen.getByText(/\*/)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
  });

  it('error state: aria-invalid + links to error via aria-describedby', () => {
    render(<Textarea label="Description" error="Required" />);
    const ta = screen.getByRole('textbox');
    expect(ta).toHaveAttribute('aria-invalid', 'true');
    const errorEl = screen.getByRole('alert');
    expect(ta.getAttribute('aria-describedby')).toBe(errorEl.id);
  });

  it('helper text: links via aria-describedby when no error', () => {
    render(<Textarea label="Description" helperText="Markdown allowed" />);
    const ta = screen.getByRole('textbox');
    const helperEl = screen.getByText(/markdown allowed/i);
    expect(ta.getAttribute('aria-describedby')).toBe(helperEl.id);
  });

  it('applies custom className', () => {
    render(<Textarea label="Description" className="min-h-[120px]" />);
    expect(screen.getByRole('textbox')).toHaveClass('min-h-[120px]');
  });
});
