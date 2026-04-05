import 'dayjs/locale/ru';
// Apply dayjs plugins (mirrors src/lib/dayjs.ts — must run before any component or hook test)
import '~/lib/dayjs';
// Initialise i18n so useTranslation() works inside components under test
import '~/lib/i18n';
import '@testing-library/jest-dom/vitest';

const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);
window.HTMLElement.prototype.scrollIntoView = () => {};

// Mantine uses window.matchMedia for color scheme detection — jsdom doesn't implement it
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

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

// Clear localStorage between tests so atomWithStorage atoms don't bleed across test cases
afterEach(() => {
  localStorage.clear();
});
