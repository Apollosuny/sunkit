import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiddleTruncate } from '../middle-truncate'

// Setup mocks 8px per character, so a 160px element fits 20 characters.
const WIDTH = 160
const LONG = 'abcdefghijklmnopqrstuvwxyz0123456789' // 36 chars → 288px
const ADDRESS = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: WIDTH,
    height: 0,
    top: 0,
    left: 0,
    right: WIDTH,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

const visible = (container: HTMLElement) =>
  container.querySelector('[aria-hidden="true"]')?.textContent

describe('MiddleTruncate', () => {
  it('renders short text as-is', () => {
    const { container } = render(<MiddleTruncate>short text</MiddleTruncate>)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveTextContent('short text')
    expect(root).not.toHaveAttribute('data-truncated')
    expect(visible(container)).toBeUndefined()
  })

  it('truncates long text in the middle to fit the width', () => {
    const { container } = render(<MiddleTruncate>{LONG}</MiddleTruncate>)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute('data-truncated')
    // 20 chars available: 19 kept + "…" → head 10, tail 9
    expect(visible(container)).toBe('abcdefghij…123456789')
  })

  it('keeps the full text available to assistive tech', () => {
    render(<MiddleTruncate>{LONG}</MiddleTruncate>)
    expect(screen.getByText(LONG)).toBeInTheDocument()
  })

  it('keeps a fixed number of trailing characters with `end`', () => {
    const { container } = render(<MiddleTruncate end={4}>{ADDRESS}</MiddleTruncate>)
    expect(visible(container)).toMatch(/…976F$/)
    expect(visible(container)).toHaveLength(20)
  })

  it('preserves the file extension', () => {
    const { container } = render(
      <MiddleTruncate preserveExtension>{'quarterly-financial-report-final.xlsx'}</MiddleTruncate>
    )
    expect(visible(container)).toMatch(/\.xlsx$/)
  })

  it('uses a custom ellipsis', () => {
    const { container } = render(<MiddleTruncate ellipsis="...">{LONG}</MiddleTruncate>)
    expect(visible(container)).toContain('...')
  })

  it('reports truncation changes once', () => {
    const onTruncateChange = vi.fn()
    const { rerender } = render(
      <MiddleTruncate onTruncateChange={onTruncateChange}>{LONG}</MiddleTruncate>
    )
    expect(onTruncateChange).toHaveBeenCalledTimes(1)
    expect(onTruncateChange).toHaveBeenLastCalledWith(true)

    rerender(<MiddleTruncate onTruncateChange={onTruncateChange}>short</MiddleTruncate>)
    expect(onTruncateChange).toHaveBeenCalledTimes(2)
    expect(onTruncateChange).toHaveBeenLastCalledWith(false)
  })

  it('copies the full text when the selection is inside the element', () => {
    const { container } = render(<MiddleTruncate>{LONG}</MiddleTruncate>)
    const fragment = container.querySelector('[aria-hidden="true"]') as HTMLElement
    const range = document.createRange()
    range.selectNodeContents(fragment)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)

    const setData = vi.fn()
    fireEvent.copy(fragment, { clipboardData: { setData } })
    expect(setData).toHaveBeenCalledWith('text/plain', LONG)
  })

  it('leaves copying alone when copyFullText is false', () => {
    const { container } = render(<MiddleTruncate copyFullText={false}>{LONG}</MiddleTruncate>)
    const fragment = container.querySelector('[aria-hidden="true"]') as HTMLElement
    const range = document.createRange()
    range.selectNodeContents(fragment)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)

    const setData = vi.fn()
    fireEvent.copy(fragment, { clipboardData: { setData } })
    expect(setData).not.toHaveBeenCalled()
  })

  it('forwards refs, className and native props', () => {
    const ref = React.createRef<HTMLSpanElement>()
    render(
      <MiddleTruncate ref={ref} className="cell" title="full" data-testid="mt">
        {LONG}
      </MiddleTruncate>
    )
    const root = screen.getByTestId('mt')
    expect(ref.current).toBe(root)
    expect(root).toHaveClass('cell')
    expect(root).toHaveAttribute('title', 'full')
  })

  it('collapses whitespace runs like white-space: nowrap', () => {
    const { container } = render(<MiddleTruncate>{'a   b\n c'}</MiddleTruncate>)
    expect(container.firstElementChild).toHaveTextContent('a b c')
  })
})
