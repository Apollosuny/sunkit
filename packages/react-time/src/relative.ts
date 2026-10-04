import { toValidEpochMs, type DateInput } from './date-input'
import { getRelativeTimeFormat } from './intl-cache'

export type RelativeTimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

export interface RelativeTimeValue {
  /** Whole units, truncated toward zero. Negative (including `-0`) means the past. */
  value: number
  unit: RelativeTimeUnit
}

export interface RelativeTimeOptions {
  /** BCP 47 locale. Defaults to the runtime locale (see `TimeProvider` for SSR). */
  locale?: string
  /** `'auto'` (default) allows "yesterday" / "now"; `'always'` forces "1 day ago" / "in 0 seconds". */
  numeric?: Intl.RelativeTimeFormatNumeric
  /** Maps to Intl's `style`: "5 minutes ago" (`'long'`, default), "5 min. ago" (`'short'`). */
  unitDisplay?: Intl.RelativeTimeFormatStyle
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
// Average Gregorian lengths: good enough for "3 months ago", which is approximate by nature.
const MONTH = 30.4375 * DAY
const YEAR = 365.25 * DAY

const UNITS: ReadonlyArray<readonly [RelativeTimeUnit, number, number]> = [
  // unit, size, use while |diff| is below
  ['second', SECOND, MINUTE],
  ['minute', MINUTE, HOUR],
  ['hour', HOUR, DAY],
  ['day', DAY, WEEK],
  ['week', WEEK, MONTH],
  ['month', MONTH, YEAR],
  ['year', YEAR, Infinity],
]

/**
 * Picks the largest unit that keeps the value at least 1 and truncates toward zero, so the
 * label never claims more time has passed than actually has ("59 seconds" stays seconds).
 *
 * @param diffMs `date - now`: negative for the past, positive for the future.
 */
export function selectRelativeUnit(diffMs: number): RelativeTimeValue {
  const abs = Math.abs(diffMs)
  const [unit, size] = UNITS.find(([, , below]) => abs < below) ?? UNITS[UNITS.length - 1]
  const magnitude = Math.floor(abs / size)
  // Keep the sign on zero: Intl renders `-0` as the past ("0 seconds ago") and `0` as the future.
  return { unit, value: diffMs < 0 || Object.is(diffMs, -0) ? -magnitude : magnitude }
}

/**
 * Formats `date` relative to `now`, e.g. "5 minutes ago", "in 2 days", "yesterday".
 * Deterministic for a given `now` and `locale`, so it is safe to call on the server.
 *
 * @throws RangeError when `date` or `now` is not a valid instant.
 */
export function formatRelativeTime(
  date: DateInput,
  now: DateInput,
  options: RelativeTimeOptions = {}
): string {
  const diff = toValidEpochMs(date, 'date') - toValidEpochMs(now, 'now')
  const { value, unit } = selectRelativeUnit(diff)
  return formatRelativeValue(value, unit, options.locale, options)
}

export function formatRelativeValue(
  value: number,
  unit: RelativeTimeUnit,
  locale: string | undefined,
  { numeric = 'auto', unitDisplay = 'long' }: RelativeTimeOptions
): string {
  return getRelativeTimeFormat(locale, { numeric, style: unitDisplay }).format(value, unit)
}
