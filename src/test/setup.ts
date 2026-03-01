import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// Mock IndexedDB for tests
const mockStore: Record<string, unknown> = {};

const mockIDBRequest = (result: unknown) => ({
  result,
  onsuccess: null as (() => void) | null,
  onerror: null as (() => void) | null,
  error: null,
});

vi.stubGlobal('indexedDB', {
  open: () => {
    const req = mockIDBRequest({
      objectStoreNames: { contains: () => true },
      createObjectStore: () => ({
        createIndex: () => {},
      }),
      transaction: () => ({
        objectStore: () => ({
          put: () => mockIDBRequest(undefined),
          get: (key: string) => {
            const r = mockIDBRequest(mockStore[key]);
            setTimeout(() => r.onsuccess?.(), 0);
            return r;
          },
          delete: () => mockIDBRequest(undefined),
          index: () => ({
            getAll: () => {
              const r = mockIDBRequest([]);
              setTimeout(() => r.onsuccess?.(), 0);
              return r;
            },
            getAllKeys: () => {
              const r = mockIDBRequest([]);
              setTimeout(() => r.onsuccess?.(), 0);
              return r;
            },
          }),
        }),
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
      }),
    });
    setTimeout(() => req.onsuccess?.(), 0);
    return req;
  },
});
