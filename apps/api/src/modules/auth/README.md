# Auth Module — Password Reset

## Overview

Implements the full **Account Recovery** flow: forgot password, OTP-based verification, and password reset.

## APIs

| Method | Endpoint                      | Purpose                              |
| ------ | ----------------------------- | ------------------------------------ |
| POST   | `/auth/forgot-password`       | Request password reset OTP           |
| POST   | `/auth/resend-password-reset` | Resend OTP (max 5)                   |
| POST   | `/auth/verify-password-reset` | Verify OTP, mark token VERIFIED      |
| POST   | `/auth/reset-password`        | Change password using VERIFIED token |

## Key Decisions

- **Reuses `EmailVerificationToken`** with `purpose: RESET_PASSWORD` — no separate table, consistent with existing email verification flow
- **Generic success messages** for forgot-password to prevent email enumeration
- **Two-step verification**: OTP is verified first (`verify-password-reset`), then consumed on actual reset (`reset-password`) — prevents race conditions
- **`refreshTokenVersion` incremented** on password change to invalidate all existing JWTs
- **Optional `logoutFromAllDevices`** revokes all active sessions inside the same Prisma transaction

## OTP Rules

| Property     | Value                                         |
| ------------ | --------------------------------------------- |
| Length       | 6 digits                                      |
| Generation   | `crypto.randomInt` (secure)                   |
| Storage      | SHA-256 hash                                  |
| Expiry       | 10 minutes                                    |
| Max attempts | 5                                             |
| Max resends  | 5                                             |
| Single use   | One active `PENDING` token per user at a time |

## Security

- Passwords hashed with bcrypt (12 rounds) via `PasswordService`
- OTP comparison uses constant-time SHA-256 comparison via `HashService`
- Never log passwords, OTPs, or hashes
- Prisma transactions ensure atomicity for password update + token consumption + session revocation
