# Contributing

## Before You Start

All coding agents **must** read `AGENTS.md` at the repository root before making any changes. AGENTS.md is the architectural source of truth.

## Standards

- Keep infrastructure and business logic separated.
- Business logic belongs in `features/` (web) or `modules/` (api).
- Shared packages must remain framework-agnostic.
- Always use the workspace protocol (`workspace:*`) for internal dependencies.
- Never use `@ts-ignore`, `@ts-nocheck`, or `as any`.
- Prefer explicit typing over inferred types for exports.

## Development Workflow

### Setup

```bash
pnpm install
pnpm build
```

### Running Dev Servers

```bash
pnpm dev              # Root — runs all dev servers
cd apps/web && pnpm dev   # Web only (port 3000)
cd apps/api && pnpm dev   # API only (port 3001)
```

### Code Quality

```bash
pnpm lint          # ESLint across all packages
pnpm typecheck     # TypeScript type check across all packages
pnpm build         # Build all packages and apps
```

Run all three before opening a pull request.

## Pull Request Checklist

- [ ] Code follows folder structure conventions (AGENTS.md)
- [ ] TypeScript strict mode passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Documentation updated if architecture or setup changed
- [ ] No architectural violations (e.g., business logic outside `features/`)
- [ ] No unused dependencies
- [ ] No circular dependencies

## Commits

Use concise, scoped commit messages:

```
feat(web): add product list page
fix(api): handle empty search query
chore(deps): update prisma to 6.x
```

## Pull Requests

- Include a clear description of the change.
- Reference any related issues or ADRs.
- Call out environment changes or migration steps.
- Keep PRs focused — one feature/fix per PR.

## Architecture Decision Records

Major architectural decisions must be documented as ADRs in `docs/adr/`.

See `docs/adr/README.md` for the template and guidelines.
