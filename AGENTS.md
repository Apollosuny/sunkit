# sunkit — agent guide

A pnpm monorepo that ships React UI through **two channels**:

| Channel | Lives in | Consumers get | Use it for |
|---|---|---|---|
| **npm packages** `@sunkitjs/*` | `packages/<name>/` | `pnpm add @sunkitjs/<name>`, versioned updates | Headless, logic-heavy code where bug fixes must reach every consumer (text measuring, truncation, PWA install, decimal input) |
| **shadcn registry** `@sunkitjs/<item>` | `apps/www/registry/<name>/` | `shadcn add` copies the source in | Styled compositions of shadcn primitives (stat card, status badge, confirm dialog, data table) that consumers will tweak |

Rule of thumb: if a consumer would want to *edit* it, it is a registry item; if they would want
to *upgrade* it, it is a package. A registry item may depend on a package (list it in the item's
`dependencies`) and add the styled layer on top.

## Layout

```
.
├── packages/<name>/          ← npm packages, published independently via Changesets
├── apps/www/                 ← Next.js docs + demo site, and the registry
│   ├── registry/<name>/
│   │   ├── <name>.tsx        ← shipped to consumers
│   │   └── <name>-demo.tsx   ← docs-only example, NOT shipped
│   ├── registry.json         ← manifest declaring every registry item
│   ├── public/r/             ← output of `shadcn build` (committed, served statically)
│   └── components/ui/        ← shadcn primitives used by the site and the registry
├── .changeset/               ← pending version bumps for packages/*
└── tsconfig.base.json        ← shared compiler options for packages/*
```

## Stack

- pnpm workspaces (`packageManager` pinned in root `package.json`), Node ≥ 20 (CI uses 22).
- `apps/www`: Next.js App Router, React 19, TypeScript strict, Tailwind CSS v4,
  shadcn with **Base UI** primitives (`style: base-nova`).
- Packages: tsup (CJS + ESM + d.ts), Vitest + Testing Library (jsdom). Template: `@apollosuny/react-truncate`.

## Commands

Run everything from the repo root and always scope to what you changed.

```bash
pnpm dev                                   # docs site
pnpm --filter www typecheck | lint | build
pnpm registry:build                        # regenerate apps/www/public/r
pnpm --filter @sunkitjs/<name> test          # one package only
pnpm changeset                             # record a version bump for a package change
```

## Adding an npm package

1. Create `packages/<name>/` with `package.json` named `@sunkitjs/<name>`, `"sideEffects": false`,
   `"files": ["dist"]`, `publishConfig.access: "public"`, React as a **peer** dependency, and a
   conditional `exports` map (import/require × types/default).
2. `tsconfig.json` extends `../../tsconfig.base.json`; build with tsup.
3. Client-only packages ship `"use client"` on line 1 of every bundle. tsup's treeshake strips
   `banner`, so prepend it in a post-build script (see react-truncate `scripts/prepend-use-client.mjs`).
4. Zero runtime dependencies unless there is a strong reason.
5. Tests next to the source; `pnpm --filter @sunkitjs/<name> test` must pass.
6. Add a docs page in `apps/www/app/` and a `pnpm changeset` entry.

## Adding a registry item

1. Create `apps/www/registry/<name>/<name>.tsx` (kebab-case file, PascalCase named export) and
   `<name>-demo.tsx`.
2. Add the item to `apps/www/registry.json`:

   ```json
   {
     "name": "stat-card",
     "type": "registry:component",
     "title": "Stat Card",
     "description": "KPI tile with label, value, delta and loading state.",
     "dependencies": [],
     "registryDependencies": ["card", "skeleton"],
     "files": [{ "path": "registry/stat-card/stat-card.tsx", "type": "registry:component" }]
   }
   ```

   - `dependencies`: npm packages (including `@sunkitjs/*`).
   - `registryDependencies`: shadcn names, or full URLs to other items in this registry.
   - Never list `*-demo.tsx` in `files`; never vendor a copy of a primitive into `registry/`.
3. Add a docs page under `apps/www/app/` showing the demo and the install command.
4. `pnpm registry:build` and commit the regenerated `apps/www/public/r/<name>.json`.

## Conventions

- `"use client"` only for components that hold state or touch the DOM.
- Accept `className` and merge with `cn()`; forward native props where it makes sense.
- Stateful inputs support controlled + uncontrolled (`value` / `defaultValue` / `onValueChange`).
- Accessible by default: keyboard navigation, ARIA, focus-visible styles.
- Registry items use only shadcn semantic tokens (`bg-background`, `text-muted-foreground`, …) —
  no hard-coded colors, no app-specific token sets.
- Prefer composing primitives by name over primitive-specific APIs (`render` / `asChild`) so an
  item also installs cleanly into Radix-based projects. Where that is impossible, target Base UI.
- Do not rebuild what shadcn already ships (`empty`, `field`, `input-group`, `item`, `pagination`);
  compose on top of them.

## Verification

- www: `pnpm --filter www typecheck`, `lint`, `build`, `pnpm registry:build`.
- Package: typecheck, test and build of that package only; check `npm pack --dry-run` before release.
- Registry item smoke test from a scratch app:
  `pnpm dlx shadcn@latest add http://localhost:3000/r/<name>.json`

## Release

- Packages: `pnpm changeset` → `pnpm version-packages` → `pnpm release` (manual, needs `npm login`
  with access to the `@sunkitjs` org).
- Registry: deploy `apps/www`; items are served from `/r/<name>.json`.

## Consumer usage (for docs)

```bash
pnpm add @sunkitjs/<package>
pnpm dlx shadcn@latest add https://sunkit.dev/r/<item>.json
```

Or namespaced, in the consumer's `components.json`:

```json
{ "registries": { "@sunkitjs": "https://sunkit.dev/r/{name}.json" } }
```

then `pnpm dlx shadcn@latest add @sunkitjs/<item>`.

## Backlog

Prioritised from a survey of existing Cyberk / Workspace projects (components re-implemented 3+ times).

Packages:
- `react-middle-truncate` — pixel-accurate middle ellipsis (addresses, hashes, file names).
- `use-pwa-install` — headless install prompt: `beforeinstallprompt`, iOS Safari, standalone detection.

Registry, wave 1: `status-badge`, `stat-card`, `empty-state` / `error-state` / loading skeletons, `copy-button`.
Registry, wave 2: `confirm-dialog` + `useConfirm`, `search-input` (debounced), `responsive-dialog`.
Registry, wave 3: `data-table` kit, `combobox` (async / multi / creatable).
