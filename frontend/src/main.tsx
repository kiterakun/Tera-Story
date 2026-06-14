import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './index.css'

// Sentry — initialized only when VITE_SENTRY_DSN is set. Captures
// uncaught errors and integrates with the ErrorBoundary. Production
// traces are sampled at 10% to balance cost vs signal.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 0,
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
