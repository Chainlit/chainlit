import matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';

expect.extend(matchers);

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn();

// Polyfill DOMMatrix for pdfjs-dist which requires it at import time in JSDOM
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    m11 = 1;
    m12 = 0;
    m13 = 0;
    m14 = 0;
    m21 = 0;
    m22 = 1;
    m23 = 0;
    m24 = 0;
    m31 = 0;
    m32 = 0;
    m33 = 1;
    m34 = 0;
    m41 = 0;
    m42 = 0;
    m43 = 0;
    m44 = 1;
    is2D = true;
    isIdentity = true;
    constructor(_init?: any) {}
    static fromMatrix(_other?: any): DOMMatrix {
      return new DOMMatrix();
    }
    static fromFloat32Array(_array32: any): DOMMatrix {
      return new DOMMatrix();
    }
    static fromFloat64Array(_array64: any): DOMMatrix {
      return new DOMMatrix();
    }
  } as unknown as typeof DOMMatrix;
}

afterEach(() => {
  cleanup();
});
