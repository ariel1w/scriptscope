import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref');

  if (ref === 'writer' || ref === 'insider') {
    const response = NextResponse.next();

    response.cookies.set('ref_source', ref, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    fetch(`${request.nextUrl.origin}/api/marketing/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref_source: ref,
        event_type: 'click',
        page: request.nextUrl.pathname,
      }),
    }).catch(() => {});

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
