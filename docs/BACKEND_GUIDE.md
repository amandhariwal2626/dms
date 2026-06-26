# Backend Guide

## Scope

`apps/api` is a NestJS REST foundation only. It contains no business modules.

## Structure

- `src/app` - root application module
- `src/common` - global filters and interceptors
- `src/config` - environment validation and ConfigModule
- `src/health` - health endpoint

## Global Setup

- Validation pipe with whitelist and transform enabled
- HTTP exception filter
- Request logging interceptor
- Swagger at `/api/docs`
- Health endpoint at `/api/health`

## Environment

Backend variables are validated with Zod:

- `DATABASE_URL`
- `PORT`
- `NODE_ENV`
