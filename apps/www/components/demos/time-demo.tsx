"use client"

import { useState } from "react"
import {
  LocalTime,
  RelativeTime,
  getServerTimeOffset,
  setServerTimeOffset,
  useCountdown,
} from "@sunkitjs/react-time"

import { Button } from "@/components/ui/button"

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const FEED_OFFSETS = [
  { label: "Deploy finished", ago: 20 * SECOND },
  { label: "Comment added", ago: 5 * MINUTE },
  { label: "Invoice paid", ago: 3 * HOUR },
  { label: "Member joined", ago: DAY + 2 * HOUR },
  { label: "Project created", ago: 12 * DAY },
]

const ZONES = ["Asia/Ho_Chi_Minh", "Europe/London", "America/New_York"]

function pad(value: number) {
  return String(value).padStart(2, "0")
}

export function TimeDemo({ renderedAt }: { renderedAt: number }) {
  const [feed, setFeed] = useState(() =>
    FEED_OFFSETS.map((item) => ({ label: item.label, date: renderedAt - item.ago }))
  )
  const [target, setTarget] = useState(renderedAt + 90 * SECOND)
  const [completions, setCompletions] = useState(0)
  const [offset, setOffset] = useState(getServerTimeOffset)
  const countdown = useCountdown(target, {
    onComplete: () => setCompletions((count) => count + 1),
  })

  function changeOffset(value: number) {
    setServerTimeOffset(value)
    setOffset(value)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Activity · RelativeTime</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFeed((items) => [{ label: "You posted", date: Date.now() }, ...items])}
          >
            Post now
          </Button>
        </div>
        <ul className="flex flex-col divide-y text-sm">
          {feed.map((item, index) => (
            <li key={`${item.label}-${item.date}-${index}`} className="flex justify-between gap-4 py-2">
              <span>{item.label}</span>
              <RelativeTime date={item.date} className="text-muted-foreground tabular-nums" />
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Hover a timestamp for the absolute date. Every row shares one aligned timer and only
          re-renders when its label changes.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Countdown · useCountdown</h3>
          <Button size="sm" variant="outline" onClick={() => setTarget(Date.now() + 10 * SECOND)}>
            Restart (10s)
          </Button>
        </div>
        <p className="font-mono text-3xl tabular-nums" aria-live="off">
          {countdown
            ? `${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`
            : "--:--:--"}
        </p>
        <p className="text-xs text-muted-foreground">
          onComplete fired {completions} {completions === 1 ? "time" : "times"}.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <h3 className="text-sm font-medium">Same instant · LocalTime</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Your time zone</dt>
          <dd>
            <LocalTime date={renderedAt} format={{ dateStyle: "medium", timeStyle: "long" }} />
          </dd>
          {ZONES.map((zone) => (
            <div key={zone} className="contents">
              <dt className="text-muted-foreground">{zone}</dt>
              <dd>
                <LocalTime date={renderedAt} timeZone={zone} format={{ dateStyle: "medium", timeStyle: "long" }} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <h3 className="text-sm font-medium">Server offset · setServerTimeOffset</h3>
        <p className="text-sm text-muted-foreground">
          Pretend the server clock is ahead of this device. Every timestamp and the countdown
          above shift together.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={offset === 0 ? "default" : "outline"} onClick={() => changeOffset(0)}>
            In sync
          </Button>
          <Button
            size="sm"
            variant={offset === 5 * MINUTE ? "default" : "outline"}
            onClick={() => changeOffset(5 * MINUTE)}
          >
            Server +5 min
          </Button>
          <Button
            size="sm"
            variant={offset === -HOUR ? "default" : "outline"}
            onClick={() => changeOffset(-HOUR)}
          >
            Server −1 h
          </Button>
        </div>
      </div>
    </div>
  )
}
