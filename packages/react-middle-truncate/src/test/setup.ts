import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Files opting into `@vitest-environment node` (SSR tests) have no DOM.
if (typeof HTMLCanvasElement !== 'undefined') {
  // jsdom has no layout engine: canvas.measureText always returns 0. Approximate
  // 8px per UTF-16 code unit so the binary search is actually exercised.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    measureText: (text: string) => ({ width: text.length * 8 }),
    font: '',
  } as unknown as CanvasRenderingContext2D)

  // ResizeObserver is not implemented in jsdom.
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
