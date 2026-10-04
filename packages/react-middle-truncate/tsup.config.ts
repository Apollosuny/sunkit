import { defineConfig } from 'tsup'
import type { Plugin } from 'esbuild'

// The component needs a client boundary (canvas, ResizeObserver), but
// `truncateMiddle()` must stay callable from React Server Components. So the
// component is built as its own entry carrying `"use client"`, and the main
// entry imports it as an external module instead of inlining it. A directive
// on the main entry would turn every export, helpers included, into client
// references.
const CLIENT_SPECIFIER = /^\.\/middle-truncate$/

const externalClientEntry: Plugin = {
  name: 'external-client-entry',
  setup(build) {
    const extension = build.initialOptions.format === 'esm' ? '.mjs' : '.js'
    build.onResolve({ filter: CLIENT_SPECIFIER }, (args) =>
      // Only rewrite the import made by the main entry, not the client entry itself.
      args.kind === 'entry-point' ? undefined : { path: `./middle-truncate${extension}`, external: true }
    )
  },
}

export default defineConfig({
  entry: ['src/index.ts', 'src/middle-truncate.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  // No `treeshake`: tsup would then build every format as ESM and convert with
  // rollup, hiding the real format from the plugin above (and stripping
  // directives). esbuild already tree-shakes the ESM output.
  esbuildPlugins: [externalClientEntry],
  // Prepends `"use client"` to the client entry only.
  onSuccess: 'node scripts/prepend-use-client.mjs',
})
