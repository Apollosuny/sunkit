# @sunkitjs/react-time

Dates and times for React that **never cause hydration mismatches** and **never drift**:
live relative time, local time and countdowns, all on one shared, wall-clock-aligned clock.

```tsx
<RelativeTime date={comment.createdAt} />   // "5 minutes ago", stays live
<LocalTime date={order.paidAt} />           // viewer's locale and time zone
const left = useCountdown(auction.endsAt, { onComplete: refetch })
```

## Why

- `toLocaleString()` and "3h ago" render differently on a UTC server and in the browser, and
  React 19 treats that as a hydration error.
- A `setInterval` per component drifts, ticks at random offsets, and falls behind in background
  tabs, where browsers throttle timers to once a minute.
- Device clocks are wrong often enough to break auctions, mints and quota resets.

## Features

- **Hydration-safe.** The first render is deterministic: it uses the `TimeProvider` values, or
  `en-US` / UTC with an absolute date. The viewer's clock, locale and time zone apply right after
  hydration, with no mount-effect flash logic to write yourself.
- **One shared clock.** Every subscriber to the same interval rides one timer, aligned to
  wall-clock boundaries, so all timestamps flip on the same frame. 500 rows cost one `setTimeout`.
- **Minimal re-renders.** A "3 days ago" row re-renders when its label changes, not every second.
- **Server time offset.** Call `setServerTimeOffset()` and every hook and component follows the
  server's clock. `estimateServerOffset()` measures the offset from one request.
- **Background-tab resync.** The clock updates immediately when a tab becomes visible again or
  is restored from the back/forward cache.
- **Server Components ready.** Pure helpers (`formatRelativeTime`, `getCountdown`,
  `estimateServerOffset`) run on the server. Hooks and components ship in a `"use client"` entry.
- **Accepts any date input:** `Date`, epoch ms, ISO strings, and `Temporal.Instant` /
  `ZonedDateTime` (anything with `epochMilliseconds`).
- **Zero dependencies**, unstyled, React 18 and 19, TypeScript types included.

## Install

```bash
pnpm add @sunkitjs/react-time
```

## Usage

```tsx
import { LocalTime, RelativeTime, useCountdown } from '@sunkitjs/react-time'

<RelativeTime date={post.createdAt} />                        // <time datetime title>5 minutes ago</time>
<RelativeTime date={post.createdAt} unitDisplay="short" />   // 5 min. ago
<LocalTime date={event.startsAt} format={{ dateStyle: 'full' }} />
<LocalTime date={market.opensAt} timeZone="America/New_York" />

function Auction({ endsAt }: { endsAt: string }) {
  const left = useCountdown(endsAt, { onComplete: () => router.refresh() })
  if (!left) return <span>--:--</span>
  return <span>{left.minutes}:{String(left.seconds).padStart(2, '0')}</span>
}
```

### Server rendering

The server cannot know the viewer's clock, locale or time zone. Without help, the first render
uses `en-US`, UTC and an absolute date, and the client swaps in the viewer's settings and the
relative label right after hydration. To render the final text on the server, wrap the app in a
`TimeProvider`:

```tsx
// app/layout.tsx (Next.js Server Component)
import { cookies } from 'next/headers'
import { TimeProvider } from '@sunkitjs/react-time'

export default async function RootLayout({ children }) {
  const timeZone = (await cookies()).get('tz')?.value
  return (
    <html lang="en">
      <body>
        <TimeProvider now={Date.now()} timeZone={timeZone}>
          {children}
        </TimeProvider>
      </body>
    </html>
  )
}
```

### Server time offset

```ts
import { estimateServerOffset, setServerTimeOffset } from '@sunkitjs/react-time'

const requestStart = Date.now()
const res = await fetch('/api/time')
const { now } = await res.json()
setServerTimeOffset(estimateServerOffset({ serverTime: now, requestStart, requestEnd: Date.now() }))
```

## API

### `<RelativeTime>`

Renders `<time datetime>`, with the absolute date as its `title`. Accepts all `<time>` props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `date` | `DateInput` | — | The instant to describe. An invalid value renders nothing (with a dev warning). |
| `locale` | `string` | provider, then browser | BCP 47 locale. |
| `numeric` | `'auto' \| 'always'` | `'auto'` | `'auto'` allows "yesterday" and "now". |
| `unitDisplay` | `'long' \| 'short' \| 'narrow'` | `'long'` | Intl `style`. |
| `timeZone` | `string` | provider, then browser | Time zone for the tooltip and the server fallback. |
| `format` | `Intl.DateTimeFormatOptions` | `{ dateStyle: 'medium', timeStyle: 'short' }` | Format for the tooltip and the server fallback. |

### `<LocalTime>`

Renders `<time datetime>` formatted with `Intl.DateTimeFormat`. Takes `date`, `locale`,
`timeZone` and `format`, as above.

### `<TimeProvider>`

| Prop | Type | Description |
|---|---|---|
| `now` | `DateInput` | The instant the server rendered at. Lets the server render relative text and countdowns. |
| `locale` | `string` | Locale for all descendants, on the server and the client. |
| `timeZone` | `string` | IANA time zone for all descendants, on the server and the client. |

### Hooks

| Hook | Returns |
|---|---|
| `useNow({ interval = 1000 })` | Epoch ms floored to `interval`, shared and aligned. `null` during SSR or hydration without a provider `now`. |
| `useCountdown(target, { interval, onComplete })` | `{ totalMs, days, hours, minutes, seconds, isComplete }`, or `null` until the time is known. `onComplete` fires once when the countdown is seen reaching zero. |
| `useRelativeTime(date, options)` | The live label, or `null` until the time is known. |
| `useLocalTime(date, options)` | The formatted date (deterministic during hydration). |

### Clock

| Function | Description |
|---|---|
| `setServerTimeOffset(ms)` | Shift every reading by `serverClock - localClock`. Subscribers update immediately. |
| `getServerTimeOffset()` | The current offset. |
| `getServerNow()` | `Date.now()` corrected by the offset. |

### Pure helpers (server-safe)

| Function | Description |
|---|---|
| `formatRelativeTime(date, now, { locale, numeric, unitDisplay })` | "5 minutes ago". Deterministic for a given `now` and `locale`. |
| `selectRelativeUnit(diffMs)` | `{ value, unit }`, truncated toward zero. |
| `getCountdown(target, now)` | Countdown parts; seconds round up so `0:00` coincides with completion. |
| `estimateServerOffset({ serverTime, requestStart, requestEnd })` | NTP-style midpoint estimate. |

## License

MIT
