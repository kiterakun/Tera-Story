/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { useTranslation } from '../i18n';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const t = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-ink-950 text-ink-100">
      <div className="text-center max-w-md bg-ink-900 border border-ink-700/60 p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold font-display text-red-400 mb-4">
          {t.errors.somethingWentWrong}
        </h2>
        <p className="text-ink-300 mb-6 text-sm">
          {error?.message || t.errors.unexpectedError}
        </p>
        <button
          onClick={onReset}
          className="px-5 py-2.5 bg-accent-600 text-white font-semibold rounded-xl hover:bg-accent-500 transition-colors shadow-lg shadow-accent-600/20"
        >
          {t.errors.reloadPage}
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => {
            this.setState({ hasError: false, error: null });
            window.location.reload();
          }}
        />
      );
    }

    return this.props.children;
  }
}
