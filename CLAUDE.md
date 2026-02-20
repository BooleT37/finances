# Finances - Project Documentation

A personal finance management application built with modern web technologies.

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/router/latest/docs/framework/react/start/overview) - Full-stack React framework with SSR
- **Router**: [TanStack Router](https://tanstack.com/router) - Type-safe routing
- **UI Library**: [Mantine](https://mantine.dev/) - React components library
- **API Layer**: [tRPC](https://trpc.io/) - End-to-end typesafe APIs
- **Database**: [Prisma](https://www.prisma.io/) - Next-generation ORM
- **Build Tool**: [Vite](https://vitejs.dev/) - Fast build tool with HMR

## Project Structure

```
finances/
├── src/
│   ├── routes/          # File-based routes
│   │   ├── __root.tsx   # Root layout with MantineProvider
│   │   └── index.tsx    # Home page (/)
│   ├── router.tsx       # Router configuration with getRouter()
│   └── routeTree.gen.ts # Auto-generated route tree (do not edit)
├── docs/                # Detailed documentation (see below)
├── prisma/              # Database schema
└── vite.config.ts       # Vite configuration
```

## Configuration

- **Path Aliases**: `~/*` maps to `./src/*` (configured in tsconfig.json + vite-tsconfig-paths)
- **Scroll Restoration**: Enabled globally
- **Preloading**: Disabled by default (opt-in per route with `preload="intent"`)
- **404 Handling**: Global `defaultNotFoundComponent` in router config

## Documentation

Detailed framework-specific documentation is split into separate files:

### TanStack Router Documentation
- **[API Reference](docs/tanstack-router-api.md)** - Complete API reference for TanStack Router types, hooks, and components
- **[Guide](docs/tanstack-router-guide.md)** - Comprehensive guide covering all Router features
- **[Routing](docs/tanstack-router-routing.md)** - File-based routing, dynamic routes, and route configuration
- **[Installation](docs/tanstack-router-installation.md)** - Installation and setup instructions
- **[Setup & Architecture](docs/tanstack-router-setup.md)** - Project setup and architectural patterns

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run type checking
npm run typecheck
```

## Code Quality

After making any code changes, run the following checks:

```bash
npm run typecheck && npm run lint && npm run format:check
```

To auto-fix lint and formatting issues:

```bash
npm run lint:fix && npm run format
```

Pre-commit hooks (Husky + lint-staged) run automatically on `git commit` — ESLint check + Prettier check on staged `src/**/*.{ts,tsx}` files, then a full `tsc --noEmit`. The commit is blocked if any check fails.

## Testing

Run E2E tests (starts dev server automatically):

```bash
npm test
```

Open interactive test UI:

```bash
npm run test:ui
```

After making UI changes, run `npm test` to verify nothing broke. The Playwright MCP server is configured in `.mcp.json` — Claude can also use it to interactively inspect the app in a real browser.

## Notes

- Router uses `getRouter()` async function export (TanStack Start v1.x requirement)
- All route files must export using `createFileRoute()` or `createRootRoute()`
- Run `npm run dev` to auto-generate routeTree.gen.ts when routes change
