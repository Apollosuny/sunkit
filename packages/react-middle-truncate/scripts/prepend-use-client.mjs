import { readFile, writeFile } from 'node:fs/promises'

// Guarantee a `"use client"` directive on line 1 of the client entry bundles
// only. tsup's `treeshake` (rollup) strips a `banner`-injected directive, so we
// prepend it after the build. Idempotent: skips files that already start with it.
// The main entry (dist/index.*) must NOT get it, so `truncateMiddle()` stays
// callable from React Server Components.
const DIRECTIVE = '"use client";\n'
const targets = ['dist/middle-truncate.js', 'dist/middle-truncate.mjs']

for (const file of targets) {
  const code = await readFile(file, 'utf8')
  if (code.startsWith('"use client"') || code.startsWith("'use client'")) continue
  await writeFile(file, DIRECTIVE + code)
}
