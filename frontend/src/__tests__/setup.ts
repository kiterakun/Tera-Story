import '@testing-library/jest-dom';

// Set default language to Vietnamese so all test assertions match VI translations.
// useLanguage() falls back to localStorage['tera-lang'] when no Zustand settings are loaded.
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
