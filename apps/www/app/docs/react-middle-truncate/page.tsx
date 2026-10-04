import type { Metadata } from "next"
import { truncateMiddle } from "@sunkit/react-middle-truncate"

import { MiddleTruncateDemo } from "@/components/demos/middle-truncate-demo"

export const metadata: Metadata = {
  title: "React Middle Truncate · sunkit",
  description:
    "Pixel-accurate middle ellipsis for React: addresses, hashes and file names.",
}

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"

export default function Page() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">npm package</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          react-middle-truncate
        </h1>
        <p className="text-muted-foreground">
          Shortens text in the middle to fit its container, keeping the start
          and the end visible. Grapheme-safe, accessible, SSR-ready, zero
          dependencies.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Install</h2>
        <pre className="overflow-x-auto rounded-lg bg-muted px-4 py-3 text-sm">
          <code>pnpm add @sunkit/react-middle-truncate</code>
        </pre>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Demo</h2>
        <MiddleTruncateDemo />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Usage</h2>
        <pre className="overflow-x-auto rounded-lg bg-muted px-4 py-3 text-sm">
          <code>{`import { MiddleTruncate } from "@sunkit/react-middle-truncate"

<MiddleTruncate end={4} className="min-w-0 font-mono">
  {address}
</MiddleTruncate>`}</code>
        </pre>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Fixed format (server-safe)</h2>
        <p className="text-sm text-muted-foreground">
          Rendered on the server with <code>truncateMiddle()</code>:{" "}
          <code className="font-mono text-foreground">
            {truncateMiddle(ADDRESS, { start: 6, end: 4 })}
          </code>
        </p>
      </section>
    </main>
  )
}
