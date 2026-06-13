/**
 * Layout — thin shell that wraps every authenticated route.
 *
 * Renders the sticky Navbar above the main content area. All
 * authentication-aware logic lives in Navbar (which reads the
 * auth store). This shell is intentionally minimal so it can be
 * tested in isolation.
 *
 * Spec: .kite-docs/spec/layout-navigation-spec.md (section 4.1)
 */

import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-200">
      <Navbar />
      <main id="main-content" className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
}
