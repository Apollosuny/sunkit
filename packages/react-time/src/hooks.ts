import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { floorToInterval, readClock, subscribeClock } from './clock'
import { FALLBACK_LOCALE, FALLBACK_TIME_ZONE, useIsHydrated, useTimeContext } from './context'
import { getCountdown, type Countdown } from './countdown'
import { toEpochMs, type DateInput } from './date-input'
import { getDateTimeFormat } from './intl-cache'
import { formatRelativeValue, selectRelativeUnit, type RelativeTimeOptions, type RelativeTimeUnit } from './relative'

const SECOND = 1000

export interface UseNowOptions {
  /** Tick interval in milliseconds; ticks align to wall-clock multiples of it. Default 1000. */
  interval?: number
}

/**
 * The current time in epoch milliseconds, floored to `interval` and shared by every caller
 * with the same interval.
 *
 * Returns `null` during server rendering and hydration unless a `TimeProvider` supplies `now`,
 * because the server's clock cannot match the browser's. Client-only apps never see `null`.
 */
export function useNow({ interval = SECOND }: UseNowOptions = {}): number | null {
  const { now: renderedAt } = useTimeContext()
  const subscribe = useCallback((listener: () => void) => subscribeClock(interval, listener), [interval])
  const getSnapshot = useCallback(() => readClock(interval), [interval])
  const getServerSnapshot = useCallback(
    () => (renderedAt === undefined ? null : floorToInterval(renderedAt, interval)),
    [renderedAt, interval]
  )
  return useSyncExternalStore<number | null>(subscribe, getSnapshot, getServerSnapshot)
}

export interface UseCountdownOptions extends UseNowOptions {
  /**
   * Called once when the countdown is seen reaching zero after having been running on the
   * client. Not called if the target had already passed when the component mounted.
   */
  onComplete?: () => void
}

/**
 * Time left until `target`, updated on the shared clock. `null` until the time is known (see
 * `useNow`) or when `target` is invalid.
 */
export function useCountdown(target: DateInput, options: UseCountdownOptions = {}): Countdown | null {
  const { interval, onComplete } = options
  const now = useNow({ interval })
  const hydrated = useIsHydrated()
  const targetMs = toEpochMs(target)
  const countdown = useMemo(
    () => (now === null || !Number.isFinite(targetMs) ? null : getCountdown(targetMs, now)),
    [now, targetMs]
  )

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  // Only states observed with the client's own clock count: a server-rendered "still running"
  // from a cached page must not fire `onComplete` on every load.
  const isComplete = hydrated ? countdown?.isComplete : undefined
  const previous = useRef<{ targetMs: number; isComplete: boolean | undefined } | null>(null)
  useEffect(() => {
    const last = previous.current
    previous.current = { targetMs, isComplete }
    if (isComplete && last?.targetMs === targetMs && last.isComplete === false) onCompleteRef.current?.()
  }, [targetMs, isComplete])

  return countdown
}

// The snapshot is the (unit, value) pair, not the time: it only changes when the label would,
// so a "3 days ago" row re-renders once a day although the shared clock ticks every second.
function relativeKey(dateMs: number, now: number): string | null {
  if (!Number.isFinite(dateMs)) return null
  const { unit, value } = selectRelativeUnit(dateMs - now)
  const negative = value < 0 || Object.is(value, -0)
  return `${unit}:${negative ? '-' : ''}${Math.abs(value)}`
}

function parseRelativeKey(key: string): { unit: RelativeTimeUnit; value: number } {
  const separator = key.indexOf(':')
  return { unit: key.slice(0, separator) as RelativeTimeUnit, value: Number(key.slice(separator + 1)) }
}

const subscribeSeconds = (listener: () => void) => subscribeClock(SECOND, listener)

/**
 * A live "5 minutes ago" / "in 2 days" label for `date`.
 *
 * Returns `null` during server rendering and hydration unless a `TimeProvider` supplies `now`,
 * and for an invalid `date`.
 */
export function useRelativeTime(date: DateInput, options: RelativeTimeOptions = {}): string | null {
  const context = useTimeContext()
  const hydrated = useIsHydrated()
  const dateMs = toEpochMs(date)

  const getSnapshot = useCallback(() => relativeKey(dateMs, readClock(SECOND)), [dateMs])
  const getServerSnapshot = useCallback(
    () => (context.now === undefined ? null : relativeKey(dateMs, context.now)),
    [dateMs, context.now]
  )
  const key = useSyncExternalStore(subscribeSeconds, getSnapshot, getServerSnapshot)
  if (key === null) return null

  const locale = options.locale ?? context.locale ?? (hydrated ? undefined : FALLBACK_LOCALE)
  const { unit, value } = parseRelativeKey(key)
  return formatRelativeValue(value, unit, locale, options)
}

export interface LocalTimeOptions extends Intl.DateTimeFormatOptions {
  locale?: string
}

const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }

/**
 * `date` formatted in the viewer's locale and time zone.
 *
 * The server and the hydrating client render with the `TimeProvider` locale / time zone, or
 * `en-US` / UTC, so the markup matches; the browser's own settings apply right after
 * hydration. An explicit `locale` / `timeZone` is used everywhere. Returns `''` for an invalid
 * `date`.
 */
export function useLocalTime(date: DateInput, options: LocalTimeOptions = {}): string {
  const context = useTimeContext()
  const hydrated = useIsHydrated()
  const { locale, timeZone, ...format } = options
  const dateMs = toEpochMs(date)
  if (!Number.isFinite(dateMs)) return ''

  const resolvedLocale = locale ?? context.locale ?? (hydrated ? undefined : FALLBACK_LOCALE)
  const resolvedTimeZone = timeZone ?? context.timeZone ?? (hydrated ? undefined : FALLBACK_TIME_ZONE)
  const hasFields = Object.keys(format).length > 0
  return getDateTimeFormat(resolvedLocale, {
    ...(hasFields ? format : DEFAULT_FORMAT),
    timeZone: resolvedTimeZone,
  }).format(dateMs)
}
