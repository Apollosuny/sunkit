"use client"

import { useState } from "react"
import { MiddleTruncate } from "@sunkitjs/react-middle-truncate"

const SAMPLES = [
  {
    label: "Address · end={4}",
    text: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    props: { end: 4 },
    mono: true,
  },
  {
    label: "File name · preserveExtension",
    text: "quarterly-financial-report-final-v3-approved.xlsx",
    props: { preserveExtension: true },
    mono: false,
  },
  {
    label: "Path · balanced",
    text: "/Users/apollo/projects/sunkit/apps/www/app/docs/react-middle-truncate/page.tsx",
    props: {},
    mono: true,
  },
  {
    label: "Emoji-safe",
    text: "👨‍👩‍👧‍👦 Family trip to Hội An 🇻🇳 — photos, receipts and itinerary 🏖️",
    props: {},
    mono: false,
  },
] as const

export function MiddleTruncateDemo() {
  const [truncatedCount, setTruncatedCount] = useState(0)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Drag the bottom-right corner to resize. Truncated right now:{" "}
        <span className="font-medium text-foreground">{truncatedCount}</span> / {SAMPLES.length}
      </p>
      <div className="w-full max-w-full min-w-40 resize-x overflow-auto rounded-lg border p-4">
        <ul className="flex flex-col gap-4">
          {SAMPLES.map((sample) => (
            <li key={sample.label} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{sample.label}</span>
              <MiddleTruncate
                {...sample.props}
                className={sample.mono ? "font-mono text-sm" : "text-sm"}
                title={sample.text}
                onTruncateChange={(truncated) =>
                  setTruncatedCount((count) => count + (truncated ? 1 : -1))
                }
              >
                {sample.text}
              </MiddleTruncate>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
