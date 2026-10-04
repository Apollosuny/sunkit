import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { extensionLength, fitMiddle, type MiddleSplit } from './fit-middle'
import { toGraphemes } from './graphemes'
import { readElementMetrics } from './measure'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export interface MiddleTruncateProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The text to truncate. Must be a plain string; whitespace runs are collapsed like `white-space: nowrap` does. */
  children: string
  /** @default "…" */
  ellipsis?: string
  /**
   * Number of graphemes always kept at the end (e.g. `4` for the checksum of
   * an address). When omitted, the visible text is split evenly between start
   * and end.
   */
  end?: number
  /**
   * Never cut into a trailing file extension (`report-final.pdf` →
   * `repo…nal.pdf`). Ignored when `end` is set.
   * @default false
   */
  preserveExtension?: boolean
  /**
   * When a selection inside the element is copied, put the full text on the
   * clipboard instead of the visible, truncated fragment.
   * @default true
   */
  copyFullText?: boolean
  /** Called when the text switches between fitting and being truncated. */
  onTruncateChange?: (truncated: boolean) => void
}

// Visually hidden but readable by assistive tech. Inlined so the package ships
// zero CSS. `user-select: none` keeps it out of copied selections that span
// beyond this element, so the clipboard never gets the text twice.
const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
  userSelect: 'none',
}

function sameSplit(a: MiddleSplit | null, b: MiddleSplit | null) {
  return a === b || (!!a && !!b && a.head === b.head && a.tail === b.tail && a.truncated === b.truncated)
}

/**
 * Single-line text that is shortened in the middle to fit its container,
 * keeping both the start and the end visible.
 *
 * The element is a block (`display: block`, `overflow: hidden`), so it takes
 * the width its parent gives it. Inside flex layouts give it `min-width: 0`.
 */
export const MiddleTruncate = forwardRef<HTMLSpanElement, MiddleTruncateProps>(
  function MiddleTruncate(
    {
      children,
      ellipsis = '…',
      end,
      preserveExtension = false,
      copyFullText = true,
      onTruncateChange,
      onCopy,
      style,
      ...props
    },
    forwardedRef
  ) {
    useEffect(() => {
      if (
        typeof process !== 'undefined' &&
        process.env.NODE_ENV !== 'production' &&
        typeof children !== 'string'
      ) {
        console.warn(
          `[react-middle-truncate] <MiddleTruncate> expects a plain string child; received ${typeof children}.`
        )
      }
    }, [children])

    const text = useMemo(() => String(children ?? '').replace(/\s+/g, ' '), [children])
    const graphemes = useMemo(() => toGraphemes(text), [text])
    const minEnd = preserveExtension && end === undefined ? extensionLength(graphemes) : 0

    const elementRef = useRef<HTMLSpanElement | null>(null)
    const [split, setSplit] = useState<MiddleSplit | null>(null)

    const setRefs = useCallback(
      (node: HTMLSpanElement | null) => {
        elementRef.current = node
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
      },
      [forwardedRef]
    )

    const recompute = useCallback(() => {
      const element = elementRef.current
      if (!element) return
      const metrics = readElementMetrics(element)
      if (!metrics) return
      const next = fitMiddle(graphemes, {
        maxWidth: metrics.width,
        measure: metrics.measure,
        ellipsis,
        end,
        minEnd,
      })
      setSplit((previous) => (sameSplit(previous, next) ? previous : next))
    }, [graphemes, ellipsis, end, minEnd])

    useIsomorphicLayoutEffect(() => {
      recompute()
      const element = elementRef.current
      if (!element) return

      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(recompute)
      observer?.observe(element)

      // Web fonts can resolve after the first measurement and change glyph
      // metrics; measure again once they are ready.
      let cancelled = false
      document.fonts?.ready
        .then(() => {
          if (!cancelled) recompute()
        })
        .catch(() => {})

      return () => {
        cancelled = true
        observer?.disconnect()
      }
    }, [recompute])

    const truncated = split?.truncated ?? false

    const onTruncateChangeRef = useRef(onTruncateChange)
    onTruncateChangeRef.current = onTruncateChange
    const reportedRef = useRef<boolean | null>(null)
    useEffect(() => {
      if (!split || reportedRef.current === split.truncated) return
      reportedRef.current = split.truncated
      onTruncateChangeRef.current?.(split.truncated)
    }, [split])

    const handleCopy = (event: React.ClipboardEvent<HTMLSpanElement>) => {
      onCopy?.(event)
      if (event.defaultPrevented || !copyFullText || !truncated) return
      const selection = window.getSelection()
      const element = elementRef.current
      if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !element) return
      if (!element.contains(selection.getRangeAt(0).commonAncestorContainer)) return
      event.clipboardData.setData('text/plain', text)
      event.preventDefault()
    }

    return (
      <span
        ref={setRefs}
        data-truncated={truncated ? '' : undefined}
        onCopy={handleCopy}
        style={{
          display: 'block',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          // Until the first measurement (SSR, first client paint without
          // layout), fall back to a native end ellipsis instead of overflowing.
          textOverflow: split ? undefined : 'ellipsis',
          ...style,
        }}
        {...props}
      >
        {split?.truncated ? (
          <>
            <span style={srOnly}>{text}</span>
            <span aria-hidden="true">
              {split.head}
              {ellipsis}
              {split.tail}
            </span>
          </>
        ) : (
          text
        )}
      </span>
    )
  }
)
