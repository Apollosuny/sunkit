import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getServerNow, readClock, setServerTimeOffset, subscribeClock } from '../clock'

const START = Date.UTC(2026, 0, 1, 12, 0, 0, 400)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
})

afterEach(() => {
  setServerTimeOffset(0)
  vi.useRealTimers()
})

describe('shared clock', () => {
  it('ticks on wall-clock boundaries, not relative to subscription time', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeClock(1000, listener)

    vi.advanceTimersByTime(599)
    expect(listener).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(readClock(1000)).toBe(Date.UTC(2026, 0, 1, 12, 0, 1))

    vi.advanceTimersByTime(1000)
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it('floors snapshots to the interval so they are stable between ticks', () => {
    expect(readClock(1000)).toBe(Date.UTC(2026, 0, 1, 12, 0, 0))
    expect(readClock(60_000)).toBe(Date.UTC(2026, 0, 1, 12, 0, 0))
    vi.advanceTimersByTime(300)
    expect(readClock(1000)).toBe(Date.UTC(2026, 0, 1, 12, 0, 0))
  })

  it('shares one timer per interval and stops when the last subscriber leaves', () => {
    const a = subscribeClock(1000, () => {})
    const b = subscribeClock(1000, () => {})
    expect(vi.getTimerCount()).toBe(1)

    const c = subscribeClock(60_000, () => {})
    expect(vi.getTimerCount()).toBe(2)

    a()
    c()
    expect(vi.getTimerCount()).toBe(1)
    b()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('tolerates double unsubscribe', () => {
    const unsubscribe = subscribeClock(1000, () => {})
    unsubscribe()
    expect(() => unsubscribe()).not.toThrow()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('applies the server offset and notifies subscribers immediately', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeClock(1000, listener)

    setServerTimeOffset(5_000)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(getServerNow()).toBe(START + 5_000)
    expect(readClock(1000)).toBe(Date.UTC(2026, 0, 1, 12, 0, 5))

    setServerTimeOffset(5_000)
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('rejects invalid offsets and intervals', () => {
    expect(() => setServerTimeOffset(Number.NaN)).toThrow(RangeError)
    expect(() => subscribeClock(0, () => {})).toThrow(RangeError)
  })

  it('resyncs when the page becomes visible again', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeClock(60_000, listener)

    document.dispatchEvent(new Event('visibilitychange'))
    expect(listener).toHaveBeenCalledTimes(1)

    const pageShow = new Event('pageshow') as PageTransitionEvent
    Object.defineProperty(pageShow, 'persisted', { value: true })
    window.dispatchEvent(pageShow)
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    document.dispatchEvent(new Event('visibilitychange'))
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
