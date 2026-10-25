import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge Security Guard Middleware (SEC-02)
 * Intercepts all requests matching /admin/:path*
 * Enforces session token presence & format and redirects unauthenticated users to /admin/login.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    // Check for session token across all supported cookie keys
    const rawToken =
      request.cookies.get('honey.session_token')?.value ||
      request.cookies.get('better-auth.session_token')?.value ||
      request.cookies.get('session_token')?.value;

    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : null;

    const token = rawToken?.trim() || bearerToken;
    // Session tokens are generated as 32-byte (64 hex char) random strings; require at least 32 non-whitespace characters
    const isValidTokenFormat = Boolean(token && token.length >= 32 && !/\s/.test(token));

    const isLoginPage = pathname === '/admin/login' || pathname.startsWith('/admin/login/');

    // Unauthenticated user trying to access any admin route other than /admin/login
    if (!isValidTokenFormat && !isLoginPage) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated user trying to access the login page
    if (isValidTokenFormat && isLoginPage) {
      const dashboardUrl = new URL('/admin', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
