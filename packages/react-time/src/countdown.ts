import { toValidEpochMs, type DateInput } from './date-input'

export interface Countdown {
  /** Milliseconds left, never negative. */
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isComplete: boolean
}

/**
 * Splits the time left until `target` into days / hours / minutes / seconds.
 *
 * Seconds are rounded **up**, so the display reads `0:00` exactly when `isComplete` flips,
 * never a full second early.
 *
 * @throws RangeError when `target` or `now` is not a valid instant.
 */
export function getCountdown(target: DateInput, now: DateInput): Countdown {
  const totalMs = Math.max(0, toValidEpochMs(target, 'target') - toValidEpochMs(now, 'now'))
  const totalSeconds = Math.ceil(totalMs / 1000)
  return {
    totalMs,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    isComplete: totalMs === 0,
  }
}
