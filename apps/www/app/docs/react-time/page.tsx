import type { Metadata } from "next"
import { connection } from "next/server"
import { TimeProvider, formatRelativeTime } from "@sunkitjs/react-time"

import { TimeDemo } from "@/components/demos/time-demo"

export const metadata: Metadata = {
  title: "React Time · sunkit",
  description:
    "Hydration-safe relative time, local time and countdowns for React on one shared clock.",
}

const USAGE = `import { RelativeTime, LocalTime, useCountdown } from "@sunkitjs/react-time"

<RelativeTime date={comment.createdAt} />          // "5 minutes ago", live
<LocalTime date={order.paidAt} />                  // viewer's locale + time zone

const left = useCountdown(auction.endsAt, { onComplete: refetch })
left && \`\${left.minutes}:\${String(left.seconds).padStart(2, "0")}\``

const PROVIDER = `// app/layout.tsx (Server Component)
import { cookies } from "next/headers"
import { TimeProvider } from "@sunkitjs/react-time"

export default async function RootLayout({ children }) {
  // Request-time: the time zone a client script stored in a cookie on a previous visit.
  const timeZone = (await cookies()).get("tz")?.value
  return (
    <html lang="en">
      <body>
        <TimeProvider now={Date.now()} timeZone={timeZone}>
          {children}
        </TimeProvider>
      </body>
    </html>
  )
}`

const OFFSET = `import { estimateServerOffset, setServerTimeOffset } from "@sunkitjs/react-time"

const requestStart = Date.now()
const res = await fetch("/api/time")
const { now } = await res.json()
setServerTimeOffset(estimateServerOffset({ serverTime: now, requestStart, requestEnd: Date.now() }))`

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-muted px-4 py-3 text-sm">
      <code>{children}</code>
    </pre>
  )
}

// Per request (not at build time), so the server-rendered labels are relative to a real "now".
async function getRequestTime() {
  await connection()
  return Date.now()
}

export default async function Page() {
  const renderedAt = await getRequestTime()

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">npm package</p>
        <h1 className="text-3xl font-semibold tracking-tight">react-time</h1>
        <p className="text-muted-foreground">
          Relative time, local time and countdowns without hydration mismatches. One shared,
          wall-clock-aligned timer for the whole page, server time offset, and resync when a
          background tab comes back. Zero dependencies.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Install</h2>
        <Code>pnpm add @sunkitjs/react-time</Code>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Demo</h2>
        <TimeProvider now={renderedAt}>
          <TimeDemo renderedAt={renderedAt} />
        </TimeProvider>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Usage</h2>
        <Code>{USAGE}</Code>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Server rendering</h2>
        <p className="text-sm text-muted-foreground">
          The server cannot know the viewer&apos;s clock, locale or time zone, so without help
          the first render uses <code>en-US</code> / UTC and an absolute date, and the client
          switches to the viewer&apos;s settings right after hydration. A{" "}
          <code>TimeProvider</code> with the render time (and a locale or time zone, if you
          know them) lets the server render the final text directly.
        </p>
        <Code>{PROVIDER}</Code>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Server time offset</h2>
        <p className="text-sm text-muted-foreground">
          Device clocks drift. For auctions, mints or quotas, measure the offset once and every
          hook and component follows the server&apos;s clock.
        </p>
        <Code>{OFFSET}</Code>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Pure helpers (server-safe)</h2>
        <p className="text-sm text-muted-foreground">
          Rendered in a Server Component with <code>formatRelativeTime()</code>:{" "}
          <code className="text-foreground">
            {formatRelativeTime(renderedAt - 3 * 60 * 60 * 1000, renderedAt, { locale: "vi" })}
          </code>
        </p>
      </section>
    </main>
  )
}
