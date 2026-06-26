# Mandatory Instructions For All Coding Agents

Before making any code changes:

1. Read AGENTS.md completely.
2. Follow all architectural rules defined in this document.
3. Do not introduce new patterns when an approved pattern already exists.
4. Do not create new folder structures without updating AGENTS.md.
5. Do not violate package boundaries.
6. If a requested change conflicts with AGENTS.md, explain the conflict before proceeding.
7. Maintain consistency across the repository.

---

# Repository Architecture

## Monorepo Structure

```
DMS MonoRepo/
├── apps/
│   ├── web/          # Next.js App Router frontend
│   └── api/          # NestJS REST API backend
│
├── packages/
│   ├── database/         # Prisma ORM setup & PrismaService
│   ├── shared-types/     # Shared DTOs, enums, API contracts
│   ├── ui/               # Foundational Base UI components (framework-agnostic)
│   ├── eslint-config/    # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
│
├── docs/             # Architecture, contributing & guides
└── AGENTS.md         # THIS FILE — architectural source of truth
```

## Package Responsibilities

| Package                      | Responsibility                                                                    | Forbidden                              |
| ---------------------------- | --------------------------------------------------------------------------------- | -------------------------------------- |
| `apps/web`                   | Next.js App Router frontend, shadcn/ui components, TanStack Query, Zustand stores | Business logic in components           |
| `apps/api`                   | NestJS REST API, modules, controllers, services, repositories                     | UI code                                |
| `packages/database`          | Prisma schema, Prisma Client, PrismaService                                       | Business logic, controllers, DTOs      |
| `packages/shared-types`      | DTOs, enums, API contracts, pagination, utility types                             | React, NestJS, UI components, Tailwind |
| `packages/ui`                | Foundational Base UI components (framework-agnostic)                              | Next.js, NestJS specific code          |
| `packages/eslint-config`     | Shared ESLint rules                                                               | Runtime code                           |
| `packages/typescript-config` | Shared tsconfig presets                                                           | Runtime code                           |

---

# Frontend Architecture

## Stack

| Layer         | Technology                                     |
| ------------- | ---------------------------------------------- |
| Framework     | Next.js 15 (App Router)                        |
| Language      | TypeScript (strict mode)                       |
| Styling       | Tailwind CSS v4                                |
| UI Components | Shadcn UI (adapted with Base UI `render` prop) |
| Base UI       | `@base-ui/react` (primitives)                  |
| Server State  | TanStack React Query v5                        |
| Client State  | Zustand v5                                     |
| Forms         | React Hook Form + Zod + `@hookform/resolvers`  |
| HTTP Client   | Axios                                          |
| Theming       | next-themes                                    |

## Folder Structure

```
apps/web/src/
├── app/                    # Next.js App Router pages & layouts
├── components/
│   ├── ui/                 # Shadcn UI components (adapted with Base UI render prop)
│   ├── layouts/            # App-level layout components (AppShell, etc.)
│   └── shared/             # Shared reusable components (sidebar, etc.)
│
├── features/               # Feature-first business modules
│   └── <feature-name>/
│       ├── api/            # API client functions
│       ├── components/     # Feature-specific components
│       ├── hooks/          # Feature-specific hooks
│       ├── schemas/        # Zod schemas
│       ├── store/          # Zustand stores
│       ├── types/          # Feature-specific types
│       ├── utils/          # Utility functions
│       └── constants/      # Constants
│
├── hooks/                  # Shared hooks (use-mobile, etc.)
├── lib/                    # Shared utilities (cn(), etc.)
├── providers/              # React providers (theme, query, etc.)
├── services/               # Shared API service layer
├── store/                  # Shared Zustand stores
└── types/                  # Shared frontend types
```

## Shadcn UI Convention

All Shadcn UI components live in `apps/web/src/components/ui/`.

These are adapted to use Base UI's `render` prop instead of `asChild`:

```tsx
// CORRECT — Base UI render prop
<SidebarMenuButton render={<a href={url} />} />

// DO NOT USE — asChild pattern
<SidebarMenuButton asChild>
  <a href={url} />
</SidebarMenuButton>
```

Key Base UI data-attrs: `data-open`/`data-closed` (not `data-[state=open/closed]`).

UI components must NEVER be placed inside packages (see Future Mobile Compatibility).

