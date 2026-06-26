# @repo/eslint-config

Shared flat ESLint configurations for the monorepo.

## Purpose

Provides strict TypeScript-first linting presets for Node, NestJS, React, and Next.js packages.

## Commands

- `pnpm lint` from any consuming workspace.

## Dependencies

- ESLint
- TypeScript ESLint
- React Hooks ESLint plugin
- Next.js ESLint plugin
- Prettier compatibility config

## Usage

Import one of the exported flat configs from a workspace `eslint.config.js`.
