import { describe, expect, it } from 'vitest'
import { extensionLength, fitMiddle, truncateMiddle } from '../fit-middle'
import { toGraphemes } from '../graphemes'

// 1px per grapheme keeps expected widths readable.
const measure = (text: string) => toGraphemes(text).length
const fit = (text: string, maxWidth: number, extra: { end?: number; minEnd?: number } = {}) =>
  fitMiddle(toGraphemes(text), { maxWidth, measure, ellipsis: '…', ...extra })

describe('fitMiddle', () => {
  it('returns the full text untouched when it fits', () => {
    expect(fit('abcdefghij', 10)).toEqual({ head: 'abcdefghij', tail: '', truncated: false })
  })

  it('splits kept graphemes evenly between head and tail', () => {
    // 7px = 6 graphemes + ellipsis
    expect(fit('abcdefghij', 7)).toEqual({ head: 'abc', tail: 'hij', truncated: true })
  })

  it('gives the extra grapheme to the head on odd counts', () => {
    expect(fit('abcdefghij', 6)).toEqual({ head: 'abc', tail: 'ij', truncated: true })
  })

  it('keeps a fixed tail and fills the head with the remaining space', () => {
    expect(fit('abcdefghij', 7, { end: 4 })).toEqual({ head: 'ab', tail: 'ghij', truncated: true })
  })

  it('still hides at least one grapheme when `end` covers the whole text', () => {
    const result = fit('abcdefghij', 5, { end: 50 })
    expect(result.truncated).toBe(true)
    expect(result.tail).toBe('bcdefghij')
    expect(result.head).toBe('')
  })

  it('never shrinks the tail below `minEnd`', () => {
    expect(fit('report-final.pdf', 7, { minEnd: 4 })).toEqual({
      head: 're',
      tail: '.pdf',
      truncated: true,
    })
  })

  it('falls back to the ellipsis alone when nothing else fits', () => {
    expect(fit('abcdefghij', 1)).toEqual({ head: '', tail: '', truncated: true })
  })

  it('trims whitespace next to the ellipsis', () => {
    // a head ending in a space loses it ("hello "), and so does a tail starting with one (" ijkl")
    expect(fit('hello world, bye now', 12)).toEqual({ head: 'hello', tail: 'ye now', truncated: true })
    expect(fit('abcd efgh ijkl', 10)).toEqual({ head: 'abcd', tail: 'ijkl', truncated: true })
  })

  it('never splits an emoji cluster', () => {
    const family = '👨‍👩‍👧‍👦'
    const result = fit(`${family}abcdefgh${family}`, 5)
    expect(result.head.startsWith(family)).toBe(true)
    expect(result.tail.endsWith(family)).toBe(true)
  })
})

describe('extensionLength', () => {
  it.each([
    ['report.final.pdf', 4],
    ['archive.tar.gz', 3],
    ['README', 0],
    ['.env', 0],
    ['trailing.', 0],
    ['my file. with spaces', 0],
    ['weird.extensiontoolong', 0],
  ])('%s → %i', (name, expected) => {
    expect(extensionLength(toGraphemes(name))).toBe(expected)
  })
})

describe('truncateMiddle', () => {
  const address = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'

  it('formats an address with fixed start and end', () => {
    expect(truncateMiddle(address, { start: 6, end: 4 })).toBe('0x71C7…976F')
  })

  it('returns the input when start + end covers it', () => {
    expect(truncateMiddle('short', { start: 3, end: 2 })).toBe('short')
  })

  it('supports a custom ellipsis and an empty end', () => {
    expect(truncateMiddle(address, { start: 4, end: 0, ellipsis: '...' })).toBe('0x71...')
  })

  it('counts graphemes, not code units', () => {
    expect(truncateMiddle('🇻🇳🇯🇵🇺🇸🇫🇷', { start: 1, end: 1 })).toBe('🇻🇳…🇫🇷')
  })
})
