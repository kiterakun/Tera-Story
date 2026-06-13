/**
 * Input + Textarea — form primitives with full a11y contract.
 *
 * Contract:
 * - Always render a visible <label> with htmlFor pointing to the input id
 * - Error state: aria-invalid="true" + aria-describedby pointing to error
 * - Helper text: optional, paired via aria-describedby
 * - Required state: aria-required + visual asterisk
 * - Focus ring: focus-visible:ring-2 ring-accent-500
 *
 * Use `<Input>` for single-line text/numeric/email/password/...
 * Use `<Textarea>` for multi-line input.
 */

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from './cn';

// ============================================================
// Shared field wrapper
// ============================================================

interface FieldWrapperProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  children: (describedBy: string | undefined) => ReactNode;
}

function FieldWrapper({
  id,
  label,
  required,
  error,
  helperText,
  className,
  children,
}: FieldWrapperProps) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText && !error ? `${id}-helper` : undefined;
  const describedBy = errorId ?? helperId;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-ink-100 flex items-center gap-1"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            *
          </span>
        )}
      </label>
      {children(describedBy)}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-xs text-ink-500">
          {helperText}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Input
// ============================================================

const INPUT_CLASS =
  'w-full min-h-[44px] px-3 py-2 rounded-md bg-ink-950 border border-ink-700 ' +
  'text-ink-100 placeholder:text-ink-500 ' +
  'transition-colors duration-base ease-standard ' +
  'focus:outline-none focus:border-accent-500 focus-visible:ring-2 ' +
  'focus-visible:ring-accent-500 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-ink-950 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:border-danger ' +
  'aria-[invalid=true]:focus-visible:ring-danger';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  helperText?: string;
  /** Wrapper className for layout */
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    required,
    id: providedId,
    wrapperClassName,
    className,
    'aria-describedby': describedByProp,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <FieldWrapper
      id={id}
      label={label}
      required={required}
      error={error}
      helperText={helperText}
      className={wrapperClassName}
    >
      {(describedByAuto) => (
        <input
          id={id}
          ref={ref}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByProp ?? describedByAuto}
          aria-required={required || undefined}
          className={cn(INPUT_CLASS, className)}
          {...rest}
        />
      )}
    </FieldWrapper>
  );
});

// ============================================================
// Textarea
// ============================================================

const TEXTAREA_CLASS =
  'w-full min-h-[80px] px-3 py-2 rounded-md bg-ink-950 border border-ink-700 ' +
  'text-ink-100 placeholder:text-ink-500 resize-y ' +
  'transition-colors duration-base ease-standard ' +
  'focus:outline-none focus:border-accent-500 focus-visible:ring-2 ' +
  'focus-visible:ring-accent-500 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-ink-950 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:border-danger ' +
  'aria-[invalid=true]:focus-visible:ring-danger';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    error,
    helperText,
    required,
    id: providedId,
    wrapperClassName,
    className,
    'aria-describedby': describedByProp,
    rows = 4,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <FieldWrapper
      id={id}
      label={label}
      required={required}
      error={error}
      helperText={helperText}
      className={wrapperClassName}
    >
      {(describedByAuto) => (
        <textarea
          id={id}
          ref={ref}
          required={required}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByProp ?? describedByAuto}
          aria-required={required || undefined}
          className={cn(TEXTAREA_CLASS, className)}
          {...rest}
        />
      )}
    </FieldWrapper>
  );
});
