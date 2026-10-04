import { act, Profiler, type ReactElement } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { cleanup, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LocalTime,
  RelativeTime,
  setServerTimeOffset,
  TimeProvider,
  useCountdown,
  useNow,
  useRelativeTime,
} from '../index'

const MINUTE = 60_000
const NOW = Date.UTC(2026, 0, 1, 12, 0, 0)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW + 400)
})

afterEach(() => {
  cleanup()
  setServerTimeOffset(0)
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useNow', () => {
  it('returns the floored time and follows the shared clock', () => {
    const { result } = renderHook(() => useNow())
    expect(result.current).toBe(NOW)
    act(() => vi.advanceTimersByTime(600))
    expect(result.current).toBe(NOW + 1000)
  })

  it('reflects the server offset', () => {
    const { result } = renderHook(() => useNow({ interval: MINUTE }))
    act(() => setServerTimeOffset(2 * MINUTE))
    expect(result.current).toBe(NOW + 2 * MINUTE)
  })
})

describe('useCountdown', () => {
  it('counts down and calls onComplete exactly once', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useCountdown(NOW + 3000, { onComplete }))
    expect(result.current).toMatchObject({ seconds: 3, isComplete: false })

    act(() => vi.advanceTimersByTime(600))
    expect(result.current?.seconds).toBe(2)

    act(() => vi.advanceTimersByTime(2000))
    expect(result.current?.isComplete).toBe(true)
    expect(onComplete).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(5000))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('does not call onComplete for a target that had already passed', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useCountdown(NOW - 1000, { onComplete }))
    expect(result.current?.isComplete).toBe(true)
    act(() => vi.advanceTimersByTime(3000))
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('returns null for an invalid target', () => {
    const { result } = renderHook(() => useCountdown('whenever'))
    expect(result.current).toBeNull()
  })
})

describe('useRelativeTime', () => {
  it('rolls over to the next unit', () => {
    const { result } = renderHook(() => useRelativeTime(NOW - 59_000, { locale: 'en-US' }))
    expect(result.current).toBe('59 seconds ago')
    act(() => vi.advanceTimersByTime(600))
    expect(result.current).toBe('1 minute ago')
  })

  it('does not re-render while the label is unchanged', () => {
    let renders = 0
    render(
      <Profiler id="row" onRender={() => renders++}>
        <RelativeTime date={NOW - 3 * 24 * 60 * MINUTE} locale="en-US" />
      </Profiler>
    )
    const initial = renders
    act(() => vi.advanceTimersByTime(10_000))
    expect(renders).toBe(initial)
    expect(screen.getByText('3 days ago')).toBeInTheDocument()
  })
})

function hydrate(element: ReactElement) {
  const html = renderToString(element)
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.append(container)

  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  const recoverable: unknown[] = []
  let root: Root | undefined
  act(() => {
    root = hydrateRoot(container, element, { onRecoverableError: (error) => recoverable.push(error) })
  })
  return {
    html,
    container,
    hydrationErrors: [...recoverable, ...consoleError.mock.calls],
    cleanup: () => {
      act(() => root?.unmount())
      container.remove()
    },
  }
}

describe('hydration', () => {
  it('server-renders a deterministic absolute date, then swaps in the relative label', () => {
    const { html, container, hydrationErrors, cleanup } = hydrate(<RelativeTime date={NOW - 5 * MINUTE} />)

    expect(html).toContain('Jan 1, 2026, 11:55')
    expect(html.toLowerCase()).toContain('datetime="2026-01-01t11:55:00.000z"')
    expect(hydrationErrors).toEqual([])
    expect(container.textContent).toBe(new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(-5, 'minute'))
    cleanup()
  })

  it('server-renders relative text from the TimeProvider render time', () => {
    const element = (
      <TimeProvider now={NOW - MINUTE} locale="en-US">
        <RelativeTime date={NOW - 5 * MINUTE} />
      </TimeProvider>
    )
    const { html, container, hydrationErrors, cleanup } = hydrate(element)

    expect(html).toContain('4 minutes ago')
    expect(hydrationErrors).toEqual([])
    expect(container.textContent).toBe('5 minutes ago')
    cleanup()
  })

  it('renders a pinned time zone identically on server and client', () => {
    const element = <LocalTime date={NOW} timeZone="Asia/Ho_Chi_Minh" locale="en-GB" format={{ timeStyle: 'short' }} />
    const { html, container, hydrationErrors, cleanup } = hydrate(element)

    expect(html).toContain('19:00')
    expect(hydrationErrors).toEqual([])
    expect(container.textContent).toBe('19:00')
    cleanup()
  })

  it('keeps useNow null until hydration without a TimeProvider', () => {
    const seen: Array<number | null> = []
    function Probe() {
      const now = useNow()
      seen.push(now)
      return <span>{now === null ? 'pending' : 'ready'}</span>
    }
    const { html, container, hydrationErrors, cleanup } = hydrate(<Probe />)

    expect(html).toContain('pending')
    expect(hydrationErrors).toEqual([])
    expect(container.textContent).toBe('ready')
    expect(seen.at(-1)).toBe(NOW)
    cleanup()
  })
})

describe('components', () => {
  it('renders <time> with an ISO datetime and the absolute date as title', () => {
    render(<RelativeTime date={NOW - 2 * MINUTE} locale="en-US" timeZone="UTC" className="stamp" />)
    const time = screen.getByText('2 minutes ago')
    expect(time.tagName).toBe('TIME')
    expect(time).toHaveAttribute('datetime', '2026-01-01T11:58:00.000Z')
    expect(time).toHaveAttribute('title', expect.stringMatching(/^Jan 1, 2026, 11:58\sAM$/))
    expect(time).toHaveClass('stamp')
  })

  it('renders nothing and warns for an invalid date', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(<RelativeTime date="nope" />)
    expect(container).toBeEmptyDOMElement()
    expect(warn).toHaveBeenCalledOnce()
  })
})
