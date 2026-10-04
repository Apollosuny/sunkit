// @vitest-environment node
import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MiddleTruncate, truncateMiddle } from '../index'

describe('server rendering', () => {
  it('renders the full text with a native ellipsis fallback and no DOM access', () => {
    const html = renderToString(<MiddleTruncate>{'some/really/long/path/to/file.txt'}</MiddleTruncate>)
    expect(html).toContain('some/really/long/path/to/file.txt')
    expect(html).toContain('text-overflow:ellipsis')
  })

  it('truncateMiddle works without a DOM', () => {
    expect(truncateMiddle('0x71C7656EC7ab88b098defB751B7401B5f6d8976F', { start: 6, end: 4 })).toBe(
      '0x71C7…976F'
    )
  })
})
