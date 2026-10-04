import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { toEpochMs, type DateInput } from './date-input'
import { useLocalTime, useRelativeTime } from './hooks'
import type { RelativeTimeOptions } from './relative'

type TimeElementProps = Omit<ComponentPropsWithoutRef<'time'>, 'children' | 'dateTime'>

function warnInvalidDate(component: string, date: DateInput): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.warn(`[@sunkitjs/react-time] <${component}> received an invalid date: ${String(date)}`)
  }
}

export interface LocalTimeProps extends TimeElementProps {
  date: DateInput
  /** Defaults to the `TimeProvider` locale, then the browser's. */
  locale?: string
  /** Defaults to the `TimeProvider` time zone, then the browser's. */
  timeZone?: string
  /** `Intl.DateTimeFormat` fields. Defaults to `{ dateStyle: 'medium', timeStyle: 'short' }`. */
  format?: Intl.DateTimeFormatOptions
}

/**
 * A date in the viewer's locale and time zone, rendered as `<time datetime>` without
 * hydration mismatches. Renders nothing for an invalid `date`.
 */
export const LocalTime = forwardRef<HTMLTimeElement, LocalTimeProps>(function LocalTime(
  { date, locale, timeZone, format, ...props },
  ref
) {
  const text = useLocalTime(date, { ...format, locale, timeZone })
  const dateMs = toEpochMs(date)
  if (!Number.isFinite(dateMs)) {
    warnInvalidDate('LocalTime', date)
    return null
  }
  return (
    <time ref={ref} dateTime={new Date(dateMs).toISOString()} {...props}>
      {text}
    </time>
  )
})

export interface RelativeTimeProps extends TimeElementProps, RelativeTimeOptions {
  date: DateInput
  /** Time zone for the tooltip and the server fallback. Defaults like `LocalTime`. */
  timeZone?: string
  /** Format for the tooltip and the server fallback. Defaults like `LocalTime`. */
  format?: Intl.DateTimeFormatOptions
}

/**
 * A live "5 minutes ago" label rendered as `<time datetime>`, with the absolute date as its
 * tooltip. Without a `TimeProvider` `now`, the server renders the absolute date and the
 * client swaps in the relative label right after hydration. Renders nothing for an invalid
 * `date`.
 */
export const RelativeTime = forwardRef<HTMLTimeElement, RelativeTimeProps>(function RelativeTime(
  { date, locale, numeric, unitDisplay, timeZone, format, title, ...props },
  ref
) {
  const relative = useRelativeTime(date, { locale, numeric, unitDisplay })
  const absolute = useLocalTime(date, { ...format, locale, timeZone })
  const dateMs = toEpochMs(date)
  if (!Number.isFinite(dateMs)) {
    warnInvalidDate('RelativeTime', date)
    return null
  }
  return (
    <time ref={ref} dateTime={new Date(dateMs).toISOString()} title={title ?? absolute} {...props}>
      {relative ?? absolute}
    </time>
  )
})
