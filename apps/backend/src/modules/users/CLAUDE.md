# Users Module — HLD §5: Authentication & User Management

## Purpose

Handles all auth flows: signup, login, email verification, password reset, and profile management. The `users` table is the root entity — every other table references `users.id`.

## Schema Tables Used

- `users` — core user record (email, hashed password, role, email verification status)
- `emailVerificationTokens` — one-time tokens for email verification (24h expiry)
- `passwordResetTokens` — one-time tokens for password reset (1h expiry)

## API Endpoints

| Method | Path                          | Auth | Validation Schema       | Description                     |
|--------|-------------------------------|------|-------------------------|---------------------------------|
| POST   | `/api/users/signup`           | No   | `signupSchema`          | Register, sends verification email |
| POST   | `/api/users/login`            | No   | `loginSchema`           | Returns JWT + user profile      |
| POST   | `/api/users/verify-email`     | No   | `verifyEmailSchema`     | Marks email as verified         |
| POST   | `/api/users/forgot-password`  | No   | `forgotPasswordSchema`  | Generates reset token           |
| POST   | `/api/users/reset-password`   | No   | `resetPasswordSchema`   | Resets password with token      |
| GET    | `/api/users/me`               | Yes  | —                       | Returns authenticated user profile |
| PATCH  | `/api/users/me`               | Yes  | `updateProfileSchema`   | Update email or password        |

## Auth Flow

1. **Signup** → hash password (bcrypt) → insert user → create email verification token → send email
2. **Login** → find user → compare password → check `isActive` → update `lastLoginAt` → sign JWT with `{ userId, email, role }`
3. **Email verification** → find valid token (not used, not expired) → mark token used → set `emailVerified: "verified"`
4. **Password reset** → find user by email (silent if not found) → create reset token → send email
5. **Reset password** → find valid token → hash new password → update user → mark token used

## JWT Payload Shape

```typescript
{ userId: string, email: string, role: string }
```

Accessible as `req.user` after `authenticate` middleware runs.

## Dependencies

- `bcrypt` — password hashing
- `jsonwebtoken` — JWT sign/verify
- `node:crypto` — random token generation
- `lib/email.ts` — sends verification and reset emails

## Key Design Decisions

- Tokens are single-use (`usedAt` timestamp) and time-bound (`expiresAt`)
- `forgotPassword` never reveals whether the email exists (anti-enumeration)
- Password is never returned in any response (select only needed columns)
- The `isActive` flag allows soft-disabling accounts without deletion
