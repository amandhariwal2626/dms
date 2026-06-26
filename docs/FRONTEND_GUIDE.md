# Frontend Guide

## Scope

`apps/web` is a shell only. It includes layout, provider setup, HTTP client setup, and state-management scaffolding.

## Structure

- `src/app` - App Router routes and global styles
- `src/components` - app-level layout components
- `src/providers` - client providers
- `src/lib` - environment and client utilities
- `src/services` - API access functions
- `src/hooks` - reusable hooks
- `src/store` - Zustand stores
- `src/types` - frontend-only types

## UI

Reusable foundation components come from `@repo/ui`. Components follow a Shadcn-inspired composition style and use Base UI primitives where primitives are needed.

## Environment

`NEXT_PUBLIC_API_URL` configures the API base URL and is validated in `src/lib/env.ts`.
