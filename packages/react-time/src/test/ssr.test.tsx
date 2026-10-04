// @vitest-environment node
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { formatRelativeTime, getCountdown, LocalTime, RelativeTime, TimeProvider } from '../index'

const NOW = Date.UTC(2026, 0, 1, 12, 0, 0)

describe('server rendering without a DOM', () => {
  it('renders components with the deterministic fallback', () => {
    const html = renderToString(
      <>
        <RelativeTime date={NOW} />
        <LocalTime date={NOW} />
      </>
    )
    expect(html).toContain('Jan 1, 2026, 12:00')
  })

  it('renders relative text from TimeProvider', () => {
    const html = renderToString(
      <TimeProvider now={NOW} locale="vi">
        <RelativeTime date={NOW - 3 * 3_600_000} />
      </TimeProvider>
    )
    expect(html).toContain('3 giờ trước')
  })

  it('keeps the pure helpers usable', () => {
    expect(formatRelativeTime(NOW - 60_000, NOW, { locale: 'en-US' })).toBe('1 minute ago')
    expect(getCountdown(NOW + 90_000, NOW)).toMatchObject({ minutes: 1, seconds: 30 })
  })
})
