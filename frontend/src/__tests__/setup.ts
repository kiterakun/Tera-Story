import '@testing-library/jest-dom';
import 'vitest-axe/extend-expect';

// Set default language to Vietnamese so all test assertions match VI translations.
localStorage.setItem('tera-lang', 'vi');

// jsdom polyfills
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

window.scrollTo = () => {};
