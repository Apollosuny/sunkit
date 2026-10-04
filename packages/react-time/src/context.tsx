import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { toEpochMs, type DateInput } from './date-input'

/**
 * What the first render uses before the browser's own clock, locale and time zone are known.
 * The server and the hydrating client must produce identical markup, so these must not depend
 * on the runtime (`Intl` defaults differ between a UTC server and a browser in Hanoi).
 */
export const FALLBACK_LOCALE = 'en-US'
export const FALLBACK_TIME_ZONE = 'UTC'

export interface TimeContextValue {
  now?: number
  locale?: string
  timeZone?: string
}

const TimeContext = createContext<TimeContextValue>({})

export interface TimeProviderProps {
  /**
   * The instant the server rendered at (`Date.now()` in a Server Component or loader). Lets
   * relative times and countdowns render real text on the server instead of a fallback; the
   * client switches to its own clock right after hydration.
   */
  now?: DateInput
  /**
   * Locale for every descendant, on the server and the client. Omit to use the browser's
   * locale after hydration (the server then renders `en-US`).
   */
  locale?: string
  /**
   * IANA time zone for every descendant, on the server and the client, e.g. from a cookie or
   * the viewer's profile. Omit to use the browser's zone after hydration (the server then
   * renders UTC).
   */
  timeZone?: string
  children?: ReactNode
}

export function TimeProvider({ now, locale, timeZone, children }: TimeProviderProps) {
  const nowMs = now === undefined ? undefined : toEpochMs(now)
  const value = useMemo<TimeContextValue>(
    () => ({ now: nowMs !== undefined && Number.isFinite(nowMs) ? nowMs : undefined, locale, timeZone }),
    [nowMs, locale, timeZone]
  )
  return <TimeContext.Provider value={value}>{children}</TimeContext.Provider>
}

export function useTimeContext(): TimeContextValue {
  return useContext(TimeContext)
}

const subscribeNothing = () => () => {}
const onClient = () => true
const onServer = () => false

/**
 * `false` during server rendering and hydration, `true` afterwards (and on client-only
 * renders). Lets the first render stay deterministic without a mount effect.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribeNothing, onClient, onServer)
}
