import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';

// Each test starts with a clean localStorage so demo-state tests don't leak.
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});
