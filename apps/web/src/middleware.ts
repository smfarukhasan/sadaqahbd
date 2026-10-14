import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle variations like /bn/masteradmin, /en/masteradmin, /master-admin -> redirect to /masteradmin
  if (
    pathname === '/bn/masteradmin' ||
    pathname === '/en/masteradmin' ||
    pathname === '/master-admin' ||
    pathname === '/bn/master-admin' ||
    pathname === '/en/master-admin'
  ) {
    return NextResponse.redirect(new URL('/masteradmin', request.url));
  }

  // Isolate /masteradmin route (do not prefix with locale)
  if (pathname.startsWith('/masteradmin')) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
