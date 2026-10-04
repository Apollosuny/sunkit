import { readFile, writeFile } from 'node:fs/promises'

// Guarantee a `"use client"` directive on line 1 of the client entry bundles only. esbuild
// drops module-level directives when bundling, so we prepend it after the build. Idempotent:
// skips files that already start with it. The main entry (dist/index.*) must NOT get it, so
// the pure helpers stay callable from React Server Components.
const DIRECTIVE = '"use client";\n'
const targets = ['dist/client.js', 'dist/client.mjs']

for (const file of targets) {
  const code = await readFile(file, 'utf8')
  if (code.startsWith('"use client"') || code.startsWith("'use client'")) continue
  await writeFile(file, DIRECTIVE + code)
}
