import { toGraphemes } from './graphemes'

// One context shared by every instance: a table with hundreds of truncated
// addresses should not allocate hundreds of canvases. The font is reassigned
// before each measurement pass, which is cheap.
let sharedContext: CanvasRenderingContext2D | null | undefined

function getContext(): CanvasRenderingContext2D | null {
  if (sharedContext === undefined) {
    sharedContext =
      typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d')
  }
  return sharedContext
}

export interface ElementMetrics {
  /** Content-box width in px (padding and border excluded), floored. */
  width: number
  measure: (text: string) => number
}

/**
 * Reads the element's available width and returns a `measure` function bound
 * to its computed font. Returns `null` when measuring is impossible (no canvas,
 * element not laid out yet).
 */
export function readElementMetrics(element: HTMLElement): ElementMetrics | null {
  const context = getContext()
  if (!context) return null

  const style = window.getComputedStyle(element)
  const box = element.getBoundingClientRect().width
  const insets =
    px(style.paddingLeft) + px(style.paddingRight) + px(style.borderLeftWidth) + px(style.borderRightWidth)
  const width = Math.floor(box - insets)
  if (width <= 0) return null

  const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  // canvas.measureText ignores letter-spacing and text-transform, so both are
  // applied by hand to match what the browser actually paints.
  const letterSpacing = px(style.letterSpacing)
  const transform = style.textTransform

  const measure = (text: string) => {
    context.font = font
    const painted =
      transform === 'uppercase' ? text.toUpperCase() : transform === 'lowercase' ? text.toLowerCase() : text
    const spacing = letterSpacing ? toGraphemes(painted).length * letterSpacing : 0
    return context.measureText(painted).width + spacing
  }

  return { width, measure }
}

function px(value: string | null | undefined): number {
  const parsed = parseFloat(value ?? '')
  return Number.isFinite(parsed) ? parsed : 0
}
