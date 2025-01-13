import matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';

expect.extend(matchers);

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn();

afterEach(() => {
  cleanup();
});
