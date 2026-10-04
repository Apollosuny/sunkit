import { describe, expect, it } from 'vitest'
import { estimateServerOffset, formatRelativeTime, getCountdown, selectRelativeUnit } from '../index'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const NOW = Date.UTC(2026, 0, 1, 12, 0, 0)

describe('selectRelativeUnit', () => {
  it.each([
    [-59_999, 'second', -59],
    [-MINUTE, 'minute', -1],
    [-(HOUR - 1), 'minute', -59],
    [HOUR, 'hour', 1],
    [-(DAY * 6.9), 'day', -6],
    [7 * DAY, 'week', 1],
    [29 * DAY, 'week', 4],
    [-31 * DAY, 'month', -1],
    [364 * DAY, 'month', 11],
    [-366 * DAY, 'year', -1],
  ] as const)('%d ms → %s %d', (diff, unit, value) => {
    expect(selectRelativeUnit(diff)).toEqual({ unit, value })
  })

  it('truncates toward zero instead of rounding up', () => {
    expect(selectRelativeUnit(-(2 * HOUR - 1))).toEqual({ unit: 'hour', value: -1 })
  })

  it('keeps the past sign on sub-second differences', () => {
    const { unit, value } = selectRelativeUnit(-500)
    expect(unit).toBe('second')
    expect(Object.is(value, -0)).toBe(true)
    expect(Object.is(selectRelativeUnit(500).value, 0)).toBe(true)
  })
})

describe('formatRelativeTime', () => {
  const en = { locale: 'en-US' }

  it('formats past and future', () => {
    expect(formatRelativeTime(NOW - 5 * MINUTE, NOW, en)).toBe('5 minutes ago')
    expect(formatRelativeTime(NOW + 2 * HOUR, NOW, en)).toBe('in 2 hours')
  })

  it('uses natural phrases with numeric: auto (default)', () => {
    expect(formatRelativeTime(NOW - 500, NOW, en)).toBe('now')
    expect(formatRelativeTime(NOW - DAY, NOW, en)).toBe('yesterday')
  })

  it('keeps the direction with numeric: always', () => {
    expect(formatRelativeTime(NOW - 500, NOW, { ...en, numeric: 'always' })).toBe('0 seconds ago')
    expect(formatRelativeTime(NOW - DAY, NOW, { ...en, numeric: 'always' })).toBe('1 day ago')
  })

  it('supports unitDisplay and other locales', () => {
    expect(formatRelativeTime(NOW - 5 * MINUTE, NOW, { ...en, unitDisplay: 'short' })).toBe('5 min. ago')
    expect(formatRelativeTime(NOW - 5 * MINUTE, NOW, { locale: 'vi' })).toBe('5 phút trước')
  })

  it('accepts Date, ISO strings and Temporal-like values', () => {
    const date = new Date(NOW - 3 * DAY)
    expect(formatRelativeTime(date, NOW, en)).toBe('3 days ago')
    expect(formatRelativeTime(date.toISOString(), new Date(NOW), en)).toBe('3 days ago')
    expect(formatRelativeTime({ epochMilliseconds: NOW + 3 * DAY }, NOW, en)).toBe('in 3 days')
  })

  it('throws on invalid input', () => {
    expect(() => formatRelativeTime('not a date', NOW)).toThrow(RangeError)
    expect(() => formatRelativeTime(NOW, Number.NaN)).toThrow(RangeError)
  })
})

describe('getCountdown', () => {
  it('splits the remaining time', () => {
    const target = NOW + DAY + 2 * HOUR + 3 * MINUTE + 4 * SECOND
    expect(getCountdown(target, NOW)).toEqual({
      totalMs: DAY + 2 * HOUR + 3 * MINUTE + 4 * SECOND,
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
      isComplete: false,
    })
  })

  it('rounds seconds up so 0:00 coincides with completion', () => {
    expect(getCountdown(NOW + 1500, NOW).seconds).toBe(2)
    expect(getCountdown(NOW + 1, NOW)).toMatchObject({ seconds: 1, isComplete: false })
    expect(getCountdown(NOW + 60 * SECOND - 1, NOW)).toMatchObject({ minutes: 1, seconds: 0 })
  })

  it('clamps at zero once the target has passed', () => {
    expect(getCountdown(NOW - HOUR, NOW)).toEqual({
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isComplete: true,
    })
  })

  it('throws on an invalid target', () => {
    expect(() => getCountdown('soon', NOW)).toThrow(RangeError)
  })
})

describe('estimateServerOffset', () => {
  it('uses the midpoint of the round trip', () => {
    expect(estimateServerOffset({ serverTime: 10_500, requestStart: 1_000, requestEnd: 2_000 })).toBe(9_000)
  })

  it('accepts a Date header value', () => {
    const serverTime = new Date(NOW).toUTCString()
    expect(estimateServerOffset({ serverTime, requestStart: NOW - 200, requestEnd: NOW })).toBe(100)
  })
})
