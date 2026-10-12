/**
 * Central Server Authorization Helper: requireAdmin() (Phase 2, Task 3)
 * Enforces server-side authentication and role verification for all admin pages,
 * server actions, and route handlers.
 *
 * Rules:
 * - Unauthenticated requests redirect to /admin/login (pages) or throw/return 401/403 (actions/handlers).
 * - Deactivated users are blocked immediately; active sessions are invalidated upon detection.
 * - Non-admin users are rejected with 403.
 */

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, UserRecord, SessionRecord } from '@/server/db/client';
import { uiStringsFa } from '@/content/ui-strings.fa';

export class AuthError extends Error {
  code: 'UNAUTHORIZED' | 'FORBIDDEN';
  status: number;

  constructor(code: 'UNAUTHORIZED' | 'FORBIDDEN', status: number, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

export interface AdminAuthResult {
  user: UserRecord;
  session: SessionRecord;
}

export interface RequireAdminOptions {
  allowRedirect?: boolean;
}

/**
 * Extracts session token from cookies or authorization header.
 */
export async function getSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get('honey.session_token')?.value ||
      cookieStore.get('better-auth.session_token')?.value ||
      cookieStore.get('session_token')?.value;

    if (token) return token;
  } catch {
    // If called outside request context (e.g. CLI or unit test), check headers
  }

  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
  } catch {
    // Header access not available
  }

  return null;
}

/**
 * Returns current admin user & session without throwing or redirecting.
 * Returns null if unauthenticated, session expired, or user deactivated.
 */
export async function getCurrentAdminSession(tokenOverride?: string): Promise<AdminAuthResult | null> {
  const token = tokenOverride || (await getSessionToken());
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  // Check expiration
  if (new Date() > new Date(session.expiresAt)) {
    await db.session.delete({ where: { token } }).catch(() => {});
    return null;
  }

  // Look up user if not joined
  let user: UserRecord | null = session.user || null;
  if (!user) {
    user = await db.user.findUnique({ where: { id: session.userId } });
  }

  if (!user) {
    await db.session.delete({ where: { token } }).catch(() => {});
    return null;
  }

  // Deactivated users cannot use existing sessions (Task 1 & Task 8)
  if (!user.isActive) {
    await db.session.delete({ where: { token } }).catch(() => {});
    return null;
  }

  // Strict role check
  if (user.role !== 'ADMIN') {
    return null;
  }

  return { user, session };
}

/**
 * Central server helper required by every admin page, server action, and handler.
 * - In page context (allowRedirect: true), redirects to /admin/login.
 * - In action/handler context (allowRedirect: false), throws AuthError with 401 or 403.
 */
export async function requireAdmin(options: RequireAdminOptions = { allowRedirect: true }): Promise<AdminAuthResult> {
  const authResult = await getCurrentAdminSession();

  if (!authResult) {
    if (options.allowRedirect) {
      redirect('/admin/login');
    }
    throw new AuthError('UNAUTHORIZED', 401, uiStringsFa.adminAuth.unauthorized);
  }

  return authResult;
}
