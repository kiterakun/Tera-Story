import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

interface WrapperOptions {
  initialEntries?: string[];
}

/**
 * Custom render that wraps component with MemoryRouter.
 * Add more providers (stores, i18n) as needed.
 */
export function renderWithRouter(
  ui: ReactElement,
  options?: RenderOptions & WrapperOptions,
) {
  const { initialEntries = ["/"], ...renderOptions } = options || {};
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// eslint-disable-next-line react-refresh/only-export-components
export * from "@testing-library/react";
