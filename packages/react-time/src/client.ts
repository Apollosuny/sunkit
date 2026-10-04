// Client entry: everything that subscribes to the clock or reads React context. Built as its
// own bundle with a `"use client"` directive (see tsup.config.ts).
export { getServerNow, getServerTimeOffset, setServerTimeOffset } from './clock'
export { TimeProvider } from './context'
export type { TimeProviderProps } from './context'
export { useCountdown, useLocalTime, useNow, useRelativeTime } from './hooks'
export type { LocalTimeOptions, UseCountdownOptions, UseNowOptions } from './hooks'
export { LocalTime, RelativeTime } from './components'
export type { LocalTimeProps, RelativeTimeProps } from './components'