## Tailwind CSS v4 Conventions

- Use `@theme` block in `globals.css` to define semantic color tokens.
- Theme tokens use `--color-*` prefix (e.g. `--color-sidebar`).
- Raw CSS variables (e.g. `--sidebar`) are duplicated outside `@theme` for direct `var()` access.
- Dark mode overrides go in `.dark { }` block, overriding both `--color-*` and raw `--*` variables.
- The `--spacing()` function is available for calc expressions.
- Use `bg-background` (maps to `--background`) and `bg-sidebar` (maps to `--color-sidebar`).

## App Layout Pattern

```tsx
<div className="[--header-height:calc(--spacing(14))]">
  <SidebarProvider className="flex flex-col">
    <SiteHeader /> {/* sticky header with SidebarTrigger */}
    <div className="flex flex-1">
      <AppSidebar /> {/* sidebar-16 pattern, no NavUser */}
      <SidebarInset>
        <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">{children}</div>
      </SidebarInset>
    </div>
  </SidebarProvider>
</div>
```

---

# Backend Architecture

## Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Framework  | NestJS v11                          |
| Language   | TypeScript (strict mode)            |
| ORM        | Prisma (via `packages/database`)    |
| Validation | class-validator + class-transformer |
| API Docs   | Swagger / OpenAPI                   |
| Config     | `@nestjs/config`                    |

## Folder Structure

```
apps/api/src/
├── main.ts
├── app/              # Root application module
├── common/           # Shared guards, filters, interceptors, decorators
├── config/           # Configuration modules
├── database/         # Database module re-export
└── modules/          # Feature modules (or domain modules at root)
```

Each business domain is a module:

```
modules/
└── <domain>/
    ├── controllers/
    ├── services/
    ├── repositories/
    ├── dto/              # Request/Response DTOs
    ├── entities/         # Database entity mappings
    ├── mappers/          # Entity <-> DTO mappers
    ├── constants/
    ├── types/
    └── <domain>.module.ts
```

## Dependency Injection

Use constructor-based injection. Avoid circular dependencies. Each module should declare its own providers and exports.

---

# Feature-First Rule (Frontend)

Business functionality MUST be implemented inside `features/`. No exceptions.

```
features/
└── products/
    ├── api/           # apiClient.getProducts, apiClient.createProduct
    ├── components/    # ProductCard, ProductList, ProductForm
    ├── hooks/         # useProducts, useProduct, useCreateProduct
    ├── schemas/       # productSchema, createProductSchema
    ├── store/         # productFilterStore, productCartStore
    ├── types/         # Product, CreateProductPayload
    ├── utils/         # formatProductPrice, sortProducts
    └── constants/     # PRODUCT_STATUSES, PRODUCT_SORT_OPTIONS
```

Prohibited patterns:

- ❌ Giant shared `services/` folder with all business API calls
- ❌ Giant shared `hooks/` folder with all business hooks
- ❌ Dumping business code into `components/`
- ❌ Business logic leaking into `lib/` or `services/`

Business logic belongs to features.

---

# Shared Package Boundaries

## `packages/shared-types`

**Allowed:**

- DTOs
- Enums
- API contracts
- Pagination contracts
- Utility types

**Forbidden:**

- React code
- Next.js code
- NestJS code
- UI components
- Tailwind CSS classes

## `packages/ui`

**Allowed:**

- Framework-agnostic Base UI components
- Shared component primitives

**Forbidden:**

- Next.js imports (`next/*`)
- NestJS imports (`@nestjs/*`)
- Web-only browser APIs

## `packages/database`

**Allowed:**

- Prisma schema
- Prisma Client
- PrismaService
- Database configuration

**Forbidden:**

- Business logic
- Controllers
- DTOs
- Route handlers

---

# TypeScript Standards

## Compiler Settings

Required (enforced per package via `packages/typescript-config`):

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `exactOptionalPropertyTypes: true`
- `noUncheckedIndexedAccess: true`

## Coding Rules

- Use **explicit typing** for function signatures and exports.
- Avoid `any`. Prefer `unknown` when the type is genuinely uncertain.
- Never disable strict mode (`// @ts-nocheck`, `@ts-ignore`, `as any`).
- Prefer `const` over `let` where possible.
- Use `ReadonlyArray<T>` or `readonly` for immutable props.

