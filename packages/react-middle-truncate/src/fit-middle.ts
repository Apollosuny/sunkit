import { toGraphemes } from './graphemes'

export interface MiddleSplit {
  /** Visible start of the text (trailing whitespace trimmed when truncated). */
  head: string
  /** Visible end of the text (leading whitespace trimmed when truncated). */
  tail: string
  /** `false` when the whole text fits; then `head` holds the full text and `tail` is empty. */
  truncated: boolean
}

export interface FitMiddleOptions {
  /** Available width in px. */
  maxWidth: number
  /** Returns the rendered width in px of a string. */
  measure: (text: string) => number
  ellipsis: string
  /** Fixed number of graphemes always kept at the end; the start absorbs the remaining space. */
  end?: number
  /** In balanced mode, the end never shrinks below this many graphemes (e.g. a file extension). */
  minEnd?: number
}

/**
 * Pure layout core: finds the longest `head + ellipsis + tail` that fits in
 * `maxWidth`. Works on grapheme clusters so a cut never splits an emoji.
 *
 * Without `end`, kept graphemes are split evenly between head and tail
 * (head gets the extra one on odd counts). With `end`, the tail is fixed and
 * only the head is searched.
 */
export function fitMiddle(graphemes: string[], options: FitMiddleOptions): MiddleSplit {
  const { maxWidth, measure, ellipsis, end, minEnd = 0 } = options
  const full = graphemes.join('')

  if (measure(full) <= maxWidth) return { head: full, tail: '', truncated: false }

  const count = graphemes.length
  // At least one grapheme must be hidden, so a fixed tail can cover at most count - 1.
  const fixedTail = end === undefined ? undefined : clamp(Math.floor(end), 0, count - 1)

  // `kept` = graphemes shown besides the ellipsis. The upper bound keeps at
  // least one grapheme hidden, otherwise the result would be the full text.
  const maxKept = fixedTail === undefined ? count - 1 : Math.max(0, count - fixedTail - 1)

  const build = (kept: number): MiddleSplit => {
    let tailLength: number
    let headLength: number
    if (fixedTail !== undefined) {
      tailLength = fixedTail
      headLength = kept
    } else {
      tailLength = Math.min(kept, Math.max(minEnd, Math.floor(kept / 2)))
      headLength = kept - tailLength
    }
    return {
      head: graphemes.slice(0, headLength).join('').trimEnd(),
      tail: tailLength > 0 ? graphemes.slice(count - tailLength).join('').trimStart() : '',
      truncated: true,
    }
  }

  const fits = (split: MiddleSplit) =>
    measure(split.head + ellipsis + split.tail) <= maxWidth

  let lo = 0
  let hi = maxKept
  let best = build(0)
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const candidate = build(mid)
    if (fits(candidate)) {
      best = candidate
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return best
}

/**
 * Length in graphemes of a trailing file extension including the dot
 * (`"report.final.pdf"` → 4), or 0 when there is none. Dotfiles (`.env`),
 * extensions longer than 10 characters and ones containing whitespace are
 * not treated as extensions.
 */
export function extensionLength(graphemes: string[]): number {
  const dot = graphemes.lastIndexOf('.')
  if (dot <= 0) return 0
  const length = graphemes.length - dot
  if (length < 2 || length > 11) return 0
  for (let i = dot + 1; i < graphemes.length; i++) {
    if (/\s/.test(graphemes[i])) return 0
  }
  return length
}

export interface TruncateMiddleOptions {
  /** Graphemes kept at the start. */
  start: number
  /** Graphemes kept at the end. */
  end: number
  /** @default "…" */
  ellipsis?: string
}

/**
 * Width-independent middle truncation, e.g. wallet addresses formatted as
 * `0x12ab…9f3c`. Safe to call on the server. Returns the input unchanged when
 * `start + end` already covers the whole text.
 *
 * @example truncateMiddle('0x71C7656EC7ab88b098defB751B7401B5f6d8976F', { start: 6, end: 4 })
 * // → '0x71C7…976F'
 */
export function truncateMiddle(text: string, options: TruncateMiddleOptions): string {
  const { ellipsis = '…' } = options
  const start = Math.max(0, Math.floor(options.start))
  const end = Math.max(0, Math.floor(options.end))
  const graphemes = toGraphemes(text)
  if (start + end >= graphemes.length) return text
  const tail = end > 0 ? graphemes.slice(graphemes.length - end).join('') : ''
  return graphemes.slice(0, start).join('') + ellipsis + tail
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
