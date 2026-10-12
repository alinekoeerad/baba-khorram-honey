/**
 * Better Auth & Session Management (Phase 2)
 * Integrates email + password, database sessions via Prisma,
 * custom Argon2id/scrypt hashing, and strict isActive check.
 */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { db } from '@/server/db/client';
import { hashPassword, verifyPassword } from './password';

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false, // Strict: no automatic sign-in on user creation
    password: {
      hash: async (password: string) => {
        return hashPassword(password);
      },
      verify: async ({ password, hash }: { password: string; hash: string }) => {
        return verifyPassword(password, hash);
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days max lifetime
    updateAge: 60 * 60 * 2,      // 2 hours idle check
    cookieCache: {
      enabled: false,            // Always verify against DB to catch deactivated users immediately
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'ADMIN',
        required: true,
      },
      isActive: {
        type: 'boolean',
        defaultValue: true,
        required: true,
      },
      lastLoginAt: {
        type: 'date',
        required: false,
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookiePrefix: 'honey',
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  },
});
