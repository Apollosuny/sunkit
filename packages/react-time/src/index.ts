// Server-safe helpers live here; everything clock- or context-bound comes from the client
// entry, re-exported by name (RSC bundlers resolve client references per export name).
export {
  getServerNow,
  getServerTimeOffset,
  LocalTime,
  RelativeTime,
  setServerTimeOffset,
  TimeProvider,
  useCountdown,
  useLocalTime,
  useNow,
  useRelativeTime,
} from './client'
export type {
  LocalTimeOptions,
  LocalTimeProps,
  RelativeTimeProps,
  TimeProviderProps,
  UseCountdownOptions,
  UseNowOptions,
} from './client'
export { formatRelativeTime, selectRelativeUnit } from './relative'
export type { RelativeTimeOptions, RelativeTimeUnit, RelativeTimeValue } from './relative'
export { getCountdown } from './countdown'
export type { Countdown } from './countdown'
export { estimateServerOffset } from './server-offset'
export type { ServerOffsetSample } from './server-offset'
export type { DateInput } from './date-input'
