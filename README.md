# duniverse

React UI building blocks, shipped two ways:

- **npm packages** — headless, versioned: `pnpm add @duniverse/<package>`
- **shadcn registry** — styled components copied into your project:
  `pnpm dlx shadcn@latest add https://duniverse.dev/r/<item>.json`

## Development

```bash
pnpm install
pnpm dev              # docs site at http://localhost:3000
pnpm registry:build   # regenerate apps/www/public/r
```

See [AGENTS.md](./AGENTS.md) for layout, conventions and how to add a package or registry item.
