import '@testing-library/jest-dom';
import 'dayjs/locale/ru';
// Apply dayjs plugins (mirrors src/lib/dayjs.ts — must run before any component or hook test)
import '~/lib/dayjs';
// Initialise i18n so useTranslation() works inside components under test
import '~/lib/i18n';

// Clear localStorage between tests so atomWithStorage atoms don't bleed across test cases
afterEach(() => {
  localStorage.clear();
});
