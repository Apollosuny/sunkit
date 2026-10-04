import { defineConfig } from 'tsup'
import type { Plugin } from 'esbuild'

// Hooks and components need a client boundary, but `formatRelativeTime()`, `getCountdown()`
// and `estimateServerOffset()` must stay callable from React Server Components. So the client
// half is built as its own entry carrying `"use client"`, and the main entry imports it as an
// external module instead of inlining it. One shared module instance also keeps a single
// clock (and server offset) per page.
const CLIENT_SPECIFIER = /^\.\/client$/

const externalClientEntry: Plugin = {
  name: 'external-client-entry',
  setup(build) {
    const extension = build.initialOptions.format === 'esm' ? '.mjs' : '.js'
    build.onResolve({ filter: CLIENT_SPECIFIER }, (args) =>
      // Only rewrite the import made by the main entry, not the client entry itself.
      args.kind === 'entry-point' ? undefined : { path: `./client${extension}`, external: true }
    )
  },
}

export default defineConfig({
  entry: ['src/index.ts', 'src/client.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  // No `treeshake`: tsup would then build every format as ESM and convert with rollup, hiding
  // the real format from the plugin above (and stripping directives).
  esbuildPlugins: [externalClientEntry],
  // Prepends `"use client"` to the client entry only.
  onSuccess: 'node scripts/prepend-use-client.mjs',
})
