/**
 * One shared clock per tick interval for the whole page.
 *
 * - **Shared**: every subscriber to the same interval rides one timer, so 500 timestamps in a
 *   table cost one `setTimeout`, and every surface flips on the same frame instead of drifting
 *   apart by their mount offsets.
 * - **Aligned**: ticks land on wall-clock boundaries (`:00`, `:01`, … for 1 s), not "1 s after
 *   whenever the component mounted".
 * - **Pure snapshots**: the snapshot is `now` floored to the interval, computed on read. It is
 *   stable between boundaries (what `useSyncExternalStore` requires) and can never go stale, so
 *   there is no cached value to refresh when the first subscriber arrives.
 * - **Resynced**: browsers throttle timers in background tabs (down to once a minute), so the
 *   clock notifies immediately when the page becomes visible again or is restored from bfcache.
 * - **Server-corrected**: `setServerTimeOffset()` shifts every reading by a measured offset.
 */

type Listener = () => void

interface Channel {
  listeners: Set<Listener>
  timer: ReturnType<typeof setTimeout> | null
}

const channels = new Map<number, Channel>()
let serverOffsetMs = 0
let resyncAttached = false

/** `Date.now()` corrected by the offset set with `setServerTimeOffset()`. */
export function getServerNow(): number {
  return Date.now() + serverOffsetMs
}

export function getServerTimeOffset(): number {
  return serverOffsetMs
}

/**
 * Shifts every clock reading by `offsetMs` (`serverClock - localClock`), e.g. the result of
 * `estimateServerOffset()`. Subscribed components update immediately.
 */
export function setServerTimeOffset(offsetMs: number): void {
  if (!Number.isFinite(offsetMs)) throw new RangeError(`Invalid server time offset: ${offsetMs}`)
  if (offsetMs === serverOffsetMs) return
  serverOffsetMs = offsetMs
  // Boundaries moved: reschedule every channel against the corrected clock.
  resyncAll()
}

export function floorToInterval(time: number, interval: number): number {
  return Math.floor(time / interval) * interval
}

export function readClock(interval: number): number {
  return floorToInterval(getServerNow(), interval)
}

export function subscribeClock(interval: number, listener: Listener): () => void {
  assertInterval(interval)
  let channel = channels.get(interval)
  if (!channel) {
    channel = { listeners: new Set(), timer: null }
    channels.set(interval, channel)
  }
  channel.listeners.add(listener)
  if (channel.timer === null) schedule(interval, channel)
  attachResync()

  return () => {
    const current = channels.get(interval)
    if (!current) return
    current.listeners.delete(listener)
    if (current.listeners.size > 0) return
    if (current.timer !== null) clearTimeout(current.timer)
    channels.delete(interval)
    if (channels.size === 0) detachResync()
  }
}

function assertInterval(interval: number): void {
  if (!Number.isFinite(interval) || interval < 1) {
    throw new RangeError(`Clock interval must be a positive number of milliseconds, got ${interval}`)
  }
}

function schedule(interval: number, channel: Channel): void {
  // Time until the next boundary, in (0, interval]. If a timer fires a hair early the floored
  // snapshot is unchanged (React bails out) and the next delay is just the remainder.
  const delay = interval - (getServerNow() % interval)
  channel.timer = setTimeout(() => {
    channel.timer = null
    if (channels.get(interval) !== channel) return
    schedule(interval, channel)
    notify(channel)
  }, delay)
}

function notify(channel: Channel): void {
  // Copy: a listener may unsubscribe (or subscribe others) while we iterate.
  for (const listener of [...channel.listeners]) listener()
}

function resyncAll(): void {
  for (const [interval, channel] of channels) {
    if (channel.timer !== null) clearTimeout(channel.timer)
    schedule(interval, channel)
    notify(channel)
  }
}

function onVisibilityChange(): void {
  if (document.visibilityState === 'visible') resyncAll()
}

function onPageShow(event: PageTransitionEvent): void {
  if (event.persisted) resyncAll()
}

function attachResync(): void {
  if (resyncAttached || typeof document === 'undefined') return
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pageshow', onPageShow)
  resyncAttached = true
}

function detachResync(): void {
  if (!resyncAttached) return
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('pageshow', onPageShow)
  resyncAttached = false
}