---

# Import Rules

Preferred imports — always use the `@/` path alias (web) or relative imports within the same package:

```ts
// CORRECT
import { Button } from '@/components/ui/button';
import { useProducts } from '@/features/products/hooks/use-products';
import { PaginationDto } from '@repo/shared-types';
import { PrismaService } from '@repo/database';

// AVOID — deep relative imports
import { Button } from '../../../components/ui/button';
```

Package imports use the workspace protocol:

```json
"@repo/database": "workspace:*",
"@repo/shared-types": "workspace:*"
```

---

# Naming Conventions

| Scope                 | Convention   | Example                                 |
| --------------------- | ------------ | --------------------------------------- |
| Frontend files        | `kebab-case` | `use-products.ts`, `product-card.tsx`   |
| React components      | `PascalCase` | `ProductCard`, `AppShell`               |
| Variables / functions | `camelCase`  | `getProducts`, `isLoading`              |
| Backend files         | `kebab-case` | `products.controller.ts`                |
| Backend classes       | `PascalCase` | `ProductsController`, `ProductsService` |
| Backend methods       | `camelCase`  | `findAll`, `createProduct`              |
| Database tables       | `snake_case` | `user_profiles`, `order_items`          |
| Database columns      | `snake_case` | `created_at`, `updated_by`              |

---

# Documentation Requirements

## New Features

Every new feature must include:

1. `README.md` — overview, purpose, key decisions
2. Architecture notes (if the feature introduces new patterns)
3. Setup instructions (if additional configuration or dependencies are required)

## Architecture Decision Records

Any major architectural decision MUST create an ADR.

Location: `docs/adr/`

Naming convention: `NNN-title-of-decision.md`

```
docs/adr/
├── 001-use-nextjs-app-router.md
├── 002-adopt-base-ui-render-prop.md
└── README.md
```

---

# Future Mobile Compatibility

The repository is expected to eventually support:

```
apps/mobile
```

All shared packages (`packages/shared-types`, `packages/ui`, `packages/database`) MUST remain platform-agnostic.

Rules:

- ❌ Do not place web-specific code inside shared packages.
- ❌ Do not place React/Next.js code inside `packages/shared-types`.
- ❌ Do not place browser-only APIs inside `packages/ui`.
- ✅ Keep shared contracts, types, and database access portable.

---

# Pull Request Checklist

Before submitting any pull request, verify:

- [ ] Code follows folder structure conventions (no misplaced files)
- [ ] TypeScript strict mode passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Documentation updated (if architecture or setup changed)
- [ ] No architectural violations (e.g. business logic outside features/)
- [ ] No unused dependencies
- [ ] No circular dependencies
- [ ] AGENTS.md updated (if new patterns or folder structures introduced)

---

# Development Workflows

## Root Commands

```bash
pnpm build          # Build all packages & apps
pnpm dev            # Start all dev servers concurrently
pnpm lint           # Lint all packages & apps
pnpm typecheck      # Type-check all packages & apps
pnpm test           # Run all tests
```

## Web App

```bash
cd apps/web
pnpm dev            # next dev --port 3000
pnpm build          # next build
pnpm lint           # eslint .
pnpm typecheck      # tsc --noEmit
```

## API

```bash
cd apps/api
pnpm dev            # nest start --watch
pnpm build          # nest build
pnpm lint           # eslint .
pnpm typecheck      # tsc --noEmit
```

---

# CSS Variable Convention (Tailwind v4)

```
@theme {
  --color-sidebar: oklch(0.985 0 0);        /* Generates bg-sidebar, text-sidebar, etc. */
  --color-sidebar-border: oklch(0.922 0 0);
}

:root {
  --sidebar: oklch(0.985 0 0);              /* Raw variable for direct var() access */
  --sidebar-border: oklch(0.922 0 0);
  --border: oklch(0.922 0 0);              /* Default border color */
}

.dark {
  --color-sidebar: oklch(0.205 0 0);        /* Override both prefixes */
  --color-sidebar-border: oklch(1 0 0 / 10%);
  --sidebar: oklch(0.205 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --border: oklch(1 0 0 / 10%);
}
```

