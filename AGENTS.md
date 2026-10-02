# apollosuny-ui-kit — agent guide

A **shadcn custom registry**: we publish copy-in components (not an npm package).
Consumers install with the shadcn CLI, which downloads JSON from `public/r/`.

## Layout

```
apollosuny-ui-kit/
├── registry/                 ← component source (the product)
│   └── <name>/
│       ├── <name>.tsx        ← shipped to consumers
│       └── <name>-demo.tsx   ← docs-only example, NOT shipped
├── app/                      ← docs + demo site (Next.js App Router)
├── public/r/                 ← output of `shadcn build` (committed, served statically)
└── registry.json             ← manifest declaring every component
```

## Stack

- Next.js (App Router) + React + TypeScript (strict), Tailwind CSS v4, pnpm.
- `shadcn` CLI for building the registry (`shadcn build` → `public/r/<name>.json`).
- Components build on shadcn/ui primitives (`button`, `checkbox`, …) via `registryDependencies`;
  never vendor a copy of a primitive into `registry/`.

## Bootstrapping (not done yet)

The repo is intentionally only a skeleton. `create-next-app` refuses non-empty dirs, so either
scaffold in a temp dir and merge, or add Next.js manually (`package.json`, `tsconfig.json`,
`next.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/globals.css`). Then:

1. `pnpm dlx shadcn@latest init` — creates `components.json`, `lib/utils.ts`, theme tokens.
2. Add scripts: `"registry:build": "shadcn build"`, `"dev"`, `"build"`, `"lint"`, `"typecheck"`.
3. Path alias `@/*` → repo root, so registry files import `@/components/ui/...` and `@/lib/utils`
   exactly as they will resolve in a consumer project.
4. Delete the `.gitkeep` files once real files exist.

## Adding a component

1. Create `registry/<name>/<name>.tsx` (kebab-case name, named export in PascalCase).
2. Create `registry/<name>/<name>-demo.tsx` for the docs page.
3. Add an item to `registry.json`:

   ```json
   {
     "name": "transfer-list",
     "type": "registry:component",
     "title": "Transfer List",
     "description": "Move items between two lists.",
     "dependencies": [],
     "registryDependencies": ["button", "checkbox"],
     "files": [{ "path": "registry/transfer-list/transfer-list.tsx", "type": "registry:component" }]
   }
   ```

   - `dependencies`: npm packages (e.g. `cron-parser`).
   - `registryDependencies`: shadcn/ui names, or full URLs to other items in this registry.
   - Do not list `*-demo.tsx` in `files`.
4. Add a docs page under `app/` that renders the demo and shows the install command.
5. `pnpm registry:build` and commit the regenerated `public/r/<name>.json`.

## Conventions

- Components are client components when they hold state (`"use client"` at top).
- Accept `className` and merge with `cn()`; forward native props where it makes sense.
- Controlled + uncontrolled support (`value`/`defaultValue`/`onValueChange`) for stateful inputs.
- Accessible by default: keyboard navigation, ARIA roles/labels, focus-visible styles.
- No hard-coded colors — use theme tokens (`bg-background`, `text-muted-foreground`, …).
- Self-contained: a component file must work after `shadcn add` with only its declared deps.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm registry:build` must pass.
- Smoke-test install from a scratch app:
  `pnpm dlx shadcn@latest add http://localhost:3000/r/<name>.json`

## Consumer usage (for docs)

```bash
pnpm dlx shadcn@latest add https://ui.apollosuny.dev/r/transfer-list.json
```

Or namespaced, in the consumer's `components.json`:

```json
{ "registries": { "@apollosuny": "https://ui.apollosuny.dev/r/{name}.json" } }
```

then `pnpm dlx shadcn@latest add @apollosuny/transfer-list`.

## Backlog

- `transfer-list` — dual list with move/move-all, search, keyboard support.
- `cron-input` — cron expression editor with human-readable preview.
- `permission-matrix` — roles × permissions grid with row/column toggles.
