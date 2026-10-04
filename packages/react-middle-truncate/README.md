# @sunkit/react-middle-truncate

Pixel-accurate **middle** ellipsis for React. Keeps both the start and the end of a string
visible — the parts that matter for wallet addresses, transaction hashes, file names, URLs and IDs.

```
0x71C7656EC7ab88b098defB751B7401B5f6d8976F   →   0x71C7656EC7…5f6d8976F
quarterly-financial-report-final.xlsx        →   quarterly-fin…final.xlsx
```

## Features

- **Pixel-accurate** — measures with `canvas.measureText()` and binary search, honouring
  `letter-spacing` and `text-transform`; re-measures on resize (`ResizeObserver`) and after web fonts load.
- **Grapheme-safe** — never cuts through an emoji, flag or combining sequence (`Intl.Segmenter`).
- **Fixed tail or balanced** — keep exactly N trailing characters (`end={4}`), or split evenly;
  `preserveExtension` never cuts into a file extension.
- **Accessible** — screen readers get the full text, not the clipped fragment.
- **Copy gives the full text** — copying a selection inside the element puts the complete string
  on the clipboard.
- **SSR-ready** — ships `"use client"`; renders the full text with a native end ellipsis on the
  server, then refines on the client before paint. `truncateMiddle()` works anywhere.
- **Zero dependencies**, unstyled, React 18 and 19, TypeScript types included.

## Install

```bash
pnpm add @sunkit/react-middle-truncate
```

## Usage

```tsx
import { MiddleTruncate } from '@sunkit/react-middle-truncate'

// Balanced: as much of the start and end as fits
<MiddleTruncate>{filePath}</MiddleTruncate>

// Always show the last 4 characters (address checksum)
<MiddleTruncate end={4}>{address}</MiddleTruncate>

// Never cut into ".xlsx"
<MiddleTruncate preserveExtension>{fileName}</MiddleTruncate>
```

The element is a block (`display: block; overflow: hidden; white-space: nowrap`) that takes the
width its parent gives it. In flex or grid layouts, let it shrink:

```tsx
<div className="flex items-center gap-2">
  <WalletIcon />
  <MiddleTruncate end={4} className="min-w-0 flex-1 font-mono">{address}</MiddleTruncate>
</div>
```

### Fixed format, no measuring

For a width-independent format — e.g. `0x71C7…976F` in a toast or an `aria-label` — use the pure
helper. It runs on the server too.

```ts
import { truncateMiddle } from '@sunkit/react-middle-truncate'

truncateMiddle('0x71C7656EC7ab88b098defB751B7401B5f6d8976F', { start: 6, end: 4 })
// → '0x71C7…976F'
```

## API

### `<MiddleTruncate>`

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `string` | — | The text. Whitespace runs collapse to one space, as `white-space: nowrap` renders them. |
| `ellipsis` | `string` | `"…"` | Inserted where text is removed. |
| `end` | `number` | — | Graphemes always kept at the end. Omit for a balanced split. |
| `preserveExtension` | `boolean` | `false` | Keep a trailing file extension intact. Ignored when `end` is set. |
| `copyFullText` | `boolean` | `true` | Copying a selection inside the element copies the full text. |
| `onTruncateChange` | `(truncated: boolean) => void` | — | Fires when the text starts or stops being truncated. |

All other props (`className`, `style`, `title`, `data-*`, event handlers, `ref`) are forwarded to
the root `<span>`. The root has `data-truncated` while truncated, for styling hooks such as showing
a tooltip only when needed.

### `truncateMiddle(text, { start, end, ellipsis? })`

Returns `text` with everything but the first `start` and last `end` graphemes replaced by
`ellipsis` (default `"…"`). Returns `text` unchanged when nothing would be removed.

## License

MIT