Rationale: `@theme` tokens generate Tailwind utility classes (`border-sidebar-border` uses `var(--color-sidebar-border)`). Raw `--sidebar-*` variables support direct `var()` access in shadcn component source code.

---

# Sidebar Pattern (sidebar-16)

The app uses the sidebar-16 layout variant with the following rules:

- Use Base UI `render` prop, never `asChild`
- Sidebar code lives in `apps/web/src/components/shared/sidebar/`
- The sidebar has `collapsible="icon"` and is positioned below the sticky header
- Header height is controlled by `--header-height` CSS variable

---

# Coding Standards

These coding standards are mandatory and must be followed by every coding agent (DeepSeek, Codex, Claude Code, Gemini CLI, Cursor, Copilot, etc.) contributing to this repository.

## General Principles

- Prioritize readability and maintainability over clever code.
- Follow existing project conventions before introducing new patterns.
- Keep components and functions focused on a single responsibility.
- Avoid unnecessary abstractions.
- Always prefer explicit code over implicit behavior.
- Write self-documenting code with meaningful names.
- Ensure consistency throughout the codebase.

---

## React Components

### ✅ Preferred Style

Always write React components using **Function Declarations**.

```tsx
interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return <Card>...</Card>;
}
```

or

```tsx
function ProductCard() {
  return <div />;
}

export default ProductCard;
```

### ❌ Avoid

```tsx
const ProductCard = () => {
    ...
}
```

Arrow function components should not be used unless there is a very specific technical requirement.

### Reason

- Better readability
- Better debugging experience
- Function hoisting
- Easier refactoring
- Consistent with React, Next.js, shadcn/ui, and Vercel examples

---

## Custom Hooks

Always use Function Declarations.

```tsx
export function useProducts() {
    ...
}
```

Never write:

```tsx
export const useProducts = () => {
    ...
}
```

---

## Utility Functions

Utility functions should use Arrow Functions.

```tsx
export const formatCurrency = (value: number) => {
    ...
};

export const calculateTax = () => {
    ...
};
```

---

## Event Handlers

Inside components, always use Arrow Functions.

```tsx
const handleSubmit = async () => {
    ...
};

const handleDelete = () => {
    ...
};
```

---

## Callbacks

Use Arrow Functions.

```tsx
products.map(product => ...)
products.filter(product => ...)
```

---

## Async Functions

- Component-local async functions should be Arrow Functions.
- Shared exported utility functions should also be Arrow Functions.

Example:

```tsx
const fetchProducts = async () => {
    ...
};
```

---

## Naming Conventions

### Components

Use PascalCase.

```tsx
ProductCard;
CompanyTable;
UserForm;
```

### Hooks

Prefix with `use`.

```tsx
useProducts;
useAuth;
usePermissions;
```

### Variables

Use camelCase.

```tsx
companyName;
selectedProduct;
currentUser;
```

### Constants

Use UPPER_SNAKE_CASE only for true constants.

```tsx
MAX_UPLOAD_SIZE;
DEFAULT_PAGE_SIZE;
```

---

## Component Structure

Every React component should follow this order:

1. Imports
2. Types / Interfaces
3. Component
4. Hooks
5. Derived values
6. Event handlers
7. Effects
8. JSX return
9. Helper components (if required)

Example:

```tsx
import ...

interface Props {}

export function ProductForm({}: Props) {
    // Hooks

    // State

    // Derived values

    // Event handlers

    // Effects

    return (...);
}
```

---

## Exports

Prefer named exports.

```tsx
export function ProductCard() {}
```

Avoid default exports unless required by the framework (e.g., Next.js pages, layouts, route handlers).

---

## Comments

Avoid unnecessary comments.

Instead of:

```tsx
// Calculate total
const total = ...
```

Use meaningful names:

```tsx
const orderTotal = ...
```

Only write comments when explaining business rules or non-obvious logic.

---

## Formatting

- Use Prettier.
- Use ESLint.
- Never disable lint rules unless absolutely necessary.
- Remove unused imports.
- Remove dead code.
- Do not leave commented-out code in commits.

---

## Repository Rule

Every coding agent working in this repository **must follow these coding standards**. Before generating or modifying code, review this `AGENTS.md` file and ensure all changes comply with these conventions. If existing code does not follow these standards, update it incrementally as part of the modified files rather than performing repository-wide refactors.
